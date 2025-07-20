import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Charge .env
load_dotenv()

# Router
from nutriflow.api.router import router as nutriflow_router

app = FastAPI(title="NutriFlow API")

# CORS (ici tout domaine, à restreindre en prod)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Monte le router sous /api
app.include_router(nutriflow_router, prefix="/api", tags=["NutriFlow"])

@app.get("/")
async def root():
    return {"message": "Bienvenue sur NutriFlow API"}
