
import requests
import json
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.services.ai_service import grade_interview

# Mock History used in Normal Mode
mock_history = [
    {
        "question": "Explain the difference between let and var in JavaScript.",
        "answer": "Let is block scoped while var is function scoped."
    },
    {
        "question": "What is a Promise?",
        "answer": "A placeholder for asynchronous result."
    }
]

print("Testing grade_interview function directly...")
try:
    result = grade_interview(mock_history)
    print("Result:", json.dumps(result, indent=2))
except Exception as e:
    print(f"FAILED: {e}")
