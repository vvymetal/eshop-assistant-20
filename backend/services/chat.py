"""
    This file contains the core functionality of the chat service.
"""

import os
import asyncio
import json
import logging
from datetime import datetime
from zoneinfo import ZoneInfo

from openai import AsyncOpenAI as OpenAI
from openai.types.beta import Assistant, Thread
from openai.types.beta.assistant_stream_event import (
    ThreadRunRequiresAction,
    ThreadMessageDelta,
    ThreadRunFailed,
    ThreadRunCancelling,
    ThreadRunCancelled,
    ThreadRunExpired,
    ThreadRunStepFailed,
    ThreadRunStepCancelled,
)

from ..config.main import config
from ..config.prompts import SYS_PROMPT
from ..utils.singleton import Singleton
from ..services.assistant_setup import AssistantSetup
from ..tools.cart_management import CartManagementTool, CART_MANAGEMENT_TOOL
from ..services.eshop_api import EshopApiService

os.environ["OPENAI_API_KEY"] = config.OPENAI_API_KEY

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ChatService(metaclass=Singleton):
    """
    This class is used to handle the OpenAI GPT based assistant.
    """

    assistant: Assistant = None
    assistant_setup: AssistantSetup = None
    sys_prompt: str = SYS_PROMPT
    chat_to_thread_map = {}
    tools = []
    tool_instances = {}

    def __init__(self) -> None:
        self.client = OpenAI()
        self.name = 'E-shop Assistant'
        self.assistant_id = config.ASSISTANT_ID
        self.cart_tool = CartManagementTool()
        self.eshop_api = EshopApiService()  # Inicializace EshopApiService
        self.init_tools()
        self.assistant_setup = AssistantSetup(
            self.client,
            self.assistant_id,
            self.sys_prompt,
            self.name,
            self.tools
        )
        asyncio.create_task(self.initialize_assistant())

    def init_tools(self):
        self.tools = [CART_MANAGEMENT_TOOL]
        self.tool_instances = {
            "manage_cart": self.cart_tool.manage_cart,
            "transfer_cart": self.transfer_cart_to_eshop,
            "get_product_info": self.get_product_info,
            "get_product_list": self.get_product_list,
        }

    async def transfer_cart_to_eshop(self, chat_id):
        """
        Přenese obsah pracovního košíku do košíku e-shopu.
        """
        cart_items = self.cart_tool.view_cart()['items']
        try:
            result = await self.eshop_api.transfer_cart(cart_items)
            logger.info(f"Cart transferred to e-shop for chat_id: {chat_id}")
            return result
        except Exception as e:
            logger.error(f"Failed to transfer cart to e-shop for chat_id {chat_id}: {str(e)}")
            raise

    async def get_product_info(self, product_id):
        """
        Získá informace o produktu z e-shopu.
        """
        try:
            result = await self.eshop_api.get_product_info(product_id)
            logger.info(f"Product info retrieved for product_id: {product_id}")
            return result
        except Exception as e:
            logger.error(f"Failed to get product info for product_id {product_id}: {str(e)}")
            raise

    async def get_product_list(self, category=None, limit=50, offset=0):
        """
        Získá seznam produktů z e-shopu.
        """
        try:
            result = await self.eshop_api.get_product_list(category, limit, offset)
            logger.info(f"Product list retrieved. Category: {category}, Limit: {limit}, Offset: {offset}")
            return result
        except Exception as e:
            logger.error(f"Failed to get product list: {str(e)}")
            raise

    async def process_tool_call(self, tool_call, extra_args=None):
            result = None
            try:
                arguments = json.loads(tool_call.function.arguments)
                function_name = tool_call.function.name
                if extra_args:
                    arguments.update(extra_args)
                if function_name not in self.tool_instances:
                    result = f"Tool '{function_name}' not found"
                    logger.warning(result)
                else:
                    tool_instance = self.tool_instances[function_name]
                    if asyncio.iscoroutinefunction(tool_instance):
                        result = await tool_instance(**arguments)
                    else:
                        result = tool_instance(**arguments)
                logger.info(f"Tool '{function_name}' executed successfully")
            except Exception as e:
                result = f"Error executing tool '{function_name}': {str(e)}"
                logger.error(result)

            # Ujistíme se, že výstup je string
            if not isinstance(result, str):
                result = json.dumps(result, ensure_ascii=False)

            # Přidáme cart_action do odpovědi, pokud se jedná o manage_cart
            if function_name == "manage_cart":
                return {"cart_action": result}
            return {
                "tool_call_id": tool_call.id,
                "output": result
            }

    async def process_tool_calls(self, tool_calls, extra_args = None):
            """
            This function processes all the tool calls.
            """
            tool_outputs = []
            cart_actions = []
            for tool_call in tool_calls:
                result = await self.process_tool_call(tool_call, extra_args)
                if isinstance(result, dict) and "cart_action" in result:
                    cart_actions.append(result["cart_action"])
                    # Přidáme výstup nástroje i pro cart_action
                    tool_outputs.append({
                        "tool_call_id": tool_call.id,
                        "output": json.dumps(result["cart_action"])
                    })
                else:
                    # Přidáme výstup nástroje do tool_outputs
                    tool_outputs.append(result)

            # Vrátíme obojí: tool_outputs pro OpenAI API a cart_actions pro další zpracování
            return tool_outputs, cart_actions
    
    async def initialize_assistant(self):
        """
        Initializes the assistant asynchronously.
        """
        try:
            self.assistant = await self.assistant_setup.create_or_update_assistant()
            logger.info(f"Assistant initialized with ID: {self.assistant.id}")
        except Exception as e:
            logger.error(f"Failed to initialize assistant: {e}")

    async def create_assistant(self):
        """
        This function creates assistant if not exists
        """
        if not self.assistant:
            try:
                self.assistant = await self.assistant_setup.create_or_update_assistant()
                logger.info(f"Assistant created with ID: {self.assistant.id}")
            except Exception as e:
                logger.error(f"Failed to create assistant: {e}")
                raise

    def get_formatted_time(self):
        """
        Returns the current time formatted as a string.
        """
        current_time = datetime.now(ZoneInfo("Europe/Prague"))
        return current_time.strftime("%Y-%m-%d %H:%M:%S %Z")

    async def generate(self, chat_id, content):
        """
        It generates the response for the user query.
        """
        await self.create_assistant()
        thread = await self.create_or_get_thread(chat_id)

        # Add current time information
        time_message = f"Aktuální čas: {self.get_formatted_time()}"
        await self.client.beta.threads.messages.create(
            thread.id,
            role="user",
            content=time_message,
        )

        # Add user's message
        await self.client.beta.threads.messages.create(
            thread.id,
            role="user",
            content=content,
        )

        stream = await self.client.beta.threads.runs.create(
            thread_id=thread.id, assistant_id=self.assistant.id, stream=True
        )
        async for event in stream:
            async for token in self.process_event(event, thread):
                if isinstance(token, dict) and "cart_action" in token:
                    # Pokud token obsahuje cart_action, odešleme ho jako samostatnou zprávu
                    yield json.dumps({"cart_action": token["cart_action"]})
                else:
                    yield token

        logger.info("Tool run completed")

    async def create_or_get_thread(self, chat_id) -> Thread:
        """
        This function either creates a new thread for the chat_id or gets the existing thread.
        """
        thread = None
        if self.chat_to_thread_map.get(chat_id):
            try:
                thread = await self.client.beta.threads.retrieve(self.chat_to_thread_map[chat_id])
            except Exception as e:
                logger.error(f"Error in getting thread: {e}")
                thread = None
        if not thread:
            thread = await self.client.beta.threads.create(
                metadata={
                    "chat_id": str(chat_id),
                },
            )
            self.chat_to_thread_map[chat_id] = thread.id
        return thread

    async def process_event(self, event, thread: Thread, **kwargs):
        """
        Process an event in the thread.

        Args:
            event: The event to be processed.
            thread: The thread object.
            **kwargs: Additional keyword arguments.

        Yields:
            The processed tokens.

        Raises:
            Exception: If the run fails.
        """
        if isinstance(event, ThreadMessageDelta):
            data = event.data.delta.content
            for d in data:
                yield d

        elif isinstance(event, ThreadRunRequiresAction):
            run_obj = event.data
            tool_outputs, cart_actions = await self.process_tool_calls(
                run_obj.required_action.submit_tool_outputs.tool_calls
            )
            for cart_action in cart_actions:
                yield json.dumps({"cart_action": cart_action})
            tool_output_events = (
                await self.client.beta.threads.runs.submit_tool_outputs(
                    thread_id=thread.id,
                    run_id=run_obj.id,
                    tool_outputs=tool_outputs,
                    stream=True,
                )
            )
            async for tool_event in tool_output_events:
                async for token in self.process_event(
                    tool_event, thread=thread, **kwargs
                ):
                    yield token

        elif any(
            isinstance(event, cls)
            for cls in [
                ThreadRunFailed,
                ThreadRunCancelling,
                ThreadRunCancelled,
                ThreadRunExpired,
                ThreadRunStepFailed,
                ThreadRunStepCancelled,
            ]
        ):
            error_message = f"Run failed: {event.__class__.__name__}"
            logger.error(error_message)
            raise Exception(error_message)