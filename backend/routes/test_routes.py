from flask import Blueprint, request, jsonify
from datetime import datetime
from services.ai_service import generate_mock_test
from db import db
from bson import ObjectId

test_bp = Blueprint('test', __name__)

@test_bp.route('/generate', methods=['POST'])
def generate_test():
    """
    Generate a new mock test.
    Payload: { "topic": "ReactJS", "difficulty": "Medium" }
    """
    try:
        data = request.json
        topic = data.get('topic')
        difficulty = data.get('difficulty', 'medium')
        count = data.get('count', 10)
        
        if not topic:
            return jsonify({"success": False, "error": "Topic is required"}), 400

        questions = generate_mock_test(topic, difficulty, count)
        
        return jsonify({
            "success": True,
            "data": questions
        })

    except Exception as e:
        print(f"Error generating test: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@test_bp.route('/submit', methods=['POST'])
def submit_test():
    """
    Submit test results.
    Payload: { 
        "user_id": "...", 
        "topic": "ReactJS", 
        "score": 8, 
        "total": 10,
        "details": [...] 
    }
    """
    try:
        data = request.json
        user_id = data.get('user_id')
        topic = data.get('topic')
        score = data.get('score')
        total = data.get('total')
        details = data.get('details', [])

        if not user_id or not topic:
             return jsonify({"success": False, "error": "User ID and Topic are required"}), 400

        # Create record
        record = {
            "user_id": user_id,
            "topic": topic,
            "score": score,
            "total_questions": total,
            "details": details,
            "created_at": datetime.utcnow()
        }

        # Save to MongoDB
        col = db.get_test_results_collection() # Ensure this method exists or use generic
        result = col.insert_one(record)

        return jsonify({
            "success": True,
            "id": str(result.inserted_id)
        })

    except Exception as e:
        print(f"Error submitting test: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@test_bp.route('/history', methods=['GET'])
def get_test_history():
    """
    Get user's test history.
    Query Params: ?user_id=...
    """
    try:
        user_id = request.args.get('user_id')
        if not user_id:
             return jsonify({"success": False, "error": "user_id required"}), 400
             
        col = db.get_test_results_collection()
        
        # Robust Logic (String vs ObjectId)
        try:
            query_id = ObjectId(user_id)
        except:
            query_id = user_id

        # Helper to convert to list
        cursor = col.find({
            "$or": [
                {"user_id": query_id},
                {"user_id": user_id} 
            ]
        }).sort("created_at", -1).limit(5)
        
        history = []
        for doc in cursor:
            history.append({
                "id": str(doc.get("_id")),
                "topic": doc.get("topic", "Unknown"),
                "score": doc.get("score", 0),
                "total_questions": doc.get("total_questions", 0),
                "difficulty": doc.get("difficulty", "Medium"),
                "date": doc.get("created_at", datetime.utcnow()).strftime("%b %d, %Y")
            })
            
        return jsonify({
            "success": True,
            "data": history
        })

    except Exception as e:
        print(f"Error fetching history: {e}")
        return jsonify({"success": False, "error": str(e)}), 500
