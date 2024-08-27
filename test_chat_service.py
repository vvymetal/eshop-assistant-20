import asyncio
from backend.services.chat import ChatService
from backend.database import get_db

async def test_chat_service():
    chat_service = ChatService()
    db = next(get_db())
    
    # Test vytvoření nové konverzace
    chat_id = "test_chat_123"
    content = "Ahoj, jak se máš?"
    
    async for response in chat_service.generate(chat_id, content):
        print(response)
    
    # Test získání poslední konverzace
    latest_messages = await chat_service.get_latest_messages(chat_id)
    print("Latest messages:", latest_messages)
    
    # Test aktualizace košíku
    cart_action = {
        "status": "added",
        "product_id": "test_product_1",
        "name": "Test Product",
        "price": 100,
        "quantity": 1
    }
    await chat_service.update_cart(chat_id, cart_action)
    
    # Test získání košíku
    cart = await chat_service.get_cart(chat_id)
    print("Cart:", cart)

if __name__ == "__main__":
    asyncio.run(test_chat_service())