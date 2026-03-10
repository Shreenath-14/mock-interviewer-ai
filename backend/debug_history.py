import os
import sys
from pymongo import MongoClient
from dotenv import load_dotenv
from bson import ObjectId
from datetime import datetime

# Load environment variables
load_dotenv()

def debug_history():
    print("=== History Debug Report ===\n")

    # 1. Connect to MongoDB
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        print("❌ Error: MONGO_URI not found in environment variables.")
        return

    try:
        client = MongoClient(mongo_uri)
        # Using the DB name found in db.py
        db = client.get_database("ai_interviewer_db")
        print(f"✅ Connected to database: {db.name}\n")
    except Exception as e:
        print(f"❌ Connection Failed: {e}")
        return

    users_col = db["users"]
    interviews_col = db["interviews"]

    # 2. Inspect Users
    print("--- Users Collection ---")
    users = list(users_col.find())
    print(f"Total Users: {len(users)}")
    user_map = {}
    
    for user in users:
        uid = user.get("_id")
        email = user.get("email", "No Email")
        uid_type = type(uid).__name__
        print(f"  • User: {email}")
        print(f"    ID: {uid} (Type: {uid_type})")
        user_map[str(uid)] = email

    print("\n")

    # 3. Inspect Interviews
    print("--- Interviews Collection ---")
    interviews = list(interviews_col.find())
    print(f"Total Interviews: {len(interviews)}")

    for interview in interviews:
        iid = interview.get("_id")
        user_id = interview.get("user_id")
        status = interview.get("status")
        score = interview.get("score")
        
        user_id_type = type(user_id).__name__
        
        # Try to find owner
        owner_email = "Unknown User"
        if str(user_id) in user_map:
            owner_email = user_map[str(user_id)]
        elif user_id == "demo_user":
            owner_email = "Demo User (No Account)"
        
        print(f"  • Interview: {iid}")
        print(f"    User ID: {user_id} (Type: {user_id_type}) -> Owner: {owner_email}")
        print(f"    Status: {status}, Score: {score}")
        
    print("\n=== End Report ===")

if __name__ == "__main__":
    debug_history()
