import types
import sys
from pathlib import Path
import pytest

sys.path.append(str(Path(__file__).resolve().parents[1]))

import nutriflow.db.supabase as db
import nutriflow.services as services

SAMPLE_USER = {
    "poids_kg": 70.0,
    "taille_cm": 175.0,
    "age": 30,
    "sexe": "male",
    "activity_factor": 1.2,
    "goal": "maintien",
}

class DummyTable:
    def __init__(self, store):
        self.store = store
    def upsert(self, record):
        self.store.append(record)
        return self
    def execute(self):
        return types.SimpleNamespace(data=self.store)

class DummyClient:
    def __init__(self, store):
        self.store = store
    def table(self, _):
        return DummyTable(self.store)

@pytest.fixture
def common_patches(monkeypatch):
    inserted = []
    monkeypatch.setattr(db, "get_supabase_client", lambda: DummyClient(inserted))
    monkeypatch.setattr(db, "get_user", lambda uid: SAMPLE_USER)
    monkeypatch.setattr(services, "calculer_bmr", lambda p, t, a, s: 1500.0)
    monkeypatch.setattr(services, "calculer_tdee", lambda p, t, a, s, af: 1500.0 * af)
    return inserted


def test_aggregate_no_meal_no_activity(common_patches, monkeypatch):
    inserted = common_patches
    monkeypatch.setattr(db, "get_daily_nutrition", lambda u, d: {
        "total_calories": 0.0,
        "total_proteins_g": 0.0,
        "total_carbs_g": 0.0,
        "total_fats_g": 0.0,
    })
    monkeypatch.setattr(db, "get_activities", lambda u, d: [])

    res = db.aggregate_daily_summary("u", "2023-01-01")
    assert res["calories_apportees"] == 0.0
    assert res["calories_brulees"] == 0.0
    assert res["balance_calorique"] == -1800.0
    assert inserted and inserted[0]["calories_apportees"] == 0.0


def test_aggregate_meals_no_activity(common_patches, monkeypatch):
    inserted = common_patches
    monkeypatch.setattr(db, "get_daily_nutrition", lambda u, d: {
        "total_calories": 600.0,
        "total_proteins_g": 30.0,
        "total_carbs_g": 80.0,
        "total_fats_g": 20.0,
    })
    monkeypatch.setattr(db, "get_activities", lambda u, d: [])

    res = db.aggregate_daily_summary("u", "2023-01-02")
    assert res["calories_apportees"] == 600.0
    assert res["balance_calorique"] == -1200.0
    assert inserted and inserted[0]["prot_tot"] == 30.0


def test_aggregate_meals_with_activity(common_patches, monkeypatch):
    inserted = common_patches
    monkeypatch.setattr(db, "get_daily_nutrition", lambda u, d: {
        "total_calories": 800.0,
        "total_proteins_g": 40.0,
        "total_carbs_g": 100.0,
        "total_fats_g": 30.0,
    })
    monkeypatch.setattr(db, "get_activities", lambda u, d: [{"calories_brulees": 200}])

    res = db.aggregate_daily_summary("u", "2023-01-03")
    assert res["calories_apportees"] == 800.0
    assert res["calories_brulees"] == 200
    assert res["tdee"] == 2000.0
    assert inserted and inserted[0]["gluc_tot"] == 100.0
