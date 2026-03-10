from flask import Blueprint, request, jsonify
from services.resume_parser import extract_text_from_pdf
from services.ai_service import review_resume
import io

resume_bp = Blueprint("resume", __name__)

@resume_bp.route("/upload", methods=["POST"])
def upload_resume():
    """
    Upload and review a resume PDF.
    Expects 'resume' file in multipart/form-data.
    """
    try:
        if 'resume' not in request.files:
            return jsonify({"success": False, "error": "No file part"}), 400
            
        file = request.files['resume']
        
        if file.filename == '':
            return jsonify({"success": False, "error": "No selected file"}), 400
            
        if not file.filename.lower().endswith('.pdf'):
            return jsonify({"success": False, "error": "Only PDF files are supported"}), 400

        # Read file into memory
        file_stream = io.BytesIO(file.read())
        
        # Extract text
        try:
            resume_text = extract_text_from_pdf(file_stream)
        except Exception as e:
            return jsonify({"success": False, "error": "Failed to extract text from PDF"}), 500
            
        if not resume_text.strip():
             return jsonify({"success": False, "error": "Could not extract any text from the PDF. It might be an image-only PDF."}), 400

        # Review with AI
        review_result = review_resume(resume_text)
        
        return jsonify({
            "success": True,
            "data": review_result
        }), 200

    except Exception as e:
        print(f"❌ Error in resume upload: {e}")
        return jsonify({"success": False, "error": str(e)}), 500
