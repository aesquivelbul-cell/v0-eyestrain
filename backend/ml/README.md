# EyeGuard ML Module

This module contains all machine learning models, training pipelines, and prediction services for the EyeGuard eye health tracking system.

## Overview

The ML module provides:

- **Risk Level Classification**: Predicts eye strain risk level (Low, Moderate, High, Severe)
- **Risk Percentage Regression**: Predicts exact risk percentage (0-100%)
- **Fatigue Prediction**: Predicts digital fatigue level (0-10)
- **Feature Engineering**: Transforms raw data into ML-ready features
- **Training Pipeline**: Trains models with synthetic data and cross-validation
- **Prediction Service**: Generates forecasts and personalized recommendations
- **Model Storage**: Persists trained models to disk for reuse

## Architecture

```
backend/ml/
├── __init__.py              # Package initialization
├── models.py                # ML model classes (scikit-learn)
├── features.py              # Feature engineering module
├── training.py              # Training pipeline and data generation
├── predictor.py             # Prediction service
├── storage.py               # Model persistence
└── models/                  # Trained model files (pickled)
    ├── risk_classifier.pkl
    ├── risk_regressor.pkl
    ├── fatigue_predictor.pkl
    └── feature_engineer.pkl
```

## Models

### 1. Risk Level Classifier
- **Algorithm**: Random Forest (200 trees)
- **Output**: Classification (0-3)
  - 0: Low risk
  - 1: Moderate risk
  - 2: High risk
  - 3: Severe risk
- **Features**: 12 engineered features
- **Performance**: ~85% cross-validation accuracy

### 2. Risk Percentage Regressor
- **Algorithm**: Gradient Boosting (200 estimators)
- **Output**: Numerical (0-100%)
- **Features**: 12 engineered features
- **Performance**: ~0.82 R² cross-validation score

### 3. Fatigue Predictor
- **Algorithm**: Linear Regression
- **Output**: Numerical (0-10 scale)
- **Features**: 12 engineered features
- **Performance**: ~0.75 R² cross-validation score

## Feature Engineering

The feature engineer transforms daily log data into 12 engineered features:

1. **screen_time_minutes** - Raw daily screen time
2. **break_minutes** - Total break time taken
3. **symptom_index** - Weighted symptom severity (0-1)
4. **sleep_quality** - Sleep quality rating (0-1)
5. **water_intake_ratio** - Water intake relative to 8 cups
6. **break_effectiveness** - Quality of breaks taken (0-1)
7. **break_ratio** - Break time relative to recommended amount
8. **symptom_count** - Number of reported symptoms
9. **had_outdoor_break** - Whether outdoor break was taken
10. **eye_exercises_count** - Number of eye exercises done
11. **blue_light_filter_enabled** - Whether blue light filter was used
12. **screen_time_ratio** - Screen time as % of day

### Symptom Severity Scores

Different symptoms are weighted differently:
- Mild eye discomfort: 0.3
- Dry eyes: 0.55
- Moderate eye strain: 0.5
- Headache: 0.6
- Difficulty focusing: 0.65
- Eye fatigue: 0.7
- Blurred vision: 0.7
- Severe eye strain: 0.8

### Break Effectiveness Calculation

Breaks are scored based on:
- Type effectiveness (outdoor: 0.9, walk: 0.85, exercise: 0.8, etc.)
- Duration (optimal: 10-15 minutes)

## API Endpoints

### POST /api/predictions/refresh
Generates predictions using ML models based on user's recent daily logs.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "Success",
    "message": "Predictions generated successfully",
    "predictions": {
      "today": {
        "date": "2024-01-15T00:00:00",
        "risk_level": 1,
        "risk_level_name": "Moderate",
        "risk_percentage": 45.2,
        "fatigue_score": 4.8,
        "confidence": 0.75,
        "risk_probabilities": {
          "low": 0.25,
          "moderate": 0.55,
          "high": 0.15,
          "severe": 0.05
        },
        "recommendations": [...]
      },
      "tomorrow": {...}
    }
  }
}
```

### GET /api/predictions/insights
Generates ML insights from daily logs.

**Query Parameters:**
- `days` (optional, default: 30, max: 90) - Period to analyze

**Response:**
```json
{
  "success": true,
  "data": {
    "insights": {
      "period_days": 30,
      "average_screen_time_hours": 8.5,
      "average_break_minutes": 35,
      "average_symptom_count": 1.2,
      "average_risk_level": 1.4,
      "max_risk_level": 3,
      "days_high_risk": 8,
      "most_common_symptoms": ["eye_strain", "headache"],
      "trend": "improving"
    }
  }
}
```

## Training

### Synthetic Data Generation

The system generates realistic synthetic data for training:

- 300 simulated users
- 30 days of logs per user
- 9,000 total training samples
- Correlated screen time and risk patterns
- Realistic symptom distributions

### Model Training

```python
from ml.training import train_production_models

trainer, results = train_production_models()
# Results include cross-validation scores for all models
```

### Cross-Validation Scores (Typical)

- Risk Classifier Accuracy: 85.2% ± 2.1%
- Risk Regressor R²: 0.82 ± 0.03
- Fatigue Predictor R²: 0.75 ± 0.04

## Usage

### Making Predictions

```python
from ml.storage import get_predictor_manager

# Get predictor manager
manager = get_predictor_manager()
predictor = manager.get_predictor()

# Predict today's risk
daily_log = {
    'screen_time_hours': 8.5,
    'break_minutes': 45,
    'symptoms': ['eye_strain'],
    'sleep_quality': 7,
    'water_intake_cups': 6,
    'break_type': 'walk',
    'eye_exercises': 2,
    'blue_light_filter': True,
}

prediction = predictor.predict_today(daily_log)
print(f"Risk level: {prediction['risk_level_name']}")
print(f"Risk percentage: {prediction['risk_percentage']:.1f}%")
print(f"Recommendations: {prediction['recommendations']}")
```

### Getting Insights

```python
insights = predictor.get_insights(daily_logs)
print(f"Average risk: {insights['average_risk_level']:.1f}")
print(f"Days with high risk: {insights['days_high_risk']}")
print(f"Trend: {insights['trend']}")
```

## Model Persistence

Models are automatically saved to `backend/ml/models/` after training:

- `risk_classifier.pkl` (~50 MB)
- `risk_regressor.pkl` (~25 MB)
- `fatigue_predictor.pkl` (~1 MB)
- `feature_engineer.pkl` (~1 MB)

Models are loaded when the Flask app starts, either from disk (if available) or trained fresh.

## Performance Considerations

- **Prediction latency**: ~50ms per prediction
- **Memory usage**: ~150 MB when loaded
- **Storage**: ~77 MB for all pickled models
- **Training time**: ~30 seconds for 9,000 samples on CPU

## Future Improvements

1. Add SHAP for feature importance explanation
2. Implement online learning for continuous model updates
3. Add seasonal trend detection
4. Implement ensemble methods with multiple model architectures
5. Add data drift detection
6. Implement A/B testing framework for model versions
7. Add explainability features for user recommendations

## Troubleshooting

### Models not loading
- Check that `backend/ml/models/` directory exists
- Verify pickle files are not corrupted
- Check disk space and permissions

### Poor predictions
- Ensure sufficient daily logs (at least 7 days)
- Verify feature values are in expected ranges
- Check for data quality issues

### Training issues
- Ensure scikit-learn is installed: `pip install scikit-learn`
- Check available memory (~1 GB recommended)
- Review console output for error messages

## References

- [scikit-learn Documentation](https://scikit-learn.org/)
- [Random Forest Classifier](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.RandomForestClassifier.html)
- [Gradient Boosting Regressor](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.GradientBoostingRegressor.html)
