
import requests
import json
import time

user_id = "test_user_tech_test"

# 1. Generate Questions
print("1. Generating Test Questions...")
try:
    res = requests.post('http://localhost:5000/api/test/generate', json={"topic": "Python", "difficulty": "hard", "count": 3})
    data = res.json()
    if data.get("success"):
        print(f"Generated {len(data['data'])} questions.")
    else:
        print("Generation Failed:", data)
        exit()
except Exception as e:
    print("Generation Exception:", e)
    exit()

# 2. Submit Results
print("\n2. Submitting Test Result...")
payload = {
    "user_id": user_id,
    "topic": "Python",
    "score": 2,
    "total": 3,
    "details": [{"q": 1, "correct": True}, {"q": 2, "correct": False}, {"q": 3, "correct": True}]
}
res = requests.post('http://localhost:5000/api/test/submit', json=payload)
submit_data = res.json()
print("Submit Status:", submit_data.get("success"))

# 3. Check History
print("\n3. Checking Test History...")
time.sleep(1)
res = requests.get(f'http://localhost:5000/api/test/history?user_id={user_id}')
history_data = res.json()

if history_data.get("success"):
    found = False
    for item in history_data.get("data", []):
        if item.get("topic") == "Python" and item.get("score") == 2:
            print("FOUND Test Result in History:", item)
            found = True
            break
    if not found:
        print("Test Result NOT found in history.")
        print("Full List:", history_data.get("data"))
else:
    print("History Fetch Failed:", history_data)
