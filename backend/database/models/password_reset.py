#!/usr/bin/env python3
"""
Password reset model for ForgeBoard local authentication.

This model handles password reset tokens for local authentication.
"""

import secrets
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Index
from sqlalchemy.orm import relationship, validates
from database.models.base import BaseModel


class PasswordReset(BaseModel):
    """Password reset token model for local authentication."""
    
    __tablename__ = 'password_resets'
    
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    token = Column(String(255), unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)
    ip_address = Column(String(45), nullable=True)
    
    # Relationships
    user = relationship("User")
    
    # Indexes
    __table_args__ = (
        Index('idx_password_reset_user_id', 'user_id'),
        Index('idx_password_reset_token', 'token'),
        Index('idx_password_reset_expires_at', 'expires_at'),
    )
    
    def __repr__(self):
        return f"<PasswordReset(user_id={self.user_id}, token={self.token[:8]}...)>"
    
    @validates('token')
    def validate_token(self, key, token):
        """Validate reset token."""
        if not token or len(token) < 32:
            raise ValueError("Token must be at least 32 characters")
        return token
    
    @validates('ip_address')
    def validate_ip_address(self, key, ip_address):
        """Validate IP address."""
        if ip_address and len(ip_address) > 45:
            raise ValueError("IP address cannot exceed 45 characters")
        return ip_address
    
    def is_expired(self) -> bool:
        """Check if reset token is expired."""
        return datetime.utcnow() > self.expires_at
    
    def is_used(self) -> bool:
        """Check if reset token has been used."""
        return self.used_at is not None
    
    def is_valid(self) -> bool:
        """Check if reset token is valid."""
        return not self.is_expired() and not self.is_used()
    
    def mark_as_used(self):
        """Mark reset token as used."""
        self.used_at = datetime.utcnow()
        self.save()
    
    def to_dict(self):
        """Convert to dictionary."""
        result = super().to_dict()
        result['is_expired'] = self.is_expired()
        result['is_used'] = self.is_used()
        result['is_valid'] = self.is_valid()
        result['token'] = self.token[:8] + '...' if self.token else None
        return result
    
    @staticmethod
    def generate_token() -> str:
        """Generate a secure reset token."""
        return secrets.token_urlsafe(32)
    
    @classmethod
    def create_reset_token(cls, user_id: int, ip_address: str = None, 
                          duration_hours: int = 1):
        """Create a new password reset token."""
        # Invalidate existing tokens for this user
        cls.invalidate_user_tokens(user_id)
        
        token = cls.generate_token()
        expires_at = datetime.utcnow() + timedelta(hours=duration_hours)
        
        reset_token = cls(
            user_id=user_id,
            token=token,
            expires_at=expires_at,
            ip_address=ip_address
        )
        reset_token.save()
        
        return reset_token
    
    @classmethod
    def find_by_token(cls, token: str):
        """Find password reset by token."""
        return cls.query.filter_by(token=token).first()
    
    @classmethod
    def find_valid_token(cls, token: str):
        """Find valid password reset token."""
        reset_token = cls.find_by_token(token)
        if reset_token and reset_token.is_valid():
            return reset_token
        return None
    
    @classmethod
    def get_user_reset_tokens(cls, user_id: int, valid_only: bool = True):
        """Get all reset tokens for a user."""
        query = cls.query.filter_by(user_id=user_id)
        
        if valid_only:
            query = query.filter(
                cls.expires_at > datetime.utcnow(),
                cls.used_at.is_(None)
            )
        
        return query.order_by(cls.created_at.desc()).all()
    
    @classmethod
    def invalidate_user_tokens(cls, user_id: int):
        """Invalidate all reset tokens for a user."""
        tokens = cls.query.filter_by(
            user_id=user_id,
            used_at=None
        ).all()
        
        for token in tokens:
            token.mark_as_used()
        
        return len(tokens)
    
    @classmethod
    def cleanup_expired_tokens(cls):
        """Clean up expired reset tokens."""
        expired_tokens = cls.query.filter(
            cls.expires_at < datetime.utcnow(),
            cls.used_at.is_(None)
        ).all()
        
        for token in expired_tokens:
            token.mark_as_used()
        
        return len(expired_tokens)
    
    @classmethod
    def get_reset_stats(cls) -> dict:
        """Get password reset statistics."""
        total_tokens = cls.query.count()
        used_tokens = cls.query.filter(cls.used_at.isnot(None)).count()
        expired_tokens = cls.query.filter(
            cls.expires_at < datetime.utcnow(),
            cls.used_at.is_(None)
        ).count()
        active_tokens = total_tokens - used_tokens - expired_tokens
        
        return {
            'total_tokens': total_tokens,
            'used_tokens': used_tokens,
            'expired_tokens': expired_tokens,
            'active_tokens': active_tokens
        }