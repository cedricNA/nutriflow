import os
from supabase import create_client, Client
from postgrest.exceptions import APIError


def get_supabase_client():
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError("Supabase credentials are not set")
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def insert_meal(user_id, date, type_repas, note=""):
    supabase = get_supabase_client()
    response = (
        supabase.table("meals")
        .insert({"user_id": user_id, "date": date, "type": type_repas, "note": note})
        .execute()
    )
    if not response.data:
        raise Exception("Erreur insertion meal")
    return response.data[0]["id"]


def insert_meal_item(
    meal_id,
    nom_aliment,
    marque,
    quantite,
    unite,
    calories,
    proteines_g,
    glucides_g,
    lipides_g,
    barcode=None,
    source=None,
):
    supabase = get_supabase_client()
    payload = {
        "meal_id": meal_id,
        "nom_aliment": nom_aliment,
        "marque": marque,
        "quantite": quantite,
        "unite": unite,
        "calories": calories,
        "proteines_g": proteines_g,
        "glucides_g": glucides_g,
        "lipides_g": lipides_g,
        "barcode": barcode,
        "source": source,
    }
    try:
        response = supabase.table("meal_items").insert(payload).execute()
    except APIError as e:
        if getattr(e, "code", "") == "PGRST204" and "source" in str(e):
            payload.pop("source", None)
            response = supabase.table("meal_items").insert(payload).execute()
        else:
            raise
    if not response.data:
        raise Exception("Erreur insertion meal_item")
    return response.data[0]["id"]


def insert_activity(user_id, date, description, duree_min, calories_brulees):
    supabase = get_supabase_client()
    response = (
        supabase.table("activities")
        .insert(
            {
                "user_id": user_id,
                "date": date,
                "description": description,
                "duree_min": duree_min,
                "calories_brulees": calories_brulees,
            }
        )
        .execute()
    )
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
    response = supabase.table("meal_items").select("*").eq("meal_id", meal_id).execute()
    return response.data or []


def get_meal(meal_id):
    """Récupère un repas par son identifiant."""
    supabase = get_supabase_client()
    response = supabase.table("meals").select("*").eq("id", meal_id).execute()
    return response.data[0] if response.data else None


def update_meal(meal_id, data):
    """Met à jour un repas."""
    supabase = get_supabase_client()
    response = supabase.table("meals").update(data).eq("id", meal_id).execute()
    return response.data[0] if response.data else None


def update_meal_item(item_id, data):
    """Met à jour un aliment d'un repas."""
    supabase = get_supabase_client()
    response = (
        supabase.table("meal_items").update(data).eq("id", item_id).execute()
    )
    return response.data[0] if response.data else None


def delete_meal_item(item_id):
    """Supprime un aliment d'un repas."""
    supabase = get_supabase_client()
    supabase.table("meal_items").delete().eq("id", item_id).execute()


def delete_meal(meal_id):
    """Supprime un repas et ses aliments."""
    supabase = get_supabase_client()
    supabase.table("meal_items").delete().eq("meal_id", meal_id).execute()
    supabase.table("meals").delete().eq("id", meal_id).execute()


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


def get_daily_nutrition(user_id: str, date: str):
    """Récupère les totaux nutritionnels d'une journée via la vue SQL."""
    supabase = get_supabase_client()
    try:
        result = (
            supabase.table("daily_nutrition_totals")
            .select("*")
            .eq("user_id", user_id)
            .eq("date", date)
            .execute()
        )
    except APIError as e:
        if getattr(e, "code", "") == "42P01":
            meals_res = (
                supabase.table("meals")
                .select("id")
                .eq("user_id", user_id)
                .eq("date", date)
                .execute()
            )
            meal_ids = [m["id"] for m in (meals_res.data or [])]
            if not meal_ids:
                return {
                    "total_calories": 0.0,
                    "total_proteins_g": 0.0,
                    "total_carbs_g": 0.0,
                    "total_fats_g": 0.0,
                }
            items_res = (
                supabase.table("meal_items")
                .select("calories,proteines_g,glucides_g,lipides_g")
                .in_("meal_id", meal_ids)
                .execute()
            )
            items = items_res.data or []
            return {
                "total_calories": sum(it.get("calories", 0) for it in items),
                "total_proteins_g": sum(it.get("proteines_g", 0) for it in items),
                "total_carbs_g": sum(it.get("glucides_g", 0) for it in items),
                "total_fats_g": sum(it.get("lipides_g", 0) for it in items),
            }
        raise
    if not result.data:
        return {
            "total_calories": 0.0,
            "total_proteins_g": 0.0,
            "total_carbs_g": 0.0,
            "total_fats_g": 0.0,
        }
    return result.data[0]


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


def get_daily_summaries(user_id, limit=30):
    """Récupère les bilans journaliers les plus récents pour un utilisateur."""
    supabase = get_supabase_client()
    response = (
        supabase.table("daily_summary")
        .select("*")
        .eq("user_id", user_id)
        .order("date", desc=True)
        .limit(limit)
        .execute()
    )
    return response.data or []


def insert_daily_summary(
    user_id,
    date,
    tdee,
    calories_apportees,
    calories_brulees,
    balance_calorique,
    conseil,
):
    supabase = get_supabase_client()
    response = (
        supabase.table("daily_summary")
        .insert(
            {
                "user_id": user_id,
                "date": date,
                "tdee": tdee,
                "calories_apportees": calories_apportees,
                "calories_brulees": calories_brulees,
                "balance_calorique": balance_calorique,
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
    tdee,
    calories_apportees,
    calories_brulees,
    balance_calorique,
    conseil,
):
    supabase = get_supabase_client()
    response = (
        supabase.table("daily_summary")
        .update(
            {
                "tdee": tdee,
                "calories_apportees": calories_apportees,
                "calories_brulees": calories_brulees,
                "balance_calorique": balance_calorique,
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


def get_user(user_id):
    supabase = get_supabase_client()
    response = supabase.table("users").select("*").eq("id", user_id).execute()
    return response.data[0] if response.data else None


def update_user(user_id, data):
    supabase = get_supabase_client()
    response = supabase.table("users").update(data).eq("id", user_id).execute()
    if not response.data:
        raise Exception("Erreur lors de la mise à jour utilisateur")
    return response.data[0]


def aggregate_daily_summary(user_id: str, date: str):
    """Agrège et enregistre le bilan quotidien d'un utilisateur."""
    supabase = get_supabase_client()

    # 1. Totaux nutritionnels via la vue/jointure
    totals = get_daily_nutrition(user_id, date)
    total_calories = totals.get("total_calories", 0.0)
    prot_tot = totals.get("total_proteins_g", 0.0)
    gluc_tot = totals.get("total_carbs_g", 0.0)
    lip_tot = totals.get("total_fats_g", 0.0)

    # 2. Activités physiques
    activities = get_activities(user_id, date)
    calories_brulees = (
        sum(a.get("calories_brulees", 0) for a in activities) if activities else 0.0
    )

    # 3. Profil utilisateur
    user = get_user(user_id)
    if not user:
        raise Exception("Utilisateur non trouvé")

    from nutriflow.services import calculer_bmr, calculer_tdee

    bmr = calculer_bmr(user["poids_kg"], user["taille_cm"], user["age"], user["sexe"])
    tdee = calculer_tdee(
        user["poids_kg"], user["taille_cm"], user["age"], user["sexe"], calories_brulees
    )

    # 4. Balance calorique
    balance = total_calories - tdee

    # 5. Conseil personnalisé selon l'objectif
    objectif = user.get("objectif", "maintien")
    if objectif == "perte":
        if balance < -300:
            conseil = "Déficit important, perte de poids rapide possible."
        elif balance < 0:
            conseil = "Déficit modéré, bonne trajectoire pour perdre du poids."
        elif balance < 150:
            conseil = "Attention, vous êtes en léger surplus."
        else:
            conseil = "Surplus, risque de prise de poids."
    elif objectif == "prise":
        if balance > 300:
            conseil = "Surplus optimal pour prise de masse."
        elif balance > 0:
            conseil = "Surplus léger, progression possible mais lente."
        elif balance > -150:
            conseil = "Attention, vous êtes presque à l\u2019\xe9quilibre."
        else:
            conseil = "Déficit, trop faible pour prise de masse."
    else:  # maintien
        if abs(balance) < 150:
            conseil = "Maintien calorique atteint."
        elif balance < 0:
            conseil = "Léger déficit, surveillez si ce n\u2019est pas souhaité."
        else:
            conseil = "Léger surplus, surveillez si ce n\u2019est pas souhaité."

    record = {
        "user_id": user_id,
        "date": date,
        "calories_apportees": total_calories,
        "calories_brulees": calories_brulees,
        "prot_tot": prot_tot,
        "gluc_tot": gluc_tot,
        "lip_tot": lip_tot,
        "tdee": tdee,
        "balance_calorique": balance,
        "conseil": conseil,
    }

    supabase.table("daily_summary").upsert(record).execute()
    return record
