import os
from pydantic import BaseSettings

class Config(BaseSettings):
    DEBUG: bool = True
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY")
    ASSISTANT_ID: str = os.getenv("ASSISTANT_ID")
    OPENAI_MODEL: str = "gpt-4o"
    OPENWEATHER_API_KEY: str = os.getenv("OPENWEATHER_API_KEY")
    ESHOP_API_URL: str = os.getenv("ESHOP_API_URL")
    ESHOP_API_KEY: str = os.getenv("ESHOP_API_KEY")
    DATABASE_URL: str = os.getenv("DATABASE_URL")

config = Config()