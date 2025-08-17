import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from nutriflow.api.router import router as nutriflow_router

# Charge .env
load_dotenv()

app = FastAPI(
    title="NutriFlow API",
    description="""
NutriFlow est une API complète pour le suivi nutritionnel et sportif.

**Principales fonctionnalités :**
- Analyse et sauvegarde des repas (ingrédients maison, produits du commerce)
- Suivi et calcul des activités physiques
- Calcul automatique du bilan journalier personnalisé (TDEE, balance, feedback selon l’objectif)
- Historique et profil utilisateur dynamique

**Workflow classique :**
1. Déclarer son profil (`/api/user/profile`)
2. Ajouter un repas (`/api/ingredients` ou `/api/barcode`)
3. Ajouter une activité (`/api/exercise`)
4. Consulter le bilan du jour (`/api/daily-summary`)
5. Visualiser l’historique (`/api/history`)

**Endpoints principaux :**
- `/api/ingredients` : Ajout/Analyse d’un repas maison
- `/api/barcode` : Ajout/Analyse d’un produit du commerce
- `/api/exercise` : Ajout/Analyse d’une activité physique
- `/api/daily-summary` : Récupère (et sauvegarde) le bilan nutritionnel d’une journée
- `/api/history` : Récupère l’historique des bilans journaliers
- `/api/user/profile` : Récupère le profil utilisateur
- `/api/user/profile/update` : Met à jour le profil utilisateur

Voir chaque endpoint pour le détail des paramètres et exemples.

> NutriFlow est pensé pour un usage progressif et personnalisé, adapté à tous les objectifs nutritionnels.
""",
    version="0.1.0",
)

# CORS (origines autorisées configurables)
origins_env = os.getenv("CORS_ORIGINS")
if origins_env:
    allowed_origins = [o.strip() for o in origins_env.split(",") if o.strip()]
else:
    allowed_origins = ["http://localhost:8080", "http://localhost:5173", "http://localhost:8081"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Monte le router sous /api
app.include_router(nutriflow_router, prefix="/api", tags=["NutriFlow"])


@app.get("/")
async def root():
    return {"message": "Bienvenue sur NutriFlow API"}
