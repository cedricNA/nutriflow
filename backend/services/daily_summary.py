def update_daily_summary(user_id: str, date: str):
    """
    Met à jour les champs calories_burned, sport_total, calorie_balance
    dans la table daily_summary pour un user_id et une date donnée.
    """
    from nutriflow.db.supabase import get_supabase_client

    try:
        supabase = get_supabase_client()

        # 🔹 Étape 1 : Récupérer les activités du jour
        activities = (
            supabase.table("activities")
            .select("*")
            .eq("user_id", user_id)
            .eq("date", date)
            .execute()
        )
        total_kcal = sum(a.get("calories_brulees", 0) for a in (activities.data or []))
        total_duree = sum(a.get("duree_min", 0) for a in (activities.data or []))

        # 🔹 Étape 2 : Récupérer daily_summary existant
        summary_resp = (
            supabase.table("daily_summary")
            .select("*")
            .eq("user_id", user_id)
            .eq("date", date)
            .execute()
        )
        summary = summary_resp.data[0] if summary_resp.data else None

        if summary:
            calories_apportees = summary.get("calories_consumed", 0)
            new_balance = calories_apportees - total_kcal

            supabase.table("daily_summary").update({
                "calories_burned": total_kcal,
                "sport_total": total_duree,
                "calorie_balance": new_balance
            }).eq("user_id", user_id).eq("date", date).execute()
    except Exception:
        # En cas d'erreur (ex: Supabase inaccessible), on ignore pour ne pas bloquer l'application
        return

