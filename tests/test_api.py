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
    IngredientQuery,
    BarcodeQueryUserInput,
    ExerciseQuery,
    BMRQuery,
    TDEEQuery,
    NutritionixResponse,
    ProductSummary,
    OFFProduct,
    ExerciseResult,
    BMRResponse,
    TDEResponse,
    DailySummary,
    UserProfile,
    UserProfileUpdate,
)
import nutriflow.db.supabase as db
from nutriflow.db.supabase import get_daily_nutrition as original_get_daily_nutrition

# Sample data for mocking
SAMPLE_FOODS = [
    {
        "food_name": "flocons d'avoine",
        "serving_qty": 50,
        "serving_unit": "g",
        "serving_weight_grams": 50,
        "nf_calories": 190,
        "nf_protein": 6.5,
        "nf_total_carbohydrate": 32,
        "nf_total_fat": 3.5,
    }
]

SAMPLE_EXERCISES = [
    {"name": "running", "duration_min": 30, "nf_calories": 300, "met": 8.0}
]

SAMPLE_PRODUCT = {
    "barcode": "12345678",
    "name": "TestProduct",
    "image_url": "http://example.com/img.jpg",
    "brand": "BrandX",
    "energy_kcal_per_100g": 100,
    "fat_per_100g": 1.0,
    "carbs_per_100g": 12.0,
    "proteins_per_100g": 3.0,
    "sugars_per_100g": 2.0,
    "salt_per_100g": 0.5,
    "nutriscore": "b",
    "labels": "Vegan",
    "ingredients": "water, sugar",
    "additives": "E330",
    "traces": "milk",
    "countries": "France",
}

SAMPLE_USER = {
    "poids_kg": 70.0,
    "taille_cm": 175.0,
    "age": 30,
    "sexe": "male",
}


@pytest.fixture(autouse=True)
def mock_router(monkeypatch):
    # Unit test mocks on router module
    monkeypatch.setattr(
        router, "analyze_ingredients_nutritionix", lambda q: SAMPLE_FOODS
    )
    monkeypatch.setattr(
        router,
        "convert_nutritionix_to_df",
        lambda foods: pd.DataFrame(
            [
                {
                    "Aliment": "flocons d'avoine",
                    "Quantite": "50 g",
                    "Poids_g": 50,
                    "Calories": 190,
                    "Proteines_g": 6.5,
                    "Glucides_g": 32,
                    "Lipides_g": 3.5,
                }
            ]
        ),
    )
    monkeypatch.setattr(
        router,
        "calculate_totals",
        lambda df: {
            "total_calories": 190,
            "total_proteins_g": 6.5,
            "total_carbs_g": 32,
            "total_fats_g": 3.5,
        },
    )
    monkeypatch.setattr(router, "get_off_search_nutrition", lambda q: SAMPLE_PRODUCT)
    monkeypatch.setattr(
        router, "get_off_nutrition_by_barcode", lambda code: SAMPLE_PRODUCT
    )
    monkeypatch.setattr(
        router, "analyze_exercise_nutritionix", lambda **kwargs: SAMPLE_EXERCISES
    )
    monkeypatch.setattr(router, "calculer_bmr", lambda p, t, a, s: 1500.0)
    monkeypatch.setattr(router, "calculer_tdee", lambda p, t, a, s, cs: 1800.0)

    # Mock Supabase insertion functions
    monkeypatch.setattr(router, "insert_meal", lambda *args, **kwargs: "fake-meal-id")
    monkeypatch.setattr(
        router, "insert_meal_item", lambda *args, **kwargs: "fake-meal-item-id"
    )
    monkeypatch.setattr(
        router, "insert_activity", lambda *args, **kwargs: "fake-activity-id"
    )

    import nutriflow.db.supabase as db

    monkeypatch.setattr(db, "insert_meal", lambda *args, **kwargs: "fake-meal-id")
    monkeypatch.setattr(
        db, "insert_meal_item", lambda *args, **kwargs: "fake-meal-item-id"
    )
    monkeypatch.setattr(
        db, "insert_activity", lambda *args, **kwargs: "fake-activity-id"
    )
    monkeypatch.setattr(
        db,
        "aggregate_daily_summary",
        lambda *args, **kwargs: {
            "date": args[1] if len(args) > 1 else kwargs.get("date"),
            "calories_apportees": 2000.0,
            "calories_brulees": 300.0,
            "tdee": 1800.0,
            "balance_calorique": 200.0,
            "conseil": "test",
            "prot_tot": 0.0,
            "gluc_tot": 0.0,
            "lip_tot": 0.0,
        },
    )
    monkeypatch.setattr(
        db,
        "get_daily_summaries",
        lambda *args, **kwargs: [
            {
                "date": "2023-01-01",
                "calories_apportees": 2000.0,
                "calories_brulees": 300.0,
                "tdee": 1800.0,
                "balance_calorique": 200.0,
                "conseil": "test",
            }
        ],
    )
    monkeypatch.setattr(db, "get_meals", lambda *args, **kwargs: [])
    monkeypatch.setattr(db, "get_meal_items", lambda *args, **kwargs: [])
    monkeypatch.setattr(db, "get_activities", lambda *args, **kwargs: [])
    monkeypatch.setattr(db, "insert_daily_summary", lambda *args, **kwargs: None)
    monkeypatch.setattr(
        db,
        "get_daily_nutrition",
        lambda *args, **kwargs: {
            "total_calories": 0.0,
            "total_proteins_g": 0.0,
            "total_carbs_g": 0.0,
            "total_fats_g": 0.0,
        },
    )
    monkeypatch.setattr(db, "get_user", lambda *args, **kwargs: SAMPLE_USER)

    def _update_user(uid, data):
        SAMPLE_USER.update(data)
        return SAMPLE_USER

    monkeypatch.setattr(db, "update_user", _update_user)
    monkeypatch.setattr(db, "update_meal", lambda *args, **kwargs: None)
    monkeypatch.setattr(db, "get_product", lambda *a, **k: SAMPLE_PRODUCT)


# ----- Unit Tests -----


def test_ingredients_unit():
    q = IngredientQuery(query="50g flocons d'avoine")
    resp = router.ingredients(q)
    assert isinstance(resp, NutritionixResponse)
    assert resp.foods[0].aliment == "flocons d'avoine"
    assert resp.totals.total_calories == 190


def test_ingredients_reuses_existing_meal(monkeypatch):
    record = {"insert_calls": 0, "meal_id": None}

    def fake_insert_meal(*args, **kwargs):
        record["insert_calls"] += 1
        return "new-id"

    def fake_insert_meal_item(*args, **kwargs):
        record["meal_id"] = kwargs.get("meal_id") or args[0]
        return "item-id"

    monkeypatch.setattr(router, "insert_meal", fake_insert_meal)
    monkeypatch.setattr(router, "insert_meal_item", fake_insert_meal_item)
    monkeypatch.setattr(db, "insert_meal", fake_insert_meal)
    monkeypatch.setattr(db, "insert_meal_item", fake_insert_meal_item)

    monkeypatch.setattr(
        db,
        "get_meals",
        lambda *a, **k: [{"id": "existing-id", "type": "dejeuner"}],
    )

    q = IngredientQuery(query="50g flocons d'avoine", type="dejeuner")
    resp = router.ingredients(q)
    assert isinstance(resp, NutritionixResponse)
    assert record["insert_calls"] == 0
    assert record["meal_id"] == "existing-id"


def test_barcode_unit():
    q = BarcodeQueryUserInput(barcode="12345678", quantity=50)
    resp = router.barcode(q)
    assert isinstance(resp, ProductSummary)
    assert resp.name == "TestProduct"
    assert resp.energy_kcal_per_100g == 100


def test_search_unit():
    resp = router.search(query="yogurt")
    assert isinstance(resp, OFFProduct)
    assert resp.energy_kcal_per_100g == 100


def test_product_details_unit():
    resp = router.product_details("12345678")
    assert resp["name"] == "TestProduct"


def test_exercise_unit():
    q = ExerciseQuery(
        query="30 minutes running", weight_kg=70, height_cm=175, age=30, gender="male"
    )
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


def test_daily_summary_unit():
    resp = router.daily_summary(date_str="2023-01-02")
    assert isinstance(resp, DailySummary)
    assert resp.date == "2023-01-02"


def test_history_unit():
    resp = router.get_history(limit=1)
    assert isinstance(resp, list)
    assert isinstance(resp[0], DailySummary)


def test_get_user_profile_unit():
    resp = router.get_user_profile()
    assert isinstance(resp, UserProfile)
    assert resp.poids_kg == SAMPLE_USER["poids_kg"]


def test_update_user_profile_unit():
    q = UserProfileUpdate(poids_kg=72.0)
    resp = router.update_user_profile(q)
    assert isinstance(resp, UserProfile)
    assert resp.poids_kg == 72.0


# ----- Integration Tests (structure only) -----


def run_async(coro):
    return asyncio.get_event_loop().run_until_complete(coro)


def test_exercise_integration_structure():
    async def inner():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            res = await ac.post(
                "/api/exercise",
                json={
                    "query": "30 minutes running",
                    "weight_kg": 70,
                    "height_cm": 175,
                    "age": 30,
                    "gender": "male",
                },
            )
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
            res = await ac.post(
                "/api/ingredients", json={"query": "50g flocons d'avoine"}
            )
            assert res.status_code == 200
            data = res.json()
            assert "foods" in data and isinstance(data["foods"], list)
            assert "totals" in data and isinstance(data["totals"], dict)

    run_async(inner())


def test_barcode_integration_structure():
    async def inner():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            res = await ac.post(
                "/api/barcode",
                json={"barcode": "3274080005003", "quantity": 100},
            )
            assert res.status_code in (200, 404)
            if res.status_code == 200:
                data = res.json()
                assert all(
                    field in data for field in ("name", "brand", "energy_kcal_per_100g")
                )

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


def test_daily_summary_integration_structure():
    async def inner():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            res = await ac.get("/api/daily-summary", params={"date_str": "2023-01-02"})
            assert res.status_code == 200
            data = res.json()
            assert all(
                k in data
                for k in (
                    "date",
                    "calories_apportees",
                    "calories_brulees",
                    "tdee",
                    "balance_calorique",
                    "conseil",
                )
            )

    run_async(inner())


def test_history_integration_structure():
    async def inner():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            res = await ac.get("/api/history", params={"limit": 1})
            assert res.status_code == 200
            data = res.json()
            assert isinstance(data, list) and data
            first = data[0]
            assert all(
                k in first
                for k in (
                    "date",
                    "calories_apportees",
                    "calories_brulees",
                    "tdee",
                    "balance_calorique",
                    "conseil",
                )
            )

    run_async(inner())


def test_user_profile_integration_structure():
    async def inner():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            res = await ac.get("/api/user/profile")
            assert res.status_code == 200
            data = res.json()
            assert all(k in data for k in ("poids_kg", "taille_cm", "age", "sexe"))

    run_async(inner())


def test_user_profile_update_integration_structure():
    async def inner():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            res = await ac.post("/api/user/profile/update", json={"poids_kg": 80})
            assert res.status_code == 200
            data = res.json()
            assert data["poids_kg"] == 80

    run_async(inner())


# ----- New Tests for daily nutrition totals -----


def test_get_daily_nutrition_totals(monkeypatch):
    user_id = "00000000-0000-0000-0000-000000000000"
    date_str = "2025-07-22"

    meals = [{"id": "meal1", "user_id": user_id, "date": date_str}]
    meal_items = [
        {
            "meal_id": "meal1",
            "calories": 250.0,
            "proteines_g": 20.0,
            "glucides_g": 30.0,
            "lipides_g": 10.0,
        },
        {
            "meal_id": "meal1",
            "calories": 100.0,
            "proteines_g": 5.0,
            "glucides_g": 15.0,
            "lipides_g": 3.0,
        },
    ]

    class DummyResult:
        def __init__(self, data):
            self.data = data

    class DummyClient:
        def __init__(self, meals, items):
            self.meals = meals
            self.items = items
            self.filters = {}

        def table(self, name):
            self.name = name
            return self

        def select(self, *_):
            return self

        def eq(self, col, val):
            self.filters[col] = val
            return self

        def execute(self):
            if self.name != "daily_nutrition_totals":
                return DummyResult([])
            uid = self.filters.get("user_id")
            d = self.filters.get("date")
            meals = [m for m in self.meals if m["user_id"] == uid and m["date"] == d]
            meal_ids = {m["id"] for m in meals}
            items = [it for it in self.items if it["meal_id"] in meal_ids]
            if not items:
                return DummyResult([])
            totals = {
                "user_id": uid,
                "date": d,
                "total_calories": sum(it["calories"] for it in items),
                "total_proteins_g": sum(it["proteines_g"] for it in items),
                "total_carbs_g": sum(it["glucides_g"] for it in items),
                "total_fats_g": sum(it["lipides_g"] for it in items),
            }
            return DummyResult([totals])

    monkeypatch.setattr(
        db, "get_supabase_client", lambda: DummyClient(meals, meal_items)
    )
    monkeypatch.setattr(db, "get_daily_nutrition", original_get_daily_nutrition)

    totals = db.get_daily_nutrition(user_id, date_str)
    assert totals["total_calories"] == 350.0
    assert totals["total_proteins_g"] == 25.0
    assert totals["total_carbs_g"] == 45.0
    assert totals["total_fats_g"] == 13.0


def test_get_daily_nutrition_empty(monkeypatch):
    class DummyResult:
        def __init__(self, data):
            self.data = data

    class DummyClient:
        def table(self, *_):
            return self

        def select(self, *_):
            return self

        def eq(self, *_):
            return self

        def execute(self):
            return DummyResult([])

    monkeypatch.setattr(db, "get_supabase_client", lambda: DummyClient())
    monkeypatch.setattr(db, "get_daily_nutrition", original_get_daily_nutrition)
    totals = db.get_daily_nutrition("u", "2025-07-22")
    assert totals == {
        "total_calories": 0.0,
        "total_proteins_g": 0.0,
        "total_carbs_g": 0.0,
        "total_fats_g": 0.0,
    }


def test_get_daily_nutrition_fallback(monkeypatch):
    user_id = "u1"
    date_str = "2025-07-22"

    meals_data = [{"id": "m1", "user_id": user_id, "date": date_str}]
    items_data = [
        {
            "meal_id": "m1",
            "calories": 200.0,
            "proteines_g": 15.0,
            "glucides_g": 20.0,
            "lipides_g": 5.0,
        },
        {
            "meal_id": "m1",
            "calories": 100.0,
            "proteines_g": 5.0,
            "glucides_g": 10.0,
            "lipides_g": 2.0,
        },
    ]

    class DummyResult:
        def __init__(self, data):
            self.data = data

    class DummyClient:
        def __init__(self):
            self.name = ""
            self.filters = {}

        def table(self, name):
            self.name = name
            self.filters = {}
            return self

        def select(self, *_):
            return self

        def eq(self, col, val):
            self.filters[col] = val
            return self

        def in_(self, col, vals):
            self.filters[col] = vals
            return self

        def execute(self):
            from postgrest.exceptions import APIError

            if self.name == "daily_nutrition_totals":
                raise APIError({"message": "relation missing", "code": "42P01"})
            if self.name == "meals":
                uid = self.filters.get("user_id")
                d = self.filters.get("date")
                data = [m for m in meals_data if m["user_id"] == uid and m["date"] == d]
                return DummyResult(data)
            if self.name == "meal_items":
                ids = self.filters.get("meal_id", [])
                data = [it for it in items_data if it["meal_id"] in ids]
                return DummyResult(data)
            return DummyResult([])

    monkeypatch.setattr(db, "get_supabase_client", lambda: DummyClient())
    monkeypatch.setattr(db, "get_daily_nutrition", original_get_daily_nutrition)

    totals = db.get_daily_nutrition(user_id, date_str)
    assert totals["total_calories"] == 300.0
    assert totals["total_proteins_g"] == 20.0
    assert totals["total_carbs_g"] == 30.0
    assert totals["total_fats_g"] == 7.0


def test_units_endpoint_unit():
    data = router.get_units()
    assert isinstance(data, dict)
    assert "cuil. a soupe" in data


def test_units_endpoint_integration():
    async def inner():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            res = await ac.get("/api/units")
            assert res.status_code == 200
            data = res.json()
            assert "cuil. a soupe" in data

    run_async(inner())


def test_edit_meal_update_type(monkeypatch):
    record = {}

    def fake_update(meal_id, data):
        record["meal_id"] = meal_id
        record.update(data)

    monkeypatch.setattr(db, "update_meal", fake_update)
    monkeypatch.setattr(router, "get_meal", lambda *a, **k: {"id": "meal123", "type": "diner"})
    monkeypatch.setattr(db, "get_meal", lambda *a, **k: {"id": "meal123", "type": "diner"})
    monkeypatch.setattr(db, "get_meal_items", lambda *a, **k: [])
    payload = router.MealPatchPayload(type="diner")
    resp = router.edit_meal("meal123", payload)
    assert record["meal_id"] == "meal123"
    assert record["type"] == "diner"
    assert resp["id"] == "meal123"


def test_edit_meal_add_item_calls_analysis(monkeypatch):
    queries = {}

    def fake_analyze(q):
        queries["query"] = q
        return [
            {
                "food_name": "bread",
                "serving_weight_grams": 50,
                "nf_calories": 120,
                "nf_protein": 4,
                "nf_total_carbohydrate": 20,
                "nf_total_fat": 2,
            }
        ]

    inserted = {}

    def fake_insert_meal_item(*_, **data):
        inserted.update(data)
        return "it"

    monkeypatch.setattr(router, "analyze_ingredients_nutritionix", fake_analyze)
    monkeypatch.setattr(db, "insert_meal_item", fake_insert_meal_item)
    monkeypatch.setattr(db, "update_meal", lambda *a, **k: None)
    monkeypatch.setattr(db, "get_meal_items", lambda *_: [inserted])
    monkeypatch.setattr(router, "get_meal", lambda *_: {"id": "m", "type": "d"})
    monkeypatch.setattr(db, "get_meal", lambda *_: {"id": "m", "type": "d"})

    payload = router.MealPatchPayload(
        add=[router.MealItemCreate(nom_aliment="bread", quantite=2, unite="slice")]
    )
    resp = router.edit_meal("m", payload)
    assert queries["query"] == "2.0 slice bread"
    assert inserted["calories"] == 120
    assert resp["ingredients"][0]["calories"] == 120


def test_edit_meal_update_item_calls_analysis(monkeypatch):
    queries = {}

    def fake_analyze(q):
        queries["query"] = q
        return [
            {
                "food_name": "apple",
                "serving_weight_grams": 100,
                "nf_calories": 60,
                "nf_protein": 0.5,
                "nf_total_carbohydrate": 15,
                "nf_total_fat": 0.2,
            }
        ]

    updated = {}

    def fake_update_meal_item(id, data):
        updated.update(data)
        updated["id"] = id

    monkeypatch.setattr(router, "analyze_ingredients_nutritionix", fake_analyze)
    monkeypatch.setattr(db, "update_meal_item", fake_update_meal_item)
    monkeypatch.setattr(db, "update_meal", lambda *a, **k: None)
    monkeypatch.setattr(db, "get_meal_items", lambda *_: [updated])
    monkeypatch.setattr(router, "get_meal", lambda *_: {"id": "m", "type": "d"})
    monkeypatch.setattr(db, "get_meal", lambda *_: {"id": "m", "type": "d"})

    item = router.MealItemUpdate(
        id="i1", nom_aliment="pomme", quantite=1, unite="piece"
    )
    payload = router.MealPatchPayload(update=[item])
    resp = router.edit_meal("m", payload)
    assert queries["query"] == "1.0 piece pomme"
    assert updated["calories"] == 60
    assert resp["ingredients"][0]["id"] == "i1"


def test_remove_activity_not_found(monkeypatch):
    monkeypatch.setattr(db, "get_activity", lambda *_: None)

    async def inner():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            return await ac.delete("/api/activities/act1")

    res = run_async(inner())
    assert res.status_code == 404


def test_remove_activity_success(monkeypatch):
    record = {}
    monkeypatch.setattr(db, "get_activity", lambda *_: {"id": "act1"})

    def fake_delete(aid):
        record["deleted"] = aid

    monkeypatch.setattr(db, "delete_activity", fake_delete)

    async def inner():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            return await ac.delete("/api/activities/act1")

    res = run_async(inner())
    assert res.status_code == 200
    assert res.json()["detail"] == "Activity deleted"
    assert record["deleted"] == "act1"
