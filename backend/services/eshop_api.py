import aiohttp
import logging
from ..config.main import config

logger = logging.getLogger(__name__)

class EshopApiService:
    def __init__(self):
        self.api_url = config.ESHOP_API_URL
        self.api_key = config.ESHOP_API_KEY

    async def _make_request(self, method, endpoint, data=None):
        """
        Pomocná metoda pro provádění HTTP požadavků.
        """
        async with aiohttp.ClientSession() as session:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            url = f"{self.api_url}/{endpoint}"
            
            try:
                async with getattr(session, method)(url, json=data, headers=headers) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        error_msg = await response.text()
                        logger.error(f"API request failed. Status: {response.status}, Error: {error_msg}")
                        raise Exception(f"API request failed. Status: {response.status}, Error: {error_msg}")
            except aiohttp.ClientError as e:
                logger.error(f"Connection error: {str(e)}")
                raise

    async def transfer_cart(self, cart_items):
        """
        Přenese položky z pracovního košíku do košíku e-shopu.
        """
        try:
            result = await self._make_request("post", "cart", data={"items": cart_items})
            logger.info("Cart transferred successfully")
            return result
        except Exception as e:
            logger.error(f"Failed to transfer cart: {str(e)}")
            raise

    async def get_product_info(self, product_id):
        """
        Získá informace o produktu z e-shopu.
        """
        try:
            result = await self._make_request("get", f"products/{product_id}")
            logger.info(f"Product info retrieved for product_id: {product_id}")
            return result
        except Exception as e:
            logger.error(f"Failed to get product info for product_id {product_id}: {str(e)}")
            raise

    async def get_product_list(self, category=None, limit=50, offset=0):
        """
        Získá seznam produktů z e-shopu.
        """
        params = f"?limit={limit}&offset={offset}"
        if category:
            params += f"&category={category}"
        
        try:
            result = await self._make_request("get", f"products{params}")
            logger.info(f"Product list retrieved. Category: {category}, Limit: {limit}, Offset: {offset}")
            return result
        except Exception as e:
            logger.error(f"Failed to get product list: {str(e)}")
            raise

    async def update_cart_item_quantity(self, product_id, quantity):
        """
        Aktualizuje množství produktu v košíku e-shopu.
        """
        try:
            result = await self._make_request("put", f"cart/items/{product_id}", data={"quantity": quantity})
            logger.info(f"Cart item quantity updated for product_id: {product_id}")
            return result
        except Exception as e:
            logger.error(f"Failed to update cart item quantity for product_id {product_id}: {str(e)}")
            raise