import requests
import json
import time

BASE_URL = "http://localhost:5000/api/test"

def test_generate():
    print("Testing Generation...")
    payload = {"topic": "Python", "difficulty": "Easy"}
    try:
        res = requests.post(f"{BASE_URL}/generate", json=payload)
        if res.status_code == 200:
            print("Generation Success")
            # print(json.dumps(res.json(), indent=2))
        else:
            print(f"Generation Failed: {res.text}")
    except Exception as e:
         print(f"Connection Error: {e}")

def test_submit():
    print("\nTesting Submission...")
    payload = {
        "user_id": "test_script_user",
        "topic": "Python",
        "score": 9,
        "total": 10,
        "details": [{"question": "Q1", "correct": True}]
    }
    try:
        res = requests.post(f"{BASE_URL}/submit", json=payload)
        if res.status_code == 200:
            print("Submission Success")
            print(res.json())
        else:
             print(f"Submission Failed: {res.text}")
    except Exception as e:
         print(f"Connection Error: {e}")

if __name__ == "__main__":
    time.sleep(2) # Wait for restarts
    test_generate()
    test_submit()
