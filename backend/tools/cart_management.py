from pydantic import BaseModel
from typing import List, Dict, Optional

class CartItem(BaseModel):
    product_id: str
    name: str
    price: float
    quantity: int

class Cart(BaseModel):
    items: List[CartItem] = []


import json

class CartManagementTool:
    def __init__(self):
        self.cart = Cart()

    def manage_cart(self, action: str, **kwargs) -> str:
        result = None
        if action == "add":
            result = self.add_to_cart(**kwargs)
        elif action == "remove":
            result = self.remove_from_cart(**kwargs)
        elif action == "view":
            result = self.view_cart()
        elif action == "clear":
            result = self.clear_cart()
        else:
            result = {"status": "error", "message": f"Neznámá akce: {action}"}
        
        # Převedeme výsledek na JSON string
        return json.dumps(result, ensure_ascii=False)
    
    
    def add_to_cart(self, product_id: str, name: str, price: float, quantity: int = 1) -> Dict:
        """Přidá produkt do košíku nebo zvýší jeho množství, pokud už v košíku je."""
        for item in self.cart.items:
            if item.product_id == product_id:
                item.quantity += quantity
                return {
                    "status": "updated", 
                    "message": f"Množství produktu {name} bylo aktualizováno na {item.quantity}.",
                    "product_id": product_id,
                    "name": name,
                    "price": price,
                    "quantity": item.quantity
                }

        new_item = CartItem(product_id=product_id, name=name, price=price, quantity=quantity)
        self.cart.items.append(new_item)
        return {
            "status": "added", 
            "message": f"Produkt {name} byl přidán do košíku.",
            "product_id": product_id,
            "name": name,
            "price": price,
            "quantity": quantity
        }

    def remove_from_cart(self, product_id: str, quantity: Optional[int] = None) -> Dict:
            for index, item in enumerate(self.cart.items):
                if item.product_id == product_id:
                    if quantity is None or item.quantity <= quantity:
                        removed_item = self.cart.items.pop(index)
                        return {
                            "status": "removed",
                            "message": f"Produkt {removed_item.name} byl odebrán z košíku.",
                            "product_id": product_id,
                            "name": removed_item.name,
                            "price": removed_item.price,
                            "quantity": removed_item.quantity
                        }
                    else:
                        item.quantity -= quantity
                        return {
                            "status": "updated",
                            "message": f"Množství produktu {item.name} bylo sníženo na {item.quantity}.",
                            "product_id": product_id,
                            "name": item.name,
                            "price": item.price,
                            "quantity": item.quantity
                        }
            return {"status": "not_found", "message": "Produkt nebyl v košíku nalezen."}
    def view_cart(self) -> Dict:
        """Zobrazí obsah košíku."""
        if not self.cart.items:
            return {"status": "empty", "message": "Košík je prázdný."}
        
        total = sum(item.price * item.quantity for item in self.cart.items)
        return {
            "status": "success",
            "items": [item.dict() for item in self.cart.items],
            "total": total,
            "message": f"Košík obsahuje {len(self.cart.items)} položek. Celková cena: {total:.2f} Kč."
        }

    def clear_cart(self) -> Dict:
        """Vyčistí celý košík."""
        self.cart.items.clear()
        return {"status": "cleared", "message": "Košík byl vyčištěn."}

# Definice nástroje pro použití s OpenAI asistentem
CART_MANAGEMENT_TOOL = {
    "type": "function",
    "function": {
        "name": "manage_cart",
        "description": "Spravuje nákupní košík - přidává, odebírá produkty a zobrazuje obsah košíku.",
        "parameters": {
            "type": "object",
            "properties": {
                "action": {
                    "type": "string",
                    "enum": ["add", "remove", "view", "clear"],
                    "description": "Akce, kterou chcete provést s košíkem."
                },
                "product_id": {
                    "type": "string",
                    "description": "ID produktu pro přidání nebo odebrání z košíku."
                },
                "name": {
                    "type": "string",
                    "description": "Název produktu pro přidání do košíku."
                },
                "price": {
                    "type": "number",
                    "description": "Cena produktu pro přidání do košíku."
                },
                "quantity": {
                    "type": "integer",
                    "description": "Množství produktu pro přidání nebo odebrání z košíku."
                }
            },
            "required": ["action"]
        }
    }
}