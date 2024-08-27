from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from ..models.conversation import Conversation
from ..models.cart import Cart
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ConversationManager:
    def __init__(self, db: Session, client):
        self.db = db
        self.client = client  # Předpokládáme, že client je instance OpenAI klienta

    async def create_or_get_conversation(self, chat_id: str, thread_id: str = None):
        try:
            conversation = self.db.query(Conversation).filter(Conversation.chat_id == chat_id).first()
            logger.info(f"Retrieved conversation for chat_id {chat_id}: {conversation}")
            if not conversation:
                if not thread_id:
                    thread = await self.client.beta.threads.create()
                    thread_id = thread.id
                conversation = Conversation(chat_id=chat_id, thread_id=thread_id, last_activity=datetime.utcnow())
                self.db.add(conversation)
                self.db.commit()
                logger.info(f"Created new conversation for chat_id {chat_id}: {conversation}")
            elif not conversation.thread_id and thread_id:
                conversation.thread_id = thread_id
                self.db.commit()
                logger.info(f"Updated thread_id for existing conversation: {conversation}")
            return conversation
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Database error in create_or_get_conversation: {str(e)}")
            raise

    async def update_last_activity(self, chat_id: str):
        try:
            conversation = self.db.query(Conversation).filter(Conversation.chat_id == chat_id).first()
            if conversation:
                conversation.last_activity = datetime.utcnow()
                self.db.commit()
                logger.info(f"Updated last activity for chat_id {chat_id}")
            else:
                logger.warning(f"Conversation not found for chat_id {chat_id} when updating last activity")
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Database error in update_last_activity: {str(e)}")
            raise

    async def get_cart(self, chat_id: str):
        try:
            cart = self.db.query(Cart).filter(Cart.chat_id == chat_id).first()
            logger.info(f"Retrieved cart for chat_id {chat_id}: {cart}")
            return cart
        except SQLAlchemyError as e:
            logger.error(f"Database error in get_cart: {str(e)}")
            raise

    async def update_cart(self, chat_id: str, cart_data: dict):
        try:
            cart = await self.get_cart(chat_id)
            if not cart:
                cart = Cart(chat_id=chat_id, data=cart_data)
                self.db.add(cart)
                logger.info(f"Created new cart for chat_id {chat_id}")
            else:
                cart.data = cart_data
                logger.info(f"Updated cart for chat_id {chat_id}")
            self.db.commit()
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Database error in update_cart: {str(e)}")
            raise

    async def get_latest_messages(self, chat_id: str, limit: int = 10):
        try:
            conversation = await self.create_or_get_conversation(chat_id)
            if conversation and conversation.thread_id:
                logger.info(f"Fetching messages for thread_id: {conversation.thread_id}")
                thread = await self.client.beta.threads.messages.list(conversation.thread_id, limit=limit)
                messages = [{
                    "role": msg.role, 
                    "content": msg.content[0].text.value if msg.content else ""
                } for msg in thread.data]
                logger.info(f"Fetched {len(messages)} messages for chat_id {chat_id}")
                return messages
            logger.warning(f"No conversation or thread_id found for chat_id: {chat_id}")
            return []
        except Exception as e:
            logger.error(f"Error fetching messages for chat_id {chat_id}: {str(e)}")
            return []