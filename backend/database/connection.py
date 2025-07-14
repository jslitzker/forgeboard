#!/usr/bin/env python3
"""
Database connection and initialization for ForgeBoard.

This module handles SQLite database connection setup using SQLAlchemy
and the bootstrap configuration system.
"""

import os
import logging
from typing import Optional
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from contextlib import contextmanager

from config.bootstrap import get_bootstrap_config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global database instance
db = SQLAlchemy()
migrate = Migrate()


def init_database(app: Flask) -> None:
    """
    Initialize the database with the Flask application.
    
    Args:
        app: Flask application instance
    """
    # Load bootstrap configuration
    bootstrap_config = get_bootstrap_config()
    
    # Configure SQLAlchemy
    app.config['SQLALCHEMY_DATABASE_URI'] = bootstrap_config.get_database_url()
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_pre_ping': True,
        'pool_recycle': 3600,
        'connect_args': {
            'timeout': 10,
            'check_same_thread': False,
        }
    }
    
    # Initialize database and migration
    db.init_app(app)
    migrate.init_app(app, db)
    
    # Create database directory if it doesn't exist
    db_path = bootstrap_config.get_database_path()
    db_dir = os.path.dirname(db_path)
    
    if not os.path.exists(db_dir):
        os.makedirs(db_dir, mode=0o700, exist_ok=True)
        logger.info(f"Created database directory: {db_dir}")
    
    # Set up database
    with app.app_context():
        # Import all models to ensure they're registered
        import database.models
        
        # Create all tables
        db.create_all()
        logger.info("Database tables created successfully")
        
        # Run initial data setup
        _setup_initial_data()


def _setup_initial_data() -> None:
    """Set up initial database data."""
    from database.models.config_setting import ConfigSetting
    
    # Check if this is a fresh database
    if ConfigSetting.query.first() is None:
        logger.info("Setting up initial database data")
        
        # Create default configuration settings
        default_settings = [
            ('auth', 'enabled', 'false', False),
            ('auth', 'method', 'local', False),
            ('auth', 'session_timeout', '86400', False),
            ('auth', 'max_login_attempts', '5', False),
            ('auth', 'lockout_duration', '300', False),
            ('system', 'initialized', 'true', False),
            ('system', 'version', '1.0.0', False),
        ]
        
        for category, key, value, is_encrypted in default_settings:
            setting = ConfigSetting(
                category=category,
                key=key,
                value=value,
                is_encrypted=is_encrypted
            )
            db.session.add(setting)
        
        try:
            db.session.commit()
            logger.info("Initial configuration data created")
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to create initial data: {e}")
            raise


@contextmanager
def get_db_session():
    """
    Context manager for database sessions.
    
    Usage:
        with get_db_session() as session:
            # Use session here
            pass
    """
    session = db.session
    try:
        yield session
        session.commit()
    except Exception as e:
        session.rollback()
        logger.error(f"Database session error: {e}")
        raise
    finally:
        session.close()


def get_database_info() -> dict:
    """Get database connection information."""
    bootstrap_config = get_bootstrap_config()
    
    return {
        'database_url': bootstrap_config.get_database_url(),
        'database_path': bootstrap_config.get_database_path(),
        'database_exists': os.path.exists(bootstrap_config.get_database_path()),
        'database_size': _get_database_size(bootstrap_config.get_database_path()),
        'environment': bootstrap_config.get_environment()
    }


def _get_database_size(db_path: str) -> int:
    """Get database file size in bytes."""
    try:
        return os.path.getsize(db_path) if os.path.exists(db_path) else 0
    except OSError:
        return 0


def backup_database(backup_path: Optional[str] = None) -> str:
    """
    Create a backup of the database.
    
    Args:
        backup_path: Optional path for the backup file
        
    Returns:
        Path to the backup file
    """
    import shutil
    from datetime import datetime
    
    bootstrap_config = get_bootstrap_config()
    db_path = bootstrap_config.get_database_path()
    
    if not os.path.exists(db_path):
        raise FileNotFoundError(f"Database file not found: {db_path}")
    
    if backup_path is None:
        # Generate backup filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_dir = os.path.join(os.path.dirname(db_path), 'backups')
        os.makedirs(backup_dir, exist_ok=True)
        backup_path = os.path.join(backup_dir, f'forgeboard_backup_{timestamp}.db')
    
    # Create backup
    shutil.copy2(db_path, backup_path)
    logger.info(f"Database backup created: {backup_path}")
    
    return backup_path


def restore_database(backup_path: str) -> None:
    """
    Restore database from backup.
    
    Args:
        backup_path: Path to the backup file
    """
    import shutil
    
    if not os.path.exists(backup_path):
        raise FileNotFoundError(f"Backup file not found: {backup_path}")
    
    bootstrap_config = get_bootstrap_config()
    db_path = bootstrap_config.get_database_path()
    
    # Create backup of current database
    if os.path.exists(db_path):
        current_backup = f"{db_path}.backup"
        shutil.copy2(db_path, current_backup)
        logger.info(f"Current database backed up to: {current_backup}")
    
    # Restore from backup
    shutil.copy2(backup_path, db_path)
    logger.info(f"Database restored from: {backup_path}")


def check_database_health() -> dict:
    """Check database health and return status."""
    try:
        bootstrap_config = get_bootstrap_config()
        db_path = bootstrap_config.get_database_path()
        
        health = {
            'status': 'healthy',
            'database_exists': os.path.exists(db_path),
            'database_readable': os.access(db_path, os.R_OK) if os.path.exists(db_path) else False,
            'database_writable': os.access(db_path, os.W_OK) if os.path.exists(db_path) else False,
            'database_size': _get_database_size(db_path),
            'connection_test': False
        }
        
        # Test database connection
        try:
            with get_db_session() as session:
                # Simple query to test connection
                session.execute('SELECT 1')
                health['connection_test'] = True
        except Exception as e:
            health['status'] = 'unhealthy'
            health['connection_error'] = str(e)
        
        return health
        
    except Exception as e:
        return {
            'status': 'unhealthy',
            'error': str(e)
        }


if __name__ == "__main__":
    # Command-line utility for database operations
    import argparse
    
    parser = argparse.ArgumentParser(description="ForgeBoard Database Operations")
    parser.add_argument("--backup", help="Create database backup")
    parser.add_argument("--restore", help="Restore database from backup")
    parser.add_argument("--health", action="store_true", help="Check database health")
    parser.add_argument("--info", action="store_true", help="Show database information")
    
    args = parser.parse_args()
    
    if args.backup:
        backup_path = backup_database(args.backup if args.backup != True else None)
        print(f"Database backup created: {backup_path}")
    
    if args.restore:
        restore_database(args.restore)
        print(f"Database restored from: {args.restore}")
    
    if args.health:
        health = check_database_health()
        print("Database Health:")
        for key, value in health.items():
            print(f"  {key}: {value}")
    
    if args.info:
        info = get_database_info()
        print("Database Information:")
        for key, value in info.items():
            print(f"  {key}: {value}")