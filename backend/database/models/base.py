#!/usr/bin/env python3
"""
Base database model for ForgeBoard.

This module provides the base model class with common fields and utilities.
"""

from datetime import datetime
from typing import Dict, Any
from sqlalchemy import Column, Integer, DateTime, Boolean
from sqlalchemy.ext.declarative import declared_attr
from database.connection import db


class BaseModel(db.Model):
    """Base model class with common fields and utilities."""
    
    __abstract__ = True
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<{self.__class__.__name__}(id={self.id})>"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model instance to dictionary."""
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, datetime):
                value = value.isoformat()
            result[column.name] = value
        return result
    
    def update(self, **kwargs):
        """Update model instance with provided keyword arguments."""
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
        self.updated_at = datetime.utcnow()
    
    def save(self):
        """Save model instance to database."""
        db.session.add(self)
        db.session.commit()
        return self
    
    def delete(self):
        """Delete model instance from database."""
        db.session.delete(self)
        db.session.commit()
    
    @classmethod
    def create(cls, **kwargs):
        """Create new model instance."""
        instance = cls(**kwargs)
        return instance.save()
    
    @classmethod
    def find_by_id(cls, id: int):
        """Find model instance by ID."""
        return cls.query.get(id)
    
    @classmethod
    def find_all(cls, **filters):
        """Find all model instances with optional filters."""
        query = cls.query
        for key, value in filters.items():
            if hasattr(cls, key):
                query = query.filter(getattr(cls, key) == value)
        return query.all()
    
    @classmethod
    def find_one(cls, **filters):
        """Find one model instance with filters."""
        query = cls.query
        for key, value in filters.items():
            if hasattr(cls, key):
                query = query.filter(getattr(cls, key) == value)
        return query.first()


class SoftDeleteMixin:
    """Mixin for soft delete functionality."""
    
    is_deleted = Column(Boolean, default=False, nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    
    def soft_delete(self):
        """Mark record as deleted without removing from database."""
        self.is_deleted = True
        self.deleted_at = datetime.utcnow()
        self.save()
    
    def restore(self):
        """Restore soft-deleted record."""
        self.is_deleted = False
        self.deleted_at = None
        self.save()
    
    @classmethod
    def active(cls):
        """Get query for non-deleted records."""
        return cls.query.filter(cls.is_deleted == False)
    
    @classmethod
    def deleted(cls):
        """Get query for deleted records."""
        return cls.query.filter(cls.is_deleted == True)


class TimestampMixin:
    """Mixin for timestamp functionality."""
    
    @declared_attr
    def created_at(cls):
        return Column(DateTime, default=datetime.utcnow, nullable=False)
    
    @declared_attr
    def updated_at(cls):
        return Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)