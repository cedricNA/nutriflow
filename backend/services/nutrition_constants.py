"""
Constantes nutritionnelles pour le système de recommandations.
Basées sur les recommandations officielles de l'ANSES et de l'OMS.
"""

# Seuils nutritionnels de référence (adulte moyen)
NUTRITION_TARGETS = {
    # Macronutriments
    "calories_min": 1200,  # kcal/jour minimum
    "calories_max": 2500,  # kcal/jour maximum (varie selon profil)
    "protein_min_per_kg": 0.8,  # g/kg poids corporel minimum
    "protein_optimal_per_kg": 1.2,  # g/kg poids corporel optimal
    "carbs_min_percent": 45,  # % calories minimum
    "carbs_max_percent": 65,  # % calories maximum
    "fat_min_percent": 20,  # % calories minimum
    "fat_max_percent": 35,  # % calories maximum
    # Micronutriments
    "fiber_min": 25,  # g/jour minimum
    "fiber_optimal": 30,  # g/jour optimal
    "sodium_max": 2300,  # mg/jour maximum
    "sugar_max_percent": 10,  # % calories totales maximum
    "saturated_fat_max_percent": 10,  # % calories totales maximum
    # Hydratation (pour futures évolutions)
    "water_min_ml": 1500,  # ml/jour minimum
    "water_optimal_ml": 2000,  # ml/jour optimal
}

# Poids corporel de référence (utilisateur test)
DEFAULT_BODY_WEIGHT_KG = 70  # kg


# Messages de recommandations par catégorie
DEFICIT_MESSAGES = {
    "calories": "Votre apport calorique semble insuffisant pour vos besoins énergétiques quotidiens.",
    "protein": "Augmentez votre apport en protéines pour maintenir votre masse musculaire et satiété.",
    "fiber": "Consommez plus de fibres pour améliorer votre digestion et santé intestinale.",
    "carbs": "Intégrez plus de glucides complexes pour soutenir votre énergie au quotidien.",
    "fat": "Ajoutez des graisses saines à votre alimentation pour l'absorption des vitamines.",
}

EXCESS_MESSAGES = {
    "calories": "Réduisez légèrement vos portions pour atteindre vos objectifs nutritionnels.",
    "sodium": "Limitez le sel ajouté pour préserver votre santé cardiovasculaire.",
    "sugar": "Réduisez les sucres ajoutés à moins de 10% de vos calories quotidiennes.",
    "saturated_fat": "Privilégiez les graisses insaturées aux graisses saturées.",
}


# Suggestions d'aliments par nutriment (fallback statique)
STATIC_FOOD_SUGGESTIONS = {
    "protein": [
        {
            "name": "Blanc de poulet grillé",
            "nutrient_value": 23.0,
            "nutrient_unit": "g",
            "portion": "100g",
            "portion_size": 100.0,
            "calories_per_portion": 165,
            "additional_nutrients": {"fiber": 0, "sodium": 74},
        },
        {
            "name": "Saumon cuit au four",
            "nutrient_value": 25.0,
            "nutrient_unit": "g",
            "portion": "100g",
            "portion_size": 100.0,
            "calories_per_portion": 206,
            "additional_nutrients": {"fiber": 0, "sodium": 83},
        },
        {
            "name": "Yaourt grec nature",
            "nutrient_value": 10.0,
            "nutrient_unit": "g",
            "portion": "150g",
            "portion_size": 150.0,
            "calories_per_portion": 130,
            "additional_nutrients": {"fiber": 0, "sodium": 36},
        },
    ],
    "fiber": [
        {
            "name": "Flocons d'avoine",
            "nutrient_value": 10.0,
            "nutrient_unit": "g",
            "portion": "80g",
            "portion_size": 80.0,
            "calories_per_portion": 304,
            "additional_nutrients": {"protein": 11, "sodium": 2},
        },
        {
            "name": "Brocolis cuits",
            "nutrient_value": 5.1,
            "nutrient_unit": "g",
            "portion": "200g",
            "portion_size": 200.0,
            "calories_per_portion": 55,
            "additional_nutrients": {"protein": 5, "sodium": 8},
        },
        {
            "name": "Haricots rouges",
            "nutrient_value": 15.0,
            "nutrient_unit": "g",
            "portion": "200g",
            "portion_size": 200.0,
            "calories_per_portion": 245,
            "additional_nutrients": {"protein": 17, "sodium": 13},
        },
    ],
    "carbs": [
        {
            "name": "Quinoa cuit",
            "nutrient_value": 22.0,
            "nutrient_unit": "g",
            "portion": "100g",
            "portion_size": 100.0,
            "calories_per_portion": 120,
            "additional_nutrients": {"protein": 4.4, "fiber": 2.8},
        },
        {
            "name": "Patate douce cuite",
            "nutrient_value": 18.0,
            "nutrient_unit": "g",
            "portion": "150g",
            "portion_size": 150.0,
            "calories_per_portion": 112,
            "additional_nutrients": {"protein": 2, "fiber": 3.8},
        },
        {
            "name": "Banane",
            "nutrient_value": 23.0,
            "nutrient_unit": "g",
            "portion": "1 moyenne (120g)",
            "portion_size": 120.0,
            "calories_per_portion": 105,
            "additional_nutrients": {"protein": 1.3, "fiber": 3.1},
        },
    ],
    "fat": [
        {
            "name": "Avocat",
            "nutrient_value": 15.0,
            "nutrient_unit": "g",
            "portion": "1/2 avocat (100g)",
            "portion_size": 100.0,
            "calories_per_portion": 160,
            "additional_nutrients": {"protein": 2, "fiber": 7},
        },
        {
            "name": "Noix mélangées",
            "nutrient_value": 20.0,
            "nutrient_unit": "g",
            "portion": "30g",
            "portion_size": 30.0,
            "calories_per_portion": 185,
            "additional_nutrients": {"protein": 6, "fiber": 3},
        },
        {
            "name": "Huile d'olive",
            "nutrient_value": 14.0,
            "nutrient_unit": "g",
            "portion": "1 cuillère à soupe (15ml)",
            "portion_size": 15.0,
            "calories_per_portion": 120,
            "additional_nutrients": {"protein": 0, "fiber": 0},
        },
    ],
}


# Termes de recherche pour APIs externes
API_SEARCH_TERMS = {
    "protein": ["chicken breast", "salmon", "greek yogurt", "lentils", "tofu", "eggs"],
    "fiber": ["oats", "broccoli", "black beans", "avocado", "quinoa", "apple"],
    "carbs": [
        "quinoa",
        "sweet potato",
        "brown rice",
        "banana",
        "oats",
        "whole wheat pasta",
    ],
    "fat": ["avocado", "olive oil", "nuts", "salmon", "seeds", "dark chocolate"],
}


# Priorités des recommandations (1 = plus haute priorité)
RECOMMENDATION_PRIORITIES = {
    "deficit_calories": 1,
    "deficit_protein": 1,
    "excess_sodium": 2,
    "deficit_fiber": 2,
    "excess_sugar": 3,
    "deficit_carbs": 3,
    "deficit_fat": 4,
    "excess_saturated_fat": 4,
}


# Configuration de confiance selon les données disponibles
CONFIDENCE_LEVELS = {
    "high": {"min_days": 6, "description": "Analyse très fiable"},
    "medium": {"min_days": 4, "description": "Analyse modérément fiable"},
    "low": {
        "min_days": 1,
        "description": "Analyse peu fiable, ajoutez plus de données",
    },
}


def get_confidence_level(days_with_data: int) -> str:
    """Détermine le niveau de confiance selon le nombre de jours de données."""
    if days_with_data >= CONFIDENCE_LEVELS["high"]["min_days"]:
        return "high"
    elif days_with_data >= CONFIDENCE_LEVELS["medium"]["min_days"]:
        return "medium"
    else:
        return "low"


def get_target_protein_grams(weight_kg: float = DEFAULT_BODY_WEIGHT_KG) -> float:
    """Calcule l'apport protéique optimal selon le poids."""
    return weight_kg * NUTRITION_TARGETS["protein_optimal_per_kg"]


def get_target_calories_from_macros(
    carbs_g: float, protein_g: float, fat_g: float
) -> float:
    """Calcule les calories totales à partir des macronutriments."""
    return (carbs_g * 4) + (protein_g * 4) + (fat_g * 9)
