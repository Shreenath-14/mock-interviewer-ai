
import requests
import json
import time

# 1. Mock Finalizing an Interview
user_id = "test_user_beta_history" # Using a string ID for test
payload = {
    "history": [{"role": "user", "content": "I love Python"}],
    "emotion_stats": {"happy": 100},
    "avg_attention_score": 90,
    "user_id": user_id
}

print("Saving Beta Result...")
res = requests.post('http://localhost:5000/api/beta/end', json=payload)
if res.status_code == 200:
    print("Save Success:", res.json().get("success"))
else:
    print("Save Failed:", res.text)
    exit()

# 2. Check History
print("Checking History...")
time.sleep(1) # Allow DB write
res_hist = requests.get(f'http://localhost:5000/api/interviews/history?user_id={user_id}&type=beta')
history_data = res_hist.json()

if history_data.get("success"):
    found = False
    for item in history_data.get("history", []):
        if item.get("job_role") == "Beta Interview" and item.get("score") > 0:
            print("FOUND Beta Interview in History:", item)
            found = True
            break
    if not found:
        print("Beta Interview NOT found in history list.")
        print("Full List:", history_data.get("history"))
else:
    print("History Fetch Failed:", history_data)
