"""
Validation Utilities
Common validation functions for input data
"""

import re

def validate_email(email):
    """Validate email format"""
    if not email or len(email) > 120:
        return False
    
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """
    Validate password strength
    Requirements:
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    """
    if not password:
        return 'Password is required'
    
    if len(password) < 8:
        return 'Password must be at least 8 characters long'
    
    if not re.search(r'[A-Z]', password):
        return 'Password must contain at least one uppercase letter'
    
    if not re.search(r'[a-z]', password):
        return 'Password must contain at least one lowercase letter'
    
    if not re.search(r'\d', password):
        return 'Password must contain at least one digit'
    
    return None

def validate_screen_time(hours):
    """Validate screen time input"""
    try:
        hours = float(hours)
        return 0 <= hours <= 24
    except (ValueError, TypeError):
        return False

def validate_symptom_level(level):
    """Validate symptom severity level (0-3 scale)"""
    try:
        level = int(level)
        return 0 <= level <= 3
    except (ValueError, TypeError):
        return False

def validate_brightness(brightness):
    """Validate screen brightness (0-100)"""
    try:
        brightness = int(brightness)
        return 0 <= brightness <= 100
    except (ValueError, TypeError):
        return False

def validate_daily_log_data(data):
    """
    Validate daily log form data
    Returns tuple: (is_valid, error_message)
    """
    errors = []
    
    # Screen time validation
    if 'screenTimeHours' not in data:
        errors.append('Screen time is required')
    elif not validate_screen_time(data['screenTimeHours']):
        errors.append('Invalid screen time value')
    
    # Breaks validation
    if 'breaksTaken' in data:
        try:
            breaks = int(data['breaksTaken'])
            if breaks < 0:
                errors.append('Breaks taken cannot be negative')
        except (ValueError, TypeError):
            errors.append('Invalid breaks value')
    
    # Symptom validations
    symptom_fields = [
        'eyeStrainLevel',
        'headachesLevel',
        'blurryVisionLevel',
        'dryEyesLevel'
    ]
    
    for field in symptom_fields:
        if field in data:
            if not validate_symptom_level(data[field]):
                errors.append(f'Invalid {field} value')
    
    # Brightness validation
    if 'screenBrightness' in data:
        if not validate_brightness(data['screenBrightness']):
            errors.append('Invalid brightness value')
    
    return len(errors) == 0, errors

def validate_settings_data(data):
    """
    Validate user settings data
    Returns tuple: (is_valid, error_message)
    """
    errors = []
    
    # Break interval validation
    if 'breakInterval' in data:
        try:
            interval = int(data['breakInterval'])
            if interval < 5 or interval > 120:
                errors.append('Break interval must be between 5 and 120 minutes')
        except (ValueError, TypeError):
            errors.append('Invalid break interval value')
    
    # Break duration validation
    if 'breakDuration' in data:
        try:
            duration = int(data['breakDuration'])
            if duration < 10 or duration > 300:
                errors.append('Break duration must be between 10 and 300 seconds')
        except (ValueError, TypeError):
            errors.append('Invalid break duration value')
    
    # Boolean validations
    bool_fields = ['notificationsEnabled', 'emailAlerts', 'darkMode']
    for field in bool_fields:
        if field in data:
            if not isinstance(data[field], bool):
                errors.append(f'Invalid {field} value')
    
    return len(errors) == 0, errors
