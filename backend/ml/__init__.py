"""
Machine Learning Module for EyeGuard

This module provides ML models for predicting eye strain and digital fatigue risk.
It includes model training, prediction, and feature engineering utilities.
"""

from .models import (
    RiskLevelClassifier,
    RiskPercentageRegressor,
    FatiguePredictor,
)
from .predictor import RiskPredictor
from .features import FeatureEngineer

__all__ = [
    'RiskLevelClassifier',
    'RiskPercentageRegressor',
    'FatiguePredictor',
    'RiskPredictor',
    'FeatureEngineer',
]
