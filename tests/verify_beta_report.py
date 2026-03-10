
import requests
import json
import sys

# Mock Data
history = [
    {"role": "assistant", "content": "What are your strengths?"},
    {"role": "user", "content": "I am great at React and Python."},
    {"role": "assistant", "content": "How do you handle deadlines?"},
    {"role": "user", "content": "I prioritize tasks and communicate early."}
]

emotion_stats = {
    "happy": 50,
    "neutral": 200,
    "fearful": 10
}

avg_attention = 85.5

payload = {
    "history": history,
    "emotion_stats": emotion_stats,
    "avg_attention_score": avg_attention
}

print("Sending Report Request...")
try:
    res = requests.post('http://localhost:5000/api/beta/end', json=payload)
    print(f"Status Code: {res.status_code}")
    
    if res.status_code == 200:
        data = res.json()
        if data['success']:
            report = data['report']
            print("\nReport Generated Successfully!")
            print(f"Overall Score: {report['scores']['overall']}")
            print(f"Mood: {report['mood_analysis']}")
            print(f"Confidence: {report['scores']['confidence']}%")
            print("Improvements:", report.get('improvement_suggestions', []))
        else:
            print("Backend returned failure:", data.get('error'))
    else:
        print("Request Failed:", res.text)

except Exception as e:
    print(f"Connection Error: {e}")
