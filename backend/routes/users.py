"""
User Routes
Handle user profile and settings endpoints
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from models import User
from utils.validation import validate_settings_data
from utils.response import success_response, error_response

users_bp = Blueprint('users', __name__)

@users_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user profile"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return error_response('User not found', 404)
        
        return success_response(user.to_dict(), 'Profile retrieved successfully')
        
    except Exception as e:
        return error_response(f'Error retrieving profile: {str(e)}', 500)

@users_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return error_response('User not found', 404)
        
        data = request.get_json()
        
        # Update allowed fields
        if 'firstName' in data:
            user.first_name = data['firstName']
        if 'lastName' in data:
            user.last_name = data['lastName']
        if 'age' in data:
            try:
                age = int(data['age'])
                if 13 <= age <= 120:
                    user.age = age
                else:
                    return error_response('Age must be between 13 and 120', 400)
            except (ValueError, TypeError):
                return error_response('Invalid age value', 400)
        
        db.session.commit()
        
        return success_response(user.to_dict(), 'Profile updated successfully')
        
    except Exception as e:
        db.session.rollback()
        return error_response(f'Error updating profile: {str(e)}', 500)

@users_bp.route('/settings', methods=['GET'])
@jwt_required()
def get_settings():
    """Get user settings"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return error_response('User not found', 404)
        
        settings = {
            'breakInterval': user.break_interval,
            'breakDuration': user.break_duration,
            'notificationsEnabled': user.notifications_enabled,
            'emailAlerts': user.email_alerts,
            'darkMode': user.dark_mode,
        }
        
        return success_response(settings, 'Settings retrieved successfully')
        
    except Exception as e:
        return error_response(f'Error retrieving settings: {str(e)}', 500)

@users_bp.route('/settings', methods=['PUT'])
@jwt_required()
def update_settings():
    """Update user settings"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return error_response('User not found', 404)
        
        data = request.get_json()
        
        # Validate settings data
        is_valid, errors = validate_settings_data(data)
        if not is_valid:
            return error_response('Validation failed', 400, errors)
        
        # Update settings
        if 'breakInterval' in data:
            user.break_interval = int(data['breakInterval'])
        if 'breakDuration' in data:
            user.break_duration = int(data['breakDuration'])
        if 'notificationsEnabled' in data:
            user.notifications_enabled = data['notificationsEnabled']
        if 'emailAlerts' in data:
            user.email_alerts = data['emailAlerts']
        if 'darkMode' in data:
            user.dark_mode = data['darkMode']
        
        db.session.commit()
        
        settings = {
            'breakInterval': user.break_interval,
            'breakDuration': user.break_duration,
            'notificationsEnabled': user.notifications_enabled,
            'emailAlerts': user.email_alerts,
            'darkMode': user.dark_mode,
        }
        
        return success_response(settings, 'Settings updated successfully')
        
    except Exception as e:
        db.session.rollback()
        return error_response(f'Error updating settings: {str(e)}', 500)

@users_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user password"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return error_response('User not found', 404)
        
        data = request.get_json()
        
        if not data.get('currentPassword') or not data.get('newPassword'):
            return error_response('Current and new password required', 400)
        
        # Verify current password
        if not user.check_password(data['currentPassword']):
            return error_response('Current password is incorrect', 401)
        
        # Set new password
        user.set_password(data['newPassword'])
        db.session.commit()
        
        return success_response({}, 'Password changed successfully')
        
    except Exception as e:
        db.session.rollback()
        return error_response(f'Error changing password: {str(e)}', 500)

@users_bp.route('/delete', methods=['POST'])
@jwt_required()
def delete_account():
    """Delete user account"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return error_response('User not found', 404)
        
        # Verify password before deletion
        data = request.get_json()
        if not data.get('password'):
            return error_response('Password required for account deletion', 400)
        
        if not user.check_password(data['password']):
            return error_response('Incorrect password', 401)
        
        # Delete user and all related data
        db.session.delete(user)
        db.session.commit()
        
        return success_response({}, 'Account deleted successfully')
        
    except Exception as e:
        db.session.rollback()
        return error_response(f'Error deleting account: {str(e)}', 500)
