import google.generativeai as genai
import os
from dotenv import load_dotenv
import json

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.0-flash-lite")

with open('cicrData.json','r') as file:
    cicrData = json.load(file)

chat = model.start_chat(history=cicrData)

def get_ai_response(user_prompt: str):
    global cicrData

    response = chat.send_message(user_prompt,stream=True)
    response.resolve() # Ensure the response is fully generated

    cicrData.append({"role" : "user","parts":[{"text":user_prompt}]})
    cicrData.append({"role" : "model","parts":[{"text":response.text}]})

    return response.text