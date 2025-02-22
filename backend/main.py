"""
    The entry file for the FastAPI application.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.router import api_router
from dotenv import load_dotenv

# Načtení proměnných prostředí
load_dotenv()

app = FastAPI(title="Activities Suggester App", version="1.0", debug=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)