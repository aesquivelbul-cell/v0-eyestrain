"""
Routes package
Import all blueprints here for registration in app.py
"""

from .auth import auth_bp
from .users import users_bp
from .logs import logs_bp
from .predictions import predictions_bp
from .analytics import analytics_bp

__all__ = [
    'auth_bp',
    'users_bp',
    'logs_bp',
    'predictions_bp',
    'analytics_bp',
]
