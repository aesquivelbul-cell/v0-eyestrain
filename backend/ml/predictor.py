"""
Risk Prediction Service

Provides prediction functionality using trained ML models.
Generates risk forecasts and personalized recommendations.
"""

import numpy as np
from typing import Dict, List, Tuple, Optional
from datetime import datetime, timedelta

from .models import RiskLevelClassifier, RiskPercentageRegressor, FatiguePredictor
from .features import FeatureEngineer


class RiskPredictor:
    """
    Main prediction service that uses trained ML models.
    Generates risk predictions and recommendations.
    """

    RISK_LEVELS = ['Low', 'Moderate', 'High', 'Severe']
    
    RECOMMENDATIONS = {
        0: [  # Low risk
            'Great job maintaining healthy screen habits!',
            'Continue taking regular breaks every hour.',
            'Keep monitoring your eye health.',
        ],
        1: [  # Moderate risk
            'Consider increasing break frequency.',
            'Try doing eye exercises every 2 hours.',
            'Ensure adequate sleep (7-9 hours).',
            'Adjust your screen brightness to match surroundings.',
        ],
        2: [  # High risk
            'Take a 15-minute break immediately.',
            'Use the 20-20-20 rule: Every 20 minutes, look at something 20 feet away for 20 seconds.',
            'Reduce screen time or adjust work schedule.',
            'Visit an eye care professional if symptoms persist.',
            'Increase water intake and consider using a blue light filter.',
        ],
        3: [  # Severe risk
            'URGENT: Take a 30-minute break from screens.',
            'Schedule an eye care appointment as soon as possible.',
            'Consider reducing daily screen time significantly.',
            'Implement comprehensive eye care: breaks, exercises, proper lighting.',
            'Ensure 8+ hours of sleep daily.',
            'Consult with your healthcare provider about digital fatigue symptoms.',
        ],
    }

    def __init__(self, risk_classifier: RiskLevelClassifier,
                 risk_regressor: RiskPercentageRegressor,
                 fatigue_predictor: FatiguePredictor,
                 feature_engineer: FeatureEngineer):
        """
        Initialize the risk predictor.
        
        Args:
            risk_classifier: Trained risk level classifier
            risk_regressor: Trained risk percentage regressor
            fatigue_predictor: Trained fatigue predictor
            feature_engineer: Feature engineer instance
        """
        self.risk_classifier = risk_classifier
        self.risk_regressor = risk_regressor
        self.fatigue_predictor = fatigue_predictor
        self.feature_engineer = feature_engineer

    def predict_today(self, daily_log: Dict) -> Dict:
        """
        Predict risk for today based on current daily log.
        
        Args:
            daily_log: Daily log dictionary
            
        Returns:
            Prediction result with risk level, percentage, and recommendations
        """
        features = self.feature_engineer.extract_features(daily_log)
        features = features.reshape(1, -1)

        # Get predictions
        risk_level = int(self.risk_classifier.predict(features)[0])
        risk_percentage = float(self.risk_regressor.predict(features)[0])
        fatigue_score = float(self.fatigue_predictor.predict(features)[0])
        risk_proba = self.risk_classifier.predict_proba(features)[0]

        return {
            'date': datetime.now().isoformat(),
            'risk_level': risk_level,
            'risk_level_name': self.RISK_LEVELS[risk_level],
            'risk_percentage': risk_percentage,
            'fatigue_score': fatigue_score,
            'confidence': float(risk_proba[risk_level]),
            'risk_probabilities': {
                'low': float(risk_proba[0]),
                'moderate': float(risk_proba[1]),
                'high': float(risk_proba[2]),
                'severe': float(risk_proba[3]),
            },
            'recommendations': self.get_recommendations(risk_level),
        }

    def predict_week(self, daily_logs: List[Dict]) -> List[Dict]:
        """
        Predict risk for each day in the week.
        
        Args:
            daily_logs: List of daily log dictionaries for the week
            
        Returns:
            List of predictions for each day
        """
        predictions = []
        
        for i, log in enumerate(daily_logs):
            pred = self.predict_today(log)
            pred['date'] = (datetime.now() - timedelta(days=len(daily_logs)-1-i)).isoformat()
            predictions.append(pred)
        
        return predictions

    def predict_tomorrow(self, recent_logs: List[Dict]) -> Dict:
        """
        Predict tomorrow's risk based on recent trends.
        
        Args:
            recent_logs: List of recent daily logs (last 3-7 days)
            
        Returns:
            Prediction for tomorrow
        """
        if not recent_logs:
            # Default prediction if no data
            return self._default_prediction(datetime.now() + timedelta(days=1))

        # Calculate average features
        features_list = [self.feature_engineer.extract_features(log) for log in recent_logs]
        avg_features = np.mean(features_list, axis=0).reshape(1, -1)

        # Simulate tomorrow with slight increase in screen time
        avg_features[0, 0] *= 1.05  # 5% increase in screen time

        risk_level = int(self.risk_classifier.predict(avg_features)[0])
        risk_percentage = float(self.risk_regressor.predict(avg_features)[0])
        fatigue_score = float(self.fatigue_predictor.predict(avg_features)[0])
        risk_proba = self.risk_classifier.predict_proba(avg_features)[0]

        return {
            'date': (datetime.now() + timedelta(days=1)).isoformat(),
            'risk_level': risk_level,
            'risk_level_name': self.RISK_LEVELS[risk_level],
            'risk_percentage': risk_percentage,
            'fatigue_score': fatigue_score,
            'confidence': float(risk_proba[risk_level]),
            'risk_probabilities': {
                'low': float(risk_proba[0]),
                'moderate': float(risk_proba[1]),
                'high': float(risk_proba[2]),
                'severe': float(risk_proba[3]),
            },
            'recommendations': self.get_recommendations(risk_level),
            'note': 'Forecast based on recent trends',
        }

    def predict_risk_score_trajectory(self, daily_logs: List[Dict],
                                     forecast_days: int = 7) -> Dict:
        """
        Predict the trajectory of risk scores over the next few days.
        
        Args:
            daily_logs: List of recent daily logs
            forecast_days: Number of days to forecast
            
        Returns:
            Trajectory data with daily risk scores
        """
        trajectory = []
        current_logs = daily_logs.copy() if daily_logs else []

        for day in range(forecast_days):
            if current_logs:
                tomorrow_pred = self.predict_tomorrow(current_logs[-7:])
            else:
                tomorrow_pred = self._default_prediction(
                    datetime.now() + timedelta(days=day+1)
                )

            trajectory.append({
                'date': tomorrow_pred['date'],
                'risk_level': tomorrow_pred['risk_level'],
                'risk_percentage': tomorrow_pred['risk_percentage'],
                'fatigue_score': tomorrow_pred['fatigue_score'],
            })

            # Update logs for next iteration (simulate)
            current_logs.append({
                'screen_time_hours': np.random.uniform(6, 12),
                'break_minutes': np.random.uniform(20, 60),
                'symptoms': [],
                'sleep_quality': 7,
                'water_intake_cups': 6,
                'break_type': 'rest',
                'eye_exercises': 1,
                'blue_light_filter': True,
            })

        return {
            'forecast_start': datetime.now().isoformat(),
            'forecast_days': forecast_days,
            'trajectory': trajectory,
        }

    def get_recommendations(self, risk_level: int) -> List[str]:
        """
        Get recommendations based on risk level.
        
        Args:
            risk_level: Risk level (0-3)
            
        Returns:
            List of recommendations
        """
        risk_level = min(3, max(0, risk_level))
        return self.RECOMMENDATIONS.get(risk_level, self.RECOMMENDATIONS[1])

    def get_insights(self, daily_logs: List[Dict]) -> Dict:
        """
        Generate insights from a collection of daily logs.
        
        Args:
            daily_logs: List of daily logs
            
        Returns:
            Insights dictionary
        """
        if not daily_logs:
            return self._default_insights()

        # Calculate statistics
        screen_times = [log.get('screen_time_hours', 0) for log in daily_logs]
        break_mins = [log.get('break_minutes', 0) for log in daily_logs]
        symptoms_counts = [len(log.get('symptoms', [])) for log in daily_logs]
        
        avg_screen_time = np.mean(screen_times)
        avg_breaks = np.mean(break_mins)
        avg_symptoms = np.mean(symptoms_counts)
        
        # Calculate predictions
        predictions = [self.predict_today(log) for log in daily_logs]
        risk_levels = [p['risk_level'] for p in predictions]
        avg_risk = np.mean(risk_levels)
        
        return {
            'period_days': len(daily_logs),
            'average_screen_time_hours': float(avg_screen_time),
            'average_break_minutes': float(avg_breaks),
            'average_symptom_count': float(avg_symptoms),
            'average_risk_level': float(avg_risk),
            'max_risk_level': int(max(risk_levels)),
            'days_high_risk': sum(1 for r in risk_levels if r >= 2),
            'most_common_symptoms': self._get_most_common_symptoms(daily_logs),
            'trend': self._calculate_trend(predictions),
        }

    def _default_prediction(self, date: datetime) -> Dict:
        """Generate a default prediction."""
        return {
            'date': date.isoformat(),
            'risk_level': 1,
            'risk_level_name': 'Moderate',
            'risk_percentage': 50.0,
            'fatigue_score': 5.0,
            'confidence': 0.5,
            'risk_probabilities': {
                'low': 0.25,
                'moderate': 0.5,
                'high': 0.2,
                'severe': 0.05,
            },
            'recommendations': self.get_recommendations(1),
        }

    def _default_insights(self) -> Dict:
        """Generate default insights."""
        return {
            'period_days': 0,
            'average_screen_time_hours': 0,
            'average_break_minutes': 0,
            'average_symptom_count': 0,
            'average_risk_level': 0,
            'max_risk_level': 0,
            'days_high_risk': 0,
            'most_common_symptoms': [],
            'trend': 'stable',
        }

    @staticmethod
    def _get_most_common_symptoms(daily_logs: List[Dict]) -> List[str]:
        """Get most common symptoms."""
        symptom_counts = {}
        
        for log in daily_logs:
            for symptom in log.get('symptoms', []):
                symptom_counts[symptom] = symptom_counts.get(symptom, 0) + 1
        
        # Return top 3 symptoms
        sorted_symptoms = sorted(symptom_counts.items(), key=lambda x: x[1], reverse=True)
        return [symptom for symptom, count in sorted_symptoms[:3]]

    @staticmethod
    def _calculate_trend(predictions: List[Dict]) -> str:
        """Calculate trend from predictions."""
        if len(predictions) < 2:
            return 'stable'
        
        risk_levels = [p['risk_level'] for p in predictions]
        avg_recent = np.mean(risk_levels[-3:])
        avg_older = np.mean(risk_levels[:-3]) if len(risk_levels) > 3 else np.mean(risk_levels)
        
        if avg_recent > avg_older + 0.5:
            return 'worsening'
        elif avg_recent < avg_older - 0.5:
            return 'improving'
        else:
            return 'stable'
