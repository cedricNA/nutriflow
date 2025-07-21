# NutriFlow API

NutriFlow est une API en **FastAPI** qui t'aide à suivre ta nutrition et tes activités sportives. Elle combine Nutritionix pour analyser tes aliments et tes exercices, OpenFoodFacts pour récupérer des infos par code-barres, et Supabase pour stocker tes repas.

## Objectifs principaux

- **Analyse d'ingrédients** : envoie une description de ton repas et reçois la liste des aliments détaillés (quantités, calories, macros, etc.).
- **Recherche produit / code-barres** : récupère les informations nutritionnelles d'un produit en scannant son code-barres ou en cherchant par nom.
- **Calcul des dépenses énergétiques** : envoie une description d'activité sportive et obtiens les calories dépensées, ainsi que le calcul du BMR/TDEE.
- **Sauvegarde de repas** : les repas analysés peuvent être enregistrés dans Supabase pour un suivi au quotidien.

## Lancer le projet en local

1. **Prérequis**
   - Python 3.12 ou plus.
   - `pip` pour installer les dépendances.
   - (Optionnel) un environnement virtuel `venv`.
2. **Installation**
   ```bash
   pip install -r requirements.txt
   ```
3. **Variables d'environnement**
   Crée un fichier `.env` à la racine et renseigne :
   ```bash
   # Nutritionix
   NUTRIFLOW_NUTRITIONIX_APP_ID=ton_app_id
   NUTRIFLOW_NUTRITIONIX_API_KEY=ta_cle_api

   # Supabase
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_KEY=ta_cle_supabase
   ```
4. **Démarrage de l'API**
   ```bash
   uvicorn main:app --reload
   ```
   L'API sera disponible sur `http://localhost:8000` (documentation Swagger sur `/docs`).

## Endpoints essentiels

- **POST `/api/ingredients`** – Analyse une liste d'ingrédients.
  ```json
  {
    "query": "2 oeufs et 100g de pâtes"
  }
  ```
- **POST `/api/barcode`** – Infos produit par code-barres.
  ```json
  {
    "barcode": "3274080005003"
  }
  ```
- **GET `/api/search`** – Recherche d'un produit.
  ```text
  /api/search?query=yaourt
  ```
- **POST `/api/exercise`** – Analyse d'une activité sportive.
  ```json
  {
    "query": "30 minutes de course",
    "weight_kg": 70,
    "height_cm": 175,
    "age": 30,
    "gender": "male"
  }
  ```
- **POST `/api/bmr`** – Calcul du métabolisme de base.
  ```json
  {
    "poids_kg": 70,
    "taille_cm": 175,
    "age": 30,
    "sexe": "male"
  }
  ```
- **POST `/api/tdee`** – Calcul du TDEE (BMR + calories sportives).
  ```json
  {
    "poids_kg": 70,
    "taille_cm": 175,
    "age": 30,
    "sexe": "male",
    "calories_sport": 300
  }
  ```
- **GET `/api/user/profile`** – Récupère le profil de l'utilisateur.
  ```text
  /api/user/profile
  ```
- **POST `/api/user/profile/update`** – Met à jour un ou plusieurs champs du profil.
  ```json
  {
    "poids_kg": 72.5
  }
  ```

Pour préremplir le formulaire d'activité physique, récupère d'abord ces informations
avec `GET /api/user/profile` puis envoie-les (éventuellement modifiées) à `POST /api/exercise`.

## Lancer les tests unitaires

Assure-toi d'avoir installé les dépendances de test, puis exécute :
```bash
pytest
```

Et voilà ! Tu disposes maintenant d'une API pour gérer alimentation et activité physique. N'hésite pas à consulter le code pour comprendre chaque fonction et à adapter les appels à tes besoins.
