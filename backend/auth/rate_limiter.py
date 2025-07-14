"""
Rate limiting implementation for ForgeBoard authentication.

This module provides a simple in-memory rate limiting system.
"""

import time
from collections import defaultdict, deque
from typing import Dict, Optional
from flask import request, current_app
from threading import Lock


class RateLimiter:
    """Simple in-memory rate limiter."""
    
    def __init__(self):
        """Initialize rate limiter."""
        self._requests = defaultdict(deque)
        self._lock = Lock()
    
    def is_allowed(self, key: str, limit: int, window: int) -> bool:
        """
        Check if request is allowed under rate limit.
        
        Args:
            key: Unique identifier for the rate limit (e.g., IP address or user ID)
            limit: Maximum number of requests
            window: Time window in seconds
        
        Returns:
            bool: True if request is allowed, False otherwise
        """
        now = time.time()
        
        with self._lock:
            # Get request history for this key
            request_times = self._requests[key]
            
            # Remove old requests outside the window
            while request_times and request_times[0] < now - window:
                request_times.popleft()
            
            # Check if we're under the limit
            if len(request_times) >= limit:
                return False
            
            # Add current request
            request_times.append(now)
            
            # Clean up old keys periodically
            self._cleanup_old_keys()
            
            return True
    
    def _cleanup_old_keys(self):
        """Clean up old keys to prevent memory leaks."""
        now = time.time()
        keys_to_remove = []
        
        for key, request_times in self._requests.items():
            # Remove requests older than 1 hour
            while request_times and request_times[0] < now - 3600:
                request_times.popleft()
            
            # If no recent requests, mark key for removal
            if not request_times:
                keys_to_remove.append(key)
        
        for key in keys_to_remove:
            del self._requests[key]
    
    def get_rate_limit_info(self, key: str, limit: int, window: int) -> Dict[str, int]:
        """
        Get rate limit information for a key.
        
        Args:
            key: Unique identifier for the rate limit
            limit: Maximum number of requests
            window: Time window in seconds
        
        Returns:
            Dict containing rate limit information
        """
        now = time.time()
        
        with self._lock:
            request_times = self._requests[key]
            
            # Remove old requests
            while request_times and request_times[0] < now - window:
                request_times.popleft()
            
            remaining = max(0, limit - len(request_times))
            reset_time = int(request_times[0] + window) if request_times else int(now)
            
            return {
                'limit': limit,
                'remaining': remaining,
                'reset': reset_time,
                'window': window
            }
    
    def clear_key(self, key: str):
        """Clear rate limit for a specific key."""
        with self._lock:
            if key in self._requests:
                del self._requests[key]


# Global rate limiter instance
_rate_limiter = RateLimiter()


def get_rate_limit_key(request) -> str:
    """
    Generate a rate limit key for the current request.
    
    Args:
        request: Flask request object
    
    Returns:
        str: Rate limit key
    """
    # Try to get user ID from session if authenticated
    try:
        from .middleware import get_current_user_id
        user_id = get_current_user_id()
        if user_id:
            return f"user:{user_id}"
    except:
        pass
    
    # Fall back to IP address
    ip_address = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
    if ip_address:
        # Handle comma-separated IPs (proxies)
        ip_address = ip_address.split(',')[0].strip()
    
    return f"ip:{ip_address}"


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
    return _rate_limiter.is_allowed(key, limit, window)


def get_rate_limit_info(key: str, limit: int, window: int) -> Dict[str, int]:
    """
    Get rate limit information.
    
    Args:
        key: Rate limit key
        limit: Maximum requests
        window: Time window in seconds
    
    Returns:
        Dict containing rate limit information
    """
    return _rate_limiter.get_rate_limit_info(key, limit, window)


def clear_rate_limit(key: str):
    """
    Clear rate limit for a key.
    
    Args:
        key: Rate limit key to clear
    """
    _rate_limiter.clear_key(key)


class RateLimitExceeded(Exception):
    """Exception raised when rate limit is exceeded."""
    
    def __init__(self, limit: int, window: int, reset_time: int):
        """Initialize rate limit exception."""
        self.limit = limit
        self.window = window
        self.reset_time = reset_time
        super().__init__(f"Rate limit exceeded: {limit} requests per {window} seconds")


def rate_limit_decorator(limit: int, window: int, key_func=None):
    """
    Decorator for rate limiting endpoints.
    
    Args:
        limit: Maximum number of requests
        window: Time window in seconds
        key_func: Optional function to generate rate limit key
    
    Returns:
        Decorator function
    """
    def decorator(f):
        def wrapper(*args, **kwargs):
            # Generate rate limit key
            if key_func:
                key = key_func()
            else:
                key = get_rate_limit_key(request)
            
            # Check rate limit
            if not check_rate_limit(key, limit, window):
                rate_info = get_rate_limit_info(key, limit, window)
                raise RateLimitExceeded(limit, window, rate_info['reset'])
            
            # Call the original function
            return f(*args, **kwargs)
        
        wrapper.__name__ = f.__name__
        wrapper.__doc__ = f.__doc__
        return wrapper
    
    return decorator


# Common rate limit configurations
AUTH_RATE_LIMIT = (5, 60)  # 5 requests per minute for auth endpoints
API_RATE_LIMIT = (100, 60)  # 100 requests per minute for API endpoints
STRICT_RATE_LIMIT = (1, 60)  # 1 request per minute for sensitive endpoints


def apply_rate_limit_headers(response, rate_info: Dict[str, int]):
    """
    Apply rate limit headers to response.
    
    Args:
        response: Flask response object
        rate_info: Rate limit information
    """
    response.headers['X-RateLimit-Limit'] = str(rate_info['limit'])
    response.headers['X-RateLimit-Remaining'] = str(rate_info['remaining'])
    response.headers['X-RateLimit-Reset'] = str(rate_info['reset'])
    response.headers['X-RateLimit-Window'] = str(rate_info['window'])
    
    return response