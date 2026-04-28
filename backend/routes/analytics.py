"""
Analytics Routes
Handle analytics and data aggregation endpoints
"""

from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from models import DailyLog
from utils.response import success_response, error_response
from datetime import date, timedelta
from sqlalchemy import func

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_summary():
    """
    Get analytics summary for a given time range
    Query params:
    - days: Number of days to include (default: 30)
    """
    try:
        user_id = get_jwt_identity()
        days = request.args.get('days', 30, type=int)
        
        if days < 1 or days > 365:
            return error_response('Days must be between 1 and 365', 400)
        
        start_date = date.today() - timedelta(days=days)
        
        # Get logs in date range
        logs = DailyLog.query.filter(
            DailyLog.user_id == user_id,
            DailyLog.logged_date >= start_date
        ).all()
        
        if not logs:
            return success_response({
                'count': 0,
                'averageScreenTime': 0,
                'totalScreenTime': 0,
                'averageBreaks': 0,
                'totalBreaks': 0,
            }, 'No data available for this period')
        
        # Calculate statistics
        count = len(logs)
        total_screen_time = sum(log.screen_time_hours for log in logs)
        avg_screen_time = total_screen_time / count if count > 0 else 0
        
        total_breaks = sum(log.breaks_taken for log in logs)
        avg_breaks = total_breaks / count if count > 0 else 0
        
        # Symptom averages
        avg_eye_strain = sum(log.eye_strain_level for log in logs) / count if count > 0 else 0
        avg_headaches = sum(log.headaches_level for log in logs) / count if count > 0 else 0
        avg_dry_eyes = sum(log.dry_eyes_level for log in logs) / count if count > 0 else 0
        avg_blurry_vision = sum(log.blurry_vision_level for log in logs) / count if count > 0 else 0
        
        # Symptom frequency (percentage of logs with symptom > 0)
        symptom_freq = {
            'eyeStrain': sum(1 for log in logs if log.eye_strain_level > 0) / count * 100 if count > 0 else 0,
            'headaches': sum(1 for log in logs if log.headaches_level > 0) / count * 100 if count > 0 else 0,
            'dryEyes': sum(1 for log in logs if log.dry_eyes_level > 0) / count * 100 if count > 0 else 0,
            'blurryVision': sum(1 for log in logs if log.blurry_vision_level > 0) / count * 100 if count > 0 else 0,
        }
        
        return success_response({
            'period': {
                'days': days,
                'startDate': start_date.isoformat(),
                'endDate': date.today().isoformat(),
            },
            'summary': {
                'logsCount': count,
                'averageScreenTime': round(avg_screen_time, 2),
                'totalScreenTime': round(total_screen_time, 2),
                'averageBreaks': round(avg_breaks, 2),
                'totalBreaks': total_breaks,
            },
            'symptoms': {
                'averageEyeStrain': round(avg_eye_strain, 2),
                'averageHeadaches': round(avg_headaches, 2),
                'averageDryEyes': round(avg_dry_eyes, 2),
                'averageBlurryVision': round(avg_blurry_vision, 2),
            },
            'symptomFrequency': {
                'eyeStrain': round(symptom_freq['eyeStrain'], 1),
                'headaches': round(symptom_freq['headaches'], 1),
                'dryEyes': round(symptom_freq['dryEyes'], 1),
                'blurryVision': round(symptom_freq['blurryVision'], 1),
            },
        }, 'Summary retrieved successfully')
        
    except Exception as e:
        return error_response(f'Error retrieving summary: {str(e)}', 500)

@analytics_bp.route('/trends', methods=['GET'])
@jwt_required()
def get_trends():
    """
    Get trend data for visualization
    Query params:
    - days: Number of days to include (default: 30)
    - metric: Which metric to trend (screenTime, eyeStrain, fatigue)
    """
    try:
        user_id = get_jwt_identity()
        days = request.args.get('days', 30, type=int)
        metric = request.args.get('metric', 'screenTime')
        
        if days < 1 or days > 365:
            return error_response('Days must be between 1 and 365', 400)
        
        start_date = date.today() - timedelta(days=days)
        
        # Get logs in date range, ordered by date
        logs = DailyLog.query.filter(
            DailyLog.user_id == user_id,
            DailyLog.logged_date >= start_date
        ).order_by(DailyLog.logged_date).all()
        
        if not logs:
            return success_response({
                'data': [],
                'metric': metric,
            }, 'No data available for this period')
        
        # Build trend data based on metric
        trend_data = []
        
        if metric == 'screenTime':
            for log in logs:
                trend_data.append({
                    'date': log.logged_date.isoformat(),
                    'value': log.screen_time_hours,
                })
        elif metric == 'eyeStrain':
            for log in logs:
                trend_data.append({
                    'date': log.logged_date.isoformat(),
                    'value': log.eye_strain_level,
                })
        elif metric == 'fatigue':
            # Fatigue is calculated from multiple symptoms
            for log in logs:
                fatigue = (log.eye_strain_level + log.headaches_level + 
                          log.dry_eyes_level + log.blurry_vision_level) / 4 * 25
                trend_data.append({
                    'date': log.logged_date.isoformat(),
                    'value': round(fatigue, 2),
                })
        else:
            return error_response('Invalid metric', 400)
        
        # Calculate moving average (7-day)
        moving_avg = []
        window = 7
        for i in range(len(trend_data)):
            start_idx = max(0, i - window + 1)
            window_data = trend_data[start_idx:i + 1]
            avg_value = sum(d['value'] for d in window_data) / len(window_data)
            moving_avg.append({
                'date': trend_data[i]['date'],
                'value': round(avg_value, 2),
            })
        
        return success_response({
            'metric': metric,
            'data': trend_data,
            'movingAverage': moving_avg,
            'days': days,
        }, 'Trends retrieved successfully')
        
    except Exception as e:
        return error_response(f'Error retrieving trends: {str(e)}', 500)

@analytics_bp.route('/insights', methods=['GET'])
@jwt_required()
def get_insights():
    """
    Get AI-generated insights from user data
    """
    try:
        user_id = get_jwt_identity()
        days = request.args.get('days', 30, type=int)
        
        start_date = date.today() - timedelta(days=days)
        
        # Get logs
        logs = DailyLog.query.filter(
            DailyLog.user_id == user_id,
            DailyLog.logged_date >= start_date
        ).all()
        
        if not logs:
            return success_response({
                'insights': [],
            }, 'No data available for insights')
        
        insights = []
        
        # TODO: Implement more sophisticated insight generation
        # For now, return basic insights based on data
        
        # Check if screen time is high
        avg_screen_time = sum(log.screen_time_hours for log in logs) / len(logs)
        if avg_screen_time > 8:
            insights.append({
                'type': 'warning',
                'title': 'High Screen Time',
                'message': f'Your average daily screen time is {avg_screen_time:.1f} hours, which exceeds recommended levels.',
                'recommendation': 'Try to limit screen time to 8 hours or less per day.',
            })
        
        # Check symptom trends
        avg_eye_strain = sum(log.eye_strain_level for log in logs) / len(logs)
        if avg_eye_strain > 1.5:
            insights.append({
                'type': 'alert',
                'title': 'Elevated Eye Strain',
                'message': 'You are experiencing frequent eye strain symptoms.',
                'recommendation': 'Increase break frequency and ensure proper screen distance.',
            })
        
        # Check break frequency
        avg_breaks = sum(log.breaks_taken for log in logs) / len(logs)
        if avg_breaks < 5:
            insights.append({
                'type': 'info',
                'title': 'Low Break Frequency',
                'message': f'You are taking only {avg_breaks:.0f} breaks per day on average.',
                'recommendation': 'Follow the 20-20-20 rule: Every 20 minutes, look at something 20 feet away for 20 seconds.',
            })
        
        # Positive insight
        if avg_screen_time <= 7 and avg_eye_strain <= 1:
            insights.append({
                'type': 'success',
                'title': 'Excellent Eye Health Habits',
                'message': 'Your screen time and eye strain levels are within healthy ranges.',
                'recommendation': 'Keep up the good work! Continue with your current habits.',
            })
        
        return success_response({
            'insights': insights,
            'period': days,
        }, 'Insights generated successfully')
        
    except Exception as e:
        return error_response(f'Error generating insights: {str(e)}', 500)
