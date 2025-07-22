import types
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from nutriflow import services


def test_translate_with_csv_mapping(tmp_path, monkeypatch, capsys):
    mapping_file = tmp_path / "map.csv"
    mapping_file.write_text(
        "fr,en\nconfiture de myrtille,blueberry jam\ncuillère à soupe,tablespoon\ncuillères à soupe,tablespoons\n"
    )
    services.reload_mapping(str(mapping_file))

    class DummyTranslator:
        def translate(self, text, src='fr', dest='en'):
            assert text == "2 tablespoons of blueberry jam"
            return types.SimpleNamespace(text=text)

    import googletrans
    monkeypatch.setattr(googletrans, 'Translator', lambda: DummyTranslator())

    result = services.translate_fr_en("2 cuillères à soupe de confiture de myrtille")
    captured = capsys.readouterr()
    assert result == "2 tablespoons of blueberry jam"
    expected = "🔁 Texte envoyé à Nutritionix : 2 tablespoons of blueberry jam → 2 tablespoons of blueberry jam"
    assert expected in captured.out
    services.reload_mapping()

