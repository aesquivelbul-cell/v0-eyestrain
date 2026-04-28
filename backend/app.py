"""
EyeGuard Flask Application
Main entry point for the backend API
"""

from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
import os
from datetime import timedelta

# Initialize extensions
db = SQLAlchemy()
jwt = JWTManager()

def create_app(config_name='development'):
    """Application factory function"""
    app = Flask(__name__)
    
    # Load configuration
    if config_name == 'production':
        from config import ProductionConfig
        app.config.from_object(ProductionConfig)
    else:
        from config import DevelopmentConfig
        app.config.from_object(DevelopmentConfig)
    
    # Initialize extensions with app
    db.init_app(app)
    jwt.init_app(app)
    
    # Enable CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Register blueprints
    register_blueprints(app)
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    # Error handlers
    register_error_handlers(app)
    
    return app

def register_blueprints(app):
    """Register all API blueprints"""
    from routes.auth import auth_bp
    from routes.users import users_bp
    from routes.logs import logs_bp
    from routes.predictions import predictions_bp
    from routes.analytics import analytics_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(logs_bp, url_prefix='/api/logs')
    app.register_blueprint(predictions_bp, url_prefix='/api/predictions')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')

def register_error_handlers(app):
    """Register error handlers"""
    @app.errorhandler(400)
    def bad_request(error):
        return {
            'success': False,
            'message': 'Bad request',
            'error': str(error)
        }, 400
    
    @app.errorhandler(401)
    def unauthorized(error):
        return {
            'success': False,
            'message': 'Unauthorized',
            'error': str(error)
        }, 401
    
    @app.errorhandler(404)
    def not_found(error):
        return {
            'success': False,
            'message': 'Resource not found',
            'error': str(error)
        }, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return {
            'success': False,
            'message': 'Internal server error',
            'error': str(error)
        }, 500

if __name__ == '__main__':
    app = create_app('development')
    app.run(debug=True, host='0.0.0.0', port=5000)
