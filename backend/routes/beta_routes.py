from flask import Blueprint, request, jsonify
from services.ai_service import generate_beta_intro, generate_beta_turn
from services.voice_service import generate_audio_url

beta_bp = Blueprint('beta', __name__)

@beta_bp.route('/intro', methods=['POST'])
def get_intro():
    try:
        data = request.json
        company = data.get('company', 'TechCorp')
        role = data.get('role', 'Software Engineer')
        resume_text = data.get('resume_text', '')
        
        user_name = data.get('user_name', 'Candidate')
        
        result = generate_beta_intro(company, role, resume_text)
        
        # Force Name Prepend
        if "audio_text" in result:
              # Fallback Name Logic
             candidate_name = result.get('candidate_name')
             print(f"📄 Name from Resume: {candidate_name}")
             
             # Force the Setup Page name to be the primary name
             final_name = user_name if user_name else (candidate_name if candidate_name != "Unknown" else "Candidate")
             print(f"✅ Final Identity Confirmed: {final_name}")
             
             final_speech_text = f"Hello {final_name}. {result['audio_text']}"
             result["audio_url"] = generate_audio_url(final_speech_text)
             # Update text to match audio
             result["audio_text"] = final_speech_text
             result["candidate_name"] = final_name
             
        return jsonify({"success": True, "data": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@beta_bp.route('/turn', methods=['POST'])
def next_turn():
    try:
        data = request.json
        history = data.get('history', [])
        current_question = data.get('current_question', '')
        user_answer = data.get('user_answer', '')
        candidate_name = data.get('candidate_name', 'Candidate')
        
        # Check Turn Limit (5 questions x 2 = 10 items)
        force_end = len(history) >= 10
        result = generate_beta_turn(history, current_question, user_answer, candidate_name=candidate_name, force_end=force_end)
        
        if force_end:
            result['is_interview_over'] = True
        
        # Generate Audio for Reaction + Next Question
        if "reaction" in result and "next_question" in result:
             full_text = f"{result['reaction']} ... {result['next_question']}"
             result["audio_url"] = generate_audio_url(full_text)
             
        return jsonify({"success": True, "data": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
@beta_bp.route('/end', methods=['POST'])
def end_interview():
    try:
        data = request.json
        history = data.get('history', [])
        # Default empty dict if missing
        emotion_stats = data.get('emotion_stats', {}) 
        # Default 0 if missing
        avg_attention = data.get('avg_attention_score', 0)
        user_id = data.get('user_id')
        
        # Call the new multimodal grading function
        from services.ai_service import grade_beta_interview
        report = grade_beta_interview(history, emotion_stats, avg_attention)
        
        # Save to DB
        if user_id:
            try:
                from db import db
                from bson import ObjectId
                from datetime import datetime
                
                uid = user_id
                try:
                    uid = ObjectId(user_id)
                except:
                    pass
                
                col = db.get_interviews_collection()
                
                # Determine Role/Company from history if possible, or default
                # (For now we rely on pure defaults or what's stored in session if we had it, 
                # but Beta is stateless mostly. We'll label it "Beta Interview")
                
                score_val = report.get('scores', {}).get('overall', 0)
                feedback_val = report.get('mood_analysis', '')
                
                rec = {
                    "user_id": uid,
                    "job_role": "Beta Interview", # Tag it as Beta
                    "date": datetime.utcnow().strftime("%b %d, %Y"),
                    "created_at": datetime.utcnow(),
                    "score": score_val,
                    "feedback": f"Confidence: {report['scores']['confidence']}%. {feedback_val}",
                    "weak_areas": report.get('improvement_suggestions', []),
                    "history": history,
                    "status": "COMPLETED",
                    "type": "beta"
                }
                col.insert_one(rec)
                print("✅ Beta Interview Saved to History")
            except Exception as dbe:
                print(f"⚠️ Failed to save Beta history: {dbe}")
        
        return jsonify({"success": True, "report": report})
    except Exception as e:
        print(f"Error ending interview: {e}")
        return jsonify({"success": False, "error": str(e)}), 500
