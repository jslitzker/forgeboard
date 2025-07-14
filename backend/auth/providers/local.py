"""
Local authentication provider for ForgeBoard.

This provider handles username/password authentication with security features.
"""

import re
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from flask import current_app
from flask_bcrypt import Bcrypt
from email_validator import validate_email, EmailNotValidError
from .base import AuthProvider
from ..models.auth_result import AuthResult, AuthError
from database.models.user import User
from database.models.password_reset import PasswordReset


class LocalAuthProvider(AuthProvider):
    """Local authentication provider using username/password."""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize local authentication provider."""
        super().__init__(config)
        self.bcrypt = Bcrypt()
        
        # Password requirements
        self.min_length = config.get('password', {}).get('min_length', 8)
        self.require_uppercase = config.get('password', {}).get('require_uppercase', True)
        self.require_lowercase = config.get('password', {}).get('require_lowercase', True)
        self.require_numbers = config.get('password', {}).get('require_numbers', True)
        self.require_special = config.get('password', {}).get('require_special', False)
        
        # Security settings
        self.max_login_attempts = config.get('security', {}).get('max_login_attempts', 5)
        self.lockout_duration = config.get('security', {}).get('lockout_duration', 300)  # 5 minutes
        self.password_reset_expiry = config.get('security', {}).get('password_reset_expiry', 3600)  # 1 hour
        
        # Email settings
        self.email_enabled = config.get('email', {}).get('enabled', False)
        self.email_config = config.get('email', {})
    
    def authenticate(self, credentials: Dict[str, Any]) -> AuthResult:
        """Authenticate user with username/password."""
        username_or_email = credentials.get('username')
        password = credentials.get('password')
        
        if not username_or_email or not password:
            return AuthResult.failure_result(
                AuthError.INVALID_CREDENTIALS,
                "Username/email and password are required"
            )
        
        # Find user by username or email
        user = None
        if '@' in username_or_email:
            user = User.find_by_email(username_or_email)
        else:
            user = User.find_by_username(username_or_email)
        
        if not user or user.auth_provider != 'local':
            return AuthResult.failure_result(
                AuthError.INVALID_CREDENTIALS,
                "Invalid username/email or password"
            )
        
        # Check if account is locked
        if user.is_locked():
            return AuthResult.failure_result(
                AuthError.ACCOUNT_LOCKED,
                f"Account is locked. Try again later."
            )
        
        # Check if account is active
        if not user.is_active:
            return AuthResult.failure_result(
                AuthError.ACCOUNT_DISABLED,
                "Account is disabled"
            )
        
        # Verify password
        if not user.check_password(password):
            user.increment_failed_login(self.max_login_attempts, self.lockout_duration)
            return AuthResult.failure_result(
                AuthError.INVALID_CREDENTIALS,
                "Invalid username/email or password"
            )
        
        # Successful authentication
        user.successful_login()
        
        return AuthResult.success_result(
            user_id=user.id,
            username=user.username,
            email=user.email,
            display_name=user.display_name,
            is_admin=user.is_admin,
            metadata={
                'auth_provider': 'local',
                'last_login': user.last_login_at.isoformat() if user.last_login_at else None
            }
        )
    
    def get_user_info(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Get user information by ID."""
        user = User.query.get(user_id)
        if not user or user.auth_provider != 'local':
            return None
        
        return {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'display_name': user.display_name,
            'is_admin': user.is_admin,
            'is_active': user.is_active,
            'auth_provider': user.auth_provider,
            'last_login_at': user.last_login_at.isoformat() if user.last_login_at else None,
            'permissions': user.get_permissions()
        }
    
    def validate_token(self, token: str) -> AuthResult:
        """Validate authentication token (handled by session manager)."""
        # This method is implemented by the session manager
        return AuthResult.failure_result(
            AuthError.TOKEN_INVALID,
            "Token validation not implemented in local provider"
        )
    
    def refresh_token(self, refresh_token: str) -> Optional[Dict[str, Any]]:
        """Refresh authentication token (handled by session manager)."""
        # This method is implemented by the session manager
        return None
    
    def get_login_url(self) -> Optional[str]:
        """Get login URL (not applicable for local auth)."""
        return None
    
    def handle_callback(self, callback_data: Dict[str, Any]) -> AuthResult:
        """Handle OAuth callback (not applicable for local auth)."""
        return AuthResult.failure_result(
            AuthError.UNKNOWN_ERROR,
            "OAuth callback not supported for local authentication"
        )
    
    def change_password(self, user_id: int, old_password: str, new_password: str) -> AuthResult:
        """Change user's password."""
        user = User.query.get(user_id)
        if not user or user.auth_provider != 'local':
            return AuthResult.failure_result(
                AuthError.UNKNOWN_ERROR,
                "User not found or not local user"
            )
        
        # Verify old password
        if not user.check_password(old_password):
            return AuthResult.failure_result(
                AuthError.INVALID_CREDENTIALS,
                "Current password is incorrect"
            )
        
        # Validate new password
        validation_result = self.validate_password(new_password)
        if not validation_result['valid']:
            return AuthResult.failure_result(
                AuthError.INVALID_CREDENTIALS,
                validation_result['message']
            )
        
        # Set new password
        try:
            user.set_password(new_password)
            return AuthResult.success_result(
                user_id=user.id,
                username=user.username,
                email=user.email,
                display_name=user.display_name,
                is_admin=user.is_admin,
                metadata={'password_changed': True}
            )
        except Exception as e:
            return AuthResult.failure_result(
                AuthError.UNKNOWN_ERROR,
                f"Failed to change password: {str(e)}"
            )
    
    def reset_password(self, email: str) -> bool:
        """Initiate password reset."""
        user = User.find_by_email(email)
        if not user or user.auth_provider != 'local':
            # Return True to prevent email enumeration
            return True
        
        # Create reset token
        reset_token = PasswordReset.create_reset_token(
            user_id=user.id,
            duration_hours=self.password_reset_expiry // 3600
        )
        
        # Send email using email service
        try:
            from ..email_service import EmailService
            from config.manager import ConfigManager
            
            config_manager = ConfigManager()
            email_service = EmailService(config_manager)
            
            if email_service.is_enabled():
                base_url = current_app.config.get('BASE_URL', 'http://localhost:5000')
                success = email_service.send_password_reset_email(user, reset_token.token, base_url)
                if not success:
                    current_app.logger.error(f"Failed to send password reset email to {email}")
                    # Still return True to prevent email enumeration
                
        except Exception as e:
            current_app.logger.error(f"Password reset email error: {str(e)}")
            # Still return True to prevent email enumeration
        
        return True
    
    def complete_password_reset(self, token: str, new_password: str) -> AuthResult:
        """Complete password reset with token."""
        reset_token = PasswordReset.find_valid_token(token)
        if not reset_token:
            return AuthResult.failure_result(
                AuthError.TOKEN_INVALID,
                "Invalid or expired reset token"
            )
        
        # Validate new password
        validation_result = self.validate_password(new_password)
        if not validation_result['valid']:
            return AuthResult.failure_result(
                AuthError.INVALID_CREDENTIALS,
                validation_result['message']
            )
        
        # Get user
        user = User.query.get(reset_token.user_id)
        if not user or user.auth_provider != 'local':
            return AuthResult.failure_result(
                AuthError.UNKNOWN_ERROR,
                "User not found"
            )
        
        try:
            # Set new password
            user.set_password(new_password)
            user.unlock_account()  # Unlock account if it was locked
            
            # Mark token as used
            reset_token.mark_as_used()
            
            return AuthResult.success_result(
                user_id=user.id,
                username=user.username,
                email=user.email,
                display_name=user.display_name,
                is_admin=user.is_admin,
                metadata={'password_reset': True}
            )
        except Exception as e:
            return AuthResult.failure_result(
                AuthError.UNKNOWN_ERROR,
                f"Failed to reset password: {str(e)}"
            )
    
    @property
    def provider_name(self) -> str:
        """Get provider name."""
        return 'local'
    
    @property
    def supports_registration(self) -> bool:
        """Check if provider supports registration."""
        return True
    
    @property
    def supports_password_reset(self) -> bool:
        """Check if provider supports password reset."""
        return self.email_enabled
    
    def validate_password(self, password: str) -> Dict[str, Any]:
        """Validate password against complexity requirements."""
        errors = []
        
        if len(password) < self.min_length:
            errors.append(f"Password must be at least {self.min_length} characters")
        
        if self.require_uppercase and not re.search(r'[A-Z]', password):
            errors.append("Password must contain at least one uppercase letter")
        
        if self.require_lowercase and not re.search(r'[a-z]', password):
            errors.append("Password must contain at least one lowercase letter")
        
        if self.require_numbers and not re.search(r'[0-9]', password):
            errors.append("Password must contain at least one number")
        
        if self.require_special and not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            errors.append("Password must contain at least one special character")
        
        return {
            'valid': len(errors) == 0,
            'message': '; '.join(errors) if errors else 'Password is valid'
        }
    
    def validate_email_format(self, email: str) -> bool:
        """Validate email format."""
        try:
            validate_email(email)
            return True
        except EmailNotValidError:
            return False
    
    def register_user(self, username: str, email: str, password: str, 
                     display_name: str = None, is_admin: bool = False) -> AuthResult:
        """Register a new local user."""
        # Validate email format
        if not self.validate_email_format(email):
            return AuthResult.failure_result(
                AuthError.INVALID_CREDENTIALS,
                "Invalid email format"
            )
        
        # Check if user already exists
        existing_user = User.find_by_email(email) or User.find_by_username(username)
        if existing_user:
            return AuthResult.failure_result(
                AuthError.INVALID_CREDENTIALS,
                "User with this email or username already exists"
            )
        
        # Validate password
        validation_result = self.validate_password(password)
        if not validation_result['valid']:
            return AuthResult.failure_result(
                AuthError.INVALID_CREDENTIALS,
                validation_result['message']
            )
        
        try:
            # Create user
            user = User.create_local_user(
                username=username,
                email=email,
                password=password,
                display_name=display_name,
                is_admin=is_admin
            )
            
            # Send welcome email
            try:
                from ..email_service import EmailService
                from config.manager import ConfigManager
                
                config_manager = ConfigManager()
                email_service = EmailService(config_manager)
                
                if email_service.is_enabled():
                    success = email_service.send_welcome_email(user)
                    if not success:
                        current_app.logger.error(f"Failed to send welcome email to {email}")
                        
            except Exception as e:
                current_app.logger.error(f"Welcome email error: {str(e)}")
                # Don't fail registration if email fails
            
            return AuthResult.success_result(
                user_id=user.id,
                username=user.username,
                email=user.email,
                display_name=user.display_name,
                is_admin=user.is_admin,
                metadata={'registration': True}
            )
        except Exception as e:
            return AuthResult.failure_result(
                AuthError.UNKNOWN_ERROR,
                f"Failed to create user: {str(e)}"
            )