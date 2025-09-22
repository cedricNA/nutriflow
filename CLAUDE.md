# CLAUDE.md - NutriFlow

**IMPORTANT**: Ce fichier guide Claude Code dans le développement de NutriFlow. Proactivement consulter cette documentation avant toute modification.

## Project Overview

NutriFlow est une application de suivi nutritionnel et fitness avec backend FastAPI et frontend React/TypeScript. Intégration APIs multiples (Nutritionix, OpenFoodFacts) avec Supabase pour la persistance et analyses nutritionnelles détaillées.

## Architecture

### Backend Structure
- **Main Application**: `main.py` - FastAPI avec configuration CORS
- **API Router**: `nutriflow/api/router.py` - Endpoints et logique métier
- **Database Layer**: `nutriflow/db/supabase.py` - Client Supabase et opérations DB
- **Services**: `nutriflow/services.py` - Logique métier nutrition/calculs
- **Backend Services**: `backend/services/daily_summary.py` - Calculs résumés quotidiens

### Frontend Structure
- **Framework**: React 18 + TypeScript, Vite bundler
- **UI Components**: Shadcn/UI dans `frontend/src/components/ui/`
- **App Components**: `frontend/src/components/` - Composants métier
- **Pages**: `frontend/src/pages/` - Composants de pages
- **Hooks**: `frontend/src/hooks/` - Custom hooks pour data fetching
- **API Client**: `frontend/src/api/nutriflow.ts` - Client API backend
- **Supabase**: `frontend/src/integrations/supabase/` - Client DB et types

### Database (Supabase PostgreSQL)
- **Tables principales**: users, meals, meal_items, activities, daily_summary, products
- **Vues**: `daily_nutrition_totals` - Données nutrition agrégées par user/date
- **Migrations**: Fichiers SQL dans `supabase/` pour modifications schéma

## Commandes de Développement

### Backend
```bash
# Installation
uv sync

# Serveur dev
uv run uvicorn main:app --reload

# Tests
uv run pytest
uv run pytest tests/test_daily_summary_upsert.py -v
```

### Frontend
```bash
cd frontend
npm install
npm run dev       # Serveur dev
npm run build     # Build production
npm run lint      # Linting
npm test          # Tests
```

## Standards de Code

### Python (Backend)
- **Style**: Ruff pour formatting/linting
- **Types**: Type hints obligatoires (PEP 484)
- **Tests**: Pytest avec couverture minimale 80%
- **Validation**: Pydantic pour modèles de données
- **Standards**: PEP 8 + The Hitchhiker's Guide to Python

### TypeScript (Frontend)
- **Style**: ESLint + Prettier
- **Tests**: Vitest + Testing Library
- **Composants**: Shadcn/UI design system
- **State**: React Query pour gestion état API

## API Endpoints (Statut Vérifié)

### ✅ Implémentés
- `POST /api/ingredients` - Analyse ingrédients via Nutritionix
- `POST /api/barcode` - Info produit via OpenFoodFacts
- `POST /api/exercise` - Log activités physiques
- `POST /api/bmr` - Calcul BMR
- `POST /api/tdee` - Calcul TDEE
- `GET /api/daily-summary` - Résumé quotidien
- `POST /api/meals` - Créer repas
- `GET /api/meals` - Lister repas

### 🚧 En développement
- `GET /api/products/{barcode}/details`
- `GET /api/search`
- `GET /api/sports`
- `PATCH /api/meals/{meal_id}`
- `DELETE /api/meals/{meal_id}`

## Variables d'Environnement

```bash
# Nutritionix API
NUTRIFLOW_NUTRITIONIX_APP_ID=your_app_id
NUTRIFLOW_NUTRITIONIX_API_KEY=your_api_key

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_key

# CORS (optionnel)
CORS_ORIGINS=http://localhost:8080
```

## Utilisateur de Test
- **UUID**: `00000000-0000-0000-0000-000000000000`
- Utilisé pour dev/demo dans toute l'application

## Règles de Développement

### ✅ Validation Gates (OBLIGATOIRE)
Avant toute PR/merge :
1. **Tests backend** : `uv run pytest` doit passer à 100%
2. **Tests frontend** : `npm test` doit passer à 100%
3. **Linting** : Ruff (backend) + ESLint (frontend) sans erreurs
4. **Types** : TypeScript compilation sans erreurs
5. **Build** : `npm run build` doit réussir

### 🔄 Workflow de Développement
1. **Créer branche feature** : `git checkout -b feature/nom-feature`
2. **Développer avec tests**
3. **Valider avec validation gates**
4. **Update documentation** si nécessaire
5. **PR avec review**
6. **Ne JAMAIS indiquer 🤖 Generated with [Claude Code](https://claude.ai/code) dans les commits ou Co-Authored-By: Claude <noreply@anthropic.com>**

### 📝 Standards de Documentation
- **API changes** : Mettre à jour ce CLAUDE.md
- **New features** : Documenter dans README si user-facing
- **Breaking changes** : Créer guide migration

## Contexte Métier

### Fonctionnalités Clés
- **Tracking nutrition** : Analyse ingrédients avec traduction FR→EN pour Nutritionix
- **Scan codes-barres** : Intégration OpenFoodFacts
- **Catégories repas** : petit_dejeuner, dejeuner, diner, collation
- **Tracking exercice** : API Nutritionix Exercise
- **Calculs BMR/TDEE** : Équation Mifflin-St Jeor
- **Objectifs personnalisés** : Perte/maintien/prise de poids

### Architecture de Données
1. **Input utilisateur** → Endpoint API
2. **Enrichissement** → APIs externes (Nutritionix/OpenFoodFacts)
3. **Stockage** → Tables Supabase
4. **Calcul résumé** → Agrégation données nutrition/calories quotidiennes
5. **Affichage** → Composants React via hooks

## Power Keywords pour Claude Code
- **IMPORTANT** : Instructions critiques à ne pas oublier
- **Proactively** : Encourager initiatives et suggestions d'améliorations
- **Ultra-think** : Déclencher analyse approfondie (utiliser avec parcimonie)

## Références Essentielles
- **UV (Python env/deps)**: [astral-sh/uv](https://github.com/astral-sh/uv)
- **Ruff**: [astral-sh/ruff](https://github.com/astral-sh/ruff)
- **FastAPI**: [fastapi.tiangolo.com](https://fastapi.tiangolo.com/)
- **React Query**: [tanstack.com/query](https://tanstack.com/query)
- **Shadcn/UI**: [ui.shadcn.com](https://ui.shadcn.com/)

---

## IMPORTANT - Règles Absolues

> **Aucune tâche n'est complète sans :**
> 1. Tests passants (backend + frontend)
> 2. Linting sans erreurs
> 3. Documentation mise à jour
> 4. Validation par validation gates
>
> **En cas de doute sur standards/architecture : DEMANDER clarification avant de procéder.**

---

*Ce fichier évolue avec le projet. Mettre à jour à chaque changement structurel.*
