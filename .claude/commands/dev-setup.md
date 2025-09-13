# Command: dev-setup

Configure l'environnement de développement NutriFlow pour un nouveau développeur.

## Étapes de setup

### 1. Vérification prérequis
- Vérifier si uv est installé : `uv --version`
- Vérifier si npm est installé : `npm --version`  
- Vérifier si les variables d'environnement sont configurées

### 2. Installation backend
- `uv sync` pour installer les dépendances Python
- Vérifier la connexion Supabase

### 3. Installation frontend
- `cd frontend && npm install`
- Vérifier la configuration Vite

### 4. Tests de démarrage
- Démarrer le backend : `uv run uvicorn main:app --reload`
- Démarrer le frontend : `cd frontend && npm run dev`
- Vérifier que l'API répond sur http://localhost:8000
- Vérifier que le frontend charge sur http://localhost:5173

## Résultat
Guide le développeur à travers le setup complet avec vérifications à chaque étape.