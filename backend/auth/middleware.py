"""
Authentication middleware for ForgeBoard.

This module provides middleware for handling authentication and authorization.
"""

from functools import wraps
from typing import Optional, List, Callable
from flask import request, jsonify, g, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

from database.models.user import User
from .session_manager import SessionManager
from .api_key_manager import APIKeyManager
from .models.auth_result import AuthResult, AuthError


class AuthenticationMiddleware:
    """Middleware for handling authentication."""
    
    def __init__(self, session_manager: SessionManager, api_key_manager: APIKeyManager):
        """Initialize authentication middleware."""
        self.session_manager = session_manager
        self.api_key_manager = api_key_manager
    
    def authenticate_request(self, request) -> Optional[AuthResult]:
        """
        Authenticate a request using JWT token or API key.
        
        Args:
            request: Flask request object
        
        Returns:
            AuthResult: Authentication result or None if no authentication
        """
        # Try JWT token first
        jwt_token = self.session_manager.extract_token_from_request(request)
        if jwt_token:
            return self.session_manager.validate_session(jwt_token)
        
        # Try API key
        api_key = self._extract_api_key_from_request(request)
        if api_key:
            return self.api_key_manager.validate_api_key(api_key)
        
        return None
    
    def _extract_api_key_from_request(self, request) -> Optional[str]:
        """Extract API key from request."""
        # Check Authorization header
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Api-Key '):
            return auth_header.split(' ')[1]
        
        # Check X-API-Key header
        api_key = request.headers.get('X-API-Key')
        if api_key:
            return api_key
        
        # Check query parameter
        api_key = request.args.get('api_key')
        if api_key:
            return api_key
        
        return None
    
    def set_current_user(self, auth_result: AuthResult):
        """Set current user in Flask's g object."""
        if auth_result.success:
            g.current_user_id = auth_result.user_id
            g.current_user_email = auth_result.email
            g.current_user_username = auth_result.username
            g.current_user_display_name = auth_result.display_name
            g.current_user_is_admin = auth_result.is_admin
            g.auth_metadata = auth_result.metadata
        else:
            g.current_user_id = None
            g.current_user_email = None
            g.current_user_username = None
            g.current_user_display_name = None
            g.current_user_is_admin = False
            g.auth_metadata = {}


# Global middleware instance (will be initialized in main.py)
auth_middleware = None


def init_auth_middleware(session_manager: SessionManager, api_key_manager: APIKeyManager):
    """Initialize global authentication middleware."""
    global auth_middleware
    auth_middleware = AuthenticationMiddleware(session_manager, api_key_manager)


def get_current_user() -> Optional[User]:
    """Get current authenticated user."""
    user_id = getattr(g, 'current_user_id', None)
    if user_id:
        return User.query.get(user_id)
    return None


def get_current_user_id() -> Optional[int]:
    """Get current authenticated user ID."""
    return getattr(g, 'current_user_id', None)


def is_authenticated() -> bool:
    """Check if current request is authenticated."""
    return getattr(g, 'current_user_id', None) is not None


def is_admin() -> bool:
    """Check if current user is admin."""
    return getattr(g, 'current_user_is_admin', False)


def get_auth_metadata() -> dict:
    """Get authentication metadata."""
    return getattr(g, 'auth_metadata', {})


def auth_required(f: Callable) -> Callable:
    """
    Decorator that requires authentication.
    
    This decorator will authenticate the request and set the current user.
    If authentication fails, it returns a 401 error.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not auth_middleware:
            return jsonify({'error': 'authentication_not_configured'}), 500
        
        auth_result = auth_middleware.authenticate_request(request)
        if not auth_result or not auth_result.success:
            error_msg = auth_result.error_message if auth_result else "Authentication required"
            error_code = auth_result.error.value if auth_result and auth_result.error else "authentication_required"
            return jsonify({'error': error_code, 'message': error_msg}), 401
        
        auth_middleware.set_current_user(auth_result)
        return f(*args, **kwargs)
    
    return decorated_function


def admin_required(f: Callable) -> Callable:
    """
    Decorator that requires admin authentication.
    
    This decorator will authenticate the request and check for admin privileges.
    If authentication fails or user is not admin, it returns an error.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not auth_middleware:
            return jsonify({'error': 'authentication_not_configured'}), 500
        
        auth_result = auth_middleware.authenticate_request(request)
        if not auth_result or not auth_result.success:
            error_msg = auth_result.error_message if auth_result else "Authentication required"
            error_code = auth_result.error.value if auth_result and auth_result.error else "authentication_required"
            return jsonify({'error': error_code, 'message': error_msg}), 401
        
        if not auth_result.is_admin:
            return jsonify({'error': 'admin_required', 'message': 'Admin privileges required'}), 403
        
        auth_middleware.set_current_user(auth_result)
        return f(*args, **kwargs)
    
    return decorated_function


def permission_required(permissions: List[str]) -> Callable:
    """
    Decorator that requires specific permissions.
    
    Args:
        permissions: List of required permissions
    
    Returns:
        Decorator function
    """
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not auth_middleware:
                return jsonify({'error': 'authentication_not_configured'}), 500
            
            auth_result = auth_middleware.authenticate_request(request)
            if not auth_result or not auth_result.success:
                error_msg = auth_result.error_message if auth_result else "Authentication required"
                error_code = auth_result.error.value if auth_result and auth_result.error else "authentication_required"
                return jsonify({'error': error_code, 'message': error_msg}), 401
            
            # Check permissions
            auth_metadata = auth_result.metadata or {}
            user_permissions = auth_metadata.get('api_key_permissions', [])
            
            # If authenticated via session, get user permissions
            if not user_permissions:
                user = User.query.get(auth_result.user_id)
                if user:
                    user_permissions = user.get_permissions()
            
            # Check if user has all required permissions
            for permission in permissions:
                if permission not in user_permissions:
                    return jsonify({
                        'error': 'insufficient_permissions',
                        'message': f'Permission "{permission}" required'
                    }), 403
            
            auth_middleware.set_current_user(auth_result)
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator


def optional_auth(f: Callable) -> Callable:
    """
    Decorator that provides optional authentication.
    
    This decorator will authenticate the request if credentials are provided,
    but will not fail if no authentication is present.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if auth_middleware:
            auth_result = auth_middleware.authenticate_request(request)
            if auth_result and auth_result.success:
                auth_middleware.set_current_user(auth_result)
        
        return f(*args, **kwargs)
    
    return decorated_function


def rate_limit_key() -> str:
    """
    Generate a rate limit key for the current request.
    
    Returns:
        str: Rate limit key based on user or IP
    """
    user_id = get_current_user_id()
    if user_id:
        return f"user:{user_id}"
    
    # Fall back to IP address
    ip_address = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
    return f"ip:{ip_address}"


def log_auth_event(event_type: str, user_id: int = None, details: dict = None):
    """
    Log authentication event for audit purposes.
    
    Args:
        event_type: Type of authentication event
        user_id: ID of the user (if available)
        details: Additional event details
    """
    try:
        from database.models.audit_log import AuditLog
        
        ip_address = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
        user_agent = request.headers.get('User-Agent', '')
        
        audit_log = AuditLog(
            user_id=user_id,
            action=event_type,
            resource_type='authentication',
            details=details,
            ip_address=ip_address,
            user_agent=user_agent
        )
        audit_log.save()
    
    except Exception as e:
        current_app.logger.error(f"Failed to log auth event: {str(e)}")


class RateLimitError(Exception):
    """Exception raised when rate limit is exceeded."""
    pass


def check_rate_limit(key: str, limit: int, window: int) -> bool:
    """
    Check if request is within rate limit.
    
    Args:
        key: Rate limit key
        limit: Maximum requests
        window: Time window in seconds
    
    Returns:
        bool: True if within limit, False otherwise
    """
    from .rate_limiter import check_rate_limit as _check_rate_limit
    return _check_rate_limit(key, limit, window)