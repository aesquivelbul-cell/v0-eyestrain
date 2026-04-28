"""
Machine Learning Models

Defines scikit-learn based models for eye strain risk prediction.
Includes risk level classification, risk percentage regression, and fatigue prediction.
"""

from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from typing import Tuple, List
import numpy as np


class RiskLevelClassifier:
    """
    Random Forest classifier for predicting eye strain risk levels.
    Classifies risk into: Low (0), Moderate (1), High (2), Severe (3)
    """

    def __init__(self, random_state: int = 42):
        """
        Initialize the risk level classifier.
        
        Args:
            random_state: Random seed for reproducibility
        """
        self.model = RandomForestClassifier(
            n_estimators=200,
            max_depth=15,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=random_state,
            n_jobs=-1,
        )
        self.scaler = StandardScaler()
        self.is_fitted = False

    def fit(self, X: np.ndarray, y: np.ndarray) -> 'RiskLevelClassifier':
        """
        Train the classifier.
        
        Args:
            X: Feature matrix
            y: Target labels (0-3 for Low/Moderate/High/Severe)
            
        Returns:
            Self for chaining
        """
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled, y)
        self.is_fitted = True
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Predict risk levels.
        
        Args:
            X: Feature matrix
            
        Returns:
            Predicted risk levels
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before prediction")
        
        X_scaled = self.scaler.transform(X)
        return self.model.predict(X_scaled)

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """
        Predict risk level probabilities.
        
        Args:
            X: Feature matrix
            
        Returns:
            Probability matrix for each class
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before prediction")
        
        X_scaled = self.scaler.transform(X)
        return self.model.predict_proba(X_scaled)

    def get_feature_importance(self) -> np.ndarray:
        """Get feature importances."""
        return self.model.feature_importances_


class RiskPercentageRegressor:
    """
    Gradient Boosting regressor for predicting eye strain risk percentage (0-100%).
    """

    def __init__(self, random_state: int = 42):
        """
        Initialize the risk percentage regressor.
        
        Args:
            random_state: Random seed for reproducibility
        """
        self.model = GradientBoostingRegressor(
            n_estimators=200,
            learning_rate=0.1,
            max_depth=8,
            min_samples_split=5,
            min_samples_leaf=2,
            subsample=0.8,
            random_state=random_state,
        )
        self.scaler = StandardScaler()
        self.is_fitted = False

    def fit(self, X: np.ndarray, y: np.ndarray) -> 'RiskPercentageRegressor':
        """
        Train the regressor.
        
        Args:
            X: Feature matrix
            y: Target values (0-100 for risk percentage)
            
        Returns:
            Self for chaining
        """
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled, y)
        self.is_fitted = True
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Predict risk percentages.
        
        Args:
            X: Feature matrix
            
        Returns:
            Predicted risk percentages (clamped to 0-100)
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before prediction")
        
        X_scaled = self.scaler.transform(X)
        predictions = self.model.predict(X_scaled)
        
        # Clamp predictions to valid range
        return np.clip(predictions, 0, 100)

    def get_feature_importance(self) -> np.ndarray:
        """Get feature importances."""
        return self.model.feature_importances_


class FatiguePredictor:
    """
    Linear Regression model for predicting digital fatigue level.
    Predicts fatigue score (0-10 scale).
    """

    def __init__(self):
        """Initialize the fatigue predictor."""
        self.model = LinearRegression()
        self.scaler = StandardScaler()
        self.is_fitted = False

    def fit(self, X: np.ndarray, y: np.ndarray) -> 'FatiguePredictor':
        """
        Train the predictor.
        
        Args:
            X: Feature matrix
            y: Target values (0-10 for fatigue level)
            
        Returns:
            Self for chaining
        """
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled, y)
        self.is_fitted = True
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Predict fatigue levels.
        
        Args:
            X: Feature matrix
            
        Returns:
            Predicted fatigue levels (clamped to 0-10)
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before prediction")
        
        X_scaled = self.scaler.transform(X)
        predictions = self.model.predict(X_scaled)
        
        # Clamp predictions to valid range
        return np.clip(predictions, 0, 10)

    def get_coefficients(self) -> np.ndarray:
        """Get model coefficients."""
        return self.model.coef_

    def get_intercept(self) -> float:
        """Get model intercept."""
        return self.model.intercept_
