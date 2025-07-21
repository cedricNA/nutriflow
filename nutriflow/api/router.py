import os
import requests
import pandas as pd
import unicodedata
from typing import List, Dict, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from googletrans import Translator
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
    calculer_tdee
)

router = APIRouter()

# ----- Services Query Models -----
class IngredientQuery(BaseModel):
    query: str = Field(..., min_length=1, description="Description des ingrédients en français")

class BarcodeQuery(BaseModel):
    barcode: str = Field(..., pattern=r"^\d{8,}$", description="Code-barres du produit (au moins 8 chiffres)")

class ExerciseQuery(BaseModel):
    query: str = Field(..., min_length=1, description="Description de l'activité sportive en français")
    weight_kg: float = Field(..., gt=0, description="Poids de l'utilisateur en kg")
    height_cm: float = Field(..., gt=0, description="Taille de l'utilisateur en cm")
    age: int = Field(..., gt=0, description="Âge de l'utilisateur")
    gender: str = Field(
        "male",
        pattern=r"^(male|female)$",
        description="Genre de l'utilisateur ('male' ou 'female')"
    )

class BMRQuery(BaseModel):
    poids_kg: float = Field(..., gt=0, description="Poids de l'utilisateur en kg")
    taille_cm: float = Field(..., gt=0, description="Taille de l'utilisateur en cm")
    age: int = Field(..., gt=0, description="Âge de l'utilisateur")
    sexe: str = Field(..., pattern=r"^(male|female|homme|femme)$", description="Sexe de l'utilisateur")

class TDEEQuery(BMRQuery):
    calories_sport: float = Field(0.0, ge=0, description="Calories brûlées via sport")

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
    tdee: float = Field(..., description="Total Daily Energy Expenditure calculé (kcal)")

class DailySummary(BaseModel):
    date: str
    total_calories: float
    total_sport: float
    tdee: float
    balance: float
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
        foods = [NutritionixFood(
            aliment=row["Aliment"], quantite=row["Quantite"], poids_g=row["Poids_g"],
            calories=row["Calories"], proteines_g=row["Proteines_g"], glucides_g=row["Glucides_g"], lipides_g=row["Lipides_g"],
        ) for _, row in df.iterrows()]

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
                barcode=None
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
def search(query: str = Query(..., min_length=1, description="Terme de recherche produit")):
    """
    Recherche un produit sur OpenFoodFacts par terme.
    """
    prod = get_off_search_nutrition(query)
    if not prod:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    return OFFProduct(**prod)

@router.post("/exercise", response_model=List[ExerciseResult])
def exercise(data: ExerciseQuery):
    """
    Analyse une activité sportive et renvoie la liste d'exercices formatée.
    """
    try:
        exercises_raw = analyze_exercise_nutritionix(
            text_fr=data.query, weight_kg=data.weight_kg,
            height_cm=data.height_cm, age=data.age, gender=data.gender
        )
        # ===== Sauvegarde des activités dans Supabase =====
        user_id = TEST_USER_ID
        for ex in exercises_raw:
            insert_activity(
                user_id=user_id,
                date=str(date.today()),
                description=ex.get("name", ""),
                duree_min=ex.get("duration_min", 0),
                calories_brulees=ex.get("nf_calories", 0)
            )
        # ===== Fin sauvegarde =====
        results = [ExerciseResult(
            name=ex.get("name",""), duration_min=ex.get("duration_min",0), calories=ex.get("nf_calories",0), met=ex.get("met")
        ) for ex in exercises_raw]
        return results
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=503, detail="Service d'exercice temporairement indisponible, réessayez plus tard")

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
        tdee_value = calculer_tdee(data.poids_kg, data.taille_cm, data.age, data.sexe, data.calories_sport)
        bmr_value = calculer_bmr(data.poids_kg, data.taille_cm, data.age, data.sexe)
        return TDEResponse(bmr=bmr_value, calories_sport=data.calories_sport, tdee=tdee_value)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/daily-summary", response_model=DailySummary)
def daily_summary():
    """Calcule et/ou retourne le résumé de la journée (bilan nutritionnel)."""
    user_id = TEST_USER_ID
    today = str(date.today())

    # Vérifie si le résumé existe déjà
    rec = db.get_daily_summary(user_id, today)
    if rec:
        return DailySummary(
            date=rec["date"],
            total_calories=rec["total_calories"],
            total_sport=rec["total_sport"],
            tdee=rec["tdee"],
            balance=rec["balance"],
            conseil=rec["conseil"],
        )

    # 1. Calcule les apports du jour
    meals = db.get_meals(user_id, today)
    meal_items = []
    for meal in meals:
        meal_items += db.get_meal_items(meal["id"])
    total_calories = sum(item["calories"] for item in meal_items) if meal_items else 0.0

    # 2. Calcule les calories sportives
    activities = db.get_activities(user_id, today)
    total_sport = sum(act["calories_brulees"] for act in activities) if activities else 0.0

    # 3. Profil utilisateur (exemple simple ici)
    user = {
        "poids_kg": 75,
        "taille_cm": 175,
        "age": 30,
        "sexe": "homme",
        "objectif": "maintien",
    }

    # 4. Calcul TDEE
    bmr = calculer_bmr(user["poids_kg"], user["taille_cm"], user["age"], user["sexe"])
    tdee = calculer_tdee(user["poids_kg"], user["taille_cm"], user["age"], user["sexe"], total_sport)

    # 5. Balance et conseil personnalisé
    balance = total_calories - tdee
    if user["objectif"] == "perte":
        conseil = (
            "Déficit souhaité pour perdre du poids" if balance < 0 else "Surplus, attention si vous souhaitez maigrir"
        )
    elif user["objectif"] == "prise":
        conseil = (
            "Surplus idéal pour prendre de la masse" if balance > 0 else "Pas assez de calories pour progresser"
        )
    else:
        conseil = (
            "Maintien calorique atteint" if abs(balance) < 100 else "Déséquilibre léger aujourd’hui"
        )

    # 6. Sauvegarde dans Supabase
    db.insert_daily_summary(
        user_id=user_id,
        date=today,
        total_calories=total_calories,
        total_sport=total_sport,
        tdee=tdee,
        balance=balance,
        conseil=conseil,
    )

    return DailySummary(
        date=today,
        total_calories=total_calories,
        total_sport=total_sport,
        tdee=tdee,
        balance=balance,
        conseil=conseil,
    )
