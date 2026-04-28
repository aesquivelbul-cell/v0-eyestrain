"""
Feature Engineering Module

Handles feature extraction and engineering for ML models.
Transforms raw daily logs into features suitable for machine learning.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional


class FeatureEngineer:
    """
    Transforms raw daily log data into engineered features for ML models.
    """

    def __init__(self):
        """Initialize the feature engineer."""
        self.feature_names = None

    @staticmethod
    def calculate_symptom_index(symptoms: List[str]) -> float:
        """
        Calculate symptom severity index (0-1).
        
        Args:
            symptoms: List of symptom names
            
        Returns:
            Normalized symptom severity score
        """
        symptom_severity = {
            'mild_eye_discomfort': 0.3,
            'moderate_eye_strain': 0.5,
            'severe_eye_strain': 0.8,
            'blurred_vision': 0.7,
            'headache': 0.6,
            'difficulty_focusing': 0.65,
            'dry_eyes': 0.55,
            'eye_fatigue': 0.7,
        }
        
        if not symptoms:
            return 0.0
        
        scores = [symptom_severity.get(s, 0.5) for s in symptoms]
        return min(1.0, np.mean(scores))  # Cap at 1.0

    @staticmethod
    def calculate_break_effectiveness(break_duration: int, break_type: str) -> float:
        """
        Calculate break effectiveness score (0-1).
        
        Args:
            break_duration: Duration of break in minutes
            break_type: Type of break (outdoor, rest, exercise, etc.)
            
        Returns:
            Break effectiveness score
        """
        type_effectiveness = {
            'outdoor': 0.9,
            'rest': 0.6,
            'exercise': 0.8,
            'meditation': 0.75,
            'walk': 0.85,
            'gaming': 0.2,
            'social_media': 0.3,
        }
        
        base_score = type_effectiveness.get(break_type, 0.5)
        
        # Duration adjustment (optimal: 10-15 minutes)
        if break_duration < 5:
            duration_multiplier = break_duration / 5
        elif break_duration <= 15:
            duration_multiplier = 1.0
        elif break_duration <= 30:
            duration_multiplier = 0.9
        else:
            duration_multiplier = 0.7
        
        return min(1.0, base_score * duration_multiplier)

    @staticmethod
    def calculate_screen_break_ratio(total_screen_time: int, total_breaks: int,
                                    break_duration: int) -> float:
        """
        Calculate screen time to break ratio (0-1, where 1 is perfect).
        Recommended: ~5-minute break per hour of screen time.
        
        Args:
            total_screen_time: Total screen time in minutes
            total_breaks: Number of breaks taken
            break_duration: Total break duration in minutes
            
        Returns:
            Break ratio score
        """
        if total_screen_time == 0:
            return 1.0
        
        recommended_breaks = total_screen_time / 60 * 5  # 5 min per hour
        actual_ratio = min(break_duration, recommended_breaks) / recommended_breaks
        
        return min(1.0, actual_ratio)

    def extract_features(self, daily_log: Dict) -> np.ndarray:
        """
        Extract features from a daily log entry.
        
        Args:
            daily_log: Dictionary with daily log data
            
        Returns:
            Feature vector
        """
        screen_time = daily_log.get('screen_time_hours', 0) * 60  # Convert to minutes
        break_minutes = daily_log.get('break_minutes', 0)
        symptoms = daily_log.get('symptoms', [])
        sleep_quality = daily_log.get('sleep_quality', 5) / 10
        water_intake = daily_log.get('water_intake_cups', 0) / 8  # Cap at 8 cups
        break_type = daily_log.get('break_type', 'rest')
        
        # Calculate derived features
        symptom_index = self.calculate_symptom_index(symptoms)
        break_effectiveness = self.calculate_break_effectiveness(break_minutes, break_type)
        break_ratio = self.calculate_screen_break_ratio(screen_time, 1, break_minutes)
        
        # Compile feature vector
        features = np.array([
            screen_time,                    # 0: Raw screen time
            break_minutes,                  # 1: Total break time
            symptom_index,                  # 2: Symptom severity (0-1)
            sleep_quality,                  # 3: Sleep quality (0-1)
            min(1.0, water_intake),         # 4: Water intake (0-1)
            break_effectiveness,            # 5: Break effectiveness (0-1)
            break_ratio,                    # 6: Break ratio (0-1)
            len(symptoms),                  # 7: Symptom count
            1.0 if 'outdoor' in break_type else 0.0,  # 8: Had outdoor break
            daily_log.get('eye_exercises', 0),        # 9: Eye exercises done
            1.0 if daily_log.get('blue_light_filter', False) else 0.0,  # 10: Blue light filter
            screen_time / 24 / 60,          # 11: Screen time ratio (% of day)
        ])
        
        return features

    def extract_features_batch(self, daily_logs: List[Dict]) -> Tuple[np.ndarray, List[str]]:
        """
        Extract features from multiple daily log entries.
        
        Args:
            daily_logs: List of daily log dictionaries
            
        Returns:
            Feature matrix and feature names
        """
        features = np.array([self.extract_features(log) for log in daily_logs])
        
        feature_names = [
            'screen_time_minutes',
            'break_minutes',
            'symptom_index',
            'sleep_quality',
            'water_intake_ratio',
            'break_effectiveness',
            'break_ratio',
            'symptom_count',
            'had_outdoor_break',
            'eye_exercises_count',
            'blue_light_filter_enabled',
            'screen_time_ratio',
        ]
        
        self.feature_names = feature_names
        return features, feature_names

    def add_temporal_features(self, features: np.ndarray,
                            dates: List[str], window: int = 7) -> np.ndarray:
        """
        Add temporal features (rolling averages, trends).
        
        Args:
            features: Feature matrix
            dates: List of date strings
            window: Rolling window size (days)
            
        Returns:
            Features with temporal features added
        """
        df = pd.DataFrame(features, index=pd.to_datetime(dates))
        
        # Calculate rolling statistics
        rolling_mean = df.rolling(window=window, min_periods=1).mean()
        rolling_std = df.rolling(window=window, min_periods=1).std().fillna(0)
        
        # Combine original and rolling features
        temporal_features = np.hstack([
            features,
            rolling_mean.values,
            rolling_std.values,
        ])
        
        return temporal_features

    def get_feature_importance_names(self) -> List[str]:
        """Get list of feature names."""
        if self.feature_names is None:
            return ['feature_' + str(i) for i in range(12)]
        return self.feature_names
