CREATE OR REPLACE VIEW daily_nutrition_totals AS
SELECT
    m.user_id,
    m.date,
    SUM(mi.calories) AS total_calories,
    SUM(mi.proteines_g) AS total_proteins_g,
    SUM(mi.glucides_g) AS total_carbs_g,
    SUM(mi.lipides_g) AS total_fats_g
FROM meal_items mi
JOIN meals m ON mi.meal_id = m.id
GROUP BY m.user_id, m.date;
