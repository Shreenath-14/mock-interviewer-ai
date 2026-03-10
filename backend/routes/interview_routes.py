from flask import Blueprint, request, jsonify
from db import db
from bson import ObjectId
from datetime import datetime
import uuid
from services.ai_service import generate_questions, grade_interview

interview_bp = Blueprint("interviews", __name__)

@interview_bp.route("/start", methods=["POST"])
def start_interview():
    try:
        data = request.get_json()
        if not data:
             return jsonify({"success": False, "error": "No data provided"}), 400
        
        user_id = data.get("user_id")
        job_role = data.get("job_role", "Software Engineer")
        difficulty = data.get("difficulty", "medium")
        skills = data.get("skills", [])
        
        if not user_id:
            print("⚠️ Warning: No user_id provided for interview, using 'demo_user'")
            user_id = "demo_user"
        
        # Handle ObjectId if it's a valid ID, otherwise keep as string (for demo_user)
        try:
            uid = ObjectId(user_id)
        except:
            uid = user_id

        interview_session = {
            "user_id": uid,
            "session_id": str(uuid.uuid4()),
            "job_role": job_role,
            "difficulty": difficulty,
            "skills": skills,
            "status": "started",
            "questions": [],
            "answers": [],
            "feedback": None,
            "score": None,
            "started_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "completed_at": None
        }
        
        try:
             interviews_col = db.get_interviews_collection()
        except:
             return jsonify({"success": False, "error": "DB integrity error"}), 503
             
        res = interviews_col.insert_one(interview_session)
        return jsonify({
            "success": True, 
            "message": "Started",
            "interview_id": str(res.inserted_id),
            "session_id": interview_session["session_id"]
        }), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@interview_bp.route("/generate-questions", methods=["POST"])
def generate_interview_questions():
    try:
        data = request.get_json()
        if not data:
             return jsonify({"success": False, "error": "No data"}), 400
        
        resume = data.get("resume_text", "")
        role = data.get("role", "Software Engineer")
        difficulty = data.get("difficulty", "medium")
        
        if not resume.strip():
             return jsonify({"success": False, "error": "resume required"}), 400
        
        try:
            questions = generate_questions(resume, role, difficulty)
            return jsonify({"success": True, "questions": questions}), 200
        except Exception as e:
             return jsonify({"success": False, "error": str(e)}), 500
    except Exception as e:
         return jsonify({"success": False, "error": str(e)}), 500

@interview_bp.route("/submit-feedback", methods=["POST"])
def submit_feedback():
    try:
        data = request.get_json()
        history = data.get("history", [])
        user_id = data.get("user_id")
        interview_id = data.get("interview_id") # Get interview_id
        
        if not history:
             return jsonify({"success": False, "error": "history required"}), 400
        
        feedback_result = grade_interview(history)

        # Extract behavioral metrics (optional)
        behavioral_metrics = data.get("behavioral_metrics", {})
        feedback_result["behavioral_metrics"] = behavioral_metrics

        # Update existing interview if ID provided
        if interview_id:
            try:
                interviews_col = db.get_interviews_collection()
                
                # Update the document
                # UPDATE Normal Interview: Add type="normal"
                interviews_col.update_one(
                    {"_id": ObjectId(interview_id)},
                    {"$set": {
                        "score": feedback_result.get("score", 0),
                        "feedback": feedback_result.get("feedback", ""),
                        "weak_areas": feedback_result.get("weak_areas", []),
                        "behavioral_metrics": behavioral_metrics, 
                        "history": history,
                        "status": "COMPLETED",
                        "type": "normal",  # ADDING TYPE
                        "completed_at": datetime.utcnow()
                    }}
                )
            except Exception as e:
                print(f"Failed to update interview: {e}")
        
        # Fallback: Create new if no ID
        elif user_id:
            try:
                # ... resolving uid omitted for brevity ...
                col = db.get_interviews_collection()
                rec = {
                    "user_id": uid,
                    "date": datetime.utcnow().strftime("%b %d, %Y"),
                    "created_at": datetime.utcnow(),
                    "score": feedback_result.get("score", 0),
                    "feedback": feedback_result.get("feedback", ""),
                    "weak_areas": feedback_result.get("weak_areas", []),
                    "history": history,
                    "status": "COMPLETED",
                    "type": "normal" # ADDING TYPE
                }
                col.insert_one(rec)
            except Exception as e:
                print(f"Failed to save: {e}")

        return jsonify({"success": True, "data": feedback_result}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@interview_bp.route("/history", methods=["GET"])
def get_interview_history():
    try:
        user_id = request.args.get("user_id")
        interview_type = request.args.get("type", "normal") # Default to normal to separate lists

        if not user_id:
             return jsonify({"success": False, "error": "user_id required"}), 400
        
        # Try finding by ObjectId first
        try:
            query_id = ObjectId(user_id)
        except:
            query_id = user_id
            
        col = db.get_interviews_collection()
        
        # Build Query
        query = {
            "$or": [
                {"user_id": query_id},
                {"user_id": user_id} 
            ],
            "status": "COMPLETED"
        }
        
        # Filter by Type
        if interview_type == "beta":
            query["type"] = "beta"
        elif interview_type == "normal":
            # Include records with type="normal" OR missing type (legacy records)
            query["$and"] = [
                {"type": {"$ne": "beta"}} 
            ]
        
        cursor = col.find(query).sort("created_at", -1).limit(10)
        
        history = []
        for doc in cursor:
            history.append({
                "id": str(doc.get("_id")),
                "date": doc.get("date", doc.get("created_at", datetime.utcnow()).strftime("%b %d, %Y")),
                "job_role": doc.get("job_role", "Unknown"),
                "score": doc.get("score", 0),
                "feedback": doc.get("feedback", ""),
                "type": doc.get("type", "normal"),
                "behavioral_metrics": doc.get("behavioral_metrics", {}),
                "avg_attention_score": doc.get("avg_attention_score", 0) # For Beta
            })
            
        return jsonify({"success": True, "history": history}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
