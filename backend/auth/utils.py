"""
Authentication utility functions for ForgeBoard.

This module provides utility functions for authentication and security.
"""

import secrets
import string
import hashlib
import hmac
import time
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from flask import current_app


def generate_secure_token(length: int = 32) -> str:
    """
    Generate a secure random token.
    
    Args:
        length: Length of the token in bytes
    
    Returns:
        str: URL-safe base64 encoded token
    """
    return secrets.token_urlsafe(length)


def generate_password(length: int = 12) -> str:
    """
    Generate a secure random password.
    
    Args:
        length: Length of the password
    
    Returns:
        str: Random password
    """
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def hash_password(password: str, salt: Optional[str] = None) -> str:
    """
    Hash a password with salt.
    
    Args:
        password: Password to hash
        salt: Salt to use (generates new one if not provided)
    
    Returns:
        str: Hashed password with salt
    """
    if salt is None:
        salt = secrets.token_hex(32)
    
    # Use PBKDF2 with SHA-256
    password_hash = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000  # 100k iterations
    )
    
    return f"{salt}:{password_hash.hex()}"


def verify_password(password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.
    
    Args:
        password: Password to verify
        hashed_password: Stored password hash
    
    Returns:
        bool: True if password matches
    """
    try:
        salt, stored_hash = hashed_password.split(':', 1)
        
        password_hash = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt.encode('utf-8'),
            100000
        )
        
        return hmac.compare_digest(stored_hash, password_hash.hex())
    except Exception:
        return False


def hash_api_key(api_key: str) -> str:
    """
    Hash an API key for storage.
    
    Args:
        api_key: API key to hash
    
    Returns:
        str: Hashed API key
    """
    return hashlib.sha256(api_key.encode('utf-8')).hexdigest()


def verify_api_key(api_key: str, hashed_key: str) -> bool:
    """
    Verify an API key against its hash.
    
    Args:
        api_key: API key to verify
        hashed_key: Stored API key hash
    
    Returns:
        bool: True if API key matches
    """
    return hmac.compare_digest(hashed_key, hash_api_key(api_key))


def generate_session_fingerprint(request) -> str:
    """
    Generate a session fingerprint based on request properties.
    
    Args:
        request: Flask request object
    
    Returns:
        str: Session fingerprint
    """
    fingerprint_data = [
        request.headers.get('User-Agent', ''),
        request.headers.get('Accept-Language', ''),
        request.headers.get('Accept-Encoding', ''),
        request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
    ]
    
    fingerprint_string = '|'.join(fingerprint_data)
    return hashlib.sha256(fingerprint_string.encode('utf-8')).hexdigest()


def is_safe_url(url: str) -> bool:
    """
    Check if a URL is safe for redirects.
    
    Args:
        url: URL to check
    
    Returns:
        bool: True if URL is safe
    """
    if not url:
        return False
    
    # Only allow relative URLs or same-origin URLs
    if url.startswith('/'):
        return True
    
    # Check if URL is from same origin
    from urllib.parse import urlparse
    parsed = urlparse(url)
    
    # No scheme or netloc means it's relative
    if not parsed.scheme and not parsed.netloc:
        return True
    
    # Allow https URLs from same domain
    if parsed.scheme == 'https' and parsed.netloc == current_app.config.get('SERVER_NAME'):
        return True
    
    return False


def get_client_ip(request) -> str:
    """
    Get client IP address from request.
    
    Args:
        request: Flask request object
    
    Returns:
        str: Client IP address
    """
    # Check for forwarded headers
    forwarded_for = request.headers.get('X-Forwarded-For')
    if forwarded_for:
        # Take the first IP in the chain
        return forwarded_for.split(',')[0].strip()
    
    forwarded = request.headers.get('X-Forwarded')
    if forwarded:
        return forwarded.split(',')[0].strip()
    
    # Fall back to remote address
    return request.remote_addr or 'unknown'


def get_user_agent(request) -> str:
    """
    Get user agent from request.
    
    Args:
        request: Flask request object
    
    Returns:
        str: User agent string
    """
    return request.headers.get('User-Agent', 'Unknown')


def generate_csrf_token() -> str:
    """
    Generate a CSRF token.
    
    Returns:
        str: CSRF token
    """
    return generate_secure_token(32)


def validate_csrf_token(token: str, session_token: str) -> bool:
    """
    Validate CSRF token.
    
    Args:
        token: CSRF token to validate
        session_token: Session token for comparison
    
    Returns:
        bool: True if valid
    """
    if not token or not session_token:
        return False
    
    # For now, just do string comparison
    # In production, you might want more sophisticated validation
    return hmac.compare_digest(token, session_token)


def sanitize_user_input(input_string: str) -> str:
    """
    Sanitize user input to prevent XSS and injection attacks.
    
    Args:
        input_string: Input string to sanitize
    
    Returns:
        str: Sanitized string
    """
    if not input_string:
        return ''
    
    # Remove potentially dangerous characters
    dangerous_chars = ['<', '>', '"', "'", '&', '\x00']
    for char in dangerous_chars:
        input_string = input_string.replace(char, '')
    
    return input_string.strip()


def validate_email_format(email: str) -> bool:
    """
    Validate email format.
    
    Args:
        email: Email to validate
    
    Returns:
        bool: True if valid email format
    """
    if not email:
        return False
    
    # Basic email validation
    import re
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(email_pattern, email) is not None


def validate_username_format(username: str) -> bool:
    """
    Validate username format.
    
    Args:
        username: Username to validate
    
    Returns:
        bool: True if valid username format
    """
    if not username:
        return False
    
    # Username should be 3-50 characters, alphanumeric with underscores and hyphens
    import re
    username_pattern = r'^[a-zA-Z0-9_-]{3,50}$'
    return re.match(username_pattern, username) is not None


def validate_password_strength(password: str) -> Dict[str, Any]:
    """
    Validate password strength.
    
    Args:
        password: Password to validate
    
    Returns:
        Dict containing validation results
    """
    if not password:
        return {
            'valid': False,
            'score': 0,
            'feedback': ['Password is required']
        }
    
    feedback = []
    score = 0
    
    # Length check
    if len(password) < 8:
        feedback.append('Password must be at least 8 characters long')
    else:
        score += 1
    
    # Character variety checks
    import re
    
    if not re.search(r'[a-z]', password):
        feedback.append('Password must contain at least one lowercase letter')
    else:
        score += 1
    
    if not re.search(r'[A-Z]', password):
        feedback.append('Password must contain at least one uppercase letter')
    else:
        score += 1
    
    if not re.search(r'[0-9]', password):
        feedback.append('Password must contain at least one number')
    else:
        score += 1
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        feedback.append('Password should contain at least one special character')
    else:
        score += 1
    
    # Common password check
    common_passwords = [
        'password', '123456', 'password123', 'admin', 'qwerty',
        'letmein', 'welcome', 'monkey', '1234567890'
    ]
    
    if password.lower() in common_passwords:
        feedback.append('Password is too common')
        score = max(0, score - 2)
    
    # Length bonus
    if len(password) >= 12:
        score += 1
    
    return {
        'valid': len(feedback) == 0,
        'score': min(score, 5),  # Max score of 5
        'feedback': feedback
    }


def time_constant_compare(a: str, b: str) -> bool:
    """
    Compare two strings in constant time to prevent timing attacks.
    
    Args:
        a: First string
        b: Second string
    
    Returns:
        bool: True if strings are equal
    """
    return hmac.compare_digest(a, b)


def generate_totp_secret() -> str:
    """
    Generate a TOTP secret key.
    
    Returns:
        str: Base32 encoded secret key
    """
    import base64
    secret = secrets.token_bytes(32)
    return base64.b32encode(secret).decode('utf-8')


def verify_totp_token(secret: str, token: str, window: int = 1) -> bool:
    """
    Verify a TOTP token.
    
    Args:
        secret: Base32 encoded secret key
        token: TOTP token to verify
        window: Time window to check (default: 1)
    
    Returns:
        bool: True if token is valid
    """
    try:
        import pyotp
        totp = pyotp.TOTP(secret)
        return totp.verify(token, valid_window=window)
    except ImportError:
        # pyotp not available, return False
        return False
    except Exception:
        return False


def mask_sensitive_data(data: str, mask_char: str = '*', visible_chars: int = 4) -> str:
    """
    Mask sensitive data for logging.
    
    Args:
        data: Sensitive data to mask
        mask_char: Character to use for masking
        visible_chars: Number of characters to leave visible
    
    Returns:
        str: Masked data
    """
    if not data:
        return ''
    
    if len(data) <= visible_chars:
        return mask_char * len(data)
    
    return data[:visible_chars] + mask_char * (len(data) - visible_chars)


def log_security_event(event_type: str, user_id: Optional[int] = None, 
                      ip_address: Optional[str] = None, details: Optional[Dict] = None):
    """
    Log security-related events.
    
    Args:
        event_type: Type of security event
        user_id: User ID (if applicable)
        ip_address: IP address
        details: Additional details
    """
    try:
        log_data = {
            'event_type': event_type,
            'user_id': user_id,
            'ip_address': ip_address,
            'timestamp': datetime.utcnow().isoformat(),
            'details': details or {}
        }
        
        current_app.logger.info(f"Security event: {log_data}")
    except Exception as e:
        current_app.logger.error(f"Failed to log security event: {str(e)}")


def get_password_policy() -> Dict[str, Any]:
    """
    Get password policy configuration.
    
    Returns:
        Dict containing password policy settings
    """
    return {
        'min_length': 8,
        'require_uppercase': True,
        'require_lowercase': True,
        'require_numbers': True,
        'require_special': False,
        'max_age_days': 90,
        'history_count': 5
    }


def check_password_history(user_id: int, new_password: str) -> bool:
    """
    Check if password has been used recently.
    
    Args:
        user_id: User ID
        new_password: New password to check
    
    Returns:
        bool: True if password is allowed (not in history)
    """
    # This would need to be implemented with a password history table
    # For now, just return True
    return True