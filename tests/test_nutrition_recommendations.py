"""
Tests pour le système de recommandations nutritionnelles.
"""

import pytest
from backend.services.nutrition_recommendations import (
    NutritionAnalyzer,
    RecommendationEngine,
    FoodSuggestionService,
    NutritionRecommendationsService,
)


class TestNutritionAnalyzer:
    """Tests pour l'analyseur de patterns nutritionnels."""

    @pytest.fixture
    def analyzer(self):
        return NutritionAnalyzer()

    def test_identify_protein_deficiency(self, analyzer):
        """Test identification déficit protéines."""
        deficiencies, excesses = analyzer._identify_deficiencies_and_excesses(
            avg_calories=2000,
            avg_protein=50,  # Inférieur à 84g (70kg * 1.2)
            avg_carbs=250,
            avg_fat=70,
            target_calories=2000,  # Objectif calorique
        )

        assert "protein" in deficiencies

    def test_identify_sodium_excess(self, analyzer):
        """Test identification excès sodium (non disponible dans MVP)."""
        deficiencies, excesses = analyzer._identify_deficiencies_and_excesses(
            avg_calories=2000,
            avg_protein=80,
            avg_carbs=250,
            avg_fat=70,
            target_calories=2000,  # Objectif calorique
        )

        # Sodium n'est plus analysé dans le MVP car la colonne n'existe pas
        assert "sodium" not in excesses

    def test_calculate_overall_score(self, analyzer):
        """Test calcul score nutritionnel global."""
        # Aucun problème = score parfait
        score = analyzer._calculate_overall_score([], [])
        assert score == 100.0

        # 2 déficits = 70 points (100 - 2*15)
        score = analyzer._calculate_overall_score(["protein", "fiber"], [])
        assert score == 70.0


class TestRecommendationEngine:
    """Tests pour le générateur de recommandations."""

    @pytest.fixture
    def engine(self):
        return RecommendationEngine()

    def test_create_deficit_recommendation(self, engine):
        """Test création recommandation déficit."""
        recommendation = engine._create_deficit_recommendation(
            "protein", 50.0, 84.0, "g"
        )

        assert recommendation.category == "deficit_protein"
        assert recommendation.current_value == 50.0
        assert recommendation.target_value == 84.0
        assert recommendation.unit == "g"
        assert "50.0" in recommendation.explanation
        assert "84.0" in recommendation.explanation

    def test_create_excess_recommendation(self, engine):
        """Test création recommandation excès."""
        recommendation = engine._create_excess_recommendation(
            "sodium", 2500.0, 2300.0, "mg"
        )

        assert recommendation.category == "excess_sodium"
        assert recommendation.current_value == 2500.0
        assert recommendation.target_value == 2300.0
        assert recommendation.unit == "mg"


class TestFoodSuggestionService:
    """Tests pour le service de suggestions alimentaires."""

    @pytest.fixture
    def service(self):
        return FoodSuggestionService()

    def test_get_static_suggestions_protein(self, service):
        """Test suggestions statiques protéines."""
        suggestions = service._get_static_suggestions("protein")

        assert len(suggestions) == 3  # 3 suggestions définies dans les constantes
        assert all(s.source == "static" for s in suggestions)
        assert "poulet" in suggestions[0].name.lower()


class TestNutritionRecommendationsService:
    """Tests d'intégration pour le service principal."""

    @pytest.fixture
    def service(self):
        return NutritionRecommendationsService()


# Tests pour l'API endpoint
@pytest.mark.asyncio
async def test_nutrition_recommendations_endpoint_invalid_params():
    """Test endpoint avec paramètres invalides."""
    from fastapi.testclient import TestClient
    from main import app

    client = TestClient(app)

    # Test avec days > 30
    response = client.get("/api/nutrition-recommendations?days=35")
    assert response.status_code == 422  # Validation error

    # Test avec days < 1
    response = client.get("/api/nutrition-recommendations?days=0")
    assert response.status_code == 422  # Validation error
