import sys
from pathlib import Path
import pytest

sys.path.append(str(Path(__file__).resolve().parents[1]))

from nutriflow.api.router import compute_goals


SAMPLE_USER = {"poids_kg": 70.0}


def test_compute_goals_perte():
    user = {**SAMPLE_USER, "objectif": "perte"}
    res = compute_goals(user, 2000.0)
    assert res["target_kcal"] == pytest.approx(1600.0)
    assert res["prot_g"] == pytest.approx(126.0)
    assert res["fat_g"] == pytest.approx(56.0)
    assert res["carbs_g"] == pytest.approx(148.0)
    assert res["ratios"]["prot_pct"] == pytest.approx(0.315, rel=1e-3)
    assert res["ratios"]["fat_pct"] == pytest.approx(0.315, rel=1e-3)
    assert res["ratios"]["carbs_pct"] == pytest.approx(0.37, rel=1e-3)


def test_compute_goals_maintien():
    user = {**SAMPLE_USER, "objectif": "maintien"}
    res = compute_goals(user, 2000.0)
    assert res["target_kcal"] == pytest.approx(2000.0)
    assert res["prot_g"] == pytest.approx(126.0)
    assert res["fat_g"] == pytest.approx(56.0)
    assert res["carbs_g"] == pytest.approx(248.0)
    assert res["ratios"]["prot_pct"] == pytest.approx(0.252, rel=1e-3)
    assert res["ratios"]["fat_pct"] == pytest.approx(0.252, rel=1e-3)
    assert res["ratios"]["carbs_pct"] == pytest.approx(0.496, rel=1e-3)


def test_compute_goals_prise():
    user = {**SAMPLE_USER, "objectif": "prise"}
    res = compute_goals(user, 2000.0)
    assert res["target_kcal"] == pytest.approx(2240.0)
    assert res["prot_g"] == pytest.approx(140.0)
    assert res["fat_g"] == pytest.approx(56.0)
    assert res["carbs_g"] == pytest.approx(294.0)
    assert res["ratios"]["prot_pct"] == pytest.approx(0.25, rel=1e-3)
    assert res["ratios"]["fat_pct"] == pytest.approx(0.225, rel=1e-3)
    assert res["ratios"]["carbs_pct"] == pytest.approx(0.525, rel=1e-3)
