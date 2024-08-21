"""
    This file contains all project configs read from env file.
"""

import os
from dotenv import load_dotenv

print("Načítám proměnné prostředí...")
load_dotenv(verbose=True)

class Base(object):
    DEBUG: bool = True

class Config(Base):
    DEBUG: bool = True
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY")
    ASSISTANT_ID: str = os.getenv("ASSISTANT_ID")
    OPENAI_MODEL: str = "gpt-4o"
    OPENWEATHER_API_KEY: str = os.getenv("OPENWEATHER_API_KEY")

config = Config()
print(f"OPENWEATHER_API_KEY z config: {config.OPENWEATHER_API_KEY}")