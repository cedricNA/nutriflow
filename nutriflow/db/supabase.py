import os
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def insert_meal(user_id, date, type_repas, note=""):
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
