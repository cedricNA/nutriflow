ALTER TABLE daily_summary
  ADD COLUMN IF NOT EXISTS target_calories numeric,
  ADD COLUMN IF NOT EXISTS target_proteins_g numeric,
  ADD COLUMN IF NOT EXISTS target_fats_g numeric,
  ADD COLUMN IF NOT EXISTS target_carbs_g numeric;
