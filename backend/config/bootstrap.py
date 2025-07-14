#!/usr/bin/env python3
"""
Bootstrap configuration system for ForgeBoard.

This module handles the minimal configuration needed to initialize the application
and establish database connectivity. All other configuration is stored in the database.
"""

import os
import json
import secrets
import base64
from typing import Dict, Any, Optional
from pathlib import Path
from dotenv import load_dotenv
from cryptography.fernet import Fernet


class BootstrapConfig:
    """
    Manages the minimal bootstrap configuration for ForgeBoard.
    
    This class handles:
    - Loading configuration from environment variables
    - Configuration validation
    - Secure key generation
    """
    
    
    def __init__(self, config_path: Optional[str] = None):
        """Initialize bootstrap configuration."""
        # Load environment variables from .env file in the project root
        env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env')
        load_dotenv(env_path)
        
        # Load configuration from environment variables only
        self._config = self._load_config()
        
        # Validate configuration
        self._validate_config()
    
    
    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from environment variables only."""
        # Skip file loading and use only environment variables
        return self._create_default_config()
    
    
    def _create_default_config(self) -> Dict[str, Any]:
        """Create configuration from environment variables."""
        return {
            "database": {
                "path": os.getenv('FORGEBOARD_DATABASE_PATH'),
                "encryption_key": os.getenv('FORGEBOARD_ENCRYPTION_KEY')
            },
            "app": {
                "secret_key": os.getenv('FORGEBOARD_SECRET_KEY'),
                "environment": os.getenv('FORGEBOARD_ENVIRONMENT', 'development')
            }
        }
    
    def _validate_config(self) -> None:
        """Validate the bootstrap configuration."""
        required_env_vars = [
            "FORGEBOARD_DATABASE_PATH",
            "FORGEBOARD_ENCRYPTION_KEY",
            "FORGEBOARD_SECRET_KEY",
            "FORGEBOARD_ENVIRONMENT"
        ]
        
        for var in required_env_vars:
            if not os.getenv(var):
                raise ValueError(f"Missing required environment variable: {var}")
        
        # Validate database path is writable
        db_path = self.get_database_path()
        db_dir = os.path.dirname(db_path)
        
        if not os.path.exists(db_dir):
            try:
                os.makedirs(db_dir, mode=0o700, exist_ok=True)
            except OSError as e:
                raise ValueError(f"Cannot create database directory {db_dir}: {e}")
        
        if not os.access(db_dir, os.W_OK):
            raise ValueError(f"Database directory {db_dir} is not writable")
    
    def _get_nested_value(self, key: str) -> Any:
        """Get a nested value from configuration using dot notation."""
        keys = key.split('.')
        value = self._config
        
        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return None
        
        return value
    
    # Public API
    
    def get_database_path(self) -> str:
        """Get the database file path."""
        return self._config["database"]["path"]
    
    def get_database_url(self) -> str:
        """Get the SQLAlchemy database URL."""
        return f"sqlite:///{self.get_database_path()}"
    
    def get_encryption_key(self) -> str:
        """Get the encryption key for sensitive configuration values."""
        return self._config["database"]["encryption_key"]
    
    def get_app_secret_key(self) -> str:
        """Get the Flask application secret key."""
        return self._config["app"]["secret_key"]
    
    def get_environment(self) -> str:
        """Get the application environment."""
        return self._config["app"]["environment"]
    
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.get_environment().lower() == "production"
    
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.get_environment().lower() == "development"
    
    
    @staticmethod
    def generate_encryption_key() -> str:
        """Generate a new encryption key for configuration values."""
        key = Fernet.generate_key()
        return base64.urlsafe_b64encode(key).decode('utf-8')
    
    @staticmethod
    def generate_secret_key() -> str:
        """Generate a new Flask secret key."""
        return secrets.token_urlsafe(32)
    
    def get_fernet_cipher(self) -> Fernet:
        """Get a Fernet cipher instance for encryption/decryption."""
        key = base64.urlsafe_b64decode(self.get_encryption_key().encode('utf-8'))
        return Fernet(key)


# Global bootstrap configuration instance
_bootstrap_config = None


def get_bootstrap_config(config_path: Optional[str] = None) -> BootstrapConfig:
    """Get the global bootstrap configuration instance."""
    global _bootstrap_config
    
    if _bootstrap_config is None:
        _bootstrap_config = BootstrapConfig(config_path)
    
    return _bootstrap_config


def initialize_bootstrap_config(config_path: Optional[str] = None) -> None:
    """Initialize the global bootstrap configuration."""
    global _bootstrap_config
    _bootstrap_config = BootstrapConfig(config_path)


if __name__ == "__main__":
    # Command-line utility for configuration management
    import argparse
    
    parser = argparse.ArgumentParser(description="ForgeBoard Bootstrap Configuration")
    parser.add_argument("--generate-keys", action="store_true", help="Generate new encryption and secret keys")
    parser.add_argument("--config-path", help="Path to configuration file")
    parser.add_argument("--validate", action="store_true", help="Validate configuration")
    
    args = parser.parse_args()
    
    if args.generate_keys:
        print("Encryption Key:", BootstrapConfig.generate_encryption_key())
        print("Secret Key:", BootstrapConfig.generate_secret_key())
    
    if args.validate:
        try:
            config = BootstrapConfig(args.config_path)
            print("Configuration is valid")
            print(f"Database path: {config.get_database_path()}")
            print(f"Environment: {config.get_environment()}")
        except Exception as e:
            print(f"Configuration validation failed: {e}")
            exit(1)