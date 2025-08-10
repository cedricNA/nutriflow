import os
import requests
import pandas as pd
import unicodedata
import asyncio
import inspect
from typing import List, Dict, Optional
from fastapi import HTTPException
from datetime import date as dt_date, datetime

import nutriflow.db.supabase as db

# Retrieve Nutritionix credentials from environment variables
APP_ID = os.getenv("NUTRIFLOW_NUTRITIONIX_APP_ID")
API_KEY = os.getenv("NUTRIFLOW_NUTRITIONIX_API_KEY")

# Mapping manuel des activités sportives FR ➔ EN
SPORTS_MAPPING: Dict[str, str] = {
    # Activités d'endurance
    "course à pied": "running",
    "course a pied": "running",
    "jogging": "running",
    "footing": "running",
    "course": "running",
    "marathon": "marathon running",
    "trail": "trail running",
    "marche rapide": "brisk walking",
    "marche": "walking",
    "vélo": "cycling",
    "velo": "cycling",
    "cyclisme": "cycling",
    "vtt": "mountain biking",
    "vélo d'appartement": "stationary bike",
    "velo d'appartement": "stationary bike",
    "vélo elliptique": "elliptical trainer",
    "velo elliptique": "elliptical trainer",
    "natation": "swimming",
    # Renforcement musculaire et fitness
    "musculation": "weight lifting",
    "haltérophilie": "weight lifting",
    "muscu": "weight lifting",
    "fitness": "fitness",
    "cross-training": "cross training",
    "crossfit": "crossfit",
    "pilates": "pilates",
    "yoga": "yoga",
    "step": "step aerobics",
    "stretching": "stretching",
    # Sports de combat et arts martiaux
    "boxe thai": "muay thai",
    "boxe": "boxing",
    "judo": "judo",
    "karaté": "karate",
    "arts martiaux": "martial arts",
    # Sports collectifs et de raquette
    "football": "soccer",
    "foot": "soccer",
    "basket": "basketball",
    "basket-ball": "basketball",
    "handball": "handball",
    "rugby": "rugby",
    "tennis": "tennis",
    "badminton": "badminton",
    "ping pong": "table tennis",
    "tennis de table": "table tennis",
    "volley": "volleyball",
    "volley-ball": "volleyball",
    # Autres activités
    "elliptique": "elliptical trainer",
    "tapis de course": "treadmill",
    "escalade": "climbing",
    "ski": "skiing",
    "snowboard": "snowboarding",
    "aviron": "rowing",
    "rameur": "rowing",
    "randonnée": "hiking",
    "triathlon": "triathlon",
    "plongée": "diving",
    "rollers": "rollerblading",
    "patinage": "ice skating",
    "golf": "golf",
    "escrime": "fencing",
    "skate": "skateboarding",
    "corde à sauter": "jump rope",
    "jump rope": "jump rope",
    "surf": "surfing",
    "cheval": "horse riding",
    "équitation": "horse riding",
}

# Chemin par défaut du mapping CSV FR→EN
DEFAULT_MAPPING_PATH = os.path.join(
    os.path.dirname(__file__), "..", "data", "fr_en_mapping.csv"
)

# Dictionnaire chargé depuis le fichier CSV (initialement None)
_CSV_MAPPING: Optional[Dict[str, str]] = None

# Ensemble des unités anglaises reconnues
UNIT_EN: set = {
    "tablespoon",
    "teaspoon",
    "slice",
    "cup",
    "glass",
    "pinch",
    "clove",
    "g",
    "kg",
    "ml",
    "l",
    "cl",
    "packet",
    "can",
    "pack",
    "carton",
    "piece",
    "fillet",
    "serving",
    "stick",
    "ball",
}


def load_mapping_csv(filepath: str) -> Dict[str, str]:
    """Charge un CSV "fr,en" ou "fr;en" et retourne un dictionnaire."""
    # On détecte automatiquement le séparateur utilisé
    with open(filepath, "r", encoding="utf-8-sig") as f:
        first_line = f.readline()
    delimiter = ";" if first_line.count(";") >= first_line.count(",") else ","

    df = pd.read_csv(filepath, sep=delimiter)
    mapping = {}
    for _, row in df.iterrows():
        fr = clean_text(str(row["fr"]))
        mapping[fr.lower().strip()] = str(row["en"]).strip()
    return mapping


def _ensure_mapping_loaded() -> None:
    """Charge le mapping CSV par défaut au premier appel."""
    global _CSV_MAPPING
    if _CSV_MAPPING is None:
        if os.path.exists(DEFAULT_MAPPING_PATH):
            try:
                _CSV_MAPPING = load_mapping_csv(DEFAULT_MAPPING_PATH)
            except Exception:
                _CSV_MAPPING = {}
        else:
            _CSV_MAPPING = {}


def reload_mapping(filepath: Optional[str] = None) -> None:
    """Recharge le mapping depuis ``filepath`` ou le chemin par défaut."""
    global _CSV_MAPPING, DEFAULT_MAPPING_PATH
    path = filepath or DEFAULT_MAPPING_PATH
    if filepath:
        DEFAULT_MAPPING_PATH = filepath
    if os.path.exists(path):
        _CSV_MAPPING = load_mapping_csv(path)
    else:
        _CSV_MAPPING = {}


def get_unit_variants() -> Dict[str, str]:
    """Retourne le mapping complet des unités FR → EN."""
    _ensure_mapping_loaded()
    return {fr: en for fr, en in (_CSV_MAPPING or {}).items() if en in UNIT_EN}


def normalize_unit(unit: str) -> str:
    """Normalise une unité française en anglais via le mapping."""
    _ensure_mapping_loaded()
    key = clean_text(unit).lower().strip()
    return (_CSV_MAPPING or {}).get(key, unit)


def normalize_units_text(text: str) -> str:
    """Remplace dans le texte toutes les unités françaises par leur équivalent anglais."""
    _ensure_mapping_loaded()
    mapping = get_unit_variants()
    for fr, en in sorted(mapping.items(), key=lambda i: len(i[0]), reverse=True):
        text = text.replace(fr, en)
    return text


def clean_text(text: str) -> str:
    """
    Nettoie le texte en remplaçant les apostrophes spéciales et les caractères accentués.
    """
    text = text.replace("’", "'").replace("œ", "oe")
    return unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("utf-8")


# Mapping manuel FR→EN pour les aliments courants
MANUAL_CORRECTIONS: Dict[str, str] = {
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
    " de ": " of ",
    # ... complète au fil des tests
}


def translate_fr_en(text_fr: str) -> str:
    _ensure_mapping_loaded()
    texte = clean_text(text_fr).lower()
    # On applique d'abord le mapping issu du CSV
    # On applique le mapping du CSV en remplaçant d'abord les clés les plus longues
    for fr, en in sorted(
        (_CSV_MAPPING or {}).items(), key=lambda item: len(item[0]), reverse=True
    ):
        texte = texte.replace(fr, en)
    # Puis le mapping manuel, également trié par taille
    for fr, en in sorted(
        MANUAL_CORRECTIONS.items(), key=lambda item: len(item[0]), reverse=True
    ):
        texte = texte.replace(fr, en)
    from googletrans import Translator

    translator = Translator()
    try:
        result = translator.translate(texte, src="fr", dest="en")
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
    # On remplace d'abord les termes français par leurs équivalents anglais
    # en triant les clés par longueur pour éviter les collisions
    for fr in sorted(SPORTS_MAPPING.keys(), key=len, reverse=True):
        en = SPORTS_MAPPING[fr]
        if fr in texte:
            texte = texte.replace(fr, en)

    # Nettoyage simple des "de", "du", "d'" qui précèdent souvent l'activité
    texte = (
        texte.replace(" d'", " ")
        .replace(" de ", " ")
        .replace(" du ", " ")
        .replace(" des ", " ")
    )

    # On passe le texte obtenu à la fonction générique de traduction
    return translate_fr_en(texte)


def get_off_search_nutrition(query: str) -> Optional[Dict]:
    """
    Recherche d'un produit sur OpenFoodFacts par termes de recherche.
    Retourne un dict ou None.
    """
    url = "https://world.openfoodfacts.org/cgi/search.pl"
    params = {"search_terms": query, "search_simple": 1, "action": "process", "json": 1}
    data = requests.get(url, params=params).json()
    if data.get("products"):
        p = data["products"][0]
        n = p.get("nutriments", {})
        return {
            "barcode": p.get("code"),
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
    """Récupère les informations nutritionnelles via code-barres sur
    OpenFoodFacts et retourne un dictionnaire complet ou ``None``."""

    url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
    data = requests.get(url).json()
    if data.get("status") == 1:
        p = data["product"]
        n = p.get("nutriments", {})
        return {
            "barcode": p.get("code", barcode),
            "name": p.get("product_name", "Inconnu"),
            "brand": p.get("brands", "Inconnue"),
            "quantity": p.get("quantity"),
            "categories": p.get("categories"),
            "image_url": p.get("image_url"),
            "image_front_url": p.get("image_front_url"),
            "image_nutrition_url": p.get("image_nutrition_url"),
            "image_ingredients_url": p.get("image_ingredients_url"),
            "energy_kcal_per_100g": n.get("energy-kcal_100g"),
            "fat_per_100g": n.get("fat_100g"),
            "carbs_per_100g": n.get("carbohydrates_100g"),
            "sugars_per_100g": n.get("sugars_100g"),
            "proteins_per_100g": n.get("proteins_100g"),
            "salt_per_100g": n.get("salt_100g"),
            "nutriscore_grade": p.get("nutriscore_grade"),
            "nutriscore_score": p.get("nutriscore_score"),
            "ecoscore_grade": p.get("ecoscore_grade"),
            "ecoscore_score": p.get("ecoscore_score"),
            "nova_group": p.get("nova_group"),
            "labels_tags": ", ".join(p.get("labels_tags", [])),
            "additives_tags": ", ".join(p.get("additives_tags", [])),
            "allergens_tags": ", ".join(p.get("allergens_tags", [])),
            "traces_tags": ", ".join(p.get("traces_tags", [])),
            "ingredients_text_fr": p.get("ingredients_text_fr"),
            "ingredients_list": p.get("ingredients", []),
            "manufacturing_places": p.get("manufacturing_places"),
            "countries": p.get("countries"),
            "packaging": p.get("packaging"),
            "product_quantity": p.get("product_quantity"),
            "serving_size": p.get("serving_size"),
            "nova_groups_tags": ", ".join(p.get("nova_groups_tags", [])),
            "categories_tags": ", ".join(p.get("categories_tags", [])),
        }
    return None


def analyze_ingredients_nutritionix(text_fr: str) -> List[Dict]:
    """
    Analyse d'ingrédients via Nutritionix Natural Language API.
    """
    query = translate_fr_en(text_fr)
    print(f"\N{CLOCKWISE OPEN CIRCLE ARROW} Requête envoyée à Nutritionix : {query}")
    url = "https://trackapi.nutritionix.com/v2/natural/nutrients"
    headers = {
        "x-app-id": APP_ID,
        "x-app-key": API_KEY,
        "Content-Type": "application/json",
    }
    resp = requests.post(url, headers=headers, json={"query": query})
    resp.raise_for_status()
    return resp.json().get("foods", [])


def convert_nutritionix_to_df(foods: List[Dict]) -> pd.DataFrame:
    """
    Convertit une liste Nutritionix en DataFrame.
    """
    rows = []
    for f in foods:
        rows.append(
            {
                "Aliment": f.get("food_name", ""),
                "Quantite": f"{f.get('serving_qty', 0)} {f.get('serving_unit','')}",
                "Poids_g": f.get("serving_weight_grams", 0),
                "Calories": f.get("nf_calories", 0),
                "Proteines_g": f.get("nf_protein", 0),
                "Glucides_g": f.get("nf_total_carbohydrate", 0),
                "Lipides_g": f.get("nf_total_fat", 0),
            }
        )
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
    headers = {
        "x-app-id": APP_ID,
        "x-app-key": API_KEY,
        "Content-Type": "application/json",
    }
    body = {
        "query": query,
        "gender": gender,
        "weight_kg": weight_kg,
        "height_cm": height_cm,
        "age": age,
    }
    resp = requests.post(url, headers=headers, json=body)
    if resp.status_code != 200:
        raise HTTPException(
            status_code=resp.status_code, detail="Erreur Nutritionix Exercise"
        )
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
    poids_kg: float, taille_cm: float, age: int, sexe: str, facteur_activite: float
) -> float:
    """
    Calcule le TDEE de base = BMR * facteur d'activité.
    """
    bmr = calculer_bmr(poids_kg, taille_cm, age, sexe)
    tdee_base = bmr * facteur_activite
    print(f"🧬 BMR (Métabolisme de base) : {bmr:.0f} kcal")
    print(f"⚙️ Facteur d'activité : {facteur_activite}")
    print(f"📊 TDEE de base estimé : {tdee_base:.0f} kcal")
    return tdee_base


def ajuster_tdee(tdee_base: float, goal: str) -> float:
    """Ajuste le TDEE en fonction de l'objectif (perte, maintien, prise)."""
    g = (goal or "maintien").lower()
    if g == "perte":
        return tdee_base * 0.8
    if g == "prise":
        return tdee_base * 1.15
    return tdee_base


def calculate_calorie_goal(tdee: Optional[float], objectif: Optional[str]) -> Optional[float]:
    """Calcule l'objectif calorique selon l'objectif utilisateur."""
    if tdee is None:
        return None
    obj = (objectif or "maintien").lower()
    if obj == "perte":
        goal = tdee - 500
    elif obj == "prise":
        goal = tdee + 300
    else:
        goal = tdee
    return round(goal)


def calculate_macro_goals(poids_kg: Optional[float], calories_goal: Optional[float]) -> Dict[str, Optional[float]]:
    """Calcule les objectifs journaliers de protéines, lipides et glucides."""
    if not poids_kg or not calories_goal:
        return {"proteins": None, "carbs": None, "fats": None}

    proteins = 1.6 * poids_kg
    fats = calories_goal * 0.25 / 9
    carbs = (calories_goal - proteins * 4 - fats * 9) / 4

    return {
        "proteins": round(proteins),
        "carbs": round(carbs),
        "fats": round(fats),
    }


def generate_conseil(objectif: str, balance: float) -> str:
    """Retourne un message personnalisé selon l'objectif et la balance."""
    obj = (objectif or "maintien").lower()
    if obj == "perte":
        if balance < -300:
            return "Déficit important, perte de poids rapide possible."
        if balance < 0:
            return "Déficit modéré, bonne trajectoire pour perdre du poids."
        if balance < 150:
            return "Attention, vous êtes en léger surplus."
        return "Surplus, risque de prise de poids."
    if obj == "prise":
        if balance > 300:
            return "Surplus optimal pour prise de masse."
        if balance > 0:
            return "Surplus léger, progression possible mais lente."
        if balance > -150:
            return "Attention, vous êtes presque à l’équilibre."
        return "Déficit, trop faible pour prise de masse."
    # maintien
    if abs(balance) < 150:
        return "Maintien calorique atteint."
    if balance < 0:
        return "Léger déficit, surveillez si ce n’est pas souhaité."
    return "Léger surplus, surveillez si ce n’est pas souhaité."


def update_daily_summary(user_id: str, date: Optional[str] = None) -> Dict:
    """Agrège repas et activités d'une journée et met à jour `daily_summary`."""

    print(f"update_daily_summary appelé avec user_id={user_id}, date={date}")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id requis")

    date_str = date if date else dt_date.today().isoformat()
    if not date_str:
        raise HTTPException(status_code=400, detail="date requise")

    try:
        meals = db.get_meals(user_id, date_str)
        num_meals = len(meals)
        print(f"Repas trouvés pour {date_str}: {meals}")
        calories_apportees = prot_tot = gluc_tot = lip_tot = 0.0
        for meal in meals:
            items = db.get_meal_items(meal.get("id"))
            for it in items:
                calories_apportees += it.get("calories", 0) or 0
                prot_tot += it.get("proteines_g", 0) or 0
                gluc_tot += it.get("glucides_g", 0) or 0
                lip_tot += it.get("lipides_g", 0) or 0

        activities = db.get_activities(user_id, date_str)
        num_activities = len(activities)
        print(f"Activités trouvées pour {date_str}: {activities}")
        calories_brulees = sum(a.get("calories_brulees", 0) or 0 for a in activities)
        total_sport = sum(a.get("duree_min", 0) or 0 for a in activities)

        user = db.get_user(user_id) or {}
        try:
            bmr = calculer_bmr(
                user.get("poids_kg", 0),
                user.get("taille_cm", 0),
                user.get("age", 0),
                user.get("sexe", "male"),
            )
            tdee_base = calculer_tdee(
                user.get("poids_kg", 0),
                user.get("taille_cm", 0),
                user.get("age", 0),
                user.get("sexe", "male"),
                user.get("activity_factor", 1.2),
            )
            tdee = ajuster_tdee(
                tdee_base, user.get("goal") or user.get("objectif")
            )
        except Exception:
            bmr = user.get("bmr", 1500.0) or 1500.0
            tdee = user.get("tdee", 2000.0) or 2000.0

        net_calories = calories_apportees - calories_brulees
        balance_calorique = net_calories - tdee
        total_calories = calories_apportees + calories_brulees
        has_data = bool(num_meals or num_activities)

        objectif = user.get("goal") or user.get("objectif") or "maintien"
        conseil = generate_conseil(objectif, balance_calorique)

        targets: Dict[str, float] = {}
        try:
            from nutriflow.api.router import compute_goals

            goals = compute_goals(user, tdee)
            targets = {
                "target_calories": goals.get("target_kcal"),
                "target_proteins_g": goals.get("prot_g"),
                "target_fats_g": goals.get("fat_g"),
                "target_carbs_g": goals.get("carbs_g"),
            }
        except Exception:
            pass

        record = {
            "user_id": user_id,
            "date": date_str,
            "calories_apportees": calories_apportees,
            "calories_brulees": calories_brulees,
            "prot_tot": prot_tot,
            "gluc_tot": gluc_tot,
            "lip_tot": lip_tot,
            "bmr": bmr,
            "tdee": tdee,
            "balance_calorique": balance_calorique,
            "conseil": conseil,
            "total_calories": total_calories,
            "total_sport": total_sport,
            "num_meals": num_meals,
            "num_activities": num_activities,
            "has_data": has_data,
            "last_updated": datetime.utcnow().isoformat(),
            **targets,
        }

        supabase = db.get_supabase_client()
        response = (
            supabase.table("daily_summary").upsert(
                record, on_conflict=["user_id", "date"]
            ).execute()
        )
        print(f"Réponse upsert daily_summary: {response}")
        if getattr(response, "error", None):
            raise HTTPException(
                status_code=500,
                detail=str(response.error),
            )
        if getattr(response, "data", None) is None:
            raise HTTPException(
                status_code=500,
                detail="Upsert daily_summary n'a renvoyé aucune donnée",
            )
        print(f"📝 daily_summary mis à jour pour {user_id} le {date_str}")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erreur update_daily_summary: {e}")
        return {}
    return response.data[0] if getattr(response, "data", None) else record


def add_meal_item(
    user_id: str,
    date_str: Optional[str],
    meal_type: str,
    item_data: Dict,
) -> Dict:
    """Ajoute un aliment à un repas et met à jour le résumé quotidien."""

    ds = date_str or dt_date.today().isoformat()

    meals = db.get_meals(user_id, ds)
    meal_id = None
    for m in meals:
        if m.get("type") == meal_type:
            meal_id = m.get("id")
            break
    if not meal_id:
        meal_id = db.insert_meal(user_id, ds, meal_type, note="")

    def _zero(val):
        return val if val is not None else 0

    data = {
        "nom_aliment": item_data.get("nom_aliment"),
        "marque": item_data.get("marque"),
        "quantite": item_data.get("quantite"),
        "unite": item_data.get("unite"),
        "calories": _zero(item_data.get("calories")),
        "proteines_g": _zero(item_data.get("proteines_g")),
        "glucides_g": _zero(item_data.get("glucides_g")),
        "lipides_g": _zero(item_data.get("lipides_g")),
        "barcode": item_data.get("barcode"),
        "source": item_data.get("source"),
    }

    item_id = db.insert_meal_item(meal_id=meal_id, **data)
    item = {"id": item_id, "meal_id": meal_id, **data}

    try:
        update_daily_summary(user_id, ds)
    except Exception as e:
        print(f"Erreur recalcul daily_summary: {e}")

    return item
