import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Google Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

import sys

# Redirect stdout to a file
with open('debug_log.txt', 'w', encoding='utf-8') as f:
    # helper to print to both console and file
    def log(msg):
        print(msg)
        f.write(msg + '\n')
    
    log("1. Testing API Connection...")
    log(f"   API Key present: {bool(GEMINI_API_KEY)}")
    if GEMINI_API_KEY:
        log(f"   API Key length: {len(GEMINI_API_KEY)}")
        log(f"   API Key repr: {repr(GEMINI_API_KEY)}")
        if len(GEMINI_API_KEY) > 8:
             log(f"   Key preview: {GEMINI_API_KEY[:4]}...{GEMINI_API_KEY[-4:]}")
        else:
             log("   Key is too short!")

    if not GEMINI_API_KEY:
        log("❌ Error: GEMINI_API_KEY not found in environment variables.")
        exit(1)

    genai.configure(api_key=GEMINI_API_KEY)

    # Dummy resume text
    resume_text = "Software Engineer with 2 years of experience in Python and Flask."

    # Prompt (simplified version of the actual one)
    prompt = f"""You are a Senior Tech Recruiter. 
Review the following resume text against "Jake's Resume" standards.

Resume Text:
{resume_text}

Analyze the resume and return a strict JSON object with this format:
{{
  "score": <number>,
  "improvements": ["<string>"]
}}
Return ONLY valid JSON.
"""

    try:
        log("   Sending request to Gemini (gemini-flash-latest)...")
        model = genai.GenerativeModel('gemini-flash-latest')
        response = model.generate_content(prompt)
        
        log(f"\n2. Raw Response from Gemini:\n{response.text}")
        log("-" * 50)
        
        # Attempt to parse
        import re
        def clean_json_string(text):
            match = re.search(r'(\{.*\}|\[.*\])', text, re.DOTALL)
            if match:
                 return match.group(1)
            return text.strip()

        clean_text = clean_json_string(response.text)
        log(f"   Cleaned Text: {clean_text}")
        
        try:
            data = json.loads(clean_text)
            log("\n✅ Success! JSON parsed correctly.")
            log(json.dumps(data, indent=2))
        except json.JSONDecodeError as e:
            log(f"\n❌ JSON Parsing Failed: {e}")

    except Exception as e:
         log(f"\n❌ API Call Failed: {e}")
