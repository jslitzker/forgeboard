#!/usr/bin/env python3
"""
Database models for ForgeBoard.

This module imports all database models to ensure they are registered with SQLAlchemy.
"""

from .base import BaseModel, SoftDeleteMixin, TimestampMixin
from .config_setting import ConfigSetting, ConfigEncryptionKey
from .user import User
from .session import Session
from .api_key import ApiKey
from .user_preference import UserPreference
from .password_reset import PasswordReset
from .audit_log import AuditLog
from .azure_group_mapping import AzureGroupMapping
from .schema_migration import SchemaMigration

__all__ = [
    # Base classes
    'BaseModel',
    'SoftDeleteMixin',
    'TimestampMixin',
    
    # Configuration models
    'ConfigSetting',
    'ConfigEncryptionKey',
    
    # User and authentication models
    'User',
    'Session',
    'ApiKey',
    'UserPreference',
    'PasswordReset',
    
    # Audit and tracking models
    'AuditLog',
    
    # Azure AD models
    'AzureGroupMapping',
    
    # Migration models
    'SchemaMigration',
]