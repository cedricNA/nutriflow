"""
Modèles Pydantic pour le système de recommandations nutritionnelles.
"""

from datetime import date
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class WeeklyNutritionAnalysis(BaseModel):
    """Analyse nutritionnelle hebdomadaire d'un utilisateur."""

    user_id: str = Field(..., description="Identifiant unique de l'utilisateur")
    analysis_period: tuple[date, date] = Field(
        ..., description="Période d'analyse (début, fin)"
    )
    days_with_data: int = Field(
        ge=0, le=7, description="Nombre de jours avec données (1-7)"
    )
    avg_calories: float = Field(ge=0, description="Calories moyennes par jour")
    avg_protein: float = Field(ge=0, description="Protéines moyennes par jour (g)")
    avg_carbs: float = Field(ge=0, description="Glucides moyens par jour (g)")
    avg_fat: float = Field(ge=0, description="Lipides moyens par jour (g)")
    avg_fiber: float = Field(ge=0, description="Fibres moyennes par jour (g)")
    avg_sodium: float = Field(ge=0, description="Sodium moyen par jour (mg)")
    avg_sugar: float = Field(ge=0, description="Sucres moyens par jour (g)")
    deficiencies: List[str] = Field(
        default_factory=list, description="Déficits nutritionnels identifiés"
    )
    excesses: List[str] = Field(
        default_factory=list, description="Excès nutritionnels identifiés"
    )
    overall_score: float = Field(
        ge=0, le=100, description="Score nutritionnel global (0-100)"
    )
    confidence_level: str = Field(
        ...,
        pattern="^(high|medium|low)$",
        description="Niveau de confiance de l'analyse",
    )


class FoodSuggestion(BaseModel):
    """Suggestion d'aliment pour améliorer l'apport nutritionnel."""

    name: str = Field(..., description="Nom de l'aliment")
    nutrient_value: float = Field(ge=0, description="Valeur du nutriment principal")
    nutrient_unit: str = Field(..., description="Unité du nutriment (g, mg, kcal)")
    portion: str = Field(..., description="Taille de la portion recommandée")
    portion_size: float = Field(ge=0, description="Taille de la portion en grammes")
    source: str = Field(
        ...,
        pattern="^(nutritionix|openfoodfacts|static)$",
        description="Source des données",
    )
    calories_per_portion: Optional[float] = Field(
        default=None, ge=0, description="Calories par portion"
    )
    additional_nutrients: Dict[str, float] = Field(
        default_factory=dict, description="Autres nutriments"
    )


class NutritionRecommendation(BaseModel):
    """Recommandation nutritionnelle personnalisée."""

    id: str = Field(..., description="Identifiant unique de la recommandation")
    category: str = Field(
        ..., description="Catégorie de la recommandation (deficit_*, excess_*)"
    )
    priority: int = Field(
        ge=1, le=4, description="Priorité (1=plus haute, 4=plus basse)"
    )
    message: str = Field(
        ..., min_length=10, description="Message principal de la recommandation"
    )
    explanation: str = Field(
        ..., min_length=10, description="Explication détaillée avec valeurs"
    )
    food_suggestions: List[FoodSuggestion] = Field(
        default_factory=list, max_length=3, description="Suggestions d'aliments"
    )
    target_value: Optional[float] = Field(
        default=None, ge=0, description="Valeur cible du nutriment"
    )
    current_value: Optional[float] = Field(
        default=None, ge=0, description="Valeur actuelle du nutriment"
    )
    unit: Optional[str] = Field(
        default=None, description="Unité du nutriment (g, mg, kcal)"
    )


class NutritionRecommendationsResponse(BaseModel):
    """Réponse complète de l'API de recommandations nutritionnelles."""

    user_id: str = Field(..., description="Identifiant de l'utilisateur")
    analysis: WeeklyNutritionAnalysis = Field(
        ..., description="Analyse nutritionnelle hebdomadaire"
    )
    recommendations: List[NutritionRecommendation] = Field(
        default_factory=list,
        max_length=4,
        description="Liste des recommandations (max 4)",
    )
    generated_at: date = Field(
        ..., description="Date de génération des recommandations"
    )
    disclaimer: str = Field(
        default="Ces suggestions sont à titre informatif uniquement. Consultez un professionnel de santé pour un suivi personnalisé.",
        description="Disclaimer légal obligatoire",
    )
