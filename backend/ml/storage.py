"""
Model Storage Module

Handles serialization and deserialization of trained models.
"""

import pickle
import os
from pathlib import Path
from typing import Tuple, Optional

from .models import RiskLevelClassifier, RiskPercentageRegressor, FatiguePredictor
from .features import FeatureEngineer
from .predictor import RiskPredictor


class ModelStorage:
    """
    Manages storage and loading of trained ML models.
    """

    def __init__(self, models_dir: str = 'backend/ml/models'):
        """
        Initialize model storage.
        
        Args:
            models_dir: Directory to store model files
        """
        self.models_dir = Path(models_dir)
        self.models_dir.mkdir(parents=True, exist_ok=True)
        
        self.classifier_path = self.models_dir / 'risk_classifier.pkl'
        self.regressor_path = self.models_dir / 'risk_regressor.pkl'
        self.fatigue_path = self.models_dir / 'fatigue_predictor.pkl'
        self.feature_engineer_path = self.models_dir / 'feature_engineer.pkl'

    def save_models(self, risk_classifier: RiskLevelClassifier,
                   risk_regressor: RiskPercentageRegressor,
                   fatigue_predictor: FatiguePredictor,
                   feature_engineer: FeatureEngineer) -> bool:
        """
        Save trained models to disk.
        
        Args:
            risk_classifier: Trained risk classifier
            risk_regressor: Trained risk regressor
            fatigue_predictor: Trained fatigue predictor
            feature_engineer: Feature engineer instance
            
        Returns:
            True if successful, False otherwise
        """
        try:
            with open(self.classifier_path, 'wb') as f:
                pickle.dump(risk_classifier, f)
            
            with open(self.regressor_path, 'wb') as f:
                pickle.dump(risk_regressor, f)
            
            with open(self.fatigue_path, 'wb') as f:
                pickle.dump(fatigue_predictor, f)
            
            with open(self.feature_engineer_path, 'wb') as f:
                pickle.dump(feature_engineer, f)
            
            print(f"[ML] Models saved successfully to {self.models_dir}")
            return True
        except Exception as e:
            print(f"[ML] Error saving models: {e}")
            return False

    def load_models(self) -> Optional[Tuple[RiskLevelClassifier,
                                           RiskPercentageRegressor,
                                           FatiguePredictor,
                                           FeatureEngineer]]:
        """
        Load trained models from disk.
        
        Returns:
            Tuple of (classifier, regressor, fatigue_predictor, feature_engineer)
            or None if models don't exist
        """
        try:
            if not self._all_models_exist():
                print("[ML] Models not found on disk")
                return None
            
            with open(self.classifier_path, 'rb') as f:
                risk_classifier = pickle.load(f)
            
            with open(self.regressor_path, 'rb') as f:
                risk_regressor = pickle.load(f)
            
            with open(self.fatigue_path, 'rb') as f:
                fatigue_predictor = pickle.load(f)
            
            with open(self.feature_engineer_path, 'rb') as f:
                feature_engineer = pickle.load(f)
            
            print(f"[ML] Models loaded successfully from {self.models_dir}")
            return risk_classifier, risk_regressor, fatigue_predictor, feature_engineer
        except Exception as e:
            print(f"[ML] Error loading models: {e}")
            return None

    def _all_models_exist(self) -> bool:
        """Check if all model files exist."""
        return (self.classifier_path.exists() and
                self.regressor_path.exists() and
                self.fatigue_path.exists() and
                self.feature_engineer_path.exists())

    def delete_models(self) -> bool:
        """
        Delete all stored models.
        
        Returns:
            True if successful, False otherwise
        """
        try:
            for path in [self.classifier_path, self.regressor_path,
                        self.fatigue_path, self.feature_engineer_path]:
                if path.exists():
                    path.unlink()
            
            print(f"[ML] Models deleted successfully from {self.models_dir}")
            return True
        except Exception as e:
            print(f"[ML] Error deleting models: {e}")
            return False

    def model_exists(self) -> bool:
        """Check if models are available."""
        return self._all_models_exist()

    def get_model_info(self) -> dict:
        """Get information about stored models."""
        info = {
            'classifier_exists': self.classifier_path.exists(),
            'regressor_exists': self.regressor_path.exists(),
            'fatigue_exists': self.fatigue_path.exists(),
            'feature_engineer_exists': self.feature_engineer_path.exists(),
        }
        
        # Add file sizes if they exist
        for path_name, path in [('classifier', self.classifier_path),
                               ('regressor', self.regressor_path),
                               ('fatigue', self.fatigue_path),
                               ('feature_engineer', self.feature_engineer_path)]:
            if path.exists():
                info[f'{path_name}_size_bytes'] = path.stat().st_size
        
        return info


class PredictorManager:
    """
    Manages the lifecycle of RiskPredictor instances.
    """

    def __init__(self, models_dir: str = 'backend/ml/models'):
        """
        Initialize the predictor manager.
        
        Args:
            models_dir: Directory where models are stored
        """
        self.storage = ModelStorage(models_dir)
        self._predictor = None

    def get_predictor(self) -> Optional[RiskPredictor]:
        """
        Get or create a RiskPredictor instance.
        
        Returns:
            RiskPredictor instance or None if models aren't available
        """
        if self._predictor is not None:
            return self._predictor
        
        # Try to load existing models
        result = self.storage.load_models()
        if result is not None:
            classifier, regressor, fatigue, feature_engineer = result
            self._predictor = RiskPredictor(classifier, regressor, fatigue, feature_engineer)
            return self._predictor
        
        return None

    def create_new_predictor(self, trainer) -> Optional[RiskPredictor]:
        """
        Create a new predictor from a trained model trainer.
        
        Args:
            trainer: ModelTrainer instance with trained models
            
        Returns:
            RiskPredictor instance
        """
        classifier, regressor, fatigue = trainer.get_models()
        feature_engineer = trainer.get_feature_engineer()
        
        # Save models
        self.storage.save_models(classifier, regressor, fatigue, feature_engineer)
        
        # Create predictor
        self._predictor = RiskPredictor(classifier, regressor, fatigue, feature_engineer)
        return self._predictor

    def reset_predictor(self):
        """Reset the cached predictor."""
        self._predictor = None


# Global predictor manager instance
_predictor_manager = None


def get_predictor_manager(models_dir: str = 'backend/ml/models') -> PredictorManager:
    """Get or create the global predictor manager."""
    global _predictor_manager
    if _predictor_manager is None:
        _predictor_manager = PredictorManager(models_dir)
    return _predictor_manager
