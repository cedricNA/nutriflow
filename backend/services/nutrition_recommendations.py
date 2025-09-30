"""
Service de recommandations nutritionnelles intelligent.
Analyse les patterns alimentaires hebdomadaires et génère des suggestions personnalisées.
"""

from datetime import date, timedelta
from typing import List
import uuid
from statistics import mean

from nutriflow.models.recommendations import (
    WeeklyNutritionAnalysis,
    NutritionRecommendation,
    FoodSuggestion,
    NutritionRecommendationsResponse,
)


class NutritionAnalyzer:
    """Analyseur de patterns nutritionnels hebdomadaires."""

    def __init__(self):
        pass

    async def analyze_weekly_patterns(
        self, user_id: str, end_date: date, days: int = 7
    ) -> WeeklyNutritionAnalysis:
        """
        Analyse les patterns nutritionnels sur une période donnée.

        Args:
            user_id: Identifiant utilisateur
            end_date: Date de fin d'analyse
            days: Nombre de jours à analyser (défaut: 7)

        Returns:
            WeeklyNutritionAnalysis: Analyse complète des patterns
        """
        from nutriflow.db.supabase import get_supabase_client
        from backend.services.nutrition_constants import get_confidence_level

        start_date = end_date - timedelta(days=days - 1)

        # Récupération des données daily_summary sur la période
        supabase = get_supabase_client()
        summaries_response = (
            supabase.table("daily_summary")
            .select(
                "date, calories_consumed, proteins_consumed, carbs_consumed, fats_consumed, target_calories, tdee"
            )
            .eq("user_id", user_id)
            .gte("date", start_date.isoformat())
            .lte("date", end_date.isoformat())
            .execute()
        )

        summaries = summaries_response.data or []
        days_with_data = len(
            [s for s in summaries if s.get("calories_consumed", 0) > 0]
        )

        if days_with_data == 0:
            # Aucune donnée disponible
            return WeeklyNutritionAnalysis(
                user_id=user_id,
                analysis_period=(start_date, end_date),
                days_with_data=0,
                avg_calories=0.0,
                avg_protein=0.0,
                avg_carbs=0.0,
                avg_fat=0.0,
                avg_fiber=0.0,
                avg_sodium=0.0,
                avg_sugar=0.0,
                deficiencies=[],
                excesses=[],
                overall_score=0.0,
                confidence_level="low",
            )

        # Calcul des moyennes nutritionnelles
        valid_summaries = [s for s in summaries if s.get("calories_consumed", 0) > 0]

        avg_calories = mean([s.get("calories_consumed", 0) for s in valid_summaries])
        avg_protein = mean([s.get("proteins_consumed", 0) for s in valid_summaries])
        avg_carbs = mean([s.get("carbs_consumed", 0) for s in valid_summaries])
        avg_fat = mean([s.get("fats_consumed", 0) for s in valid_summaries])

        # Calcul de l'objectif calorique personnalisé
        # Priorité : target_calories > tdee > fallback sécurisé (1200)
        target_calories_values = [s.get("target_calories") for s in valid_summaries if s.get("target_calories")]
        tdee_values = [s.get("tdee") for s in valid_summaries if s.get("tdee")]

        if target_calories_values:
            avg_target_calories = mean(target_calories_values)
        elif tdee_values:
            avg_target_calories = mean(tdee_values)
        else:
            # Fallback sécurisé uniquement si aucune donnée personnalisée
            avg_target_calories = NUTRITION_TARGETS["calories_min"]

        # Colonnes fiber, sodium, sugar n'existent pas dans daily_summary
        avg_fiber = 0.0  # Non disponible dans daily_summary
        avg_sodium = 0.0  # Non disponible dans daily_summary
        avg_sugar = 0.0  # Non disponible dans daily_summary

        # Identification des déficits et excès (macros disponibles uniquement)
        deficiencies, excesses = self._identify_deficiencies_and_excesses(
            avg_calories,
            avg_protein,
            avg_carbs,
            avg_fat,
            avg_target_calories,
        )

        # Calcul du score nutritionnel global
        overall_score = self._calculate_overall_score(deficiencies, excesses)

        # Niveau de confiance
        confidence_level = get_confidence_level(days_with_data)

        return WeeklyNutritionAnalysis(
            user_id=user_id,
            analysis_period=(start_date, end_date),
            days_with_data=days_with_data,
            avg_calories=avg_calories,
            avg_protein=avg_protein,
            avg_carbs=avg_carbs,
            avg_fat=avg_fat,
            avg_fiber=avg_fiber,
            avg_sodium=avg_sodium,
            avg_sugar=avg_sugar,
            deficiencies=deficiencies,
            excesses=excesses,
            overall_score=overall_score,
            confidence_level=confidence_level,
        )

    def _identify_deficiencies_and_excesses(
        self,
        avg_calories: float,
        avg_protein: float,
        avg_carbs: float,
        avg_fat: float,
        target_calories: float,
    ) -> tuple[List[str], List[str]]:
        """
        Identifie les déficits et excès nutritionnels (macros disponibles uniquement).

        Args:
            avg_calories: Calories moyennes consommées
            avg_protein: Protéines moyennes consommées (g)
            avg_carbs: Glucides moyens consommés (g)
            avg_fat: Lipides moyens consommés (g)
            target_calories: Objectif calorique personnalisé (target_calories ou TDEE)

        Returns:
            tuple: (déficits, excès)
        """
        from backend.services.nutrition_constants import (
            NUTRITION_TARGETS,
            DEFAULT_BODY_WEIGHT_KG,
            get_target_protein_grams,
        )

        deficiencies = []
        excesses = []

        # Vérification calories par rapport à l'objectif personnalisé
        # Déficit si consommation < 80% de l'objectif
        # Excès si consommation > 120% de l'objectif
        if avg_calories < (target_calories * 0.8):
            deficiencies.append("calories")
        elif avg_calories > (target_calories * 1.2):
            excesses.append("calories")

        # Vérification protéines (basé sur poids de référence)
        target_protein = get_target_protein_grams(DEFAULT_BODY_WEIGHT_KG)
        if avg_protein < target_protein:
            deficiencies.append("protein")

        # Vérification glucides (en pourcentage des calories)
        if avg_calories > 0:
            carbs_percent = (avg_carbs * 4) / avg_calories * 100  # 4 kcal/g de glucides
            if carbs_percent < NUTRITION_TARGETS["carbs_min_percent"]:
                deficiencies.append("carbs")

        # Vérification lipides (en pourcentage des calories)
        if avg_calories > 0:
            fat_percent = (avg_fat * 9) / avg_calories * 100  # 9 kcal/g de lipides
            if fat_percent < NUTRITION_TARGETS["fat_min_percent"]:
                deficiencies.append("fat")

        return deficiencies, excesses

    def _calculate_overall_score(
        self, deficiencies: List[str], excesses: List[str]
    ) -> float:
        """
        Calcule un score nutritionnel global (0-100).

        Args:
            deficiencies: Liste des déficits nutritionnels
            excesses: Liste des excès nutritionnels

        Returns:
            float: Score global entre 0 et 100
        """
        total_issues = len(deficiencies) + len(excesses)
        if total_issues == 0:
            return 100.0

        # Pénalité par problème nutritionnel
        penalty_per_issue = 15  # Points perdus par déficit/excès
        score = max(0.0, 100.0 - (total_issues * penalty_per_issue))

        return score


class RecommendationEngine:
    """Générateur de recommandations nutritionnelles personnalisées."""

    def __init__(self):
        pass

    async def generate_recommendations(
        self, analysis: WeeklyNutritionAnalysis, target_calories: float
    ) -> List[NutritionRecommendation]:
        """
        Génère des recommandations basées sur l'analyse nutritionnelle.

        Args:
            analysis: Analyse nutritionnelle hebdomadaire
            target_calories: Objectif calorique personnalisé (target_calories ou TDEE)

        Returns:
            List[NutritionRecommendation]: Max 4 recommandations priorisées
        """
        from backend.services.nutrition_constants import (
            NUTRITION_TARGETS,
            DEFAULT_BODY_WEIGHT_KG,
            get_target_protein_grams,
        )

        recommendations = []

        # Génération des recommandations pour déficits (priorité plus haute)
        for deficit in analysis.deficiencies:
            if deficit == "calories":
                rec = self._create_deficit_recommendation(
                    "calories",
                    analysis.avg_calories,
                    target_calories,
                    "kcal",
                )
            elif deficit == "protein":
                target_protein = get_target_protein_grams(DEFAULT_BODY_WEIGHT_KG)
                rec = self._create_deficit_recommendation(
                    "protein", analysis.avg_protein, target_protein, "g"
                )
            elif deficit == "fiber":
                rec = self._create_deficit_recommendation(
                    "fiber", analysis.avg_fiber, NUTRITION_TARGETS["fiber_min"], "g"
                )
            elif deficit == "carbs":
                # Calcul cible glucides (50% des calories)
                target_carbs = (analysis.avg_calories * 0.5) / 4  # 4 kcal/g
                rec = self._create_deficit_recommendation(
                    "carbs", analysis.avg_carbs, target_carbs, "g"
                )
            elif deficit == "fat":
                # Calcul cible lipides (25% des calories)
                target_fat = (analysis.avg_calories * 0.25) / 9  # 9 kcal/g
                rec = self._create_deficit_recommendation(
                    "fat", analysis.avg_fat, target_fat, "g"
                )
            else:
                continue

            recommendations.append(rec)

        # Génération des recommandations pour excès (priorité plus basse)
        for excess in analysis.excesses:
            if excess == "sodium":
                rec = self._create_excess_recommendation(
                    "sodium", analysis.avg_sodium, NUTRITION_TARGETS["sodium_max"], "mg"
                )
            elif excess == "sugar":
                # Calcul cible sucres (10% des calories)
                target_sugar = (analysis.avg_calories * 0.1) / 4  # 4 kcal/g
                rec = self._create_excess_recommendation(
                    "sugar", analysis.avg_sugar, target_sugar, "g"
                )
            elif excess == "calories":
                rec = self._create_excess_recommendation(
                    "calories",
                    analysis.avg_calories,
                    target_calories,
                    "kcal",
                )
            else:
                continue

            recommendations.append(rec)

        # Tri par priorité et limitation à 4 recommandations max
        recommendations.sort(key=lambda r: r.priority)
        return recommendations[:4]

    def _create_deficit_recommendation(
        self, nutrient: str, current_value: float, target_value: float, unit: str
    ) -> NutritionRecommendation:
        """
        Crée une recommandation pour un déficit nutritionnel.

        Args:
            nutrient: Nom du nutriment en déficit
            current_value: Valeur actuelle
            target_value: Valeur cible
            unit: Unité du nutriment

        Returns:
            NutritionRecommendation: Recommandation pour le déficit
        """
        from backend.services.nutrition_constants import (
            DEFICIT_MESSAGES,
            RECOMMENDATION_PRIORITIES,
        )

        deficit_amount = target_value - current_value

        category = f"deficit_{nutrient}"
        priority = RECOMMENDATION_PRIORITIES.get(category, 3)

        message = DEFICIT_MESSAGES.get(
            nutrient, f"Augmentez votre apport en {nutrient}"
        )

        explanation = (
            f"Vous consommez en moyenne {current_value:.1f}{unit}/jour. "
            f"Objectif recommandé : {target_value:.1f}{unit}/jour "
            f"(+{deficit_amount:.1f}{unit} par rapport à votre consommation actuelle)."
        )

        return NutritionRecommendation(
            id=str(uuid.uuid4()),
            category=category,
            priority=priority,
            message=message,
            explanation=explanation,
            food_suggestions=[],  # Sera rempli plus tard
            target_value=target_value,
            current_value=current_value,
            unit=unit,
        )

    def _create_excess_recommendation(
        self, nutrient: str, current_value: float, target_value: float, unit: str
    ) -> NutritionRecommendation:
        """
        Crée une recommandation pour un excès nutritionnel.

        Args:
            nutrient: Nom du nutriment en excès
            current_value: Valeur actuelle
            target_value: Valeur cible
            unit: Unité du nutriment

        Returns:
            NutritionRecommendation: Recommandation pour l'excès
        """
        from backend.services.nutrition_constants import (
            EXCESS_MESSAGES,
            RECOMMENDATION_PRIORITIES,
        )

        excess_amount = current_value - target_value

        category = f"excess_{nutrient}"
        priority = RECOMMENDATION_PRIORITIES.get(category, 4)

        message = EXCESS_MESSAGES.get(nutrient, f"Réduisez votre apport en {nutrient}")

        explanation = (
            f"Vous consommez en moyenne {current_value:.1f}{unit}/jour. "
            f"Limite recommandée : {target_value:.1f}{unit}/jour "
            f"(-{excess_amount:.1f}{unit} par rapport à votre consommation actuelle)."
        )

        return NutritionRecommendation(
            id=str(uuid.uuid4()),
            category=category,
            priority=priority,
            message=message,
            explanation=explanation,
            food_suggestions=[],  # Sera rempli plus tard
            target_value=target_value,
            current_value=current_value,
            unit=unit,
        )


class FoodSuggestionService:
    """Service de suggestions d'aliments via APIs externes."""

    def __init__(self):
        pass

    async def get_food_suggestions(
        self, nutrient_need: str, count: int = 3
    ) -> List[FoodSuggestion]:
        """
        Récupère des suggestions d'aliments pour un nutriment donné.

        Args:
            nutrient_need: Type de nutriment recherché
            count: Nombre de suggestions (défaut: 3)

        Returns:
            List[FoodSuggestion]: Suggestions d'aliments
        """
        # Pour le MVP, utilisation de suggestions statiques fiables
        # Futures évolutions : intégration APIs Nutritionix/OpenFoodFacts

        suggestions = self._get_static_suggestions(nutrient_need)

        # Limitation au nombre demandé
        return suggestions[:count]

    async def _search_nutritionix(
        self, search_terms: List[str]
    ) -> List[FoodSuggestion]:
        """
        Recherche d'aliments via l'API Nutritionix.

        Args:
            search_terms: Termes de recherche

        Returns:
            List[FoodSuggestion]: Suggestions depuis Nutritionix
        """
        # TODO: Implémentation à venir
        pass

    async def _search_openfoodfacts(
        self, search_terms: List[str]
    ) -> List[FoodSuggestion]:
        """
        Recherche d'aliments via l'API OpenFoodFacts.

        Args:
            search_terms: Termes de recherche

        Returns:
            List[FoodSuggestion]: Suggestions depuis OpenFoodFacts
        """
        # TODO: Implémentation à venir
        pass

    def _get_static_suggestions(self, nutrient: str) -> List[FoodSuggestion]:
        """
        Retourne des suggestions statiques en fallback.

        Args:
            nutrient: Type de nutriment

        Returns:
            List[FoodSuggestion]: Suggestions statiques
        """
        from backend.services.nutrition_constants import STATIC_FOOD_SUGGESTIONS

        # Récupération des suggestions pour le nutriment demandé
        nutrient_foods = STATIC_FOOD_SUGGESTIONS.get(nutrient, [])

        # Conversion en objets FoodSuggestion
        suggestions = []
        for food_data in nutrient_foods:
            suggestion = FoodSuggestion(
                name=food_data["name"],
                nutrient_value=food_data["nutrient_value"],
                nutrient_unit=food_data["nutrient_unit"],
                portion=food_data["portion"],
                portion_size=food_data["portion_size"],
                source="static",
                calories_per_portion=food_data.get("calories_per_portion"),
                additional_nutrients=food_data.get("additional_nutrients", {}),
            )
            suggestions.append(suggestion)

        return suggestions


class NutritionRecommendationsService:
    """Service principal de recommandations nutritionnelles."""

    def __init__(self):
        self.analyzer = NutritionAnalyzer()
        self.recommendation_engine = RecommendationEngine()
        self.food_suggestion_service = FoodSuggestionService()

    async def get_recommendations(
        self, user_id: str, days: int = 7
    ) -> NutritionRecommendationsResponse:
        """
        Génère des recommandations nutritionnelles complètes.

        Args:
            user_id: Identifiant utilisateur
            days: Nombre de jours à analyser

        Returns:
            NutritionRecommendationsResponse: Recommandations complètes
        """
        from datetime import date

        end_date = date.today()

        # Étape 1 : Analyse des patterns nutritionnels
        analysis = await self.analyzer.analyze_weekly_patterns(user_id, end_date, days)

        # Récupération de target_calories pour les recommandations
        from nutriflow.db.supabase import get_supabase_client
        from backend.services.nutrition_constants import NUTRITION_TARGETS

        start_date = end_date - timedelta(days=days - 1)
        supabase = get_supabase_client()
        summaries_response = (
            supabase.table("daily_summary")
            .select("target_calories, tdee")
            .eq("user_id", user_id)
            .gte("date", start_date.isoformat())
            .lte("date", end_date.isoformat())
            .execute()
        )

        summaries = summaries_response.data or []
        valid_summaries = [s for s in summaries if s.get("target_calories") or s.get("tdee")]

        if valid_summaries:
            target_calories_values = [s.get("target_calories") for s in valid_summaries if s.get("target_calories")]
            tdee_values = [s.get("tdee") for s in valid_summaries if s.get("tdee")]

            if target_calories_values:
                target_calories = sum(target_calories_values) / len(target_calories_values)
            elif tdee_values:
                target_calories = sum(tdee_values) / len(tdee_values)
            else:
                target_calories = NUTRITION_TARGETS["calories_min"]
        else:
            target_calories = NUTRITION_TARGETS["calories_min"]

        # Étape 2 : Génération des recommandations
        recommendations = await self.recommendation_engine.generate_recommendations(
            analysis, target_calories
        )

        # Étape 3 : Ajout des suggestions alimentaires pour chaque recommandation
        for recommendation in recommendations:
            # Extraction du nutriment depuis la catégorie (ex: "deficit_protein" -> "protein")
            nutrient = (
                recommendation.category.split("_", 1)[1]
                if "_" in recommendation.category
                else recommendation.category
            )

            # Récupération des suggestions alimentaires
            food_suggestions = await self.food_suggestion_service.get_food_suggestions(
                nutrient, 3
            )
            recommendation.food_suggestions = food_suggestions

        return NutritionRecommendationsResponse(
            user_id=user_id,
            analysis=analysis,
            recommendations=recommendations,
            generated_at=date.today(),
            disclaimer="Ces suggestions sont à titre informatif uniquement. Consultez un professionnel de santé pour un suivi personnalisé.",
        )
