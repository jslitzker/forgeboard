"""
Authentication result classes for ForgeBoard.

This module contains classes that represent the results of authentication operations.
"""

from dataclasses import dataclass
from typing import Optional, Dict, Any
from enum import Enum


class AuthError(Enum):
    """Authentication error types."""
    INVALID_CREDENTIALS = "invalid_credentials"
    ACCOUNT_LOCKED = "account_locked"
    ACCOUNT_DISABLED = "account_disabled"
    TOKEN_EXPIRED = "token_expired"
    TOKEN_INVALID = "token_invalid"
    RATE_LIMITED = "rate_limited"
    UNKNOWN_ERROR = "unknown_error"


@dataclass
class AuthResult:
    """Result of an authentication operation."""
    success: bool
    user_id: Optional[int] = None
    username: Optional[str] = None
    email: Optional[str] = None
    display_name: Optional[str] = None
    is_admin: bool = False
    error: Optional[AuthError] = None
    error_message: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    
    @classmethod
    def success_result(cls, user_id: int, username: str, email: str, 
                      display_name: str, is_admin: bool = False, 
                      metadata: Optional[Dict[str, Any]] = None) -> 'AuthResult':
        """Create a successful authentication result."""
        return cls(
            success=True,
            user_id=user_id,
            username=username,
            email=email,
            display_name=display_name,
            is_admin=is_admin,
            metadata=metadata or {}
        )
    
    @classmethod
    def failure_result(cls, error: AuthError, 
                      error_message: Optional[str] = None,
                      metadata: Optional[Dict[str, Any]] = None) -> 'AuthResult':
        """Create a failed authentication result."""
        return cls(
            success=False,
            error=error,
            error_message=error_message,
            metadata=metadata or {}
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert the result to a dictionary for JSON serialization."""
        result = {
            'success': self.success,
            'user_id': self.user_id,
            'username': self.username,
            'email': self.email,
            'display_name': self.display_name,
            'is_admin': self.is_admin,
            'metadata': self.metadata
        }
        
        if not self.success:
            result['error'] = self.error.value if self.error else None
            result['error_message'] = self.error_message
        
        return result