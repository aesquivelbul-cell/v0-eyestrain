"""
Predictions Routes
Handle ML model predictions and risk assessment
"""

from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from models import RiskPrediction, DailyLog
from utils.response import success_response, error_response
from datetime import date, timedelta
import json

predictions_bp = Blueprint('predictions', __name__)

@predictions_bp.route('', methods=['GET'])
@jwt_required()
def get_predictions():
    """Get all predictions for user"""
    try:
        user_id = get_jwt_identity()
        
        # Pagination
        page = request.args.get('page', 1, type=int)
        page_size = request.args.get('pageSize', 10, type=int)
        
        query = RiskPrediction.query.filter_by(user_id=user_id).order_by(
            RiskPrediction.prediction_date.desc()
        )
        
        total = query.count()
        predictions = query.offset((page - 1) * page_size).limit(page_size).all()
        
        data = [p.to_dict() for p in predictions]
        
        return success_response({
            'predictions': data,
            'pagination': {
                'total': total,
                'page': page,
                'pageSize': page_size,
                'totalPages': (total + page_size - 1) // page_size,
            }
        }, 'Predictions retrieved successfully')
        
    except Exception as e:
        return error_response(f'Error retrieving predictions: {str(e)}', 500)

@predictions_bp.route('/today', methods=['GET'])
@jwt_required()
def get_today_prediction():
    """Get today's prediction"""
    try:
        user_id = get_jwt_identity()
        prediction = RiskPrediction.query.filter_by(
            user_id=user_id,
            prediction_date=date.today()
        ).first()
        
        if not prediction:
            return error_response('No prediction available for today', 404)
        
        return success_response(prediction.to_dict(), 'Prediction retrieved successfully')
        
    except Exception as e:
        return error_response(f'Error retrieving prediction: {str(e)}', 500)

@predictions_bp.route('/tomorrow', methods=['GET'])
@jwt_required()
def get_tomorrow_prediction():
    """Get tomorrow's prediction"""
    try:
        user_id = get_jwt_identity()
        tomorrow = date.today() + timedelta(days=1)
        
        prediction = RiskPrediction.query.filter_by(
            user_id=user_id,
            prediction_date=tomorrow
        ).first()
        
        if not prediction:
            return error_response('No prediction available for tomorrow', 404)
        
        return success_response(prediction.to_dict(), 'Prediction retrieved successfully')
        
    except Exception as e:
        return error_response(f'Error retrieving prediction: {str(e)}', 500)

@predictions_bp.route('/week', methods=['GET'])
@jwt_required()
def get_week_prediction():
    """Get 7-day forecast"""
    try:
        user_id = get_jwt_identity()
        start_date = date.today()
        end_date = start_date + timedelta(days=7)
        
        predictions = RiskPrediction.query.filter(
            RiskPrediction.user_id == user_id,
            RiskPrediction.prediction_date.between(start_date, end_date)
        ).order_by(RiskPrediction.prediction_date).all()
        
        data = [p.to_dict() for p in predictions]
        
        return success_response({
            'predictions': data,
            'count': len(data),
        }, 'Week forecast retrieved successfully')
        
    except Exception as e:
        return error_response(f'Error retrieving forecast: {str(e)}', 500)

@predictions_bp.route('/refresh', methods=['POST'])
@jwt_required()
def refresh_predictions():
    """
    Trigger model training and prediction refresh
    This would call the ML pipeline to generate new predictions
    """
    try:
        user_id = get_jwt_identity()
        
        # TODO: Implement ML model training and prediction
        # For now, return a placeholder response
        
        return success_response({
            'status': 'Processing',
            'message': 'Model retraining started. Predictions will be updated shortly.',
        }, 'Refresh initiated', 202)
        
    except Exception as e:
        return error_response(f'Error refreshing predictions: {str(e)}', 500)

@predictions_bp.route('/<prediction_id>', methods=['GET'])
@jwt_required()
def get_prediction(prediction_id):
    """Get specific prediction"""
    try:
        user_id = get_jwt_identity()
        prediction = RiskPrediction.query.filter_by(
            id=prediction_id,
            user_id=user_id
        ).first()
        
        if not prediction:
            return error_response('Prediction not found', 404)
        
        return success_response(prediction.to_dict(), 'Prediction retrieved successfully')
        
    except Exception as e:
        return error_response(f'Error retrieving prediction: {str(e)}', 500)
