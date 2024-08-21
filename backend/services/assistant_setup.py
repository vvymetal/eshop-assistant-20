import json
from openai import AsyncOpenAI as OpenAI
from ..config.main import config
from ..config.prompts import SYS_PROMPT

class AssistantSetup:
    def __init__(self, client: OpenAI, assistant_id, sys_prompt, name, tools):
        self.client = client
        self.assistant_id = assistant_id
        self.tools = tools
        self.sys_prompt = sys_prompt
        self.name = name
        self.model = config.OPENAI_MODEL

    async def create_or_update_assistant(self):
        assistant_id = self.assistant_id
        if assistant_id:
            assistant = await self.update_existing_assistant(assistant_id)
        else:
            assistant = await self.create_new_assistant()
        return assistant

    async def create_new_assistant(self):
        try:
            assistant = await self.client.beta.assistants.create(
                name=self.name,
                instructions=self.sys_prompt,
                model=self.model,
                tools=self.tools,
            )
            print("Assistant created successfully!", assistant.id)
        except Exception as e:
            print(f"Error creating assistant: {e}")
            assistant = None
        return assistant

    async def update_existing_assistant(self, assistant_id):
        try:
            assistant = await self.client.beta.assistants.retrieve(assistant_id)
            assistant = await self.client.beta.assistants.update(
                assistant.id,
                instructions=self.sys_prompt,
                tools=self.tools,
            )
        except Exception as e:
            print(f"Error updating assistant: {e}")
            assistant = await self.create_new_assistant()
        return assistant

    # Odstraňte metodu get_temperature(), pokud ji již nepoužíváte

    async def update_assistant_properties(self, assistant):
        try:
            assistant = await self.client.beta.assistants.update(
                assistant.id,
                instructions=self.sys_prompt,
                tools=self.tools,  # Zde se aktualizují nástroje včetně nového
                temperature=self.get_temperature(),
            )
        except Exception as e:
            print(f"Error updating assistant: {e}")
        return assistant
    


    async def update_assistant_properties(self, assistant):
        try:
            assistant = await self.client.beta.assistants.update(
                assistant.id,
                instructions=self.sys_prompt,
                tools=self.tools,
                temperature=self.get_temperature(),
            )
        except Exception as e:
            print(f"Error updating assistant: {e}")
        return assistant

    async def upload_product_data(self, file_path):
        try:
            with open(file_path, 'r') as file:
                product_data = json.load(file)
            
            file = await self.client.files.create(
                file=json.dumps(product_data),
                purpose='assistants'
            )
            
            await self.client.beta.assistants.files.create(
                assistant_id=self.assistant_id,
                file_id=file.id
            )
            
            print(f"Product data uploaded successfully. File ID: {file.id}")
        except Exception as e:
            print(f"Error uploading product data: {e}")

    async def initialize_assistant(self, product_data_file):
        assistant = await self.create_or_update_assistant()
        if assistant:
            await self.upload_product_data(product_data_file)
        return assistant