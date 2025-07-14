#!/usr/bin/env python3
"""
Session model for ForgeBoard authentication.

This model handles user sessions and tokens.
"""

import secrets
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, Index
from sqlalchemy.orm import relationship, validates
from database.models.base import BaseModel


class Session(BaseModel):
    """Session model for user authentication tokens."""
    
    __tablename__ = 'sessions'
    
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    token = Column(String(255), unique=True, nullable=False)
    refresh_token = Column(String(255), nullable=True)
    expires_at = Column(DateTime, nullable=False)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="sessions")
    
    # Indexes
    __table_args__ = (
        Index('idx_session_user_id', 'user_id'),
        Index('idx_session_token', 'token'),
        Index('idx_session_active', 'is_active'),
        Index('idx_session_expires_at', 'expires_at'),
    )
    
    def __repr__(self):
        return f"<Session(user_id={self.user_id}, token={self.token[:8]}...)>"
    
    @validates('token')
    def validate_token(self, key, token):
        """Validate session token."""
        if not token or len(token) < 32:
            raise ValueError("Token must be at least 32 characters")
        return token
    
    @validates('ip_address')
    def validate_ip_address(self, key, ip_address):
        """Validate IP address."""
        if ip_address and len(ip_address) > 45:
            raise ValueError("IP address cannot exceed 45 characters")
        return ip_address
    
    @validates('user_agent')
    def validate_user_agent(self, key, user_agent):
        """Validate user agent."""
        if user_agent and len(user_agent) > 500:
            user_agent = user_agent[:500]
        return user_agent
    
    def is_expired(self) -> bool:
        """Check if session is expired."""
        return datetime.utcnow() > self.expires_at
    
    def is_valid(self) -> bool:
        """Check if session is valid."""
        return self.is_active and not self.is_expired()
    
    def extend_session(self, duration_seconds: int = 86400):
        """Extend session expiration."""
        self.expires_at = datetime.utcnow() + timedelta(seconds=duration_seconds)
        self.save()
    
    def revoke(self):
        """Revoke session."""
        self.is_active = False
        self.save()
    
    def refresh(self, duration_seconds: int = 86400):
        """Refresh session with new token."""
        self.token = self.generate_token()
        self.expires_at = datetime.utcnow() + timedelta(seconds=duration_seconds)
        self.save()
        return self.token
    
    def to_dict(self):
        """Convert to dictionary."""
        result = super().to_dict()
        result['is_expired'] = self.is_expired()
        result['is_valid'] = self.is_valid()
        result['token'] = self.token[:8] + '...' if self.token else None
        return result
    
    @staticmethod
    def generate_token() -> str:
        """Generate a secure session token."""
        return secrets.token_urlsafe(32)
    
    @classmethod
    def create_session(cls, user_id: int, ip_address: str = None, user_agent: str = None, 
                      duration_seconds: int = 86400):
        """Create a new session."""
        token = cls.generate_token()
        expires_at = datetime.utcnow() + timedelta(seconds=duration_seconds)
        
        session = cls(
            user_id=user_id,
            token=token,
            expires_at=expires_at,
            ip_address=ip_address,
            user_agent=user_agent
        )
        return session.save()
    
    @classmethod
    def find_by_token(cls, token: str):
        """Find session by token."""
        return cls.query.filter_by(token=token, is_active=True).first()
    
    @classmethod
    def find_valid_session(cls, token: str):
        """Find valid session by token."""
        session = cls.find_by_token(token)
        if session and session.is_valid():
            return session
        return None
    
    @classmethod
    def get_user_sessions(cls, user_id: int, active_only: bool = True):
        """Get all sessions for a user."""
        query = cls.query.filter_by(user_id=user_id)
        if active_only:
            query = query.filter_by(is_active=True)
        return query.order_by(cls.created_at.desc()).all()
    
    @classmethod
    def revoke_user_sessions(cls, user_id: int, exclude_token: str = None):
        """Revoke all sessions for a user."""
        query = cls.query.filter_by(user_id=user_id, is_active=True)
        if exclude_token:
            query = query.filter(cls.token != exclude_token)
        
        sessions = query.all()
        for session in sessions:
            session.revoke()
        
        return len(sessions)
    
    @classmethod
    def cleanup_expired_sessions(cls):
        """Clean up expired sessions."""
        expired_sessions = cls.query.filter(
            cls.expires_at < datetime.utcnow(),
            cls.is_active == True
        ).all()
        
        for session in expired_sessions:
            session.revoke()
        
        return len(expired_sessions)
    
    @classmethod
    def get_active_session_count(cls) -> int:
        """Get count of active sessions."""
        return cls.query.filter_by(is_active=True).count()
    
    @classmethod
    def get_session_stats(cls) -> dict:
        """Get session statistics."""
        total_sessions = cls.query.count()
        active_sessions = cls.query.filter_by(is_active=True).count()
        expired_sessions = cls.query.filter(
            cls.expires_at < datetime.utcnow(),
            cls.is_active == True
        ).count()
        
        return {
            'total_sessions': total_sessions,
            'active_sessions': active_sessions,
            'expired_sessions': expired_sessions,
            'inactive_sessions': total_sessions - active_sessions
        }