import os
import sys
from pathlib import Path
import pytest
import pandas as pd
import asyncio
from httpx import AsyncClient, ASGITransport

os.environ.setdefault("SUPABASE_URL", "http://localhost")
os.environ.setdefault("SUPABASE_KEY", "test-key")

sys.path.append(str(Path(__file__).resolve().parents[1]))

from main import app
from nutriflow.api import router
from nutriflow.api.router import (
    IngredientQuery, BarcodeQuery, ExerciseQuery, BMRQuery, TDEEQuery,
    NutritionixResponse, OFFProduct, ExerciseResult, BMRResponse, TDEResponse
)

# Sample data for mocking
SAMPLE_FOODS = [{
    "food_name": "flocons d'avoine",
    "serving_qty": 50,
    "serving_unit": "g",
    "serving_weight_grams": 50,
    "nf_calories": 190,
    "nf_protein": 6.5,
    "nf_total_carbohydrate": 32,
    "nf_total_fat": 3.5
}]

SAMPLE_EXERCISES = [{
    "name": "running",
    "duration_min": 30,
    "nf_calories": 300,
    "met": 8.0
}]

SAMPLE_PRODUCT = {
    "name": "TestProduct",
    "brand": "BrandX",
    "energy_kcal_per_100g": 100,
    "fat_per_100g": 1.0,
    "sugars_per_100g": 2.0,
    "proteins_per_100g": 3.0,
    "salt_per_100g": 0.5
}

@pytest.fixture(autouse=True)
def mock_router(monkeypatch):
    # Unit test mocks on router module
    monkeypatch.setattr(router, 'analyze_ingredients_nutritionix', lambda q: SAMPLE_FOODS)
    monkeypatch.setattr(router, 'convert_nutritionix_to_df', lambda foods: pd.DataFrame([
        {"Aliment": "flocons d'avoine", "Quantite": "50 g", "Poids_g": 50, "Calories": 190, "Proteines_g": 6.5, "Glucides_g": 32, "Lipides_g": 3.5}
    ]))
    monkeypatch.setattr(router, 'calculate_totals', lambda df: {"total_calories": 190, "total_proteins_g": 6.5, "total_carbs_g": 32, "total_fats_g": 3.5})
    monkeypatch.setattr(router, 'get_off_search_nutrition', lambda q: SAMPLE_PRODUCT)
    monkeypatch.setattr(router, 'get_off_nutrition_by_barcode', lambda code: SAMPLE_PRODUCT)
    monkeypatch.setattr(router, 'analyze_exercise_nutritionix', lambda **kwargs: SAMPLE_EXERCISES)
    monkeypatch.setattr(router, 'calculer_bmr', lambda p, t, a, s: 1500.0)
    monkeypatch.setattr(router, 'calculer_tdee', lambda p, t, a, s, cs: 1800.0)

    # Mock Supabase insertion functions
    monkeypatch.setattr(router, 'insert_meal', lambda *args, **kwargs: 'fake-meal-id')
    monkeypatch.setattr(router, 'insert_meal_item', lambda *args, **kwargs: 'fake-meal-item-id')

    import nutriflow.db.supabase as db
    monkeypatch.setattr(db, 'insert_meal', lambda *args, **kwargs: 'fake-meal-id')
    monkeypatch.setattr(db, 'insert_meal_item', lambda *args, **kwargs: 'fake-meal-item-id')
    monkeypatch.setattr(db, 'insert_activity', lambda *args, **kwargs: 'fake-activity-id')

# ----- Unit Tests -----

def test_ingredients_unit():
    q = IngredientQuery(query="50g flocons d'avoine")
    resp = router.ingredients(q)
    assert isinstance(resp, NutritionixResponse)
    assert resp.foods[0].aliment == "flocons d'avoine"
    assert resp.totals.total_calories == 190


def test_barcode_unit():
    q = BarcodeQuery(barcode="12345678")
    resp = router.barcode(q)
    assert isinstance(resp, OFFProduct)
    assert resp.name == "TestProduct"


def test_search_unit():
    resp = router.search(query="yogurt")
    assert isinstance(resp, OFFProduct)
    assert resp.energy_kcal_per_100g == 100


def test_exercise_unit():
    q = ExerciseQuery(query="30 minutes running", weight_kg=70, height_cm=175, age=30, gender="male")
    resp = router.exercise(q)
    assert isinstance(resp, list)
    ex = resp[0]
    assert ex.name == "running"
    assert ex.duration_min == 30
    assert ex.calories == 300
    assert ex.met == 8.0


def test_bmr_unit():
    q = BMRQuery(poids_kg=70, taille_cm=175, age=30, sexe="male")
    resp = router.bmr(q)
    assert isinstance(resp, BMRResponse)
    assert resp.bmr == 1500.0


def test_tdee_unit():
    q = TDEEQuery(poids_kg=70, taille_cm=175, age=30, sexe="male", calories_sport=200)
    resp = router.tdee(q)
    assert isinstance(resp, TDEResponse)
    assert resp.bmr == 1500.0
    assert resp.calories_sport == 200
    assert resp.tdee == 1800.0

# ----- Integration Tests (structure only) -----

def run_async(coro):
    return asyncio.get_event_loop().run_until_complete(coro)


def test_exercise_integration_structure():
    async def inner():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            res = await ac.post("/api/exercise", json={
                "query": "30 minutes running",
                "weight_kg": 70,
                "height_cm": 175,
                "age": 30,
                "gender": "male"
            })
            assert res.status_code == 200
            data = res.json()
            assert isinstance(data, list) and data, "Expected non-empty list"
            ex = data[0]
            for key in ("name", "duration_min", "calories", "met"):
                assert key in ex
                assert isinstance(ex[key], (str, int, float))
    run_async(inner())


def test_ingredients_integration_structure():
    async def inner():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            res = await ac.post("/api/ingredients", json={"query": "50g flocons d'avoine"})
            assert res.status_code == 200
            data = res.json()
            assert "foods" in data and isinstance(data["foods"], list)
            assert "totals" in data and isinstance(data["totals"], dict)
    run_async(inner())


def test_barcode_integration_structure():
    async def inner():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            res = await ac.post("/api/barcode", json={"barcode": "3274080005003"})
            assert res.status_code in (200, 404)
            if res.status_code == 200:
                data = res.json()
                assert all(field in data for field in ("name", "brand", "energy_kcal_per_100g"))
    run_async(inner())


def test_search_integration_structure():
    async def inner():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            res = await ac.get("/api/search", params={"query": "yaourt"})
            assert res.status_code in (200, 404)
            if res.status_code == 200:
                data = res.json()
                assert "name" in data and "energy_kcal_per_100g" in data
    run_async(inner())
