import types
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from nutriflow import services


def test_translate_fr_en_basic(monkeypatch, capsys):
    class DummyTranslator:
        def translate(self, text, src='fr', dest='en'):
            return types.SimpleNamespace(text="1 avocado, 100g corn, 60g cherry tomato")

    import googletrans
    monkeypatch.setattr(googletrans, 'Translator', lambda: DummyTranslator())
    result = services.translate_fr_en("1 avocat, 100g de ma\u00efs, 60g de tomate cerise")
    captured = capsys.readouterr()
    assert result == "1 avocado, 100g corn, 60g cherry tomato"
    expected_log = "🔁 Texte envoyé à Nutritionix : 1 avocado, 100g of corn, 60g of tomate cherry → 1 avocado, 100g corn, 60g cherry tomato"
    assert expected_log in captured.out
