"""
This file is responsible for routing the incoming requests to the respective endpoints.
"""

from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.templating import Jinja2Templates
from fastapi import APIRouter
from fastapi.requests import Request
from pydantic import BaseModel

from ..services.chat import ChatService
from ..utils.stream import stream_generator
from fastapi import HTTPException
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

api_router = APIRouter()
chat_service = ChatService()

templates = Jinja2Templates(directory="templates")


class GetChatResponseRequest(BaseModel):
    """
    This class is used to validate the request for getting a chat response
    """

    user_query: str


@api_router.get("/ping", response_class=JSONResponse)
async def ping():
    """
    This function is used for health check of the application.
    """
    return {"message": "Application is Running!", "status": "success"}


@api_router.post("/chat/{chat_id}")
async def get_chat_response(chat_id: str, data: GetChatResponseRequest):
    """
    This function generates response for a user query
    """
    query = data.user_query
    response = chat_service.generate(chat_id, query)
    return StreamingResponse(stream_generator(response))

@api_router.get("/", response_class=JSONResponse)
async def chat_frontend(request: Request):
    """
    This function renders the chat frontend
    """
    return templates.TemplateResponse("index.html", {"request": request})

@api_router.post("/cart/transfer/{chat_id}")
async def transfer_cart_to_eshop(chat_id: str):
    """
    Přenese obsah pracovního košíku do košíku e-shopu.
    """
    result = await chat_service.transfer_cart_to_eshop(chat_id)
    return JSONResponse(content=result)

@api_router.get("/product/{product_id}")
async def get_product_details(product_id: str):
    """
    Získá detaily produktu z e-shopu.
    """
    result = await chat_service.get_product_details(product_id)
    return JSONResponse(content=result)


@api_router.get("/chat/{chat_id}/latest-messages")
async def get_latest_messages(chat_id: str):
    try:
        messages = await chat_service.get_latest_messages(chat_id)
        return {"messages": messages}
    except Exception as e:
        logger.error(f"Error getting latest messages: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@api_router.get("/cart/{chat_id}")
async def get_cart(chat_id: str):
    try:
        cart = await chat_service.get_cart(chat_id)
        return cart
    except Exception as e:
        logger.error(f"Error getting cart: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@api_router.post("/cart/{chat_id}")
async def update_cart(chat_id: str, cart_action: dict):
    await chat_service.update_cart(chat_id, cart_action)
    return {"status": "success"}