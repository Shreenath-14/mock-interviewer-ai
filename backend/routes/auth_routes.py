from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from db import db
from bson import ObjectId
from datetime import datetime

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    """
    Register a new user.
    Expected JSON body:
    {
        "full_name": "John Doe",
        "email": "john@example.com",
        "password": "securepassword123",
        "skills": ["Python", "React", "JavaScript"]
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ["full_name", "email", "password"]
        for field in required_fields:
            if not data or field not in data:
                return jsonify({
                    "success": False,
                    "error": f"Missing required field: {field}"
                }), 400
        
        full_name = data.get("full_name")
        email = data.get("email").lower().strip()
        password = data.get("password")
        skills = data.get("skills", [])
        
        # Validate email format (basic check)
        if "@" not in email or "." not in email:
            return jsonify({
                "success": False,
                "error": "Invalid email format"
            }), 400
        
        # Validate password length
        if len(password) < 6:
            return jsonify({
                "success": False,
                "error": "Password must be at least 6 characters long"
            }), 400
        
        # Check database connection
        try:
            users_col = db.get_users_collection()
        except ConnectionError as e:
            return jsonify({
                "success": False,
                "error": "Database connection not available. Please check server configuration."
            }), 503
        
        # Check if user already exists
        existing_user = users_col.find_one({"email": email})
        if existing_user:
            return jsonify({
                "success": False,
                "error": "User with this email already exists"
            }), 409
        
        # Hash password
        hashed_password = generate_password_hash(password)
        
        # Create new user document
        new_user = {
            "full_name": full_name,
            "email": email,
            "password": hashed_password,
            "skills": skills if isinstance(skills, list) else [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Insert user into database
        result = users_col.insert_one(new_user)
        
        return jsonify({
            "success": True,
            "message": "User registered successfully",
            "user_id": str(result.inserted_id)
        }), 201
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Registration failed: {str(e)}"
        }), 500

@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Login an existing user.
    Expected JSON body:
    {
        "email": "john@example.com",
        "password": "securepassword123"
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or "email" not in data or "password" not in data:
            return jsonify({
                "success": False,
                "error": "Email and password are required"
            }), 400
        
        email = data.get("email").lower().strip()
        password = data.get("password")
        
        # Check database connection
        try:
            users_col = db.get_users_collection()
        except ConnectionError as e:
            return jsonify({
                "success": False,
                "error": "Database connection not available. Please check server configuration."
            }), 503
        
        # Find user by email
        user = users_col.find_one({"email": email})
        if not user:
            return jsonify({
                "success": False,
                "error": "Invalid email or password"
            }), 401
        
        # Verify password
        if not check_password_hash(user["password"], password):
            return jsonify({
                "success": False,
                "error": "Invalid email or password"
            }), 401
        
        # Return user data (excluding password)
        user_data = {
            "user_id": str(user["_id"]),
            "full_name": user["full_name"],
            "email": user["email"],
            "skills": user.get("skills", [])
        }
        
        return jsonify({
            "success": True,
            "message": "Login successful",
            "user": user_data
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Login failed: {str(e)}"
        }), 500

@auth_bp.route("/profile", methods=["PUT"])
def update_profile():
    try:
        data = request.get_json()
        user_id = data.get("user_id")
        
        if not user_id:
            return jsonify({"success": False, "error": "User ID required"}), 400
            
        updates = {}
        
        if "full_name" in data:
            updates["full_name"] = data["full_name"]
            
        if "skills" in data:
            updates["skills"] = data["skills"]
            
        if "password" in data and data["password"]:
            if len(data["password"]) < 6:
                return jsonify({"success": False, "error": "Password too short"}), 400
            updates["password"] = generate_password_hash(data["password"])
            
        if not updates:
            return jsonify({"success": False, "error": "No updates provided"}), 400
            
        updates["updated_at"] = datetime.utcnow()
        
        users_col = db.get_users_collection()
        result = users_col.find_one_and_update(
            {"_id": ObjectId(user_id)},
            {"$set": updates},
            return_document=True
        )
        
        if not result:
            return jsonify({"success": False, "error": "User not found"}), 404
            
        # Return updated user data (excluding password)
        user_data = {
            "user_id": str(result["_id"]),
            "full_name": result["full_name"],
            "email": result["email"],
            "skills": result.get("skills", [])
        }
        
        return jsonify({
            "success": True,
            "message": "Profile updated successfully",
            "user": user_data
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
