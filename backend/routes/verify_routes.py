from flask import Blueprint, request, jsonify
from db import db
from bson import ObjectId
from datetime import datetime
import uuid
from services.ai_service import generate_questions, grade_interview

interview_bp = Blueprint("interviews", __name__)

@interview_bp.route("/start", methods=["POST"])
def start_interview():
    """
    Start a new interview session.
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or "user_id" not in data:
            return jsonify({
                "success": False,
                "error": "user_id is required"
            }), 400
        
        user_id = data.get("user_id")
        job_role = data.get("job_role", "Software Engineer")
        difficulty = data.get("difficulty", "medium")
        skills = data.get("skills", [])
        
        # Validate user_id format
        try:
            ObjectId(user_id)
        except Exception:
            return jsonify({
                "success": False,
                "error": "Invalid user_id format"
            }), 400
        
        # Check database connection and verify user exists
        try:
            users_col = db.get_users_collection()
        except ConnectionError as e:
            return jsonify({
                "success": False,
                "error": "Database connection not available. Please check server configuration."
            }), 503
        
        user = users_col.find_one({"_id": ObjectId(user_id)})
        if not user:
            return jsonify({
                "success": False,
                "error": "User not found"
            }), 404
        
        # Validate difficulty
        valid_difficulties = ["easy", "medium", "hard"]
        if difficulty not in valid_difficulties:
            return jsonify({
                "success": False,
                "error": f"Difficulty must be one of: {', '.join(valid_difficulties)}"
            }), 400
        
        # Check database connection for interviews collection
        try:
            interviews_col = db.get_interviews_collection()
        except ConnectionError as e:
            return jsonify({
                "success": False,
                "error": "Database connection not available. Please check server configuration."
            }), 503
        
        # Create new interview session
        interview_session = {
            "user_id": ObjectId(user_id),
            "session_id": str(uuid.uuid4()),
            "job_role": job_role,
            "difficulty": difficulty,
            "skills": skills if isinstance(skills, list) else [],
            "status": "started",
            "questions": [],
            "answers": [],
            "feedback": None,
            "score": None,
            "started_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "completed_at": None
        }
        
        # Insert interview session into database
        result = interviews_col.insert_one(interview_session)
        
        return jsonify({
            "success": True,
            "message": "Interview session started successfully",
            "interview_id": str(result.inserted_id),
            "session_id": interview_session["session_id"],
            "job_role": job_role,
            "difficulty": difficulty
        }), 201
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Failed to start interview: {str(e)}"
        }), 500

@interview_bp.route("/generate-questions", methods=["POST"])
def generate_interview_questions():
    """
    Generate interview questions using AI.
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data:
            return jsonify({
                "success": False,
                "error": "Request body is required"
            }), 400
        
        resume_text = data.get("resume_text", "")
        role = data.get("role", "Software Engineer")
        
        # Validate that resume_text is provided
        if not resume_text or not resume_text.strip():
            return jsonify({
                "success": False,
                "error": "resume_text is required"
            }), 400
        
        # Validate role
        if not role or not role.strip():
            return jsonify({
                "success": False,
                "error": "role is required"
            }), 400
        
        # Generate questions using AI service
        try:
            questions = generate_questions(resume_text, role)
            
            return jsonify({
                "success": True,
                "message": "Questions generated successfully",
                "questions": questions,
                "count": len(questions)
            }), 200
            
        except ValueError as e:
            # API key not configured
            return jsonify({
                "success": False,
                "error": f"AI service configuration error: {str(e)}"
            }), 503
            
        except Exception as e:
            # Other AI service errors
            print(f"❌ Error generating questions: {e}")
            return jsonify({
                "success": False,
                "error": f"Failed to generate questions: {str(e)}"
            }), 500
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Request processing failed: {str(e)}"
        }), 500


@interview_bp.route("/submit-feedback", methods=["POST"])
def submit_feedback():
    """
    Generate feedback and save history.
    """
    try:
        data = request.get_json()
        
        if not data or "history" not in data:
            return jsonify({
                "success": False,
                "error": "history is required"
            }), 400
            
        history = data.get("history", [])
        user_id = data.get("user_id")
        job_role = data.get("job_role", "Software Engineer")
        
        if not history:
             return jsonify({
                "success": False,
                "error": "history cannot be empty"
            }), 400
            
        feedback_result = grade_interview(history)
        
        # Save to database if user_id is provided
        if user_id:
            try:
                # Handle valid ObjectId
                uid = user_id
                try:
                    uid = ObjectId(user_id)
                except:
                    pass
                    
                interviews_col = db.get_interviews_collection()
                interview_record = {
                    "user_id": uid,
                    "job_role": job_role,
                    "date": datetime.utcnow().strftime("%b %d, %Y"),
                    "created_at": datetime.utcnow(),
                    "score": feedback_result.get("score", 0),
                    "feedback": feedback_result.get("feedback", ""),
                    "weak_areas": feedback_result.get("weak_areas", []),
                    "history": history,
                    "status": "COMPLETED"
                }
                interviews_col.insert_one(interview_record)
            except Exception as db_err:
                print(f"⚠️ Failed to save interview history: {db_err}")
        
        return jsonify({
            "success": True,
            "data": feedback_result
        }), 200
        
    except Exception as e:
        print(f"❌ Error submitting feedback: {e}")
        return jsonify({
            "success": False,
            "error": "Failed to generate feedback"
        }), 500

@interview_bp.route("/history", methods=["GET"])
def get_interview_history():
    """
    Get interview history for a user.
    """
    try:
        user_id = request.args.get("user_id")
        if not user_id:
            return jsonify({"success": False, "error": "user_id is required"}), 400
            
        try:
            uid = ObjectId(user_id)
        except:
            uid = user_id
            
        interviews_col = db.get_interviews_collection()
        # Find interviews for this user, sort by created_at desc
        cursor = interviews_col.find({"user_id": uid}).sort("created_at", -1)
        
        history = []
        for doc in cursor:
            history.append({
                "id": str(doc.get("_id")),
                "date": doc.get("date", "Unknown Date"),
                "job_role": doc.get("job_role", "Unknown Role"),
                "score": doc.get("score", 0),
                "feedback": doc.get("feedback", "")
            })
            
        return jsonify({
            "success": True,
            "count": len(history),
            "history": history
        }), 200
