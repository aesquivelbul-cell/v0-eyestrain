"""
Training Pipeline Module

Handles model training with synthetic data generation and cross-validation.
"""

import numpy as np
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.metrics import classification_report, mean_squared_error, r2_score
from typing import Tuple, Dict
from datetime import datetime, timedelta
import random

from .models import RiskLevelClassifier, RiskPercentageRegressor, FatiguePredictor
from .features import FeatureEngineer


class SyntheticDataGenerator:
    """
    Generates realistic synthetic daily log data for model training.
    """

    @staticmethod
    def generate_synthetic_logs(num_samples: int = 500,
                               num_days: int = 30) -> Tuple[list, list, list]:
        """
        Generate synthetic daily log data.
        
        Args:
            num_samples: Number of users to generate data for
            num_days: Number of days of logs per user
            
        Returns:
            Tuple of (daily_logs, risk_levels, risk_percentages)
        """
        daily_logs = []
        risk_levels = []
        risk_percentages = []

        symptoms_pool = [
            'mild_eye_discomfort', 'moderate_eye_strain', 'severe_eye_strain',
            'blurred_vision', 'headache', 'difficulty_focusing', 'dry_eyes', 'eye_fatigue'
        ]
        break_types = ['outdoor', 'rest', 'exercise', 'meditation', 'walk', 'gaming', 'social_media']

        for _ in range(num_samples):
            # Generate correlated screen time and risk pattern
            base_screen_time = np.random.uniform(4, 14)  # Hours per day
            base_risk_pattern = np.random.choice([0, 1, 2, 3])  # Low, Moderate, High, Severe

            for day in range(num_days):
                # Add daily variation
                screen_time = base_screen_time + np.random.normal(0, 1)
                screen_time = np.clip(screen_time, 2, 16)

                # Screen time based break
                max_break = (screen_time / 12) * 60  # Minutes
                break_minutes = np.random.uniform(0, max_break)

                # Symptom correlation with screen time and breaks
                symptom_prob = (screen_time / 16) * (1 - break_minutes / 60)
                symptom_prob = np.clip(symptom_prob, 0, 1)
                num_symptoms = np.random.choice([0, 1, 2, 3], p=[
                    max(0, 1 - symptom_prob),
                    symptom_prob * 0.5,
                    symptom_prob * 0.3,
                    symptom_prob * 0.2,
                ])
                symptoms = list(np.random.choice(symptoms_pool, num_symptoms, replace=False))

                daily_log = {
                    'screen_time_hours': screen_time,
                    'break_minutes': break_minutes,
                    'symptoms': symptoms,
                    'sleep_quality': np.random.uniform(3, 10),
                    'water_intake_cups': np.random.uniform(2, 10),
                    'break_type': np.random.choice(break_types),
                    'eye_exercises': np.random.choice([0, 1, 2, 3, 4]),
                    'blue_light_filter': np.random.choice([True, False]),
                }

                daily_logs.append(daily_log)

                # Determine risk level based on features
                risk_level = min(3, base_risk_pattern + (len(symptoms) > 2))
                risk_percentage = min(100, (screen_time / 16) * 100 + (len(symptoms) * 15))
                risk_percentage -= break_minutes * 0.5
                risk_percentage = max(0, risk_percentage)

                risk_levels.append(risk_level)
                risk_percentages.append(risk_percentage)

        return daily_logs, risk_levels, risk_percentages

    @staticmethod
    def generate_fatigue_labels(daily_logs: list, risk_levels: list) -> np.ndarray:
        """
        Generate fatigue labels (0-10) based on daily logs and risk levels.
        
        Args:
            daily_logs: List of daily log dictionaries
            risk_levels: List of risk level labels
            
        Returns:
            Fatigue labels
        """
        fatigue_labels = []
        
        for log, risk in zip(daily_logs, risk_levels):
            # Base fatigue from risk level
            base_fatigue = risk * 2.5  # 0 to 7.5
            
            # Screen time contribution
            screen_contrib = (log['screen_time_hours'] / 16) * 3  # Up to 3 points
            
            # Break effectiveness reduction
            break_effectiveness = 0
            if log['break_minutes'] > 0:
                break_effectiveness = min(1, log['break_minutes'] / 30)
            
            # Sleep quality and hydration help
            sleep_factor = log['sleep_quality'] / 10  # 0 to 1
            water_factor = min(1, log['water_intake_cups'] / 8)  # 0 to 1
            
            fatigue = base_fatigue + screen_contrib
            fatigue -= break_effectiveness * 1.5
            fatigue -= sleep_factor * 2
            fatigue -= water_factor * 1
            
            # Add noise
            fatigue += np.random.normal(0, 0.5)
            fatigue = np.clip(fatigue, 0, 10)
            
            fatigue_labels.append(fatigue)
        
        return np.array(fatigue_labels)


class ModelTrainer:
    """
    Handles training, validation, and evaluation of ML models.
    """

    def __init__(self):
        """Initialize the model trainer."""
        self.risk_classifier = RiskLevelClassifier()
        self.risk_regressor = RiskPercentageRegressor()
        self.fatigue_predictor = FatiguePredictor()
        self.feature_engineer = FeatureEngineer()

    def train_models(self, daily_logs: list, risk_levels: list,
                    risk_percentages: list) -> Dict[str, float]:
        """
        Train all models with cross-validation.
        
        Args:
            daily_logs: List of daily log dictionaries
            risk_levels: List of risk level labels
            risk_percentages: List of risk percentage labels
            
        Returns:
            Dictionary with validation scores
        """
        # Extract features
        X, feature_names = self.feature_engineer.extract_features_batch(daily_logs)
        
        # Generate fatigue labels
        y_fatigue = SyntheticDataGenerator.generate_fatigue_labels(daily_logs, risk_levels)
        
        # Convert to numpy arrays
        y_risk_levels = np.array(risk_levels)
        y_risk_percentages = np.array(risk_percentages)

        # Train risk level classifier
        print("[ML] Training Risk Level Classifier...")
        self.risk_classifier.fit(X, y_risk_levels)
        classifier_scores = cross_val_score(
            self.risk_classifier.model,
            self.risk_classifier.scaler.transform(X),
            y_risk_levels,
            cv=5,
            scoring='accuracy'
        )

        # Train risk percentage regressor
        print("[ML] Training Risk Percentage Regressor...")
        self.risk_regressor.fit(X, y_risk_percentages)
        regressor_scores = cross_val_score(
            self.risk_regressor.model,
            self.risk_regressor.scaler.transform(X),
            y_risk_percentages,
            cv=5,
            scoring='r2'
        )

        # Train fatigue predictor
        print("[ML] Training Fatigue Predictor...")
        self.fatigue_predictor.fit(X, y_fatigue)
        fatigue_scores = cross_val_score(
            self.fatigue_predictor.model,
            self.fatigue_predictor.scaler.transform(X),
            y_fatigue,
            cv=5,
            scoring='r2'
        )

        results = {
            'classifier_accuracy': classifier_scores.mean(),
            'classifier_std': classifier_scores.std(),
            'regressor_r2': regressor_scores.mean(),
            'regressor_std': regressor_scores.std(),
            'fatigue_r2': fatigue_scores.mean(),
            'fatigue_std': fatigue_scores.std(),
        }

        print(f"[ML] Risk Classifier Accuracy: {results['classifier_accuracy']:.3f} (+/- {results['classifier_std']:.3f})")
        print(f"[ML] Risk Regressor R2: {results['regressor_r2']:.3f} (+/- {results['regressor_std']:.3f})")
        print(f"[ML] Fatigue Predictor R2: {results['fatigue_r2']:.3f} (+/- {results['fatigue_std']:.3f})")

        return results

    def get_models(self) -> Tuple[RiskLevelClassifier, RiskPercentageRegressor, FatiguePredictor]:
        """Get trained models."""
        return self.risk_classifier, self.risk_regressor, self.fatigue_predictor

    def get_feature_engineer(self) -> FeatureEngineer:
        """Get feature engineer."""
        return self.feature_engineer


def train_production_models(min_real_samples: int = 20) -> Tuple[ModelTrainer, Dict[str, float]]:
    """
    Train production-ready models.

    Strategy:
    1. Try to fetch real data from Supabase.
    2. If enough real data exists (>= min_real_samples), train on it.
    3. If not enough real data, supplement with synthetic data so the
       model still works while the app is being used.

    Args:
        min_real_samples: Minimum real rows needed before we prefer real data.

    Returns:
        Tuple of (trained ModelTrainer, validation results)
    """
    from .supabase_loader import fetch_training_data

    real_logs, real_risk_levels, real_risk_pcts = fetch_training_data()
    n_real = len(real_logs)
    print(f"[ML] Real training samples from Supabase: {n_real}")

    if n_real >= min_real_samples:
        # Enough real data — train purely on it
        print("[ML] Training on real Supabase data")
        daily_logs = real_logs
        risk_levels = real_risk_levels
        risk_percentages = real_risk_pcts
    else:
        # Not enough real data yet — generate synthetic and mix in any real rows
        needed_synthetic = max(300 * 30, min_real_samples * 30)  # at least 9000 samples
        print(f"[ML] Not enough real data ({n_real} rows). "
              f"Generating {needed_synthetic} synthetic samples and mixing in real data.")
        syn_logs, syn_levels, syn_pcts = SyntheticDataGenerator.generate_synthetic_logs(
            num_samples=300,
            num_days=30
        )
        # Real data gets appended last so it has the most influence
        daily_logs = syn_logs + real_logs
        risk_levels = syn_levels + real_risk_levels
        risk_percentages = syn_pcts + real_risk_pcts

    print(f"[ML] Total training samples: {len(daily_logs)}")

    trainer = ModelTrainer()
    results = trainer.train_models(daily_logs, risk_levels, risk_percentages)
    results["real_samples_used"] = n_real
    results["total_samples"] = len(daily_logs)

    return trainer, results
