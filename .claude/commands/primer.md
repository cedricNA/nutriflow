# Command: primer

Analyse complète du repository NutriFlow pour préparer Claude Code au développement.

## Objectif
Fournir à Claude Code une compréhension complète de la structure, des patterns et de l'état actuel du projet NutriFlow.

## Étapes d'analyse

### 1. Structure générale
- Lire CLAUDE.md pour comprendre l'architecture
- Examiner package.json (frontend) et pyproject.toml/requirements.txt (backend)
- Identifier les dossiers principaux et leur organisation

### 2. Backend Analysis
- Examiner main.py et la structure FastAPI
- Analyser nutriflow/api/router.py pour les endpoints implémentés
- Vérifier nutriflow/services.py pour la logique métier
- Examiner les tests dans tests/ pour comprendre les patterns

### 3. Frontend Analysis  
- Examiner frontend/src structure
- Vérifier les composants dans components/
- Analyser les hooks personnalisés dans hooks/
- Examiner l'intégration Supabase dans integrations/supabase/

### 4. Database Schema
- Examiner les fichiers SQL dans supabase/ si présents
- Analyser les types TypeScript générés pour Supabase

### 5. Configuration & Environment
- Vérifier les fichiers de config (.env.example, etc.)
- Examiner les scripts dans package.json et pyproject.toml

### 6. Tests & Quality
- Analyser la structure des tests backend (pytest)
- Examiner les tests frontend (vitest/testing-library)
- Vérifier la configuration linting (ruff, eslint)

## Résultat attendu
Un rapport structuré couvrant :
- État actuel du projet
- Patterns de code identifiés
- Endpoints API documentés vs implémentés
- Architecture des données
- Points d'amélioration potentiels
- Recommandations pour le développement

## Format de sortie
Générer un rapport markdown avec sections claires pour référence future.