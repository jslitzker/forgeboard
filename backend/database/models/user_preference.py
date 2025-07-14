#!/usr/bin/env python3
"""
User preferences model for ForgeBoard.

This model stores user-specific preferences and settings.
"""

import json
from typing import Any, Dict
from sqlalchemy import Column, String, Boolean, Integer, ForeignKey, Index, Text, UniqueConstraint
from sqlalchemy.orm import relationship, validates
from database.models.base import BaseModel


class UserPreference(BaseModel):
    """User preferences model for storing user-specific settings."""
    
    __tablename__ = 'user_preferences'
    
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    key = Column(String(100), nullable=False)
    value = Column(Text, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="preferences")
    
    # Constraints and indexes
    __table_args__ = (
        UniqueConstraint('user_id', 'key', name='uq_user_preference_user_key'),
        Index('idx_user_preference_user_id', 'user_id'),
        Index('idx_user_preference_key', 'key'),
    )
    
    def __repr__(self):
        return f"<UserPreference(user_id={self.user_id}, key={self.key})>"
    
    @validates('key')
    def validate_key(self, key, pref_key):
        """Validate preference key."""
        if not pref_key or len(pref_key.strip()) == 0:
            raise ValueError("Preference key cannot be empty")
        if len(pref_key) > 100:
            raise ValueError("Preference key cannot exceed 100 characters")
        return pref_key.strip()
    
    def get_value(self, default=None):
        """Get preference value with type conversion."""
        if self.value is None:
            return default
        
        try:
            # Try to parse as JSON first
            return json.loads(self.value)
        except (json.JSONDecodeError, TypeError):
            # Return as string if not valid JSON
            return self.value
    
    def set_value(self, value: Any):
        """Set preference value with JSON serialization."""
        if value is None:
            self.value = None
        elif isinstance(value, (str, int, float, bool)):
            self.value = json.dumps(value)
        else:
            # For complex types, serialize as JSON
            try:
                self.value = json.dumps(value)
            except (TypeError, ValueError):
                self.value = str(value)
    
    def to_dict(self):
        """Convert to dictionary."""
        result = super().to_dict()
        result['parsed_value'] = self.get_value()
        return result
    
    @classmethod
    def get_user_preference(cls, user_id: int, key: str, default=None):
        """Get user preference value."""
        preference = cls.query.filter_by(user_id=user_id, key=key).first()
        if preference:
            return preference.get_value(default)
        return default
    
    @classmethod
    def set_user_preference(cls, user_id: int, key: str, value: Any):
        """Set user preference value."""
        preference = cls.query.filter_by(user_id=user_id, key=key).first()
        
        if preference:
            preference.set_value(value)
            preference.save()
        else:
            preference = cls(user_id=user_id, key=key)
            preference.set_value(value)
            preference.save()
        
        return preference
    
    @classmethod
    def get_user_preferences(cls, user_id: int) -> Dict[str, Any]:
        """Get all preferences for a user."""
        preferences = cls.query.filter_by(user_id=user_id).all()
        return {pref.key: pref.get_value() for pref in preferences}
    
    @classmethod
    def set_user_preferences(cls, user_id: int, preferences: Dict[str, Any]):
        """Set multiple user preferences."""
        for key, value in preferences.items():
            cls.set_user_preference(user_id, key, value)
    
    @classmethod
    def delete_user_preference(cls, user_id: int, key: str):
        """Delete a user preference."""
        preference = cls.query.filter_by(user_id=user_id, key=key).first()
        if preference:
            preference.delete()
        return preference
    
    @classmethod
    def delete_user_preferences(cls, user_id: int):
        """Delete all preferences for a user."""
        preferences = cls.query.filter_by(user_id=user_id).all()
        for preference in preferences:
            preference.delete()
        return len(preferences)
    
    @classmethod
    def get_default_preferences(cls) -> Dict[str, Any]:
        """Get default user preferences."""
        return {
            'theme': 'light',
            'language': 'en',
            'timezone': 'UTC',
            'notifications': {
                'email': True,
                'app_events': True,
                'system_events': True
            },
            'dashboard': {
                'refresh_interval': 30,
                'show_metrics': True,
                'items_per_page': 20
            },
            'ui': {
                'sidebar_collapsed': False,
                'table_density': 'normal'
            }
        }
    
    @classmethod
    def initialize_user_preferences(cls, user_id: int):
        """Initialize user preferences with defaults."""
        default_prefs = cls.get_default_preferences()
        cls.set_user_preferences(user_id, default_prefs)