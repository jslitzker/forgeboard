"""
Session management system for ForgeBoard authentication.

This module handles JWT token generation, validation, and session management.
"""

import jwt
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple
from flask import current_app
from flask_jwt_extended import (
    JWTManager, create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt, verify_jwt_in_request
)

from database.models.session import Session
from database.models.user import User
from .models.auth_result import AuthResult, AuthError


class SessionManager:
    """Manages user sessions and JWT tokens."""
    
    def __init__(self, app=None, config: Dict[str, Any] = None):
        """Initialize session manager."""
        self.app = app
        self.jwt = JWTManager()
        self.config = config or {}
        
        # Session configuration
        self.session_timeout = self.config.get('session_timeout', 86400)  # 24 hours
        self.refresh_timeout = self.config.get('refresh_timeout', 604800)  # 7 days
        self.refresh_enabled = self.config.get('refresh_enabled', True)
        
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize Flask app with JWT configuration."""
        self.app = app
        
        # Configure JWT
        app.config['JWT_SECRET_KEY'] = app.config.get('SECRET_KEY')
        app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(seconds=self.session_timeout)
        app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(seconds=self.refresh_timeout)
        app.config['JWT_ALGORITHM'] = 'HS256'
        app.config['JWT_BLACKLIST_ENABLED'] = True
        app.config['JWT_BLACKLIST_TOKEN_CHECKS'] = ['access', 'refresh']
        
        # Initialize JWT manager
        self.jwt.init_app(app)
        
        # Register JWT callbacks
        self._register_jwt_callbacks()
    
    def _register_jwt_callbacks(self):
        """Register JWT callback handlers."""
        
        @self.jwt.token_in_blocklist_loader
        def check_if_token_revoked(jwt_header, jwt_payload):
            """Check if token is revoked."""
            jti = jwt_payload['jti']
            session = Session.find_by_token(jti)
            return session is None or not session.is_valid()
        
        @self.jwt.user_identity_loader
        def user_identity_lookup(user_id):
            """User identity loader."""
            return user_id
        
        @self.jwt.user_lookup_loader
        def user_lookup_callback(_jwt_header, jwt_payload):
            """User lookup callback."""
            identity = jwt_payload['sub']
            return User.query.get(identity)
        
        @self.jwt.expired_token_loader
        def expired_token_callback(jwt_header, jwt_payload):
            """Handle expired token."""
            return {'error': 'token_expired', 'message': 'Token has expired'}, 401
        
        @self.jwt.invalid_token_loader
        def invalid_token_callback(error):
            """Handle invalid token."""
            return {'error': 'token_invalid', 'message': 'Invalid token'}, 401
        
        @self.jwt.unauthorized_loader
        def missing_token_callback(error):
            """Handle missing token."""
            return {'error': 'authorization_required', 'message': 'Authorization token required'}, 401
        
        @self.jwt.revoked_token_loader
        def revoked_token_callback(jwt_header, jwt_payload):
            """Handle revoked token."""
            return {'error': 'token_revoked', 'message': 'Token has been revoked'}, 401
    
    def create_session(self, user_id: int, ip_address: str = None, 
                      user_agent: str = None) -> Dict[str, Any]:
        """Create a new session with JWT tokens."""
        try:
            # Get user
            user = User.query.get(user_id)
            if not user:
                raise ValueError("User not found")
            
            # Generate JTI (JWT ID) for token tracking
            jti = secrets.token_urlsafe(32)
            
            # Create access token
            access_token = create_access_token(
                identity=user_id,
                additional_claims={
                    'username': user.username,
                    'email': user.email,
                    'display_name': user.display_name,
                    'is_admin': user.is_admin,
                    'permissions': user.get_permissions()
                }
            )
            
            # Create refresh token if enabled
            refresh_token = None
            if self.refresh_enabled:
                refresh_token = create_refresh_token(identity=user_id)
            
            # Create session record
            session = Session.create_session(
                user_id=user_id,
                ip_address=ip_address,
                user_agent=user_agent,
                duration_seconds=self.session_timeout
            )
            
            # Update session with JTI
            session.token = jti
            session.refresh_token = refresh_token
            session.save()
            
            return {
                'access_token': access_token,
                'refresh_token': refresh_token,
                'token_type': 'Bearer',
                'expires_in': self.session_timeout,
                'user_id': user_id,
                'session_id': session.id
            }
        
        except Exception as e:
            current_app.logger.error(f"Failed to create session: {str(e)}")
            raise
    
    def validate_session(self, token: str) -> AuthResult:
        """Validate session token."""
        try:
            # Decode JWT without verification first to get JTI
            unverified_payload = jwt.decode(token, options={"verify_signature": False})
            jti = unverified_payload.get('jti')
            
            if not jti:
                return AuthResult.failure_result(
                    AuthError.TOKEN_INVALID,
                    "Token missing JTI"
                )
            
            # Find session
            session = Session.find_by_token(jti)
            if not session:
                return AuthResult.failure_result(
                    AuthError.TOKEN_INVALID,
                    "Session not found"
                )
            
            # Check if session is valid
            if not session.is_valid():
                return AuthResult.failure_result(
                    AuthError.TOKEN_EXPIRED,
                    "Session expired or revoked"
                )
            
            # Verify JWT token
            try:
                payload = jwt.decode(
                    token,
                    current_app.config['JWT_SECRET_KEY'],
                    algorithms=[current_app.config['JWT_ALGORITHM']]
                )
            except jwt.ExpiredSignatureError:
                return AuthResult.failure_result(
                    AuthError.TOKEN_EXPIRED,
                    "Token has expired"
                )
            except jwt.InvalidTokenError:
                return AuthResult.failure_result(
                    AuthError.TOKEN_INVALID,
                    "Invalid token"
                )
            
            # Get user
            user_id = payload.get('sub')
            user = User.query.get(user_id)
            if not user:
                return AuthResult.failure_result(
                    AuthError.TOKEN_INVALID,
                    "User not found"
                )
            
            # Check if user is active
            if not user.is_active:
                return AuthResult.failure_result(
                    AuthError.ACCOUNT_DISABLED,
                    "User account is disabled"
                )
            
            # Extend session if needed
            if session.expires_at - datetime.utcnow() < timedelta(hours=1):
                session.extend_session(self.session_timeout)
            
            return AuthResult.success_result(
                user_id=user.id,
                username=user.username,
                email=user.email,
                display_name=user.display_name,
                is_admin=user.is_admin,
                metadata={
                    'session_id': session.id,
                    'expires_at': session.expires_at.isoformat()
                }
            )
        
        except Exception as e:
            current_app.logger.error(f"Session validation error: {str(e)}")
            return AuthResult.failure_result(
                AuthError.UNKNOWN_ERROR,
                "Session validation failed"
            )
    
    def refresh_session(self, refresh_token: str) -> Optional[Dict[str, Any]]:
        """Refresh session using refresh token."""
        if not self.refresh_enabled:
            return None
        
        try:
            # Verify refresh token
            payload = jwt.decode(
                refresh_token,
                current_app.config['JWT_SECRET_KEY'],
                algorithms=[current_app.config['JWT_ALGORITHM']]
            )
            
            user_id = payload.get('sub')
            if not user_id:
                return None
            
            # Find session with this refresh token
            session = Session.query.filter_by(
                user_id=user_id,
                refresh_token=refresh_token,
                is_active=True
            ).first()
            
            if not session or not session.is_valid():
                return None
            
            # Get user
            user = User.query.get(user_id)
            if not user or not user.is_active:
                return None
            
            # Create new tokens
            new_access_token = create_access_token(
                identity=user_id,
                additional_claims={
                    'username': user.username,
                    'email': user.email,
                    'display_name': user.display_name,
                    'is_admin': user.is_admin,
                    'permissions': user.get_permissions()
                }
            )
            
            new_refresh_token = create_refresh_token(identity=user_id)
            
            # Update session
            session.refresh_token = new_refresh_token
            session.extend_session(self.session_timeout)
            
            return {
                'access_token': new_access_token,
                'refresh_token': new_refresh_token,
                'token_type': 'Bearer',
                'expires_in': self.session_timeout,
                'user_id': user_id,
                'session_id': session.id
            }
        
        except Exception as e:
            current_app.logger.error(f"Token refresh error: {str(e)}")
            return None
    
    def revoke_session(self, token: str) -> bool:
        """Revoke a session."""
        try:
            # Decode JWT to get JTI
            unverified_payload = jwt.decode(token, options={"verify_signature": False})
            jti = unverified_payload.get('jti')
            
            if jti:
                session = Session.find_by_token(jti)
                if session:
                    session.revoke()
                    return True
            
            return False
        
        except Exception as e:
            current_app.logger.error(f"Session revocation error: {str(e)}")
            return False
    
    def revoke_user_sessions(self, user_id: int, exclude_token: str = None) -> int:
        """Revoke all sessions for a user."""
        try:
            return Session.revoke_user_sessions(user_id, exclude_token)
        except Exception as e:
            current_app.logger.error(f"User session revocation error: {str(e)}")
            return 0
    
    def get_user_sessions(self, user_id: int) -> list:
        """Get all active sessions for a user."""
        try:
            sessions = Session.get_user_sessions(user_id, active_only=True)
            return [session.to_dict() for session in sessions]
        except Exception as e:
            current_app.logger.error(f"Get user sessions error: {str(e)}")
            return []
    
    def cleanup_expired_sessions(self) -> int:
        """Clean up expired sessions."""
        try:
            return Session.cleanup_expired_sessions()
        except Exception as e:
            current_app.logger.error(f"Session cleanup error: {str(e)}")
            return 0
    
    def get_session_stats(self) -> Dict[str, Any]:
        """Get session statistics."""
        try:
            return Session.get_session_stats()
        except Exception as e:
            current_app.logger.error(f"Session stats error: {str(e)}")
            return {
                'total_sessions': 0,
                'active_sessions': 0,
                'expired_sessions': 0,
                'inactive_sessions': 0
            }
    
    def extract_token_from_request(self, request) -> Optional[str]:
        """Extract token from request headers."""
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            return auth_header.split(' ')[1]
        return None
    
    def get_current_user_id(self) -> Optional[int]:
        """Get current user ID from JWT token."""
        try:
            verify_jwt_in_request()
            return get_jwt_identity()
        except Exception:
            return None
    
    def get_current_user(self) -> Optional[User]:
        """Get current user from JWT token."""
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            return User.query.get(user_id)
        except Exception:
            return None