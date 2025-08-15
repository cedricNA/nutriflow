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
- **GET `/api/products/{barcode}/details`** – Détails complets d'un produit via son code-barres.
  ```text
  /api/products/3274080005003/details
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

## Documentation développeur complète

# 🚀 NutriFlow API – Documentation développeur

NutriFlow est une API complète pour le suivi nutritionnel et sportif.  
Elle permet d’analyser, enregistrer et restituer :

- Les repas (ingrédients, produits du commerce)
- Les activités sportives
- Les besoins et bilans quotidiens personnalisés
- L’évolution et l’historique de l’utilisateur

## Endpoints principaux

| Route | Méthode | Rôle | Exemple de données |
|-------|---------|------|--------------------|
| `/api/ingredients` | POST | Analyse & enregistre un repas maison | `{ "query": "2 carottes, 100g steak haché" }` |
| `/api/barcode` | POST | Analyse & enregistre un aliment par code-barres | `{ "barcode": "3274080005003" }` |
| `/api/products/{barcode}/details` | GET | Récupère les détails d'un produit par code-barres | `/api/products/3274080005003/details` |
| `/api/search` | GET | Recherche un produit dans OpenFoodFacts | `?query=yaourt` |
| `/api/exercise` | POST | Analyse & enregistre une activité physique | `{ "query": "45 minutes de vélo", ... }` |
| `/api/bmr` | POST | Calcule le BMR (besoin basal) | `{ "poids_kg": 75, "taille_cm": 175, "age": 30, "sexe": "homme" }` |
| `/api/tdee` | POST | Calcule le TDEE (besoin total ajusté) | `{ "poids_kg": 75, "taille_cm": 175, ... }` |
| `/api/daily-summary` | GET | Donne (et sauvegarde) le bilan du jour | `?date_str=2025-07-21` |
| `/api/history` | GET | Récupère l’historique des bilans | `?limit=7&user_id=...` |
| `/api/user/profile` | GET | Récupère le profil utilisateur | `?user_id=...` |
| `/api/user/profile/update` | POST | Modifie le profil utilisateur | `{ "poids_kg": 72 }` |

## Workflow type utilisateur

1. **Déclarer ou mettre à jour ton profil**  
   Utilise `/api/user/profile` et `/api/user/profile/update`.
2. **Ajouter un repas**  
   Passe par `/api/ingredients` ou `/api/barcode`.
3. **Ajouter une activité physique**  
   Envoie une requête à `/api/exercise`.
4. **Obtenir le bilan quotidien**  
   Consulte `/api/daily-summary`.
5. **Consulter ton historique**  
   Va sur `/api/history`.

## Détails par endpoint

### `/api/ingredients`
- Analyse une description d’ingrédients, retourne la liste détaillée et les totaux macros.
- Payload : `{ "query": "2 carottes, 100g steak haché" }`
- Réponse : liste + totaux

### `/api/barcode`
- Récupère les infos nutritionnelles d’un produit via son code-barres.
- Payload : `{ "barcode": "3274080005003" }`
- Réponse : infos produit

### `/api/exercise`
- Analyse une activité sportive et l’enregistre.
- Exemple de payload :
```json
{
  "query": "45 minutes de vélo",
  "weight_kg": 75,
  "height_cm": 175,
  "age": 30,
  "gender": "male"
}
```
- Réponse : liste d’exercices analysés

-### `/api/daily-summary`
- Calcule ou lit le bilan nutritionnel du jour (apports, dépenses, TDEE, balance, goal feedback).
- Paramètre : `date_str` (optionnel)
- Exemple de réponse :
```json
{
  "date": "2025-07-21",
  "calories_consumed": 1700,
  "calories_burned": 300,
  "tdee": 2100,
  "calorie_balance": -400,
  "goal_feedback": "Déficit modéré, bonne trajectoire pour perdre du poids."
}
```

### `/api/history`
- Retourne l’historique des bilans journaliers.
- Paramètres : `limit`, `user_id`
- Réponse : liste de bilans journaliers.

### `/api/user/profile`
- Récupère le profil utilisateur.
- Paramètre : `user_id`
- Exemple de réponse :
```json
{
  "poids_kg": 75,
  "taille_cm": 175,
  "age": 30,
  "sexe": "homme"
}
```

### `/api/user/profile/update`
- Met à jour le profil utilisateur.
- Payload : `{ "poids_kg": 72 }`
- Réponse : profil mis à jour

## FAQ & Conseils

- Tous les endpoints suivent la structure **OpenAPI/Swagger**, ce qui facilite l’intégration côté front.
- Les données sont historisées, parfait pour créer des graphiques et suivre l’évolution sur le long terme.
- Le profil utilisateur est dynamique : poids, taille, âge et sexe peuvent évoluer.

## Pour bien débuter

1. Crée un utilisateur test dans **Supabase**.
2. Déclare ton profil avec `/api/user/profile/update`.
3. Ajoute un repas ou une activité via `/api/ingredients`, `/api/barcode` ou `/api/exercise`.
4. Consulte ton bilan avec `/api/daily-summary`.
5. Explore l’historique avec `/api/history`.

## Exemple de traduction avec mapping CSV

```python
from nutriflow.services import reload_mapping, translate_fr_en

# Charge le fichier CSV fournissant les correspondances FR→EN
reload_mapping("data/fr_en_mapping.csv")

phrase = "2 cuillères à soupe de confiture de myrtille"
resultat = translate_fr_en(phrase)
print(resultat)
```

Format attendu du CSV :
- deux colonnes nommées `fr` et `en`
- séparateur `;` ou `,` accepté

L'appel à Google Translate reçoit déjà :
`2 tablespoons of blueberry jam`.

Happy coding !
