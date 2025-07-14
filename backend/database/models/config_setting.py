#!/usr/bin/env python3
"""
Configuration setting model for ForgeBoard.

This model stores configuration settings in the database with encryption support.
"""

from sqlalchemy import Column, String, Boolean, Text, Index, UniqueConstraint
from sqlalchemy.orm import validates
from database.models.base import BaseModel


class ConfigSetting(BaseModel):
    """Configuration setting model for storing encrypted configuration values."""
    
    __tablename__ = 'config_settings'
    
    category = Column(String(50), nullable=False, index=True)
    key = Column(String(100), nullable=False)
    value = Column(Text, nullable=True)
    is_encrypted = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Unique constraint on category + key
    __table_args__ = (
        UniqueConstraint('category', 'key', name='uq_config_category_key'),
        Index('idx_config_category_key', 'category', 'key'),
        Index('idx_config_active', 'is_active'),
    )
    
    def __repr__(self):
        return f"<ConfigSetting(category={self.category}, key={self.key})>"
    
    @validates('category')
    def validate_category(self, key, category):
        """Validate configuration category."""
        if not category or len(category.strip()) == 0:
            raise ValueError("Category cannot be empty")
        if len(category) > 50:
            raise ValueError("Category cannot exceed 50 characters")
        return category.strip().lower()
    
    @validates('key')
    def validate_key(self, key, config_key):
        """Validate configuration key."""
        if not config_key or len(config_key.strip()) == 0:
            raise ValueError("Key cannot be empty")
        if len(config_key) > 100:
            raise ValueError("Key cannot exceed 100 characters")
        return config_key.strip().lower()
    
    def to_dict(self):
        """Convert to dictionary, masking encrypted values."""
        result = super().to_dict()
        if self.is_encrypted:
            result['value'] = '***ENCRYPTED***'
        return result
    
    @classmethod
    def get_setting(cls, category: str, key: str, default=None):
        """Get configuration setting value."""
        setting = cls.query.filter_by(
            category=category.lower(),
            key=key.lower(),
            is_active=True
        ).first()
        
        if setting:
            return setting.value
        return default
    
    @classmethod
    def set_setting(cls, category: str, key: str, value: str, is_encrypted: bool = False):
        """Set configuration setting value."""
        setting = cls.query.filter_by(
            category=category.lower(),
            key=key.lower()
        ).first()
        
        if setting:
            setting.value = value
            setting.is_encrypted = is_encrypted
            setting.is_active = True
            setting.save()
        else:
            setting = cls.create(
                category=category.lower(),
                key=key.lower(),
                value=value,
                is_encrypted=is_encrypted,
                is_active=True
            )
        
        return setting
    
    @classmethod
    def get_category_settings(cls, category: str):
        """Get all settings for a category."""
        return cls.query.filter_by(
            category=category.lower(),
            is_active=True
        ).all()
    
    @classmethod
    def delete_setting(cls, category: str, key: str):
        """Delete a configuration setting."""
        setting = cls.query.filter_by(
            category=category.lower(),
            key=key.lower()
        ).first()
        
        if setting:
            setting.is_active = False
            setting.save()
        
        return setting
    
    @classmethod
    def get_all_categories(cls):
        """Get all configuration categories."""
        return [row[0] for row in cls.query.with_entities(cls.category).distinct().all()]


class ConfigEncryptionKey(BaseModel):
    """Configuration encryption key tracking model."""
    
    __tablename__ = 'config_encryption_keys'
    
    setting_id = Column(String(36), nullable=False, index=True)
    key_version = Column(String(10), default='1', nullable=False)
    
    # Indexes
    __table_args__ = (
        Index('idx_encryption_setting_id', 'setting_id'),
    )
    
    def __repr__(self):
        return f"<ConfigEncryptionKey(setting_id={self.setting_id}, version={self.key_version})>"