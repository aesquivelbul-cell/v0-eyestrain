"""
Authentication Routes
Handle user registration, login, and token management
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from app import db
from models import User, AuditLog
from utils.validation import validate_email, validate_password
from utils.response import success_response, error_response

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    User registration endpoint
    Expected JSON:
    {
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "age": 22,
        "password": "secure_password"
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'firstName', 'lastName', 'age', 'password']
        if not all(field in data for field in required_fields):
            return error_response('Missing required fields', 400)
        
        # Validate email
        if not validate_email(data['email']):
            return error_response('Invalid email format', 400)
        
        # Validate password
        password_error = validate_password(data['password'])
        if password_error:
            return error_response(password_error, 400)
        
        # Check if user exists
        if User.query.filter_by(email=data['email']).first():
            return error_response('Email already registered', 409)
        
        # Validate age
        try:
            age = int(data['age'])
            if age < 13 or age > 120:
                return error_response('Age must be between 13 and 120', 400)
        except (ValueError, TypeError):
            return error_response('Invalid age value', 400)
        
        # Create new user
        user = User(
            email=data['email'],
            first_name=data['firstName'],
            last_name=data['lastName'],
            age=age
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        # Log the action
        audit_log = AuditLog(
            user_id=user.id,
            action='register',
            resource='user',
            resource_id=user.id,
            status='success'
        )
        db.session.add(audit_log)
        db.session.commit()
        
        # Generate tokens
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        return success_response({
            'user': user.to_dict(),
            'accessToken': access_token,
            'refreshToken': refresh_token,
        }, 'User registered successfully', 201)
        
    except Exception as e:
        db.session.rollback()
        return error_response(f'Registration error: {str(e)}', 500)

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    User login endpoint
    Expected JSON:
    {
        "email": "user@example.com",
        "password": "secure_password"
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('email') or not data.get('password'):
            return error_response('Email and password required', 400)
        
        # Find user
        user = User.query.filter_by(email=data['email']).first()
        
        if not user or not user.check_password(data['password']):
            return error_response('Invalid email or password', 401)
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Log the action
        audit_log = AuditLog(
            user_id=user.id,
            action='login',
            resource='user',
            resource_id=user.id,
            status='success'
        )
        db.session.add(audit_log)
        db.session.commit()
        
        # Generate tokens
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        return success_response({
            'user': user.to_dict(),
            'accessToken': access_token,
            'refreshToken': refresh_token,
        }, 'Logged in successfully')
        
    except Exception as e:
        db.session.rollback()
        return error_response(f'Login error: {str(e)}', 500)

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """
    Refresh access token using refresh token
    """
    try:
        identity = get_jwt_identity()
        access_token = create_access_token(identity=identity)
        
        return success_response({
            'accessToken': access_token,
        }, 'Token refreshed successfully')
        
    except Exception as e:
        return error_response(f'Token refresh error: {str(e)}', 500)

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """
    Logout endpoint
    Logs the logout action
    """
    try:
        user_id = get_jwt_identity()
        
        # Log the action
        audit_log = AuditLog(
            user_id=user_id,
            action='logout',
            resource='user',
            resource_id=user_id,
            status='success'
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return success_response({}, 'Logged out successfully')
        
    except Exception as e:
        db.session.rollback()
        return error_response(f'Logout error: {str(e)}', 500)

@auth_bp.route('/verify', methods=['GET'])
@jwt_required()
def verify():
    """
    Verify JWT token and get user info
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return error_response('User not found', 404)
        
        return success_response({
            'user': user.to_dict(),
        }, 'Token verified')
        
    except Exception as e:
        return error_response(f'Verification error: {str(e)}', 500)
