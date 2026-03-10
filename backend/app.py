from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from db import db

load_dotenv()

def create_app():
    """
    Factory function to create and configure the Flask app.
    """
    app = Flask(__name__)
    
    # Configure CORS to allow requests from frontend
    CORS(app, origins=["http://localhost:5173"])
    
    # Initialize database connection
    try:
        db.connect()
    except Exception as e:
        print(f"Warning: Database connection failed: {e}")
        print("Make sure MONGO_URI is set in your .env file")
    
    # Register blueprints
    from routes.auth_routes import auth_bp
    from routes.interview_routes import interview_bp
    from routes.resume_routes import resume_bp
    from routes.test_routes import test_bp
    from routes.beta_routes import beta_bp
    from routes.voice_routes import voice_bp
    
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(interview_bp, url_prefix="/api/interviews")
    app.register_blueprint(resume_bp, url_prefix="/api/resume")
    app.register_blueprint(test_bp, url_prefix="/api/test")
    app.register_blueprint(beta_bp, url_prefix="/api/beta")
    app.register_blueprint(voice_bp, url_prefix="/api/voice")
    
    @app.route("/", methods=["GET"])
    def root():
        """Root endpoint with API information"""
        return {
            "message": "Mock Interviewer API",
            "version": "1.0.0",
            "endpoints": {
                "health": "/api/health",
                "auth": {
                    "register": "POST /api/auth/register",
                    "login": "POST /api/auth/login"
                },
                "interviews": {
                    "start": "POST /api/interviews/start",
                    "generate-questions": "POST /api/interviews/generate-questions"
                }
            }
        }, 200
    
    @app.route("/api/health", methods=["GET"])
    def health_check():
        """Health check endpoint"""
        return {"status": "ok", "message": "Backend is running"}, 200
    
    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)

