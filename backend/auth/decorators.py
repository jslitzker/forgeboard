"""
Authentication decorators for ForgeBoard.

This module provides convenient decorators for authentication and authorization.
"""

from functools import wraps
from typing import List, Callable, Optional
from flask import jsonify, request, current_app

from .middleware import (
    auth_required, admin_required, permission_required, optional_auth,
    get_current_user, get_current_user_id, is_authenticated, is_admin,
    rate_limit_key, log_auth_event, RateLimitError
)
from .rate_limiter import check_rate_limit, get_rate_limit_info, RateLimitExceeded


def require_auth(f: Callable) -> Callable:
    """
    Decorator that requires authentication.
    Alias for auth_required for convenience.
    """
    return auth_required(f)


def require_admin(f: Callable) -> Callable:
    """
    Decorator that requires admin privileges.
    Alias for admin_required for convenience.
    """
    return admin_required(f)


def require_permissions(*permissions: str) -> Callable:
    """
    Decorator that requires specific permissions.
    
    Args:
        *permissions: Required permissions
    
    Returns:
        Decorator function
    """
    return permission_required(list(permissions))


def rate_limited(limit: int, window: int = 60, key_func: Optional[Callable] = None) -> Callable:
    """
    Decorator that applies rate limiting to an endpoint.
    
    Args:
        limit: Maximum number of requests
        window: Time window in seconds (default: 60)
        key_func: Function to generate rate limit key (default: rate_limit_key)
    
    Returns:
        Decorator function
    """
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if key_func:
                key = key_func()
            else:
                key = rate_limit_key()
            
            if not check_rate_limit(key, limit, window):
                rate_info = get_rate_limit_info(key, limit, window)
                response = jsonify({
                    'error': 'rate_limit_exceeded',
                    'message': f'Rate limit exceeded: {limit} requests per {window} seconds',
                    'retry_after': rate_info['reset']
                })
                response.status_code = 429
                response.headers['X-RateLimit-Limit'] = str(limit)
                response.headers['X-RateLimit-Remaining'] = '0'
                response.headers['X-RateLimit-Reset'] = str(rate_info['reset'])
                response.headers['Retry-After'] = str(rate_info['reset'])
                return response
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator


def audit_log(event_type: str, include_request_data: bool = False) -> Callable:
    """
    Decorator that logs authentication events.
    
    Args:
        event_type: Type of event to log
        include_request_data: Whether to include request data in log
    
    Returns:
        Decorator function
    """
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user_id = get_current_user_id()
            
            details = {'endpoint': request.endpoint}
            if include_request_data:
                details['method'] = request.method
                details['path'] = request.path
                details['args'] = dict(request.args)
            
            log_auth_event(event_type, user_id, details)
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator


def local_auth_only(f: Callable) -> Callable:
    """
    Decorator that only allows local authentication (not API keys).
    
    This is useful for sensitive operations like password changes.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not is_authenticated():
            return jsonify({'error': 'authentication_required'}), 401
        
        from .middleware import get_auth_metadata
        auth_metadata = get_auth_metadata()
        
        # Check if authenticated via API key
        if auth_metadata.get('auth_method') == 'api_key':
            return jsonify({
                'error': 'session_required',
                'message': 'This action requires session authentication, not API key'
            }), 403
        
        return f(*args, **kwargs)
    
    return decorated_function


def api_key_only(f: Callable) -> Callable:
    """
    Decorator that only allows API key authentication.
    
    This is useful for programmatic endpoints.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not is_authenticated():
            return jsonify({'error': 'authentication_required'}), 401
        
        from .middleware import get_auth_metadata
        auth_metadata = get_auth_metadata()
        
        # Check if authenticated via API key
        if auth_metadata.get('auth_method') != 'api_key':
            return jsonify({
                'error': 'api_key_required',
                'message': 'This action requires API key authentication'
            }), 403
        
        return f(*args, **kwargs)
    
    return decorated_function


def self_or_admin(user_id_param: str = 'user_id') -> Callable:
    """
    Decorator that allows access if user is admin or accessing their own data.
    
    Args:
        user_id_param: Name of the parameter containing user ID
    
    Returns:
        Decorator function
    """
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not is_authenticated():
                return jsonify({'error': 'authentication_required'}), 401
            
            current_user_id = get_current_user_id()
            target_user_id = kwargs.get(user_id_param)
            
            # Allow if admin or accessing own data
            if is_admin() or current_user_id == target_user_id:
                return f(*args, **kwargs)
            
            return jsonify({
                'error': 'access_denied',
                'message': 'You can only access your own data'
            }), 403
        
        return decorated_function
    return decorator


def validate_json_content(f: Callable) -> Callable:
    """
    Decorator that validates JSON content type and parses JSON data.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if request.content_type != 'application/json':
            return jsonify({
                'error': 'invalid_content_type',
                'message': 'Content-Type must be application/json'
            }), 400
        
        try:
            if request.get_json() is None:
                return jsonify({
                    'error': 'invalid_json',
                    'message': 'Invalid JSON in request body'
                }), 400
        except Exception:
            return jsonify({
                'error': 'invalid_json',
                'message': 'Invalid JSON in request body'
            }), 400
        
        return f(*args, **kwargs)
    
    return decorated_function


def require_fields(*fields: str) -> Callable:
    """
    Decorator that requires specific fields in JSON request.
    
    Args:
        *fields: Required field names
    
    Returns:
        Decorator function
    """
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated_function(*args, **kwargs):
            data = request.get_json()
            if not data:
                return jsonify({
                    'error': 'missing_json_data',
                    'message': 'JSON data required'
                }), 400
            
            missing_fields = []
            for field in fields:
                if field not in data or data[field] is None:
                    missing_fields.append(field)
            
            if missing_fields:
                return jsonify({
                    'error': 'missing_required_fields',
                    'message': f'Missing required fields: {", ".join(missing_fields)}'
                }), 400
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator


def handle_auth_errors(f: Callable) -> Callable:
    """
    Decorator that handles authentication errors gracefully.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            current_app.logger.error(f"Authentication error in {f.__name__}: {str(e)}")
            
            # Map common exceptions to appropriate HTTP responses
            if isinstance(e, RateLimitError):
                return jsonify({
                    'error': 'rate_limit_exceeded',
                    'message': str(e)
                }), 429
            
            # Generic error response
            return jsonify({
                'error': 'authentication_error',
                'message': 'An authentication error occurred'
            }), 500
    
    return decorated_function


# Convenience decorators for common permission combinations
def require_read_permission(f: Callable) -> Callable:
    """Decorator that requires read permission."""
    return require_permissions('read')(f)


def require_write_permission(f: Callable) -> Callable:
    """Decorator that requires write permission."""
    return require_permissions('write')(f)


def require_user_management_permission(f: Callable) -> Callable:
    """Decorator that requires user management permission."""
    return require_permissions('user_management')(f)


# Rate limiting presets
def auth_rate_limit(f: Callable) -> Callable:
    """Apply authentication-specific rate limiting (5 requests per minute)."""
    return rate_limited(5, 60)(f)


def api_rate_limit(f: Callable) -> Callable:
    """Apply API-specific rate limiting (100 requests per minute)."""
    return rate_limited(100, 60)(f)


def strict_rate_limit(f: Callable) -> Callable:
    """Apply strict rate limiting (1 request per minute)."""
    return rate_limited(1, 60)(f)