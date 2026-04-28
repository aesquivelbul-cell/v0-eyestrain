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
    Generate predictions using ML models based on user's recent daily logs
    """
    try:
        user_id = get_jwt_identity()
        
        # Import ML predictor from app
        from app import ml_predictor
        
        if ml_predictor is None:
            return error_response('ML models not available', 503)
        
        # Get user's recent daily logs (last 7 days)
        end_date = date.today()
        start_date = end_date - timedelta(days=7)
        
        recent_logs = DailyLog.query.filter(
            DailyLog.user_id == user_id,
            DailyLog.log_date.between(start_date, end_date)
        ).all()
        
        if not recent_logs:
            return error_response('No daily logs found for prediction', 404)
        
        # Convert to dictionaries for ML model
        log_dicts = [log.to_dict() for log in recent_logs]
        
        # Generate predictions
        try:
            # Today's prediction
            if recent_logs:
                today_pred = ml_predictor.predict_today(log_dicts[-1])
                
                # Save or update today's prediction
                existing_pred = RiskPrediction.query.filter_by(
                    user_id=user_id,
                    prediction_date=date.today()
                ).first()
                
                if existing_pred:
                    existing_pred.risk_level = today_pred['risk_level']
                    existing_pred.risk_percentage = today_pred['risk_percentage']
                    existing_pred.fatigue_score = today_pred['fatigue_score']
                    existing_pred.recommendations = json.dumps(today_pred['recommendations'])
                else:
                    existing_pred = RiskPrediction(
                        user_id=user_id,
                        prediction_date=date.today(),
                        risk_level=today_pred['risk_level'],
                        risk_percentage=today_pred['risk_percentage'],
                        fatigue_score=today_pred['fatigue_score'],
                        recommendations=json.dumps(today_pred['recommendations']),
                    )
                    db.session.add(existing_pred)
            
            # Tomorrow's prediction
            tomorrow_pred = ml_predictor.predict_tomorrow(log_dicts)
            
            existing_tomorrow = RiskPrediction.query.filter_by(
                user_id=user_id,
                prediction_date=date.today() + timedelta(days=1)
            ).first()
            
            if existing_tomorrow:
                existing_tomorrow.risk_level = tomorrow_pred['risk_level']
                existing_tomorrow.risk_percentage = tomorrow_pred['risk_percentage']
                existing_tomorrow.fatigue_score = tomorrow_pred['fatigue_score']
                existing_tomorrow.recommendations = json.dumps(tomorrow_pred['recommendations'])
            else:
                existing_tomorrow = RiskPrediction(
                    user_id=user_id,
                    prediction_date=date.today() + timedelta(days=1),
                    risk_level=tomorrow_pred['risk_level'],
                    risk_percentage=tomorrow_pred['risk_percentage'],
                    fatigue_score=tomorrow_pred['fatigue_score'],
                    recommendations=json.dumps(tomorrow_pred['recommendations']),
                )
                db.session.add(existing_tomorrow)
            
            db.session.commit()
            
            return success_response({
                'status': 'Success',
                'message': 'Predictions generated successfully',
                'predictions': {
                    'today': today_pred if recent_logs else None,
                    'tomorrow': tomorrow_pred,
                }
            }, 'Predictions refreshed')
            
        except Exception as ml_error:
            db.session.rollback()
            return error_response(f'ML prediction error: {str(ml_error)}', 500)
        
    except Exception as e:
        db.session.rollback()
        return error_response(f'Error refreshing predictions: {str(e)}', 500)

@predictions_bp.route('/insights', methods=['GET'])
@jwt_required()
def get_insights():
    """Get ML-generated insights from daily logs"""
    try:
        user_id = get_jwt_identity()
        
        # Import ML predictor from app
        from app import ml_predictor
        
        if ml_predictor is None:
            return error_response('ML models not available', 503)
        
        # Get time period from query params (default to last 30 days)
        days = request.args.get('days', 30, type=int)
        days = min(days, 90)  # Cap at 90 days
        
        end_date = date.today()
        start_date = end_date - timedelta(days=days)
        
        # Get daily logs for the period
        logs = DailyLog.query.filter(
            DailyLog.user_id == user_id,
            DailyLog.log_date.between(start_date, end_date)
        ).all()
        
        if not logs:
            return error_response('No daily logs found for insights', 404)
        
        # Convert to dictionaries
        log_dicts = [log.to_dict() for log in logs]
        
        # Generate insights
        try:
            insights = ml_predictor.get_insights(log_dicts)
            
            return success_response({
                'insights': insights,
                'period_days': days,
                'logs_analyzed': len(log_dicts),
            }, 'Insights generated successfully')
            
        except Exception as ml_error:
            return error_response(f'ML insights error: {str(ml_error)}', 500)
        
    except Exception as e:
        return error_response(f'Error generating insights: {str(e)}', 500)

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
