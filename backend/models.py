"""
Database Models
Define all data structures for the EyeGuard application
"""

from app import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import uuid

class User(db.Model):
    """User model for authentication and profile"""
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    
    # Preferences
    break_interval = db.Column(db.Integer, default=20)  # minutes
    break_duration = db.Column(db.Integer, default=20)  # seconds
    notifications_enabled = db.Column(db.Boolean, default=True)
    email_alerts = db.Column(db.Boolean, default=True)
    dark_mode = db.Column(db.Boolean, default=True)
    
    # Metadata
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    # Relationships
    daily_logs = db.relationship('DailyLog', backref='user', lazy=True, cascade='all, delete-orphan')
    predictions = db.relationship('RiskPrediction', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check if provided password matches hash"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """Convert user to dictionary"""
        return {
            'id': self.id,
            'email': self.email,
            'firstName': self.first_name,
            'lastName': self.last_name,
            'age': self.age,
            'breakInterval': self.break_interval,
            'breakDuration': self.break_duration,
            'notificationsEnabled': self.notifications_enabled,
            'emailAlerts': self.email_alerts,
            'darkMode': self.dark_mode,
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat(),
        }
    
    def __repr__(self):
        return f'<User {self.email}>'


class DailyLog(db.Model):
    """Daily health log model"""
    __tablename__ = 'daily_logs'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Screen time data
    screen_time_hours = db.Column(db.Float, nullable=False)  # Total hours
    breaks_taken = db.Column(db.Integer, default=0)  # Number of breaks
    
    # Symptom severity (0-3 scale)
    eye_strain_level = db.Column(db.Integer, nullable=False)  # 0=none, 1=mild, 2=moderate, 3=severe
    headaches_level = db.Column(db.Integer, nullable=False)
    blurry_vision_level = db.Column(db.Integer, nullable=False)
    dry_eyes_level = db.Column(db.Integer, nullable=False)
    
    # Environment
    screen_brightness = db.Column(db.Integer, default=75)  # 0-100 scale
    
    # Additional notes
    notes = db.Column(db.Text)
    
    # Metadata
    logged_date = db.Column(db.Date, nullable=False, index=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert daily log to dictionary"""
        return {
            'id': self.id,
            'userId': self.user_id,
            'screenTimeHours': self.screen_time_hours,
            'breaksTaken': self.breaks_taken,
            'eyeStrainLevel': self.eye_strain_level,
            'headachesLevel': self.headaches_level,
            'blurryVisionLevel': self.blurry_vision_level,
            'dryEyesLevel': self.dry_eyes_level,
            'screenBrightness': self.screen_brightness,
            'notes': self.notes,
            'loggedDate': self.logged_date.isoformat(),
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat(),
        }
    
    def __repr__(self):
        return f'<DailyLog {self.user_id} - {self.logged_date}>'


class RiskPrediction(db.Model):
    """AI risk prediction model"""
    __tablename__ = 'risk_predictions'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Prediction targets
    prediction_date = db.Column(db.Date, nullable=False)  # Which date is being predicted
    eye_strain_risk = db.Column(db.Float, nullable=False)  # 0-100 percentage
    fatigue_index = db.Column(db.Float, nullable=False)  # 0-100 scale
    risk_level = db.Column(db.String(20), nullable=False)  # healthy, warning, critical
    
    # Model metadata
    model_version = db.Column(db.String(50), default='1.0.0')
    accuracy_score = db.Column(db.Float)  # Model accuracy on test data
    data_points_used = db.Column(db.Integer)  # Number of historical logs used
    
    # Recommendations (JSON stored as text)
    recommendations = db.Column(db.Text)  # JSON string of recommendations
    
    # Metadata
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert prediction to dictionary"""
        import json
        return {
            'id': self.id,
            'userId': self.user_id,
            'predictionDate': self.prediction_date.isoformat(),
            'eyeStrainRisk': self.eye_strain_risk,
            'fatigueIndex': self.fatigue_index,
            'riskLevel': self.risk_level,
            'modelVersion': self.model_version,
            'accuracyScore': self.accuracy_score,
            'dataPointsUsed': self.data_points_used,
            'recommendations': json.loads(self.recommendations) if self.recommendations else [],
            'createdAt': self.created_at.isoformat(),
        }
    
    def __repr__(self):
        return f'<RiskPrediction {self.user_id} - {self.prediction_date}>'


class AuditLog(db.Model):
    """Audit log for tracking system actions"""
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    
    # Action details
    action = db.Column(db.String(100), nullable=False)  # e.g., 'login', 'data_export', 'model_train'
    resource = db.Column(db.String(100))  # e.g., 'daily_log', 'prediction'
    resource_id = db.Column(db.String(36))  # ID of the affected resource
    
    # Status
    status = db.Column(db.String(20), default='success')  # success, error, warning
    details = db.Column(db.Text)  # Additional details
    
    # Metadata
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    ip_address = db.Column(db.String(50))
    
    def __repr__(self):
        return f'<AuditLog {self.action} - {self.resource}>'
