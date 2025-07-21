import os
from supabase import create_client, Client

def get_supabase_client():
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError("Supabase credentials are not set")
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def insert_meal(user_id, date, type_repas, note=""):
    supabase = get_supabase_client()
    response = supabase.table("meals").insert({
        "user_id": user_id,
        "date": date,
        "type": type_repas,
        "note": note
    }).execute()
    if not response.data:
        raise Exception("Erreur insertion meal")
    return response.data[0]["id"]

def insert_meal_item(meal_id, nom_aliment, marque, quantite, unite, calories, proteines_g, glucides_g, lipides_g, barcode=None):
    supabase = get_supabase_client()
    response = supabase.table("meal_items").insert({
        "meal_id": meal_id,
        "nom_aliment": nom_aliment,
        "marque": marque,
        "quantite": quantite,
        "unite": unite,
        "calories": calories,
        "proteines_g": proteines_g,
        "glucides_g": glucides_g,
        "lipides_g": lipides_g,
        "barcode": barcode
    }).execute()
    if not response.data:
        raise Exception("Erreur insertion meal_item")
    return response.data[0]["id"]

def insert_activity(user_id, date, description, duree_min, calories_brulees):
    supabase = get_supabase_client()
    response = supabase.table("activities").insert({
        "user_id": user_id,
        "date": date,
        "description": description,
        "duree_min": duree_min,
        "calories_brulees": calories_brulees
    }).execute()
    if not response.data:
        raise Exception("Erreur insertion activity")
    return response.data[0]["id"]


# ----- Fonctions lecture -----

def get_meals(user_id, date):
    """Récupère la liste des repas pour un utilisateur et une date."""
    supabase = get_supabase_client()
    response = (
        supabase.table("meals")
        .select("*")
        .eq("user_id", user_id)
        .eq("date", date)
        .execute()
    )
    return response.data or []


def get_meal_items(meal_id):
    """Récupère les aliments liés à un repas."""
    supabase = get_supabase_client()
    response = (
        supabase.table("meal_items")
        .select("*")
        .eq("meal_id", meal_id)
        .execute()
    )
    return response.data or []


def get_activities(user_id, date):
    """Récupère les activités sportives pour un utilisateur et une date."""
    supabase = get_supabase_client()
    response = (
        supabase.table("activities")
        .select("*")
        .eq("user_id", user_id)
        .eq("date", date)
        .execute()
    )
    return response.data or []


# ----- Daily Summary -----

def get_daily_summary(user_id, date):
    supabase = get_supabase_client()
    response = (
        supabase.table("daily_summary")
        .select("*")
        .eq("user_id", user_id)
        .eq("date", date)
        .execute()
    )
    return response.data[0] if response.data else None


def insert_daily_summary(
    user_id,
    date,
    total_calories,
    total_sport,
    tdee,
    balance,
    conseil,
):
    supabase = get_supabase_client()
    response = (
        supabase.table("daily_summary")
        .insert(
            {
                "user_id": user_id,
                "date": date,
                "total_calories": total_calories,
                "total_sport": total_sport,
                "tdee": tdee,
                "balance": balance,
                "conseil": conseil,
            }
        )
        .execute()
    )
    if not response.data:
        raise Exception("Erreur insertion daily_summary")
    return response.data[0]


def update_daily_summary(
    user_id,
    date,
    total_calories,
    total_sport,
    tdee,
    balance,
    conseil,
):
    supabase = get_supabase_client()
    response = (
        supabase.table("daily_summary")
        .update(
            {
                "total_calories": total_calories,
                "total_sport": total_sport,
                "tdee": tdee,
                "balance": balance,
                "conseil": conseil,
            }
        )
        .eq("user_id", user_id)
        .eq("date", date)
        .execute()
    )
    if not response.data:
        raise Exception("Erreur update daily_summary")
    return response.data[0]
