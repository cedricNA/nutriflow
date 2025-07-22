import os
import requests
import pandas as pd
import unicodedata
from typing import List, Dict, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from nutriflow.db.supabase import insert_meal, insert_meal_item, insert_activity
import nutriflow.db.supabase as db

# ID utilisateur générique pour les tests/démo (doit être un UUID valide)
TEST_USER_ID = "00000000-0000-0000-0000-000000000000"
from datetime import date


from nutriflow.services import (
    analyze_ingredients_nutritionix,
    get_off_search_nutrition,
    get_off_nutrition_by_barcode,
    analyze_exercise_nutritionix,
    convert_nutritionix_to_df,
    calculate_totals,
    calculer_bmr,
    calculer_tdee,
    SPORTS_MAPPING,
)

router = APIRouter()


# ----- Services Query Models -----
class IngredientQuery(BaseModel):
    query: str = Field(
        ..., min_length=1, description="Description des ingrédients en français"
    )


class BarcodeQuery(BaseModel):
    barcode: str = Field(
        ...,
        pattern=r"^\d{8,}$",
        description="Code-barres du produit (au moins 8 chiffres)",
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
    calories_sport: float = Field(0.0, ge=0, description="Calories brûlées via sport")


# ----- User Profile Models -----
class UserProfile(BaseModel):
    poids_kg: float
    taille_cm: float
    age: int
    sexe: str


class UserProfileUpdate(BaseModel):
    poids_kg: Optional[float] = None
    taille_cm: Optional[float] = None
    age: Optional[int] = None
    sexe: Optional[str] = None


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


class OFFProduct(BaseModel):
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
    calories_sport: float = Field(..., description="Calories brûlées via sport (kcal)")
    tdee: float = Field(
        ..., description="Total Daily Energy Expenditure calculé (kcal)"
    )


class DailySummary(BaseModel):
    date: str
    calories_apportees: float
    calories_brulees: float
    tdee: float
    balance_calorique: float
    conseil: str


# ----- Endpoints -----
@router.post("/ingredients", response_model=NutritionixResponse)
def ingredients(data: IngredientQuery):
    """
    Analyse une description d'ingrédients et renvoie la liste des aliments et totaux.
    """
    try:
        foods_raw = analyze_ingredients_nutritionix(data.query)
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

        # === AJOUT SAUVEGARDE DANS SUPABASE ===
        user_id = TEST_USER_ID  # ID générique en l'absence d'utilisateur connecté
        meal_id = insert_meal(user_id, str(date.today()), "repas", note="")
        for food in foods:
            insert_meal_item(
                meal_id=meal_id,
                nom_aliment=food.aliment,
                marque=None,
                quantite=food.poids_g,
                unite="g",
                calories=food.calories,
                proteines_g=food.proteines_g,
                glucides_g=food.glucides_g,
                lipides_g=food.lipides_g,
                barcode=None,
            )
        # === FIN SAUVEGARDE ===

        return NutritionixResponse(foods=foods, totals=Totals(**totals_dict))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/barcode", response_model=OFFProduct)
def barcode(data: BarcodeQuery):
    """
    Récupère les infos nutritionnelles d'un produit via OpenFoodFacts.
    """
    prod = get_off_nutrition_by_barcode(data.barcode)
    if not prod:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    return OFFProduct(**prod)


@router.get("/search", response_model=OFFProduct)
def search(
    query: str = Query(..., min_length=1, description="Terme de recherche produit")
):
    """
    Recherche un produit sur OpenFoodFacts par terme.
    """
    prod = get_off_search_nutrition(query)
    if not prod:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    return OFFProduct(**prod)


@router.get("/sports", response_model=List[str])
def get_supported_sports() -> List[str]:
    """Retourne la liste des activités sportives reconnues."""
    return list(SPORTS_MAPPING.keys())


@router.post("/exercise", response_model=List[ExerciseResult])
def exercise(data: ExerciseQuery):
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
        # ===== Sauvegarde des activités dans Supabase =====
        user_id = TEST_USER_ID
        for ex in exercises_raw:
            insert_activity(
                user_id=user_id,
                date=str(date.today()),
                description=ex.get("name", ""),
                duree_min=ex.get("duration_min", 0),
                calories_brulees=ex.get("nf_calories", 0),
            )
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
    Calcule le TDEE (BMR + calories sportives).
    """
    try:
        tdee_value = calculer_tdee(
            data.poids_kg, data.taille_cm, data.age, data.sexe, data.calories_sport
        )
        bmr_value = calculer_bmr(data.poids_kg, data.taille_cm, data.age, data.sexe)
        return TDEResponse(
            bmr=bmr_value, calories_sport=data.calories_sport, tdee=tdee_value
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/daily-summary", response_model=DailySummary)
def daily_summary(
    date_str: str = Query(default=None, description="Date au format YYYY-MM-DD")
):
    """Calcule ou met à jour le résumé quotidien pour la date donnée."""
    user_id = TEST_USER_ID
    today = str(date.today())
    d = date_str if date_str else today

    data = db.aggregate_daily_summary(user_id, d)
    return DailySummary(
        date=d,
        calories_apportees=data.get("calories_apportees", 0.0),
        calories_brulees=data.get("calories_brulees", 0.0),
        tdee=data.get("tdee", 0.0),
        balance_calorique=data.get("balance_calorique", 0.0),
        conseil=data.get("conseil", ""),
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
            calories_apportees=rec.get("calories_apportees", 0),
            calories_brulees=rec.get("calories_brulees", 0),
            tdee=rec.get("tdee", 0),
            balance_calorique=rec.get("balance_calorique", 0),
            conseil=rec.get("conseil", ""),
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
    if maj:
        db.update_user(user_id, maj)
        user.update(maj)
    return UserProfile(
        poids_kg=user["poids_kg"],
        taille_cm=user["taille_cm"],
        age=user["age"],
        sexe=user["sexe"],
    )
