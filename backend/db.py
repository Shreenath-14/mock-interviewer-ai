import os
from pymongo import MongoClient
from pymongo.collection import Collection
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Database:
    """
    Singleton Database Manager for MongoDB Atlas.
    """
    _client = None
    _db = None

    @classmethod
    def connect(cls):
        """
        Initializes the MongoDB connection.
        Must be called when the Flask app starts.
        """
        mongo_uri = os.getenv("MONGO_URI")
        if not mongo_uri:
            raise ValueError("MONGO_URI is not set in environment variables.")

        try:
            cls._client = MongoClient(mongo_uri)
            cls._db = cls._client.get_database("ai_interviewer_db")
            print("✅ Connected to MongoDB Atlas successfully.")
        except Exception as e:
            print(f"❌ Failed to connect to MongoDB: {e}")
            raise e

    @classmethod
    def get_users_collection(cls) -> Collection:
        if cls._db is None:
            raise ConnectionError("Database not initialized. Call connect() first.")
        return cls._db["users"]

    @classmethod
    def get_interviews_collection(cls) -> Collection:
        if cls._db is None:
            raise ConnectionError("Database not initialized. Call connect() first.")
        return cls._db["interviews"]

    @classmethod
    def get_test_results_collection(cls) -> Collection:
        if cls._db is None:
            raise ConnectionError("Database not initialized. Call connect() first.")
        return cls._db["test_results"]

# Global instance for easy import
db = Database

