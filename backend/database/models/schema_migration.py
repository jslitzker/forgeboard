#!/usr/bin/env python3
"""
Schema migration model for ForgeBoard.

This model tracks database schema migrations and versions.
"""

from typing import List, Optional
from sqlalchemy import Column, Integer, DateTime, String, Text, Index
from sqlalchemy.orm import validates
from database.models.base import BaseModel


class SchemaMigration(BaseModel):
    """Schema migration model for tracking database migrations."""
    
    __tablename__ = 'schema_migrations'
    
    version = Column(Integer, unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    applied_at = Column(DateTime, nullable=False)
    
    # Indexes
    __table_args__ = (
        Index('idx_schema_migration_version', 'version'),
        Index('idx_schema_migration_applied_at', 'applied_at'),
    )
    
    def __repr__(self):
        return f"<SchemaMigration(version={self.version}, name={self.name})>"
    
    @validates('version')
    def validate_version(self, key, version):
        """Validate migration version."""
        if not isinstance(version, int) or version < 1:
            raise ValueError("Version must be a positive integer")
        return version
    
    @validates('name')
    def validate_name(self, key, name):
        """Validate migration name."""
        if not name or len(name.strip()) == 0:
            raise ValueError("Migration name cannot be empty")
        if len(name) > 255:
            raise ValueError("Migration name cannot exceed 255 characters")
        return name.strip()
    
    def to_dict(self):
        """Convert to dictionary."""
        result = super().to_dict()
        return result
    
    @classmethod
    def record_migration(cls, version: int, name: str, description: str = None):
        """Record a completed migration."""
        migration = cls(
            version=version,
            name=name,
            description=description
        )
        return migration.save()
    
    @classmethod
    def get_current_version(cls) -> int:
        """Get current schema version."""
        latest = cls.query.order_by(cls.version.desc()).first()
        return latest.version if latest else 0
    
    @classmethod
    def is_migration_applied(cls, version: int) -> bool:
        """Check if migration version is applied."""
        return cls.query.filter_by(version=version).first() is not None
    
    @classmethod
    def get_applied_migrations(cls) -> List['SchemaMigration']:
        """Get all applied migrations."""
        return cls.query.order_by(cls.version.asc()).all()
    
    @classmethod
    def get_migration_history(cls, limit: int = 50) -> List['SchemaMigration']:
        """Get migration history."""
        return cls.query.order_by(cls.applied_at.desc()).limit(limit).all()
    
    @classmethod
    def get_migration_by_version(cls, version: int) -> Optional['SchemaMigration']:
        """Get migration by version."""
        return cls.query.filter_by(version=version).first()
    
    @classmethod
    def get_pending_migrations(cls, available_versions: List[int]) -> List[int]:
        """Get pending migration versions."""
        applied_versions = {m.version for m in cls.get_applied_migrations()}
        return [v for v in available_versions if v not in applied_versions]
    
    @classmethod
    def rollback_migration(cls, version: int):
        """Rollback a migration (remove from history)."""
        migration = cls.get_migration_by_version(version)
        if migration:
            migration.delete()
        return migration