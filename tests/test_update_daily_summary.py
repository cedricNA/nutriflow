import types
import nutriflow.services as services
import nutriflow.db.supabase as db


def test_update_daily_summary_dynamic(monkeypatch):
    store = []

    class DummyTable:
        def __init__(self, store):
            self.store = store
            self.filters = {}

        def select(self, *_):
            return self

        def eq(self, key, value):
            self.filters[key] = value
            return self

        def upsert(self, record, **_):
            for i, rec in enumerate(self.store):
                if rec["user_id"] == record["user_id"] and rec["date"] == record["date"]:
                    self.store[i] = record
                    break
            else:
                self.store.append(record)
            return self

        def execute(self):
            if self.filters:
                data = [
                    r for r in self.store if all(r.get(k) == v for k, v in self.filters.items())
                ]
            else:
                data = self.store
            return types.SimpleNamespace(data=data)

    class DummyClient:
        def table(self, _):
            return DummyTable(store)

    monkeypatch.setattr(db, "get_supabase_client", lambda: DummyClient())

    user = {
        "poids_kg": 70.0,
        "taille_cm": 175.0,
        "age": 30,
        "sexe": "male",
        "activity_factor": 1.2,
        "goal": "maintien",
    }
    monkeypatch.setattr(db, "get_user", lambda *_: user)

    # Aucun repas ni activité
    monkeypatch.setattr(db, "get_meals", lambda *_, **__: [])
    monkeypatch.setattr(db, "get_meal_items", lambda *_: [])
    monkeypatch.setattr(db, "get_activities", lambda *_, **__: [])
    services.update_daily_summary("u1", "2024-01-01")
    assert store[0]["calories_consumed"] == 0
    assert store[0]["calories_burned"] == 0
    assert store[0]["num_meals"] == 0
    assert store[0]["num_activities"] == 0

    # Ajout d'un repas
    monkeypatch.setattr(db, "get_meals", lambda *_, **__: [{"id": "m1"}])
    monkeypatch.setattr(
        db,
        "get_meal_items",
        lambda *_: [
            {
                "calories": 500,
                "proteines_g": 30,
                "glucides_g": 50,
                "lipides_g": 20,
            }
        ],
    )
    services.update_daily_summary("u1", "2024-01-01")
    assert store[0]["calories_consumed"] == 500
    assert store[0]["num_meals"] == 1

    # Ajout d'une activité
    monkeypatch.setattr(
        db, "get_activities", lambda *_, **__: [{"calories_brulees": 200, "duree_min": 30}]
    )
    services.update_daily_summary("u1", "2024-01-01")
    assert store[0]["calories_burned"] == 200
    assert store[0]["num_activities"] == 1
    assert "tdee" in store[0]
