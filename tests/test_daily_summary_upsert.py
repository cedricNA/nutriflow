import types
import nutriflow.services as services
import nutriflow.db.supabase as db
import nutriflow.api.router as router


def test_daily_summary_meal_activity(monkeypatch):
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

        def update(self, record):
            # Trouve et met à jour l'enregistrement existant
            for i, rec in enumerate(self.store):
                if all(rec.get(k) == v for k, v in self.filters.items()):
                    self.store[i] = {**rec, **record}
                    break
            return self

        def insert(self, record):
            self.store.append(record)
            return self

        def upsert(self, record, **_):
            self.store.append(record)
            return self

        def execute(self):
            if self.filters:
                # Retour filtré pour select
                data = [r for r in self.store if all(r.get(k) == v for k, v in self.filters.items())]
                return types.SimpleNamespace(data=data)
            else:
                # Retour complet pour insert/update
                return types.SimpleNamespace(data=self.store)

    class DummyClient:
        def __init__(self, store):
            self.store = store

        def table(self, _):
            return DummyTable(self.store)

    monkeypatch.setattr(db, "get_supabase_client", lambda: DummyClient(store))

    user = {
        "poids_kg": 70.0,
        "taille_cm": 175.0,
        "age": 30,
        "sexe": "male",
        "activity_factor": 1.2,
        "goal": "maintien",
    }
    monkeypatch.setattr(db, "get_user", lambda *_: user)
    monkeypatch.setattr(services, "calculer_bmr", lambda *a, **k: 1500.0)
    monkeypatch.setattr(services, "calculer_tdee", lambda *a, **k: 1800.0)
    monkeypatch.setattr(
        router,
        "compute_goals",
        lambda u, t: {
            "target_kcal": 2000.0,
            "prot_g": 120.0,
            "fat_g": 60.0,
            "carbs_g": 200.0,
        },
    )

    monkeypatch.setattr(db, "get_meals", lambda *a, **k: [{"id": "m1"}])
    monkeypatch.setattr(
        db,
        "get_meal_items",
        lambda *a, **k: [
            {
                "calories": 500.0,
                "proteines_g": 30.0,
                "glucides_g": 50.0,
                "lipides_g": 20.0,
            }
        ],
    )
    monkeypatch.setattr(
        db,
        "get_activities",
        lambda *a, **k: [{"calories_brulees": 200.0, "duree_min": 30.0}],
    )

    services.update_daily_summary("u1", "2024-01-01")
    assert store, "daily_summary not upserted"
    rec = store[0]
    assert rec["calories_consumed"] == 500.0
    assert rec["calories_burned"] == 200.0
    assert rec["num_meals"] == 1
    assert rec["num_activities"] == 1
    assert rec["target_calories"] == 2000.0
