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
    ESHOP_API_URL: str = os.getenv("ESHOP_API_URL")
    ESHOP_API_KEY: str = os.getenv("ESHOP_API_KEY")
    DATABASE_URL: str = os.getenv("DATABASE_URL")

config = Config()
print(f"ESHOP_API_URL z config: {config.ESHOP_API_URL}")