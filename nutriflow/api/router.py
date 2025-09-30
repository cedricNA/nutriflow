from typing import List, Dict, Optional
from datetime import date
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from nutriflow.db.supabase import (
    insert_activity,
    get_meal,
)
import nutriflow.db.supabase as db
from nutriflow.services import (
    analyze_ingredients_nutritionix,
    get_off_search_nutrition,
    get_off_nutrition_by_barcode,
    analyze_exercise_nutritionix,
    convert_nutritionix_to_df,
    calculate_totals,
    calculer_bmr,
    calculer_tdee,
    ajuster_tdee,
    calculate_macro_goals,
    SPORTS_MAPPING,
    get_unit_variants,
    normalize_units_text,
    add_meal_item,
    update_daily_summary,
)

# ID utilisateur générique pour les tests/démo (doit être un UUID valide)
TEST_USER_ID = "00000000-0000-0000-0000-000000000000"

router = APIRouter()


def compute_goals(user: Dict, tdee: float) -> Dict[str, float]:
    """Calcule les objectifs caloriques et macros selon le profil utilisateur."""
    objectif = (user.get("goal") or user.get("objectif") or "maintien").lower()
    poids = user.get("poids_kg", 0)

    if objectif == "perte":
        target_kcal = tdee * 0.80
        prot_g = 1.8 * poids
    elif objectif == "prise":
        target_kcal = tdee * 1.12
        prot_g = 2.0 * poids
    else:  # maintien
        target_kcal = tdee
        prot_g = 1.8 * poids

    fat_g = 0.8 * poids
    kcal_restantes = target_kcal - (prot_g * 4 + fat_g * 9)
    carbs_g = max(0.0, kcal_restantes / 4)

    prot_pct = (prot_g * 4) / target_kcal if target_kcal else 0
    fat_pct = (fat_g * 9) / target_kcal if target_kcal else 0
    carbs_pct = (carbs_g * 4) / target_kcal if target_kcal else 0

    return {
        "target_kcal": target_kcal,
        "prot_g": prot_g,
        "fat_g": fat_g,
        "carbs_g": carbs_g,
        "ratios": {
            "prot_pct": prot_pct,
            "fat_pct": fat_pct,
            "carbs_pct": carbs_pct,
        },
    }


def _analyze_item(name: str, qty: float, unit: str) -> Dict[str, float]:
    """Analyse un ingrédient via Nutritionix et retourne les infos utiles."""
    query = normalize_units_text(f"{qty} {unit} {name}")
    foods = analyze_ingredients_nutritionix(query)
    if not foods:
        raise HTTPException(status_code=400, detail="Analyse Nutritionix vide")
    food = foods[0]
    return {
        "nom_aliment": food.get("food_name"),
        "quantite": food.get("serving_weight_grams", qty),
        "unite": "g",
        "calories": food.get("nf_calories", 0),
        "proteines_g": food.get("nf_protein", 0),
        "glucides_g": food.get("nf_total_carbohydrate", 0),
        "lipides_g": food.get("nf_total_fat", 0),
    }


# ----- Services Query Models -----
class IngredientQuery(BaseModel):
    query: str = Field(
        ..., min_length=1, description="Description des ingrédients en français"
    )
    type: str = Field(
        "dejeuner",
        description="Type de repas (petit_dejeuner, dejeuner, diner, collation)",
    )
    date_str: Optional[str] = Field(
        None, description="Date YYYY-MM-DD pour enregistrer le repas"
    )


class BarcodeQuery(BaseModel):
    barcode: str = Field(
        ...,
        pattern=r"^\d{8,}$",
        description="Code-barres du produit (au moins 8 chiffres)",
    )
    quantity: float = Field(100.0, gt=0, description="Quantité du produit (g)")
    meal_id: Optional[str] = Field(
        None, description="Identifiant du repas auquel ajouter l'article"
    )


class BarcodeQueryUserInput(BaseModel):
    """Modèle simplifié pour l'ajout d'un produit via code-barres."""

    barcode: str = Field(
        ...,
        pattern=r"^\d{8,}$",
        description="Code-barres du produit (au moins 8 chiffres)",
    )
    quantity: float = Field(..., gt=0, description="Quantité du produit (g)")
    type: str = Field(
        "dejeuner",
        description="Type de repas (petit_dejeuner, dejeuner, diner, collation)",
    )
    date_str: Optional[str] = Field(
        None, description="Date YYYY-MM-DD pour enregistrer le repas"
    )


class ExerciseQuery(BaseModel):
    query: str = Field(
        ..., min_length=1, description="Description de l'activité sportive en français"
    )
    weight_kg: float = Field(..., gt=0, description="Poids de l'utilisateur en kg")
    height_cm: float = Field(..., gt=0, description="Taille de l'utilisateur en cm")
    age: int = Field(..., gt=0, description="Âge de l'utilisateur")
    gender: str = Field(
        "male",
        pattern=r"^(male|female)$",
        description="Genre de l'utilisateur ('male' ou 'female')",
    )


class BMRQuery(BaseModel):
    poids_kg: float = Field(..., gt=0, description="Poids de l'utilisateur en kg")
    taille_cm: float = Field(..., gt=0, description="Taille de l'utilisateur en cm")
    age: int = Field(..., gt=0, description="Âge de l'utilisateur")
    sexe: str = Field(
        ..., pattern=r"^(male|female|homme|femme)$", description="Sexe de l'utilisateur"
    )


class TDEEQuery(BMRQuery):
    activity_factor: float = Field(
        ..., gt=0, description="Facteur d'activité (ex: 1.2 sédentaire)"
    )
    goal: str = Field(
        "maintien",
        description="Objectif : perte, maintien ou prise de masse",
    )


# ----- User Profile Models -----
class UserProfile(BaseModel):
    poids_kg: float
    taille_cm: float
    age: int
    sexe: str
    activity_factor: float
    goal: str
    tdee_base: float
    tdee: float


class UserProfileUpdate(BaseModel):
    poids_kg: Optional[float] = None
    taille_cm: Optional[float] = None
    age: Optional[int] = None
    sexe: Optional[str] = None
    activity_factor: Optional[float] = None
    goal: Optional[str] = None


# ----- Meal Editing Models -----
class MealItemBase(BaseModel):
    nom_aliment: Optional[str] = None
    marque: Optional[str] = None
    quantite: Optional[float] = None
    unite: Optional[str] = None
    calories: Optional[float] = None
    proteines_g: Optional[float] = None
    glucides_g: Optional[float] = None
    lipides_g: Optional[float] = None
    barcode: Optional[str] = None
    source: Optional[str] = None


class MealItemCreate(MealItemBase):
    nom_aliment: str
    quantite: float
    unite: str


class MealItemUpdate(MealItemBase):
    id: str


class MealPatchPayload(BaseModel):
    add: Optional[List[MealItemCreate]] = None
    update: Optional[List[MealItemUpdate]] = None
    delete: Optional[List[str]] = None
    type: Optional[str] = None
    date: Optional[str] = None


# ----- Response Models -----
class NutritionixFood(BaseModel):
    aliment: str
    quantite: str
    poids_g: float
    calories: float
    proteines_g: float
    glucides_g: float
    lipides_g: float


class Totals(BaseModel):
    total_calories: float = Field(..., description="Total des calories (kcal)")
    total_proteins_g: float = Field(..., description="Total des protéines (g)")
    total_carbs_g: float = Field(..., description="Total des glucides (g)")
    total_fats_g: float = Field(..., description="Total des lipides (g)")


class NutritionixResponse(BaseModel):
    foods: List[NutritionixFood]
    totals: Totals


class ProductSummary(BaseModel):
    barcode: str
    name: str
    image_url: Optional[str] = None
    brand: Optional[str] = None
    energy_kcal_per_100g: Optional[float] = None
    proteins_per_100g: Optional[float] = None
    carbs_per_100g: Optional[float] = None
    fat_per_100g: Optional[float] = None
    nutriscore: Optional[str] = None


class OFFProduct(BaseModel):
    barcode: str
    name: str
    brand: str
    energy_kcal_per_100g: Optional[float]
    fat_per_100g: Optional[float]
    sugars_per_100g: Optional[float]
    proteins_per_100g: Optional[float]
    salt_per_100g: Optional[float]


class ExerciseResult(BaseModel):
    name: str = Field(..., description="Nom de l'exercice")
    duration_min: float = Field(..., description="Durée en minutes")
    calories: float = Field(..., description="Calories brûlées")
    met: Optional[float] = Field(None, description="MET approximatif")


class BMRResponse(BaseModel):
    bmr: float = Field(..., description="Métabolisme de base calculé (kcal)")


class TDEResponse(BaseModel):
    bmr: float = Field(..., description="Métabolisme de base calculé (kcal)")
    activity_factor: float = Field(..., description="Facteur d'activité utilisé")
    tdee_base: float = Field(..., description="TDEE de base (kcal)")
    tdee: float = Field(..., description="TDEE ajusté selon l'objectif (kcal)")


class DailySummary(BaseModel):
    date: str
    calories_consumed: float
    calories_burned: float
    tdee: float
    calorie_balance: float
    goal_feedback: str


class DailyNutritionSummary(BaseModel):
    """
    Réponse API pour les résumés quotidiens nutritionnels
    IMPORTANT: Doit matcher exactement DailySummary TypeScript et la table daily_summary
    """

    # === Colonnes de consommation (données réelles) ===
    calories_consumed: float = Field(
        default=0, description="Calories consommées via repas (kcal)"
    )
    proteins_consumed: float = Field(default=0, description="Protéines consommées (g)")
    carbs_consumed: float = Field(default=0, description="Glucides consommés (g)")
    fats_consumed: float = Field(default=0, description="Lipides consommés (g)")

    # === Colonnes d'objectifs (calculés) ===
    calories_goal: float = Field(
        default=0, description="Objectif calorique quotidien (kcal)"
    )
    proteins_goal: float = Field(default=0, description="Objectif protéines (g)")
    carbs_goal: float = Field(default=0, description="Objectif glucides (g)")
    fats_goal: float = Field(default=0, description="Objectif lipides (g)")

    # === Colonnes optionnelles étendues ===
    calories_burned: Optional[float] = Field(
        default=None, description="Calories brûlées via exercices (kcal)"
    )
    bmr: Optional[float] = Field(default=None, description="Métabolisme de base (kcal)")
    tdee: Optional[float] = Field(default=None, description="TDEE total (kcal)")
    calorie_balance: Optional[float] = Field(
        default=None, description="Balance calorique nette"
    )
    calories_total: Optional[float] = Field(
        default=None, description="calories_consumed + calories_burned"
    )
    sport_total: Optional[float] = Field(
        default=None, description="Durée totale exercices (minutes)"
    )
    goal_feedback: Optional[str] = Field(
        default=None, description="Message de conseil personnalisé"
    )
    has_data: Optional[bool] = Field(
        default=None, description="Indicateur de présence de données"
    )


class GoalRatios(BaseModel):
    prot_pct: float
    fat_pct: float
    carbs_pct: float


class GoalsResponse(BaseModel):
    target_kcal: float
    prot_g: float
    fat_g: float
    carbs_g: float
    ratios: GoalRatios
    tdee: float
    objectif: str


# ----- Endpoints -----
@router.post("/ingredients", response_model=NutritionixResponse)
def ingredients(data: IngredientQuery):
    """
    Analyse une description d'ingrédients et renvoie la liste des aliments et totaux.
    """
    try:
        normalized = normalize_units_text(data.query)
        foods_raw = analyze_ingredients_nutritionix(normalized)
        df = convert_nutritionix_to_df(foods_raw)
        totals_dict = calculate_totals(df)
        foods = [
            NutritionixFood(
                aliment=row["Aliment"],
                quantite=row["Quantite"],
                poids_g=row["Poids_g"],
                calories=row["Calories"],
                proteines_g=row["Proteines_g"],
                glucides_g=row["Glucides_g"],
                lipides_g=row["Lipides_g"],
            )
            for _, row in df.iterrows()
        ]

        # === AJOUT DANS SUPABASE ===
        user_id = TEST_USER_ID  # ID générique en l'absence d'utilisateur connecté
        for food in foods:
            add_meal_item(
                user_id=user_id,
                date_str=data.date_str,
                meal_type=data.type,
                item_data={
                    "nom_aliment": food.aliment,
                    "marque": None,
                    "quantite": food.poids_g,
                    "unite": "g",
                    "calories": food.calories,
                    "proteines_g": food.proteines_g,
                    "glucides_g": food.glucides_g,
                    "lipides_g": food.lipides_g,
                    "barcode": None,
                    "source": "manual",
                },
            )
        # === FIN SAUVEGARDE ===

        return NutritionixResponse(foods=foods, totals=Totals(**totals_dict))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/barcode", response_model=OFFProduct)
def barcode(data: BarcodeQueryUserInput):
    """
    Récupère les infos nutritionnelles d'un produit via OpenFoodFacts.
    Ajoute ou met à jour automatiquement ce produit dans la table products
    pour alimenter la fiche détaillée.
    """
    prod = get_off_nutrition_by_barcode(data.barcode)
    if not prod:
        raise HTTPException(status_code=404, detail="Produit non trouvé")

    # === Upsert automatique dans la table products ===
    supabase = db.get_supabase_client()
    supabase.table("products").upsert(prod, on_conflict=["barcode"]).execute()
    # === Fin upsert automatique ===

    user_id = TEST_USER_ID
    qty = data.quantity

    def _mul(val):
        return (val or 0) * qty / 100.0

    add_meal_item(
        user_id=user_id,
        date_str=data.date_str,
        meal_type=data.type,
        item_data={
            "nom_aliment": prod["name"],
            "marque": prod.get("brand"),
            "quantite": qty,
            "unite": "g",
            "calories": _mul(prod.get("energy_kcal_per_100g")),
            "proteines_g": _mul(prod.get("proteins_per_100g")),
            "glucides_g": _mul(prod.get("carbs_per_100g")),
            "lipides_g": _mul(prod.get("fat_per_100g")),
            "barcode": data.barcode,
            "source": "openfoodfacts",
        },
    )

    return OFFProduct(
        barcode=data.barcode,
        name=prod.get("name", ""),
        brand=prod.get("brand", ""),
        energy_kcal_per_100g=_mul(prod.get("energy_kcal_per_100g")),
        fat_per_100g=_mul(prod.get("fat_per_100g")),
        sugars_per_100g=_mul(prod.get("sugars_per_100g")),
        proteins_per_100g=_mul(prod.get("proteins_per_100g")),
        salt_per_100g=_mul(prod.get("salt_per_100g")),
    )


@router.get("/products/{barcode}/details")
def product_details(barcode: str):
    """Retourne toutes les infos enrichies depuis Supabase."""
    prod = db.get_product(barcode)
    if not prod:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    return prod


@router.get("/search", response_model=OFFProduct)
def search(
    query: str = Query(..., min_length=1, description="Terme de recherche produit"),
):
    """
    Recherche un produit sur OpenFoodFacts par terme.
    """
    prod = get_off_search_nutrition(query)
    if not prod:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    return OFFProduct(
        barcode=prod.get("barcode", ""),
        name=prod.get("name", ""),
        brand=prod.get("brand", ""),
        energy_kcal_per_100g=prod.get("energy_kcal_per_100g"),
        fat_per_100g=prod.get("fat_per_100g"),
        sugars_per_100g=prod.get("sugars_per_100g"),
        proteins_per_100g=prod.get("proteins_per_100g"),
        salt_per_100g=prod.get("salt_per_100g"),
    )


@router.get("/sports", response_model=List[str])
def get_supported_sports() -> List[str]:
    """Retourne la liste des activités sportives reconnues."""
    return list(SPORTS_MAPPING.keys())


@router.get("/units", response_model=Dict[str, str])
def get_units() -> Dict[str, str]:
    """Retourne le mapping des unités françaises vers l'anglais."""
    return get_unit_variants()


@router.post("/exercise", response_model=List[ExerciseResult])
def exercise(data: ExerciseQuery, preview: bool = False):
    """
    Analyse une activité sportive et renvoie la liste d'exercices formatée.
    """
    try:
        exercises_raw = analyze_exercise_nutritionix(
            text_fr=data.query,
            weight_kg=data.weight_kg,
            height_cm=data.height_cm,
            age=data.age,
            gender=data.gender,
        )

        if not preview:
            # ===== Sauvegarde des activités dans Supabase =====
            user_id = TEST_USER_ID
            date_str = str(date.today())
            for ex in exercises_raw:
                insert_activity(
                    user_id=user_id,
                    date=date_str,
                    description=ex.get("name", ""),
                    duree_min=ex.get("duration_min", 0),
                    calories_brulees=ex.get("nf_calories", 0),
                )
            update_daily_summary(user_id=user_id, date=date_str)
            # ===== Fin sauvegarde =====
        results = [
            ExerciseResult(
                name=ex.get("name", ""),
                duration_min=ex.get("duration_min", 0),
                calories=ex.get("nf_calories", 0),
                met=ex.get("met"),
            )
            for ex in exercises_raw
        ]
        return results
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Service d'exercice temporairement indisponible, réessayez plus tard",
        )


@router.post("/bmr", response_model=BMRResponse)
def bmr(data: BMRQuery):
    """
    Calcule le métabolisme de base selon Mifflin-St Jeor.
    """
    try:
        value = calculer_bmr(data.poids_kg, data.taille_cm, data.age, data.sexe)
        return BMRResponse(bmr=value)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/tdee", response_model=TDEResponse)
def tdee(data: TDEEQuery):
    """
    Calcule le TDEE de base et ajusté selon l'objectif.
    """
    try:
        bmr_value = calculer_bmr(data.poids_kg, data.taille_cm, data.age, data.sexe)
        tdee_base = calculer_tdee(
            data.poids_kg, data.taille_cm, data.age, data.sexe, data.activity_factor
        )
        tdee_adj = ajuster_tdee(tdee_base, data.goal)
        return TDEResponse(
            bmr=bmr_value,
            activity_factor=data.activity_factor,
            tdee_base=tdee_base,
            tdee=tdee_adj,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/user/goals", response_model=GoalsResponse)
def get_goals():
    """Retourne les objectifs personnalisés calories et macros de l'utilisateur."""
    user_id = TEST_USER_ID
    user = db.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    today = date.today().isoformat()
    activities = db.get_activities(user_id, today)
    calories_brulees = (
        sum(a.get("calories_brulees", 0) for a in activities) if activities else 0.0
    )

    tdee_base = calculer_tdee(
        user["poids_kg"],
        user["taille_cm"],
        user["age"],
        user["sexe"],
        user.get("activity_factor", 1.2),
    )
    tdee_user = ajuster_tdee(
        tdee_base, user.get("goal") or user.get("objectif", "maintien")
    )
    tdee = tdee_user + calories_brulees

    goals = compute_goals(user, tdee)
    objectif = (user.get("goal") or user.get("objectif") or "maintien").lower()

    # Optionnel : historiser dans daily_summary si les colonnes existent
    try:
        supabase = db.get_supabase_client()
        supabase.table("daily_summary").select(
            "target_calories,target_proteins_g,target_fats_g,target_carbs_g"
        ).limit(1).execute()
        supabase.table("daily_summary").upsert(
            {
                "user_id": user_id,
                "date": today,
                "target_calories": goals["target_kcal"],
                "target_proteins_g": goals["prot_g"],
                "target_fats_g": goals["fat_g"],
                "target_carbs_g": goals["carbs_g"],
            },
            on_conflict=["user_id", "date"],
        ).execute()
    except Exception:
        pass

    return GoalsResponse(**goals, tdee=tdee, objectif=objectif)


@router.get("/daily-summary", response_model=DailyNutritionSummary)
def daily_summary(
    date_str: str = Query(default=None, description="Date au format YYYY-MM-DD"),
):
    """Retourne l'apport actuel et les objectifs calories/macros pour la date donnée."""
    user_id = TEST_USER_ID
    d = date_str if date_str else str(date.today())

    totals = db.get_daily_nutrition(user_id, d) or {}
    calories_cons = totals.get("total_calories") or 0
    prot_cons = totals.get("total_proteins_g") or 0
    carb_cons = totals.get("total_carbs_g") or 0
    fat_cons = totals.get("total_fats_g") or 0

    user = db.get_user(user_id)
    if not user:
        return DailyNutritionSummary(
            calories_consumed=calories_cons,
            proteins_consumed=prot_cons,
            carbs_consumed=carb_cons,
            fats_consumed=fat_cons,
            calories_goal=1800,  # Default pour les tests
            proteins_goal=0,
            carbs_goal=0,
            fats_goal=0,
        )
    # Calculer BMR et TDEE
    try:
        from nutriflow.services import calculer_bmr

        bmr = calculer_bmr(
            user["poids_kg"],
            user["taille_cm"],
            user["age"],
            user["sexe"],
        )
        tdee_base = calculer_tdee(
            user["poids_kg"],
            user["taille_cm"],
            user["age"],
            user["sexe"],
            user.get("activity_factor", 1.2),
        )
        tdee_val = ajuster_tdee(tdee_base, user.get("goal", "maintien"))
    except Exception:
        bmr = None
        tdee_val = None

    cal_goal = tdee_val
    macros_goal = calculate_macro_goals(user.get("poids_kg"), cal_goal)

    # Récupérer les données d'activités pour calories_burned
    try:
        supabase = db.get_supabase_client()
        activities = (
            supabase.table("activities")
            .select("calories_brulees")
            .eq("user_id", user_id)
            .eq("date", d)
            .execute()
        )
        calories_burned = sum(
            a.get("calories_brulees", 0) for a in (activities.data or [])
        )
    except Exception:
        calories_burned = 0

    # Calculer calorie_balance
    calorie_balance = None
    if cal_goal and calories_cons is not None:
        calorie_balance = calories_cons - cal_goal + calories_burned

    # Générer goal_feedback
    goal_feedback = None
    if calorie_balance is not None and cal_goal:
        objectif = (user.get("goal") or "maintien").lower()
        if objectif == "perte":
            if calorie_balance < -200:
                goal_feedback = "Excellent déficit pour une perte de poids saine"
            elif calorie_balance < 0:
                goal_feedback = "Bon déficit, continuez ainsi"
            else:
                goal_feedback = "Surplus calorique - ajustez votre alimentation"
        elif objectif == "prise":
            if calorie_balance > 200:
                goal_feedback = "Bon surplus pour une prise de masse"
            elif calorie_balance > 0:
                goal_feedback = "Léger surplus, idéal pour la prise de muscle"
            else:
                goal_feedback = "Déficit calorique - augmentez votre apport"
        else:  # maintien
            if abs(calorie_balance) < 100:
                goal_feedback = "Balance parfaite pour maintenir votre poids"
            elif calorie_balance > 100:
                goal_feedback = "Léger surplus - surveillez votre poids"
            else:
                goal_feedback = (
                    "Léger déficit - surveillez votre énergie et hydratation"
                )

    return DailyNutritionSummary(
        calories_consumed=calories_cons,
        proteins_consumed=prot_cons,
        carbs_consumed=carb_cons,
        fats_consumed=fat_cons,
        calories_goal=cal_goal or 1800,
        proteins_goal=macros_goal.get("proteins", 0) if macros_goal else 0,
        carbs_goal=macros_goal.get("carbs", 0) if macros_goal else 0,
        fats_goal=macros_goal.get("fats", 0) if macros_goal else 0,
        calories_burned=calories_burned,
        bmr=bmr,
        tdee=tdee_val,
        calorie_balance=calorie_balance,
        goal_feedback=goal_feedback,
    )


@router.post("/daily-summary/update")
def recalc_daily_summary(
    date_str: str = Query(default=None, description="Date au format YYYY-MM-DD"),
):
    """Recalcule et enregistre le bilan quotidien pour la date donnée."""
    user_id = TEST_USER_ID
    d = date.fromisoformat(date_str) if date_str else date.today()
    try:
        return update_daily_summary(user_id=user_id, date=d)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Erreur lors de la mise à jour du bilan journalier",
        )


@router.get("/history", response_model=List[DailySummary])
def get_history(
    limit: int = Query(default=30, description="Nombre de jours à retourner"),
    user_id: str = TEST_USER_ID,
):
    """Retourne l'historique des bilans journaliers pour l'utilisateur connecté (max: limit)."""
    recs = db.get_daily_summaries(user_id, limit)
    return [
        DailySummary(
            date=rec["date"],
            calories_consumed=rec.get("calories_consumed", 0),
            calories_burned=rec.get("calories_burned", 0),
            tdee=rec.get("tdee", 0),
            calorie_balance=rec.get("calorie_balance", 0),
            goal_feedback=rec.get("goal_feedback", ""),
        )
        for rec in recs
    ]


@router.get("/user/profile", response_model=UserProfile)
def get_user_profile(user_id: str = TEST_USER_ID):
    user = db.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return UserProfile(
        poids_kg=user["poids_kg"],
        taille_cm=user["taille_cm"],
        age=user["age"],
        sexe=user["sexe"],
        activity_factor=user.get("activity_factor", 1.2),
        goal=user.get("goal", "maintien"),
        tdee_base=user.get("tdee_base", 0.0),
        tdee=user.get("tdee", 0.0),
    )


@router.post("/user/profile/update", response_model=UserProfile)
def update_user_profile(data: UserProfileUpdate, user_id: str = TEST_USER_ID):
    user = db.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    maj = {}
    if data.poids_kg is not None:
        maj["poids_kg"] = data.poids_kg
    if data.taille_cm is not None:
        maj["taille_cm"] = data.taille_cm
    if data.age is not None:
        maj["age"] = data.age
    if data.sexe is not None:
        maj["sexe"] = data.sexe
    if data.activity_factor is not None:
        maj["activity_factor"] = data.activity_factor
    if data.goal is not None:
        maj["goal"] = data.goal

    temp_user = {**user, **maj}
    bmr = calculer_bmr(
        temp_user["poids_kg"],
        temp_user["taille_cm"],
        temp_user["age"],
        temp_user["sexe"],
    )
    tdee_base = calculer_tdee(
        temp_user["poids_kg"],
        temp_user["taille_cm"],
        temp_user["age"],
        temp_user["sexe"],
        temp_user.get("activity_factor", 1.2),
    )
    tdee_adj = ajuster_tdee(tdee_base, temp_user.get("goal", "maintien"))
    # Nouveau calcul pour le daily_summary
    daily_tdee = bmr * 1.55
    objectif = (temp_user.get("goal") or "maintien").lower()
    if objectif == "perte":
        daily_tdee -= 500
    elif objectif == "prise":
        daily_tdee += 300
    try:
        supabase = db.get_supabase_client()
        today = date.today().isoformat()
        existing = (
            supabase.table("daily_summary")
            .select("user_id")
            .eq("user_id", user_id)
            .eq("date", today)
            .execute()
        )
        payload = {"bmr": bmr, "tdee": daily_tdee}
        if existing.data:
            (
                supabase.table("daily_summary")
                .update(payload)
                .eq("user_id", user_id)
                .eq("date", today)
                .execute()
            )
        else:
            supabase.table("daily_summary").insert(
                {"user_id": user_id, "date": today, **payload}
            ).execute()
    except Exception:
        pass
    maj["tdee_base"] = tdee_base
    maj["tdee"] = tdee_adj

    if maj:
        db.update_user(user_id, maj)
        user.update(maj)
    return UserProfile(
        poids_kg=user["poids_kg"],
        taille_cm=user["taille_cm"],
        age=user["age"],
        sexe=user["sexe"],
        activity_factor=user.get("activity_factor", 1.2),
        goal=user.get("goal", "maintien"),
        tdee_base=user.get("tdee_base", 0.0),
        tdee=user.get("tdee", 0.0),
    )


# ----- Meals Management -----


class MealCreatePayload(BaseModel):
    type: str = Field(..., description="Type de repas")
    date: Optional[str] = Field(
        default_factory=lambda: str(date.today()), description="Date YYYY-MM-DD"
    )
    user_id: str = Field(TEST_USER_ID, description="Identifiant utilisateur")
    note: Optional[str] = None


class MealItemCreatePayload(BaseModel):
    meal_id: str
    nom_aliment: str
    quantite: float
    unite: str
    calories: float
    proteines_g: float
    glucides_g: float
    lipides_g: float
    marque: Optional[str] = None
    barcode: Optional[str] = None
    source: Optional[str] = None


@router.post("/meals")
def create_meal(payload: MealCreatePayload):
    meal_id = db.insert_meal(
        payload.user_id, payload.date, payload.type, payload.note or ""
    )
    try:
        update_daily_summary(payload.user_id, payload.date)
    except Exception:
        pass
    return {"id": meal_id}


@router.post("/meal-items")
def create_meal_item(payload: MealItemCreatePayload):
    item_id = db.insert_meal_item(
        payload.meal_id,
        payload.nom_aliment,
        payload.quantite,
        payload.unite,
        payload.calories,
        payload.proteines_g,
        payload.glucides_g,
        payload.lipides_g,
        marque=payload.marque,
        barcode=payload.barcode,
        source=payload.source,
    )
    meal = db.get_meal(payload.meal_id)
    uid = meal.get("user_id", TEST_USER_ID) if meal else TEST_USER_ID
    ds = meal.get("date") if meal else str(date.today())
    try:
        update_daily_summary(uid, ds)
    except Exception:
        pass
    return {"id": item_id}


@router.get("/meals")
def list_meals(
    user_id: str = TEST_USER_ID,
    date_str: str = Query(default=str(date.today()), description="Date YYYY-MM-DD"),
):
    """Liste les repas d'un utilisateur pour une date donnée avec leurs ingrédients."""
    meals = db.get_meals(user_id, date_str)
    result = []
    for m in meals:
        items = db.get_meal_items(m["id"])
        result.append({"id": m["id"], "type": m.get("type"), "ingredients": items})
    return result


@router.patch("/meals/{meal_id}")
def edit_meal(meal_id: str, payload: MealPatchPayload):
    """Ajoute, met à jour ou supprime des ingrédients d'un repas."""
    meal = get_meal(meal_id) or {"id": meal_id, "user_id": TEST_USER_ID}
    user_id = meal.get("user_id", TEST_USER_ID)
    meal_type = meal.get("type")
    meal_date = meal.get("date")

    meal_data = {}
    if payload.type is not None:
        meal_data["type"] = payload.type
        meal_type = payload.type
    if payload.date is not None:
        meal_data["date"] = payload.date
        meal_date = payload.date
    if meal_data:
        db.update_meal(meal_id, meal_data)

    if payload.add:
        for item in payload.add:
            analysed = _analyze_item(item.nom_aliment, item.quantite, item.unite)
            add_meal_item(
                user_id=user_id,
                date_str=meal_date,
                meal_type=meal_type,
                item_data={**analysed, "source": "manual"},
            )
    if payload.update:
        for item in payload.update:
            analysed = _analyze_item(item.nom_aliment, item.quantite, item.unite)
            db.update_meal_item(item.id, {**analysed})
    if payload.delete:
        for item_id in payload.delete:
            db.delete_meal_item(item_id)
    try:
        update_daily_summary(user_id, meal_date or str(date.today()))
    except Exception:
        pass
    meal = get_meal(meal_id) or {"id": meal_id}
    return {
        "id": meal_id,
        "type": meal.get("type"),
        "ingredients": db.get_meal_items(meal_id),
    }


@router.delete("/meals/{meal_id}")
def remove_meal(meal_id: str):
    """Supprime un repas et ses ingrédients."""
    meal = db.get_meal(meal_id)
    db.delete_meal(meal_id)
    try:
        if meal:
            update_daily_summary(meal.get("user_id", TEST_USER_ID), meal.get("date"))
    except Exception:
        pass
    return {"status": "deleted"}


@router.delete("/meal-items/{item_id}")
def remove_meal_item(item_id: str):
    """Supprime un ingrédient d'un repas."""
    item = db.get_meal_item(item_id)
    db.delete_meal_item(item_id)
    try:
        if item:
            meal = db.get_meal(item.get("meal_id"))
            if meal:
                update_daily_summary(
                    meal.get("user_id", TEST_USER_ID), meal.get("date")
                )
    except Exception:
        pass
    return {"status": "deleted"}


# ----- Activities Management -----


@router.get("/activities")
def list_activities(
    date: str = Query(default=str(date.today()), description="Date YYYY-MM-DD"),
    user_id: str = TEST_USER_ID,
):
    """Retourne les activités sportives de l'utilisateur pour la date donnée."""
    return db.get_activities(user_id, date)


@router.delete("/activities/{activity_id}")
def remove_activity(activity_id: str):
    """Supprime l'activité donnée."""
    activity = db.get_activity(activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    db.delete_activity(activity_id)
    return {"detail": "Activity deleted"}


@router.get("/nutrition-recommendations")
async def get_nutrition_recommendations(
    user_id: str = Query(default=TEST_USER_ID, description="Identifiant utilisateur"),
    days: int = Query(default=7, ge=1, le=30, description="Nombre de jours à analyser"),
):
    """
    Génère des recommandations nutritionnelles personnalisées basées sur l'historique alimentaire.

    Analyse les patterns nutritionnels sur les derniers jours et propose des suggestions
    d'amélioration avec des aliments concrets.

    Args:
        user_id: Identifiant de l'utilisateur (défaut: utilisateur test)
        days: Nombre de jours d'historique à analyser (1-30, défaut: 7)

    Returns:
        NutritionRecommendationsResponse: Analyse nutritionnelle + recommandations + suggestions alimentaires

    Raises:
        HTTPException: Si erreur lors de l'analyse ou génération des recommandations
    """
    try:
        from backend.services.nutrition_recommendations import (
            NutritionRecommendationsService,
        )

        # Initialisation du service de recommandations
        recommendations_service = NutritionRecommendationsService()

        # Génération des recommandations complètes
        result = await recommendations_service.get_recommendations(user_id, days)

        return result

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la génération des recommandations: {str(e)}",
        )
