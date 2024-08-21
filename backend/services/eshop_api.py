import aiohttp
from ..config.main import config

class EshopApiService:
    def __init__(self):
        self.api_url = config.ESHOP_API_URL
        self.api_key = config.ESHOP_API_KEY

    async def transfer_cart(self, cart_items):
        """
        Přenese položky z pracovního košíku do košíku e-shopu.
        """
        async with aiohttp.ClientSession() as session:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            payload = {"items": cart_items}
            
            async with session.post(f"{self.api_url}/cart", json=payload, headers=headers) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    error_msg = await response.text()
                    raise Exception(f"Failed to transfer cart. Status: {response.status}, Error: {error_msg}")

    async def get_product_info(self, product_id):
        """
        Získá informace o produktu z e-shopu.
        """
        async with aiohttp.ClientSession() as session:
            headers = {"Authorization": f"Bearer {self.api_key}"}
            
            async with session.get(f"{self.api_url}/products/{product_id}", headers=headers) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    error_msg = await response.text()
                    raise Exception(f"Failed to get product info. Status: {response.status}, Error: {error_msg}")