from sqlalchemy import Column, Integer, String, DateTime
from .base import Base

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(String, unique=True, index=True)
    thread_id = Column(String, unique=True)
    last_activity = Column(DateTime)