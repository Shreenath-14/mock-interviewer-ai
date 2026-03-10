
import os
import google.generativeai as genai
from dotenv import load_dotenv

# Force reload of env from backend
backend_env = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))
if os.path.exists(backend_env):
    load_dotenv(backend_env, override=True)
else:
    load_dotenv(override=True)

api_key = os.getenv("GEMINI_API_KEY")
print(f"DEBUG: Loaded API KEY: {api_key[:5]}...{api_key[-5:] if api_key else 'None'}")

if not api_key:
    print("❌ CRITICAL: GEMINI_API_KEY is missing!")
    exit(1)

genai.configure(api_key=api_key)

print("Attempting to connect to Gemini...")
try:
    model = genai.GenerativeModel('gemini-flash-latest') # Verify model name
    response = model.generate_content("Hello, this is a connectivity test. Reply with 'OK'.")
    print(f"✅ CONNECTION SUCCESS. Response: {response.text}")
except Exception as e:
    print(f"❌ CONNECTION FAILED: {e}")
    import traceback
    traceback.print_exc()
