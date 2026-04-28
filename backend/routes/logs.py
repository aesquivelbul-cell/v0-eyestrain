"""
Daily Logs Routes
Handle daily health log endpoints
"""

from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date
from app import db
from models import DailyLog
from utils.validation import validate_daily_log_data
from utils.response import success_response, error_response, paginated_response

logs_bp = Blueprint('logs', __name__)

@logs_bp.route('', methods=['GET'])
@jwt_required()
def get_logs():
    """
    Get all daily logs for user with pagination
    Query parameters:
    - page: Page number (default: 1)
    - pageSize: Items per page (default: 10)
    - startDate: Filter by start date (ISO format)
    - endDate: Filter by end date (ISO format)
    """
    try:
        user_id = get_jwt_identity()
        
        # Pagination
        page = request.args.get('page', 1, type=int)
        page_size = request.args.get('pageSize', 10, type=int)
        
        if page < 1 or page_size < 1 or page_size > 100:
            return error_response('Invalid pagination parameters', 400)
        
        # Build query
        query = DailyLog.query.filter_by(user_id=user_id)
        
        # Filter by date range if provided
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')
        
        if start_date:
            try:
                start = datetime.fromisoformat(start_date).date()
                query = query.filter(DailyLog.logged_date >= start)
            except ValueError:
                return error_response('Invalid startDate format', 400)
        
        if end_date:
            try:
                end = datetime.fromisoformat(end_date).date()
                query = query.filter(DailyLog.logged_date <= end)
            except ValueError:
                return error_response('Invalid endDate format', 400)
        
        # Order by date descending
        query = query.order_by(DailyLog.logged_date.desc())
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        logs = query.offset((page - 1) * page_size).limit(page_size).all()
        
        data = [log.to_dict() for log in logs]
        
        return paginated_response(data, total, page, page_size, 'Logs retrieved successfully')
        
    except Exception as e:
        return error_response(f'Error retrieving logs: {str(e)}', 500)

@logs_bp.route('/<log_id>', methods=['GET'])
@jwt_required()
def get_log(log_id):
    """Get specific daily log"""
    try:
        user_id = get_jwt_identity()
        log = DailyLog.query.filter_by(id=log_id, user_id=user_id).first()
        
        if not log:
            return error_response('Log not found', 404)
        
        return success_response(log.to_dict(), 'Log retrieved successfully')
        
    except Exception as e:
        return error_response(f'Error retrieving log: {str(e)}', 500)

@logs_bp.route('', methods=['POST'])
@jwt_required()
def create_log():
    """
    Create new daily log
    Expected JSON:
    {
        "screenTimeHours": 7.5,
        "breaksTaken": 5,
        "eyeStrainLevel": 2,
        "headachesLevel": 1,
        "blurryVisionLevel": 0,
        "dryEyesLevel": 2,
        "screenBrightness": 75,
        "notes": "Optional notes",
        "loggedDate": "2024-04-28"
    }
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate data
        is_valid, errors = validate_daily_log_data(data)
        if not is_valid:
            return error_response('Validation failed', 400, errors)
        
        # Parse logged date
        logged_date = date.today()
        if 'loggedDate' in data:
            try:
                logged_date = datetime.fromisoformat(data['loggedDate']).date()
            except ValueError:
                return error_response('Invalid loggedDate format', 400)
        
        # Check if log for this date exists
        existing = DailyLog.query.filter_by(
            user_id=user_id,
            logged_date=logged_date
        ).first()
        
        if existing:
            return error_response('Log already exists for this date', 409)
        
        # Create log
        log = DailyLog(
            user_id=user_id,
            screen_time_hours=float(data['screenTimeHours']),
            breaks_taken=int(data.get('breaksTaken', 0)),
            eye_strain_level=int(data['eyeStrainLevel']),
            headaches_level=int(data['headachesLevel']),
            blurry_vision_level=int(data['blurryVisionLevel']),
            dry_eyes_level=int(data['dryEyesLevel']),
            screen_brightness=int(data.get('screenBrightness', 75)),
            notes=data.get('notes'),
            logged_date=logged_date,
        )
        
        db.session.add(log)
        db.session.commit()
        
        return success_response(log.to_dict(), 'Log created successfully', 201)
        
    except Exception as e:
        db.session.rollback()
        return error_response(f'Error creating log: {str(e)}', 500)

@logs_bp.route('/<log_id>', methods=['PUT'])
@jwt_required()
def update_log(log_id):
    """Update existing daily log"""
    try:
        user_id = get_jwt_identity()
        log = DailyLog.query.filter_by(id=log_id, user_id=user_id).first()
        
        if not log:
            return error_response('Log not found', 404)
        
        data = request.get_json()
        
        # Validate data
        is_valid, errors = validate_daily_log_data(data)
        if not is_valid:
            return error_response('Validation failed', 400, errors)
        
        # Update fields
        if 'screenTimeHours' in data:
            log.screen_time_hours = float(data['screenTimeHours'])
        if 'breaksTaken' in data:
            log.breaks_taken = int(data['breaksTaken'])
        if 'eyeStrainLevel' in data:
            log.eye_strain_level = int(data['eyeStrainLevel'])
        if 'headachesLevel' in data:
            log.headaches_level = int(data['headachesLevel'])
        if 'blurryVisionLevel' in data:
            log.blurry_vision_level = int(data['blurryVisionLevel'])
        if 'dryEyesLevel' in data:
            log.dry_eyes_level = int(data['dryEyesLevel'])
        if 'screenBrightness' in data:
            log.screen_brightness = int(data['screenBrightness'])
        if 'notes' in data:
            log.notes = data['notes']
        
        log.updated_at = datetime.utcnow()
        db.session.commit()
        
        return success_response(log.to_dict(), 'Log updated successfully')
        
    except Exception as e:
        db.session.rollback()
        return error_response(f'Error updating log: {str(e)}', 500)

@logs_bp.route('/<log_id>', methods=['DELETE'])
@jwt_required()
def delete_log(log_id):
    """Delete daily log"""
    try:
        user_id = get_jwt_identity()
        log = DailyLog.query.filter_by(id=log_id, user_id=user_id).first()
        
        if not log:
            return error_response('Log not found', 404)
        
        db.session.delete(log)
        db.session.commit()
        
        return success_response({}, 'Log deleted successfully')
        
    except Exception as e:
        db.session.rollback()
        return error_response(f'Error deleting log: {str(e)}', 500)
