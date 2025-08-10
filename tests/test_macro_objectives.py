import types
import sys
from pathlib import Path

import pytest

sys.path.append(str(Path(__file__).resolve().parents[1]))

import nutriflow.db.supabase as db


class DummyTable:
    def __init__(self, store):
        self.store = store

    def update(self, record):
        self.store.append(record)
        return self

    def eq(self, *_args, **_kwargs):
        return self

    def execute(self):
        return types.SimpleNamespace(data=self.store)


class DummyClient:
    def __init__(self, store):
        self.store = store

    def table(self, _):
        return DummyTable(self.store)


def test_update_macro_objectives(monkeypatch):
    store = []
    monkeypatch.setattr(db, "get_supabase_client", lambda: DummyClient(store))
    monkeypatch.setattr(db, "get_daily_summary", lambda u, d: {"tdee": 2000.0})
    monkeypatch.setattr(db, "get_user", lambda uid: {"objectif": "perte"})

    res = db.update_macro_objectives("u", "2023-01-01")

    assert pytest.approx(res["target_proteins_g"], rel=1e-3) == 150.0
    assert pytest.approx(res["target_carbs_g"], rel=1e-3) == 150.0
    assert pytest.approx(res["target_fats_g"], rel=1e-3) == 88.8889

    assert store and store[0]["target_proteins_g"] == res["target_proteins_g"]
