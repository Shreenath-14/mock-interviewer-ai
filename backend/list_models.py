import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

print("Listing available models...")
with open('models_list.txt', 'w', encoding='utf-8') as f:
    try:
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"- {m.name}")
                f.write(f"- {m.name}\n")
    except Exception as e:
        print(f"Error listing models: {e}")
        f.write(f"Error listing models: {e}\n")
