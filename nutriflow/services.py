import os
import requests
import pandas as pd
import unicodedata
import asyncio
import inspect
from typing import List, Dict, Optional
from fastapi import HTTPException
from googletrans import Translator

# Retrieve Nutritionix credentials from environment variables
APP_ID = os.getenv("NUTRIFLOW_NUTRITIONIX_APP_ID")
API_KEY = os.getenv("NUTRIFLOW_NUTRITIONIX_API_KEY")

# Mapping manuel des activités sportives FR ➔ EN
SPORTS_MAPPING: Dict[str, str] = {
    "natation": "swimming",
    "course": "running",
    "marche": "walking",
    "vélo": "cycling",
    "cyclisme": "cycling",
    "musculation": "weight lifting",
    "fitness": "fitness",
    "yoga": "yoga",
    "boxe": "boxing",
    "danse": "dancing",
    "elliptique": "elliptical trainer",
    "tapis de course": "treadmill",
    "escalade": "climbing",
    "ski": "skiing",
    "snowboard": "snowboarding",
    "basket": "basketball",
    "basket-ball": "basketball",
    "football": "soccer",
    "foot": "soccer",
    "tennis": "tennis",
    "badminton": "badminton",
    "ping pong": "table tennis",
    "tennis de table": "table tennis",
    "volley": "volleyball",
    "volley-ball": "volleyball",
    "rugby": "rugby",
    "handball": "handball",
    "crossfit": "crossfit",
    "pilates": "pilates",
    "step": "step aerobics",
    "aviron": "rowing",
    "rameur": "rowing",
    "randonnée": "hiking",
    "marathon": "marathon running",
    "triathlon": "triathlon",
    "trail": "trail running",
    "boxe thai": "muay thai",
    "judo": "judo",
    "karaté": "karate",
    "arts martiaux": "martial arts",
    "plongée": "diving",
    "rollers": "rollerblading",
    "patinage": "ice skating",
    "golf": "golf",
    "escrime": "fencing",
    "skate": "skateboarding",
    "cross-training": "cross training",
    "corde à sauter": "jump rope",
    "jump rope": "jump rope",
    "stretching": "stretching",
    "surf": "surfing",
    "cheval": "horse riding",
    "équitation": "horse riding",
}


def clean_text(text: str) -> str:
    """
    Nettoie le texte en remplaçant les apostrophes spéciales et les caractères accentués.
    """
    text = text.replace("’", "'").replace("œ", "oe")
    return unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("utf-8")


def translate_fr_en(text_fr: str) -> str:
    # Mapping manuel FR→EN pour les aliments courants
    corrections = {
        "avocat": "avocado",
        "maïs": "corn",
        "mais": "corn",
        "tomate cerise": "cherry tomato",
        "œuf": "egg",
        "oeuf": "egg",
        "œufs": "eggs",
        "oeufs": "eggs",
        "pomme de terre": "potato",
        "pommes de terre": "potatoes",
        "pâtes": "pasta",
        "riz": "rice",
        "fromage": "cheese",
        "thon": "tuna",
        "lait": "milk",
        "pain": "bread",
        "yaourt": "yogurt",
        "banane": "banana",
        "carotte": "carrot",
        "carottes": "carrots",
        "poulet": "chicken breast",
        "boeuf": "beef",
        "steak": "steak",
        "porc": "pork",
        "jambon": "ham",
        "saumon": "salmon",
        "dinde": "turkey",
        "haricot vert": "green bean",
        "haricots verts": "green beans",
        "lentilles": "lentils",
        "pois chiche": "chickpea",
        "pois chiches": "chickpeas",
        "poivron": "bell pepper",
        "poivrons": "bell peppers",
        "courgette": "zucchini",
        "courgettes": "zucchinis",
        "aubergine": "eggplant",
        "aubergines": "eggplants",
        "oignon": "onion",
        "oignons": "onions",
        "ail": "garlic",
        "laitue": "lettuce",
        "salade": "lettuce",
        "beurre": "butter",
        "huile": "oil",
        "huile d'olive": "olive oil",
        "sucre": "sugar",
        "miel": "honey",
        "concombre": "cucumber",
        "concombres": "cucumbers",
        "pomme": "apple",
        "pommes": "apples",
        "poire": "pear",
        "poires": "pears",
        "orange": "orange",
        "oranges": "oranges",
        "fraise": "strawberry",
        "fraises": "strawberries",
        "framboise": "raspberry",
        "framboises": "raspberries",
        "cerise": "cherry",
        "cerises": "cherries",
        "abricot": "apricot",
        "abricots": "apricots",
        "raisin": "grape",
        "raisins": "grapes",
        "melon": "melon",
        "pastèque": "watermelon",
        "ananas": "pineapple",
        "kiwi": "kiwi",
        "citron": "lemon",
        "citrons": "lemons",
        "grenade": "pomegranate",
        " de ": " ",
        # ... complète au fil des tests
    }
    texte = clean_text(text_fr).lower()
    for fr, en in corrections.items():
        texte = texte.replace(fr, en)
    from googletrans import Translator
    translator = Translator()
    try:
        result = translator.translate(texte, src='fr', dest='en')
        print(f"🔁 Texte envoyé à Nutritionix : {texte} → {result.text}")
        return result.text
    except Exception as e:
        print(f"❌ Erreur traduction : {e}")
        return texte


def translate_activity_fr_en(text_fr: str) -> str:
    """Traduit une activité sportive en anglais.

    Utilise d'abord un mapping manuel puis la fonction centrale de
    traduction pour le reste.
    """
    texte = text_fr.lower()
    for fr, en in SPORTS_MAPPING.items():
        if fr in texte:
            texte = texte.replace(fr, en)
    # On passe le texte obtenu à la fonction générique de traduction
    return translate_fr_en(texte)


def get_off_search_nutrition(query: str) -> Optional[Dict]:
    """
    Recherche d'un produit sur OpenFoodFacts par termes de recherche.
    Retourne un dict ou None.
    """
    url = "https://world.openfoodfacts.org/cgi/search.pl"
    params = {"search_terms": query,"search_simple": 1,"action": "process","json": 1}
    data = requests.get(url, params=params).json()
    if data.get("products"):
        p = data["products"][0]
        n = p.get("nutriments", {})
        return {
            "name": p.get("product_name", "Inconnu"),
            "brand": p.get("brands", "Inconnue"),
            "energy_kcal_per_100g": n.get("energy-kcal_100g"),
            "fat_per_100g": n.get("fat_100g"),
            "sugars_per_100g": n.get("sugars_100g"),
            "proteins_per_100g": n.get("proteins_100g"),
            "salt_per_100g": n.get("salt_100g"),
        }
    return None


def get_off_nutrition_by_barcode(barcode: str) -> Optional[Dict]:
    """
    Récupère les informations nutritionnelles via code-barres.
    Retourne un dict ou None.
    """
    url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
    data = requests.get(url).json()
    if data.get("status") == 1:
        p = data["product"]
        n = p.get("nutriments", {})
        return {
            "name": p.get("product_name", "Inconnu"),
            "brand": p.get("brands", "Inconnue"),
            "energy_kcal_per_100g": n.get("energy-kcal_100g"),
            "fat_per_100g": n.get("fat_100g"),
            "sugars_per_100g": n.get("sugars_100g"),
            "proteins_per_100g": n.get("proteins_100g"),
            "salt_per_100g": n.get("salt_100g"),
        }
    return None


def analyze_ingredients_nutritionix(text_fr: str) -> List[Dict]:
    """
    Analyse d'ingrédients via Nutritionix Natural Language API.
    """
    query = translate_fr_en(text_fr)
    print(f"\N{CLOCKWISE OPEN CIRCLE ARROW} Requête envoyée à Nutritionix : {query}")
    url = "https://trackapi.nutritionix.com/v2/natural/nutrients"
    headers = {"x-app-id": APP_ID, "x-app-key": API_KEY, "Content-Type": "application/json"}
    resp = requests.post(url, headers=headers, json={"query": query})
    resp.raise_for_status()
    return resp.json().get("foods", [])


def convert_nutritionix_to_df(foods: List[Dict]) -> pd.DataFrame:
    """
    Convertit une liste Nutritionix en DataFrame.
    """
    rows = []
    for f in foods:
        rows.append({
            "Aliment": f.get("food_name", ""),
            "Quantite": f"{f.get('serving_qty', 0)} {f.get('serving_unit','')}",
            "Poids_g": f.get("serving_weight_grams", 0),
            "Calories": f.get("nf_calories", 0),
            "Proteines_g": f.get("nf_protein", 0),
            "Glucides_g": f.get("nf_total_carbohydrate", 0),
            "Lipides_g": f.get("nf_total_fat", 0)
        })
    return pd.DataFrame(rows)


def calculate_totals(df: pd.DataFrame) -> Dict[str, float]:
    """
    Calcule les totaux macros.
    """
    return {
        "total_calories": df["Calories"].sum(),
        "total_proteins_g": df["Proteines_g"].sum(),
        "total_carbs_g": df["Glucides_g"].sum(),
        "total_fats_g": df["Lipides_g"].sum(),
    }


def analyze_exercise_nutritionix(
    text_fr: str, weight_kg: float, height_cm: float, age: int, gender: str = "male"
) -> List[Dict]:
    """
    Analyse d'activité via Nutritionix Exercise API.
    """
    query = translate_activity_fr_en(text_fr)
    print(f"🔁 Requête envoyée à Nutritionix : {query}")
    url = "https://trackapi.nutritionix.com/v2/natural/exercise"
    headers = {"x-app-id": APP_ID, "x-app-key": API_KEY, "Content-Type": "application/json"}
    body = {"query": query, "gender": gender, "weight_kg": weight_kg, "height_cm": height_cm, "age": age}
    resp = requests.post(url, headers=headers, json=body)
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail="Erreur Nutritionix Exercise")
    return resp.json().get("exercises", [])

# ---- Nouvelle fonction TDEE ----

def calculer_bmr(poids_kg: float, taille_cm: float, age: int, sexe: str) -> float:
    """
    Calcule le métabolisme de base (BMR) selon Mifflin-St Jeor.
    """
    s = sexe.lower()
    if s == "male" or s == "homme":
        return 10 * poids_kg + 6.25 * taille_cm - 5 * age + 5
    elif s == "female" or s == "femme":
        return 10 * poids_kg + 6.25 * taille_cm - 5 * age - 161
    else:
        raise ValueError("Sexe non reconnu: 'male'/'female' ou 'homme'/'femme'")


def calculer_tdee(
    poids_kg: float,
    taille_cm: float,
    age: int,
    sexe: str,
    calories_sport: float = 0.0
) -> float:
    """
    Calcule le TDEE = BMR + calories_sportives.
    Affiche un résumé clair des valeurs.
    """
    bmr = calculer_bmr(poids_kg, taille_cm, age, sexe)
    tdee = bmr + calories_sport
    print(f"🧬 BMR (Métabolisme de base) : {bmr:.0f} kcal")
    print(f"🏋️ Calories brûlées via sport : {calories_sport:.0f} kcal")
    print(f"📊 TDEE total journalier estimé : {tdee:.0f} kcal")
    return tdee
