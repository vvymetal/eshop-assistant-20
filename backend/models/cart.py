from sqlalchemy import Column, Integer, String, JSON
from .base import Base

class Cart(Base):
    __tablename__ = "carts"

    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(String, unique=True, index=True)
    data = Column(JSON)