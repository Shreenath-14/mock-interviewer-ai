from flask import Blueprint, jsonify
from services.voice_service import generate_audio_url

voice_bp = Blueprint('voice', __name__)

@voice_bp.route('/test', methods=['GET'])
def test_voice():
    """
    Generate a sample audio file for testing the voice.
    """
    try:
        text = "Hello! I am your AI recruiter. I am ready to begin."
        audio_url = generate_audio_url(text)
        
        if not audio_url:
            return jsonify({"success": False, "error": "Failed to generate audio"}), 500
            
        return jsonify({
            "success": True, 
            "audio_url": audio_url
        })
    except Exception as e:
        print(f"Error in voice test: {e}")
        return jsonify({"success": False, "error": str(e)}), 500
