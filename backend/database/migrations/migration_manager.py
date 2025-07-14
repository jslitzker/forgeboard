#!/usr/bin/env python3
"""
Database migration manager for ForgeBoard.

This module handles database schema migrations and version management.
"""

import os
import logging
from typing import List, Dict, Optional
from datetime import datetime
from database.connection import db, get_db_session
from database.models.schema_migration import SchemaMigration

logger = logging.getLogger(__name__)


class MigrationManager:
    """Database migration manager."""
    
    def __init__(self):
        self.migrations_dir = os.path.dirname(os.path.abspath(__file__))
        self.available_migrations = self._load_available_migrations()
    
    def _load_available_migrations(self) -> Dict[int, Dict]:
        """Load available migrations from the migrations directory."""
        migrations = {}
        
        # Define available migrations
        migration_definitions = [
            {
                'version': 1,
                'name': 'create_initial_tables',
                'description': 'Create initial database tables for authentication system',
                'up': self._migration_001_up,
                'down': self._migration_001_down
            },
            {
                'version': 2,
                'name': 'add_indexes',
                'description': 'Add performance indexes to all tables',
                'up': self._migration_002_up,
                'down': self._migration_002_down
            },
        ]
        
        for migration in migration_definitions:
            migrations[migration['version']] = migration
        
        return migrations
    
    def get_current_version(self) -> int:
        """Get current database version."""
        try:
            return SchemaMigration.get_current_version()
        except Exception:
            # If schema_migrations table doesn't exist, we're at version 0
            return 0
    
    def get_pending_migrations(self) -> List[int]:
        """Get list of pending migration versions."""
        current_version = self.get_current_version()
        available_versions = list(self.available_migrations.keys())
        return [v for v in available_versions if v > current_version]
    
    def run_migrations(self, target_version: Optional[int] = None) -> List[Dict]:
        """Run pending migrations up to target version."""
        if target_version is None:
            target_version = max(self.available_migrations.keys())
        
        current_version = self.get_current_version()
        pending_versions = [v for v in self.available_migrations.keys() 
                          if current_version < v <= target_version]
        pending_versions.sort()
        
        executed_migrations = []
        
        for version in pending_versions:
            migration = self.available_migrations[version]
            logger.info(f"Running migration {version}: {migration['name']}")
            
            try:
                # Run migration
                migration['up']()
                
                # Record migration
                SchemaMigration.record_migration(
                    version=version,
                    name=migration['name'],
                    description=migration['description']
                )
                
                executed_migrations.append({
                    'version': version,
                    'name': migration['name'],
                    'status': 'success'
                })
                
                logger.info(f"Migration {version} completed successfully")
                
            except Exception as e:
                logger.error(f"Migration {version} failed: {e}")
                executed_migrations.append({
                    'version': version,
                    'name': migration['name'],
                    'status': 'failed',
                    'error': str(e)
                })
                break
        
        return executed_migrations
    
    def rollback_migration(self, version: int) -> bool:
        """Rollback a specific migration."""
        if version not in self.available_migrations:
            raise ValueError(f"Migration {version} not found")
        
        migration = self.available_migrations[version]
        
        try:
            logger.info(f"Rolling back migration {version}: {migration['name']}")
            
            # Run rollback
            migration['down']()
            
            # Remove from migration history
            SchemaMigration.rollback_migration(version)
            
            logger.info(f"Migration {version} rolled back successfully")
            return True
            
        except Exception as e:
            logger.error(f"Rollback of migration {version} failed: {e}")
            return False
    
    def get_migration_status(self) -> Dict:
        """Get migration status information."""
        current_version = self.get_current_version()
        pending_migrations = self.get_pending_migrations()
        applied_migrations = SchemaMigration.get_applied_migrations()
        
        return {
            'current_version': current_version,
            'latest_version': max(self.available_migrations.keys()),
            'pending_migrations': pending_migrations,
            'applied_migrations': [m.to_dict() for m in applied_migrations],
            'migration_count': len(self.available_migrations),
            'is_up_to_date': len(pending_migrations) == 0
        }
    
    # Migration implementations
    
    def _migration_001_up(self):
        """Migration 001: Create initial tables."""
        # Tables are created automatically by SQLAlchemy create_all()
        # This migration just ensures the schema_migrations table exists
        db.create_all()
    
    def _migration_001_down(self):
        """Migration 001 rollback: Drop all tables."""
        # This is a destructive operation - use with caution
        db.drop_all()
    
    def _migration_002_up(self):
        """Migration 002: Add performance indexes."""
        # Indexes are defined in model __table_args__ and created automatically
        # This migration exists for version tracking purposes
        pass
    
    def _migration_002_down(self):
        """Migration 002 rollback: Remove performance indexes."""
        # Indexes would be dropped when tables are recreated
        pass


# Global migration manager instance
_migration_manager = None


def get_migration_manager() -> MigrationManager:
    """Get the global migration manager instance."""
    global _migration_manager
    
    if _migration_manager is None:
        _migration_manager = MigrationManager()
    
    return _migration_manager


def run_pending_migrations():
    """Run all pending migrations."""
    manager = get_migration_manager()
    return manager.run_migrations()


def get_migration_status():
    """Get migration status."""
    manager = get_migration_manager()
    return manager.get_migration_status()


if __name__ == "__main__":
    # Command-line utility for migrations
    import argparse
    
    parser = argparse.ArgumentParser(description="ForgeBoard Database Migrations")
    parser.add_argument("--status", action="store_true", help="Show migration status")
    parser.add_argument("--migrate", action="store_true", help="Run pending migrations")
    parser.add_argument("--rollback", type=int, help="Rollback specific migration")
    parser.add_argument("--target", type=int, help="Target version for migration")
    
    args = parser.parse_args()
    
    manager = get_migration_manager()
    
    if args.status:
        status = manager.get_migration_status()
        print("Migration Status:")
        print(f"  Current Version: {status['current_version']}")
        print(f"  Latest Version: {status['latest_version']}")
        print(f"  Up to Date: {status['is_up_to_date']}")
        print(f"  Pending Migrations: {status['pending_migrations']}")
        print(f"  Applied Migrations: {len(status['applied_migrations'])}")
    
    if args.migrate:
        results = manager.run_migrations(args.target)
        print(f"Executed {len(results)} migrations:")
        for result in results:
            print(f"  {result['version']}: {result['name']} - {result['status']}")
    
    if args.rollback:
        success = manager.rollback_migration(args.rollback)
        print(f"Rollback {'successful' if success else 'failed'}")