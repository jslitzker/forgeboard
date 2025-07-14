"""
Base authentication provider interface for ForgeBoard.

This module defines the abstract base class that all authentication providers must implement.
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from ..models.auth_result import AuthResult


class AuthProvider(ABC):
    """Base class for all authentication providers."""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize the authentication provider with configuration."""
        self.config = config
    
    @abstractmethod
    def authenticate(self, credentials: Dict[str, Any]) -> AuthResult:
        """
        Authenticate a user with the provided credentials.
        
        Args:
            credentials: Dictionary containing authentication credentials
                        (e.g., {'username': 'user', 'password': 'pass'})
        
        Returns:
            AuthResult: Result of the authentication attempt
        """
        pass
    
    @abstractmethod
    def get_user_info(self, user_id: int) -> Optional[Dict[str, Any]]:
        """
        Get user information by user ID.
        
        Args:
            user_id: ID of the user
        
        Returns:
            Dict containing user information or None if not found
        """
        pass
    
    @abstractmethod
    def validate_token(self, token: str) -> AuthResult:
        """
        Validate an authentication token.
        
        Args:
            token: Token to validate
        
        Returns:
            AuthResult: Result of token validation
        """
        pass
    
    @abstractmethod
    def refresh_token(self, refresh_token: str) -> Optional[Dict[str, Any]]:
        """
        Refresh an authentication token.
        
        Args:
            refresh_token: Token to refresh
        
        Returns:
            Dict containing new token information or None if failed
        """
        pass
    
    @abstractmethod
    def get_login_url(self) -> Optional[str]:
        """
        Get the login URL for OAuth providers.
        
        Returns:
            Login URL string or None for local providers
        """
        pass
    
    @abstractmethod
    def handle_callback(self, callback_data: Dict[str, Any]) -> AuthResult:
        """
        Handle OAuth callback for external providers.
        
        Args:
            callback_data: Data from OAuth callback
        
        Returns:
            AuthResult: Result of callback handling
        """
        pass
    
    @abstractmethod
    def change_password(self, user_id: int, old_password: str, 
                       new_password: str) -> AuthResult:
        """
        Change a user's password.
        
        Args:
            user_id: ID of the user
            old_password: Current password
            new_password: New password
        
        Returns:
            AuthResult: Result of password change
        """
        pass
    
    @abstractmethod
    def reset_password(self, email: str) -> bool:
        """
        Initiate password reset for a user.
        
        Args:
            email: Email address of the user
        
        Returns:
            bool: True if reset was initiated successfully
        """
        pass
    
    @abstractmethod
    def complete_password_reset(self, token: str, new_password: str) -> AuthResult:
        """
        Complete password reset with token.
        
        Args:
            token: Password reset token
            new_password: New password
        
        Returns:
            AuthResult: Result of password reset
        """
        pass
    
    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Get the name of this authentication provider."""
        pass
    
    @property
    @abstractmethod
    def supports_registration(self) -> bool:
        """Check if this provider supports user registration."""
        pass
    
    @property
    @abstractmethod
    def supports_password_reset(self) -> bool:
        """Check if this provider supports password reset."""
        pass