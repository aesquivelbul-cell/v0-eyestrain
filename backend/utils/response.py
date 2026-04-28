"""
Response Formatting Utilities
Standardized response format for all API endpoints
"""

from flask import jsonify

def success_response(data, message='Success', status_code=200):
    """
    Format successful response
    
    Args:
        data: Response data (dict, list, or any JSON-serializable object)
        message: Optional success message
        status_code: HTTP status code (default: 200)
    
    Returns:
        Flask jsonify response with status code
    """
    response = {
        'success': True,
        'message': message,
        'data': data
    }
    return jsonify(response), status_code

def error_response(message, status_code=400, errors=None, data=None):
    """
    Format error response
    
    Args:
        message: Error message
        status_code: HTTP status code (default: 400)
        errors: Optional list of detailed errors
        data: Optional additional data
    
    Returns:
        Flask jsonify response with status code
    """
    response = {
        'success': False,
        'message': message,
    }
    
    if errors:
        response['errors'] = errors
    
    if data:
        response['data'] = data
    
    return jsonify(response), status_code

def paginated_response(items, total, page, page_size, message='Success', status_code=200):
    """
    Format paginated response
    
    Args:
        items: List of items for current page
        total: Total number of items
        page: Current page number
        page_size: Items per page
        message: Optional success message
        status_code: HTTP status code
    
    Returns:
        Flask jsonify response with pagination metadata
    """
    total_pages = (total + page_size - 1) // page_size
    
    response = {
        'success': True,
        'message': message,
        'data': items,
        'pagination': {
            'total': total,
            'page': page,
            'pageSize': page_size,
            'totalPages': total_pages,
            'hasNextPage': page < total_pages,
            'hasPreviousPage': page > 1,
        }
    }
    
    return jsonify(response), status_code

def validation_error_response(errors, status_code=400):
    """
    Format validation error response
    
    Args:
        errors: List of error messages or dict of field errors
        status_code: HTTP status code (default: 400)
    
    Returns:
        Flask jsonify response
    """
    if isinstance(errors, list):
        error_data = {'general': errors}
    else:
        error_data = errors
    
    response = {
        'success': False,
        'message': 'Validation failed',
        'errors': error_data
    }
    
    return jsonify(response), status_code
