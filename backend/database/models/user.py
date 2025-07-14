#!/usr/bin/env python3
"""
User model for ForgeBoard authentication.

This model supports both local and Azure AD authentication.
"""

from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy import Column, String, Boolean, DateTime, Integer, CheckConstraint, Index, UniqueConstraint
from sqlalchemy.orm import validates, relationship
from werkzeug.security import generate_password_hash, check_password_hash
from database.models.base import BaseModel


class User(BaseModel):
    """User model supporting both local and Azure AD authentication."""
    
    __tablename__ = 'users'
    
    username = Column(String(100), nullable=True, unique=True)
    email = Column(String(255), nullable=False, unique=True)
    display_name = Column(String(255), nullable=False)
    auth_provider = Column(String(20), nullable=False)
    external_id = Column(String(255), nullable=True)
    password_hash = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    password_change_required = Column(Boolean, default=False, nullable=False)
    last_login_at = Column(DateTime, nullable=True)
    failed_login_count = Column(Integer, default=0, nullable=False)
    locked_until = Column(DateTime, nullable=True)
    
    # Relationships
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    api_keys = relationship("ApiKey", back_populates="user", cascade="all, delete-orphan")
    preferences = relationship("UserPreference", back_populates="user", cascade="all, delete-orphan")
    
    # Constraints and indexes
    __table_args__ = (
        CheckConstraint(
            "auth_provider IN ('local', 'azure_ad')",
            name='ck_user_auth_provider'
        ),
        UniqueConstraint('auth_provider', 'external_id', name='uq_user_provider_external_id'),
        Index('idx_user_email', 'email'),
        Index('idx_user_username', 'username'),
        Index('idx_user_external_id', 'external_id'),
        Index('idx_user_auth_provider', 'auth_provider'),
        Index('idx_user_active', 'is_active'),
    )
    
    def __repr__(self):
        return f"<User(username={self.username}, email={self.email}, provider={self.auth_provider})>"
    
    @validates('email')
    def validate_email(self, key, email):
        """Validate email address."""
        if not email or '@' not in email:
            raise ValueError("Valid email address is required")
        return email.lower().strip()
    
    @validates('auth_provider')
    def validate_auth_provider(self, key, provider):
        """Validate authentication provider."""
        if provider not in ['local', 'azure_ad']:
            raise ValueError("Auth provider must be 'local' or 'azure_ad'")
        return provider
    
    @validates('username')
    def validate_username(self, key, username):
        """Validate username."""
        if username:
            username = username.strip()
            if len(username) < 3:
                raise ValueError("Username must be at least 3 characters")
            if len(username) > 100:
                raise ValueError("Username cannot exceed 100 characters")
            return username
        return username
    
    def set_password(self, password: str):
        """Set password hash for local authentication."""
        if self.auth_provider != 'local':
            raise ValueError("Password can only be set for local authentication")
        
        if not password or len(password) < 8:
            raise ValueError("Password must be at least 8 characters")
        
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password: str) -> bool:
        """Check password for local authentication."""
        if self.auth_provider != 'local' or not self.password_hash:
            return False
        
        return check_password_hash(self.password_hash, password)
    
    def is_locked(self) -> bool:
        """Check if user account is locked."""
        if self.locked_until is None:
            return False
        return datetime.utcnow() < self.locked_until
    
    def lock_account(self, duration_minutes: int = 5):
        """Lock user account for specified duration."""
        self.locked_until = datetime.utcnow() + timedelta(minutes=duration_minutes)
        self.save()
    
    def unlock_account(self):
        """Unlock user account."""
        self.locked_until = None
        self.failed_login_count = 0
        self.save()
    
    def increment_failed_login(self, max_attempts: int = 5, lockout_duration: int = 5):
        """Increment failed login count and lock if needed."""
        self.failed_login_count += 1
        
        if self.failed_login_count >= max_attempts:
            self.lock_account(lockout_duration)
        
        self.save()
    
    def successful_login(self):
        """Record successful login."""
        self.last_login_at = datetime.utcnow()
        self.failed_login_count = 0
        self.locked_until = None
        self.save()
    
    def can_login(self) -> bool:
        """Check if user can login."""
        return self.is_active and not self.is_locked()
    
    def get_permissions(self) -> list:
        """Get user permissions."""
        permissions = ['read']
        
        if self.is_admin:
            permissions.extend(['write', 'admin', 'user_management'])
        else:
            permissions.append('write')
        
        return permissions
    
    def has_permission(self, permission: str) -> bool:
        """Check if user has specific permission."""
        return permission in self.get_permissions()
    
    def complete_password_change(self):
        """Clear the password change requirement after user changes password."""
        self.password_change_required = False
        self.save()
    
    def to_dict(self, include_sensitive=False):
        """Convert to dictionary."""
        result = super().to_dict()
        
        # Remove sensitive fields
        if not include_sensitive:
            result.pop('password_hash', None)
            result.pop('failed_login_count', None)
            result.pop('locked_until', None)
        
        # Add computed fields
        result['is_locked'] = self.is_locked()
        result['can_login'] = self.can_login()
        result['permissions'] = self.get_permissions()
        
        return result
    
    @classmethod
    def create_local_user(cls, username: str, email: str, password: str, display_name: str = None, is_admin: bool = False, require_password_change: bool = True):
        """Create a new local user."""
        user = cls(
            username=username,
            email=email,
            display_name=display_name or username,
            auth_provider='local',
            is_admin=is_admin,
            password_change_required=require_password_change
        )
        user.set_password(password)
        return user.save()
    
    @classmethod
    def create_azure_user(cls, email: str, display_name: str, external_id: str):
        """Create a new Azure AD user."""
        user = cls(
            email=email,
            display_name=display_name,
            auth_provider='azure_ad',
            external_id=external_id
        )
        return user.save()
    
    @classmethod
    def find_by_email(cls, email: str):
        """Find user by email."""
        return cls.query.filter_by(email=email.lower()).first()
    
    @classmethod
    def find_by_username(cls, username: str):
        """Find user by username."""
        return cls.query.filter_by(username=username).first()
    
    @classmethod
    def find_by_external_id(cls, external_id: str, provider: str = 'azure_ad'):
        """Find user by external ID."""
        return cls.query.filter_by(
            external_id=external_id,
            auth_provider=provider
        ).first()
    
    @classmethod
    def get_active_users(cls):
        """Get all active users."""
        return cls.query.filter_by(is_active=True).all()
    
    @classmethod
    def get_admin_users(cls):
        """Get all admin users."""
        return cls.query.filter_by(is_admin=True, is_active=True).all()