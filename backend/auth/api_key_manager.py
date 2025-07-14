"""
API Key management system for ForgeBoard authentication.

This module handles API key generation, validation, and management.
"""

import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List, Tuple
from flask import current_app

from database.models.api_key import ApiKey
from database.models.user import User
from .models.auth_result import AuthResult, AuthError


class APIKeyManager:
    """Manages API keys for programmatic access."""
    
    def __init__(self, config: Dict[str, Any] = None):
        """Initialize API key manager."""
        self.config = config or {}
        
        # API key configuration
        self.enabled = self.config.get('enabled', True)
        self.max_per_user = self.config.get('max_per_user', 5)
        self.default_expiry = self.config.get('default_expiry', None)  # None = no expiry
        
        # Default permissions
        self.default_permissions = ['read']
        self.available_permissions = ['read', 'write', 'admin', 'user_management']
    
    def create_api_key(self, user_id: int, name: str, permissions: List[str] = None, 
                      expires_days: int = None) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
        """
        Create a new API key for a user.
        
        Args:
            user_id: ID of the user
            name: Name/description of the API key
            permissions: List of permissions for the key
            expires_days: Number of days until expiration (None = no expiry)
        
        Returns:
            Tuple of (api_key_dict, raw_key) or (None, None) on failure
        """
        if not self.enabled:
            return None, None
        
        try:
            # Check if user exists
            user = User.query.get(user_id)
            if not user:
                return None, None
            
            # Check user's API key limit
            existing_keys = ApiKey.get_user_api_keys(user_id, active_only=True)
            if len(existing_keys) >= self.max_per_user:
                return None, None
            
            # Validate permissions
            if permissions:
                user_permissions = user.get_permissions()
                for permission in permissions:
                    if permission not in self.available_permissions:
                        return None, None
                    if permission not in user_permissions:
                        return None, None
            else:
                permissions = self.default_permissions.copy()
            
            # Use default expiry if not specified
            if expires_days is None:
                expires_days = self.default_expiry
            
            # Create API key
            api_key, raw_key = ApiKey.create_api_key(
                user_id=user_id,
                name=name,
                permissions=permissions,
                expires_days=expires_days
            )
            
            return api_key.to_dict(), raw_key
        
        except Exception as e:
            current_app.logger.error(f"Failed to create API key: {str(e)}")
            return None, None
    
    def validate_api_key(self, key: str) -> AuthResult:
        """
        Validate an API key.
        
        Args:
            key: API key to validate
        
        Returns:
            AuthResult: Result of validation
        """
        if not self.enabled:
            return AuthResult.failure_result(
                AuthError.TOKEN_INVALID,
                "API key authentication is disabled"
            )
        
        if not key or not key.startswith('fb_'):
            return AuthResult.failure_result(
                AuthError.TOKEN_INVALID,
                "Invalid API key format"
            )
        
        try:
            # Find and validate API key
            api_key = ApiKey.find_valid_key(key)
            if not api_key:
                return AuthResult.failure_result(
                    AuthError.TOKEN_INVALID,
                    "Invalid or expired API key"
                )
            
            # Get user
            user = User.query.get(api_key.user_id)
            if not user:
                return AuthResult.failure_result(
                    AuthError.TOKEN_INVALID,
                    "API key user not found"
                )
            
            # Check if user is active
            if not user.is_active:
                return AuthResult.failure_result(
                    AuthError.ACCOUNT_DISABLED,
                    "API key user account is disabled"
                )
            
            # Record usage
            api_key.record_usage()
            
            return AuthResult.success_result(
                user_id=user.id,
                username=user.username,
                email=user.email,
                display_name=user.display_name,
                is_admin=user.is_admin,
                metadata={
                    'auth_method': 'api_key',
                    'api_key_id': api_key.id,
                    'api_key_name': api_key.name,
                    'api_key_permissions': api_key.get_permissions(),
                    'api_key_expires_at': api_key.expires_at.isoformat() if api_key.expires_at else None
                }
            )
        
        except Exception as e:
            current_app.logger.error(f"API key validation error: {str(e)}")
            return AuthResult.failure_result(
                AuthError.UNKNOWN_ERROR,
                "API key validation failed"
            )
    
    def get_user_api_keys(self, user_id: int, active_only: bool = True) -> List[Dict[str, Any]]:
        """
        Get all API keys for a user.
        
        Args:
            user_id: ID of the user
            active_only: Whether to return only active keys
        
        Returns:
            List of API key dictionaries
        """
        try:
            api_keys = ApiKey.get_user_api_keys(user_id, active_only=active_only)
            return [api_key.to_dict() for api_key in api_keys]
        except Exception as e:
            current_app.logger.error(f"Failed to get user API keys: {str(e)}")
            return []
    
    def revoke_api_key(self, key_id: int, user_id: int) -> bool:
        """
        Revoke an API key.
        
        Args:
            key_id: ID of the API key
            user_id: ID of the user (for security)
        
        Returns:
            bool: True if revoked successfully
        """
        try:
            api_key = ApiKey.query.filter_by(id=key_id, user_id=user_id).first()
            if api_key:
                api_key.revoke()
                return True
            return False
        except Exception as e:
            current_app.logger.error(f"Failed to revoke API key: {str(e)}")
            return False
    
    def update_api_key(self, key_id: int, user_id: int, name: str = None, 
                      permissions: List[str] = None, expires_days: int = None) -> bool:
        """
        Update an API key.
        
        Args:
            key_id: ID of the API key
            user_id: ID of the user (for security)
            name: New name for the key
            permissions: New permissions for the key
            expires_days: New expiry in days
        
        Returns:
            bool: True if updated successfully
        """
        try:
            api_key = ApiKey.query.filter_by(id=key_id, user_id=user_id).first()
            if not api_key:
                return False
            
            # Get user for permission validation
            user = User.query.get(user_id)
            if not user:
                return False
            
            # Update name
            if name:
                api_key.name = name
            
            # Update permissions
            if permissions:
                user_permissions = user.get_permissions()
                for permission in permissions:
                    if permission not in self.available_permissions:
                        return False
                    if permission not in user_permissions:
                        return False
                api_key.set_permissions(permissions)
            
            # Update expiry
            if expires_days is not None:
                if expires_days > 0:
                    api_key.expires_at = datetime.utcnow() + timedelta(days=expires_days)
                else:
                    api_key.expires_at = None
            
            api_key.save()
            return True
        
        except Exception as e:
            current_app.logger.error(f"Failed to update API key: {str(e)}")
            return False
    
    def revoke_user_api_keys(self, user_id: int, exclude_id: int = None) -> int:
        """
        Revoke all API keys for a user.
        
        Args:
            user_id: ID of the user
            exclude_id: API key ID to exclude from revocation
        
        Returns:
            int: Number of keys revoked
        """
        try:
            return ApiKey.revoke_user_api_keys(user_id, exclude_id)
        except Exception as e:
            current_app.logger.error(f"Failed to revoke user API keys: {str(e)}")
            return 0
    
    def cleanup_expired_keys(self) -> int:
        """
        Clean up expired API keys.
        
        Returns:
            int: Number of keys cleaned up
        """
        try:
            return ApiKey.cleanup_expired_keys()
        except Exception as e:
            current_app.logger.error(f"Failed to cleanup expired keys: {str(e)}")
            return 0
    
    def get_api_key_stats(self) -> Dict[str, Any]:
        """
        Get API key statistics.
        
        Returns:
            Dict containing API key statistics
        """
        try:
            return ApiKey.get_api_key_stats()
        except Exception as e:
            current_app.logger.error(f"Failed to get API key stats: {str(e)}")
            return {
                'total_keys': 0,
                'active_keys': 0,
                'expired_keys': 0,
                'inactive_keys': 0,
                'used_keys': 0,
                'unused_keys': 0
            }
    
    def validate_permissions(self, permissions: List[str], user_permissions: List[str]) -> bool:
        """
        Validate that requested permissions are available and allowed for user.
        
        Args:
            permissions: Requested permissions
            user_permissions: User's available permissions
        
        Returns:
            bool: True if all permissions are valid
        """
        if not permissions:
            return True
        
        for permission in permissions:
            if permission not in self.available_permissions:
                return False
            if permission not in user_permissions:
                return False
        
        return True
    
    def get_available_permissions(self) -> List[str]:
        """
        Get list of available permissions.
        
        Returns:
            List of available permission strings
        """
        return self.available_permissions.copy()
    
    def is_enabled(self) -> bool:
        """
        Check if API key authentication is enabled.
        
        Returns:
            bool: True if enabled
        """
        return self.enabled
    
    def get_user_key_count(self, user_id: int) -> int:
        """
        Get count of active API keys for a user.
        
        Args:
            user_id: ID of the user
        
        Returns:
            int: Number of active keys
        """
        try:
            return len(ApiKey.get_user_api_keys(user_id, active_only=True))
        except Exception as e:
            current_app.logger.error(f"Failed to get user key count: {str(e)}")
            return 0
    
    def can_create_key(self, user_id: int) -> bool:
        """
        Check if user can create a new API key.
        
        Args:
            user_id: ID of the user
        
        Returns:
            bool: True if user can create a new key
        """
        if not self.enabled:
            return False
        
        return self.get_user_key_count(user_id) < self.max_per_user