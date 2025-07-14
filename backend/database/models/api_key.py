#!/usr/bin/env python3
"""
API Key model for ForgeBoard authentication.

This model handles API key authentication for automated access.
"""

import secrets
import hashlib
import json
from datetime import datetime, timedelta
from typing import Optional, List, Dict
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, Index, Text
from sqlalchemy.orm import relationship, validates
from database.models.base import BaseModel


class ApiKey(BaseModel):
    """API Key model for programmatic access."""
    
    __tablename__ = 'api_keys'
    
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    key_hash = Column(String(255), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    permissions = Column(Text, nullable=True)
    last_used_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="api_keys")
    
    # Indexes
    __table_args__ = (
        Index('idx_api_key_user_id', 'user_id'),
        Index('idx_api_key_hash', 'key_hash'),
        Index('idx_api_key_active', 'is_active'),
        Index('idx_api_key_expires_at', 'expires_at'),
    )
    
    def __repr__(self):
        return f"<ApiKey(user_id={self.user_id}, name={self.name})>"
    
    @validates('name')
    def validate_name(self, key, name):
        """Validate API key name."""
        if not name or len(name.strip()) == 0:
            raise ValueError("API key name cannot be empty")
        if len(name) > 255:
            raise ValueError("API key name cannot exceed 255 characters")
        return name.strip()
    
    @validates('permissions')
    def validate_permissions(self, key, permissions):
        """Validate permissions JSON."""
        if permissions:
            try:
                json.loads(permissions)
            except json.JSONDecodeError:
                raise ValueError("Permissions must be valid JSON")
        return permissions
    
    def is_expired(self) -> bool:
        """Check if API key is expired."""
        if self.expires_at is None:
            return False
        return datetime.utcnow() > self.expires_at
    
    def is_valid(self) -> bool:
        """Check if API key is valid."""
        return self.is_active and not self.is_expired()
    
    def get_permissions(self) -> List[str]:
        """Get API key permissions."""
        if not self.permissions:
            return ['read']
        
        try:
            perms = json.loads(self.permissions)
            if isinstance(perms, list):
                return perms
            elif isinstance(perms, dict):
                return perms.get('permissions', ['read'])
            else:
                return ['read']
        except (json.JSONDecodeError, AttributeError):
            return ['read']
    
    def set_permissions(self, permissions: List[str]):
        """Set API key permissions."""
        self.permissions = json.dumps(permissions)
    
    def has_permission(self, permission: str) -> bool:
        """Check if API key has specific permission."""
        return permission in self.get_permissions()
    
    def record_usage(self):
        """Record API key usage."""
        self.last_used_at = datetime.utcnow()
        self.save()
    
    def revoke(self):
        """Revoke API key."""
        self.is_active = False
        self.save()
    
    def extend_expiration(self, days: int = 30):
        """Extend API key expiration."""
        if self.expires_at:
            self.expires_at = max(self.expires_at, datetime.utcnow()) + timedelta(days=days)
        else:
            self.expires_at = datetime.utcnow() + timedelta(days=days)
        self.save()
    
    def to_dict(self):
        """Convert to dictionary."""
        result = super().to_dict()
        result['is_expired'] = self.is_expired()
        result['is_valid'] = self.is_valid()
        result['permissions'] = self.get_permissions()
        result['key_hash'] = self.key_hash[:8] + '...' if self.key_hash else None
        return result
    
    @staticmethod
    def generate_key() -> str:
        """Generate a secure API key."""
        return 'fb_' + secrets.token_urlsafe(32)
    
    @staticmethod
    def hash_key(key: str) -> str:
        """Hash API key for storage."""
        return hashlib.sha256(key.encode()).hexdigest()
    
    @classmethod
    def create_api_key(cls, user_id: int, name: str, permissions: List[str] = None, 
                      expires_days: int = None):
        """Create a new API key."""
        key = cls.generate_key()
        key_hash = cls.hash_key(key)
        
        expires_at = None
        if expires_days:
            expires_at = datetime.utcnow() + timedelta(days=expires_days)
        
        api_key = cls(
            user_id=user_id,
            key_hash=key_hash,
            name=name,
            expires_at=expires_at
        )
        
        if permissions:
            api_key.set_permissions(permissions)
        
        api_key.save()
        
        # Return the unhashed key (this is the only time it's available)
        return api_key, key
    
    @classmethod
    def find_by_key(cls, key: str):
        """Find API key by key value."""
        key_hash = cls.hash_key(key)
        return cls.query.filter_by(key_hash=key_hash, is_active=True).first()
    
    @classmethod
    def find_valid_key(cls, key: str):
        """Find valid API key by key value."""
        api_key = cls.find_by_key(key)
        if api_key and api_key.is_valid():
            return api_key
        return None
    
    @classmethod
    def get_user_api_keys(cls, user_id: int, active_only: bool = True):
        """Get all API keys for a user."""
        query = cls.query.filter_by(user_id=user_id)
        if active_only:
            query = query.filter_by(is_active=True)
        return query.order_by(cls.created_at.desc()).all()
    
    @classmethod
    def revoke_user_api_keys(cls, user_id: int, exclude_id: int = None):
        """Revoke all API keys for a user."""
        query = cls.query.filter_by(user_id=user_id, is_active=True)
        if exclude_id:
            query = query.filter(cls.id != exclude_id)
        
        api_keys = query.all()
        for api_key in api_keys:
            api_key.revoke()
        
        return len(api_keys)
    
    @classmethod
    def cleanup_expired_keys(cls):
        """Clean up expired API keys."""
        expired_keys = cls.query.filter(
            cls.expires_at < datetime.utcnow(),
            cls.is_active == True
        ).all()
        
        for api_key in expired_keys:
            api_key.revoke()
        
        return len(expired_keys)
    
    @classmethod
    def get_api_key_stats(cls) -> Dict:
        """Get API key statistics."""
        total_keys = cls.query.count()
        active_keys = cls.query.filter_by(is_active=True).count()
        expired_keys = cls.query.filter(
            cls.expires_at < datetime.utcnow(),
            cls.is_active == True
        ).count()
        
        # Usage stats
        used_keys = cls.query.filter(cls.last_used_at.isnot(None)).count()
        unused_keys = total_keys - used_keys
        
        return {
            'total_keys': total_keys,
            'active_keys': active_keys,
            'expired_keys': expired_keys,
            'inactive_keys': total_keys - active_keys,
            'used_keys': used_keys,
            'unused_keys': unused_keys
        }