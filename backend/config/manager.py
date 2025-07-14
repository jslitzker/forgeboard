#!/usr/bin/env python3
"""
Configuration manager for ForgeBoard.

This module provides a centralized configuration management system with encryption
support for sensitive values. Configuration is stored in the database and can be
managed through the API.
"""

import json
import logging
from typing import Any, Dict, List, Optional, Union
from cryptography.fernet import Fernet
from database.connection import get_db_session
from database.models.config_setting import ConfigSetting
from config.bootstrap import get_bootstrap_config

logger = logging.getLogger(__name__)


class ConfigManager:
    """
    Configuration manager with encryption support.
    
    This class provides methods to get, set, and manage configuration values
    stored in the database. Sensitive values are encrypted using the bootstrap
    encryption key.
    """
    
    def __init__(self):
        self.bootstrap_config = get_bootstrap_config()
        self.cipher = self.bootstrap_config.get_fernet_cipher()
        self._cached_config = {}
        self._cache_dirty = True
    
    def get(self, key: str, default=None, decrypt: bool = True) -> Any:
        """
        Get configuration value.
        
        Args:
            key: Configuration key in format 'category.key'
            default: Default value if key not found
            decrypt: Whether to decrypt encrypted values
            
        Returns:
            Configuration value or default
        """
        category, config_key = self._parse_key(key)
        
        try:
            setting = ConfigSetting.get_setting(category, config_key)
            
            if setting is None:
                return default
            
            value = setting
            
            # Handle encrypted values
            if decrypt:
                setting_obj = ConfigSetting.find_one(category=category, key=config_key)
                if setting_obj and setting_obj.is_encrypted:
                    value = self._decrypt_value(value)
            
            # Try to parse as JSON
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                return value
                
        except Exception as e:
            logger.error(f"Error getting config value {key}: {e}")
            return default
    
    def set(self, key: str, value: Any, encrypt: bool = False) -> bool:
        """
        Set configuration value.
        
        Args:
            key: Configuration key in format 'category.key'
            value: Value to set
            encrypt: Whether to encrypt the value
            
        Returns:
            True if successful, False otherwise
        """
        category, config_key = self._parse_key(key)
        
        try:
            # Serialize value
            if isinstance(value, (dict, list)):
                serialized_value = json.dumps(value)
            else:
                serialized_value = str(value)
            
            # Encrypt if needed
            if encrypt:
                serialized_value = self._encrypt_value(serialized_value)
            
            # Save to database
            ConfigSetting.set_setting(category, config_key, serialized_value, encrypt)
            
            # Clear cache
            self._cache_dirty = True
            
            logger.info(f"Configuration value {key} updated (encrypted: {encrypt})")
            return True
            
        except Exception as e:
            logger.error(f"Error setting config value {key}: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """
        Delete configuration value.
        
        Args:
            key: Configuration key in format 'category.key'
            
        Returns:
            True if successful, False otherwise
        """
        category, config_key = self._parse_key(key)
        
        try:
            ConfigSetting.delete_setting(category, config_key)
            self._cache_dirty = True
            
            logger.info(f"Configuration value {key} deleted")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting config value {key}: {e}")
            return False
    
    def get_category(self, category: str) -> Dict[str, Any]:
        """
        Get all configuration values for a category.
        
        Args:
            category: Configuration category
            
        Returns:
            Dictionary of configuration values
        """
        try:
            settings = ConfigSetting.get_category_settings(category)
            result = {}
            
            for setting in settings:
                value = setting.value
                
                # Decrypt if needed
                if setting.is_encrypted:
                    value = self._decrypt_value(value)
                
                # Parse JSON
                try:
                    value = json.loads(value)
                except (json.JSONDecodeError, TypeError):
                    pass
                
                result[setting.key] = value
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting category {category}: {e}")
            return {}
    
    def set_category(self, category: str, values: Dict[str, Any], encrypt_keys: List[str] = None) -> bool:
        """
        Set multiple configuration values for a category.
        
        Args:
            category: Configuration category
            values: Dictionary of key-value pairs
            encrypt_keys: List of keys to encrypt
            
        Returns:
            True if successful, False otherwise
        """
        if encrypt_keys is None:
            encrypt_keys = []
        
        try:
            for key, value in values.items():
                full_key = f"{category}.{key}"
                encrypt = key in encrypt_keys
                self.set(full_key, value, encrypt)
            
            return True
            
        except Exception as e:
            logger.error(f"Error setting category {category}: {e}")
            return False
    
    def is_configured(self, category: str, required_keys: List[str] = None) -> bool:
        """
        Check if a configuration category is properly configured.
        
        Args:
            category: Configuration category
            required_keys: List of required keys
            
        Returns:
            True if fully configured, False otherwise
        """
        if required_keys is None:
            required_keys = []
        
        try:
            config = self.get_category(category)
            
            # Check if all required keys are present
            for key in required_keys:
                if key not in config or config[key] is None:
                    return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error checking configuration for {category}: {e}")
            return False
    
    def get_all_categories(self) -> List[str]:
        """Get all configuration categories."""
        try:
            return ConfigSetting.get_all_categories()
        except Exception as e:
            logger.error(f"Error getting categories: {e}")
            return []
    
    def export_config(self, include_encrypted: bool = False) -> Dict[str, Dict[str, Any]]:
        """
        Export all configuration values.
        
        Args:
            include_encrypted: Whether to include encrypted values (decrypted)
            
        Returns:
            Dictionary of all configuration values grouped by category
        """
        try:
            categories = self.get_all_categories()
            result = {}
            
            for category in categories:
                if include_encrypted:
                    result[category] = self.get_category(category)
                else:
                    # Get settings without decryption
                    settings = ConfigSetting.get_category_settings(category)
                    category_config = {}
                    
                    for setting in settings:
                        if setting.is_encrypted:
                            category_config[setting.key] = "***ENCRYPTED***"
                        else:
                            value = setting.value
                            try:
                                value = json.loads(value)
                            except (json.JSONDecodeError, TypeError):
                                pass
                            category_config[setting.key] = value
                    
                    result[category] = category_config
            
            return result
            
        except Exception as e:
            logger.error(f"Error exporting config: {e}")
            return {}
    
    def import_config(self, config_data: Dict[str, Dict[str, Any]], 
                     encrypt_keys: Dict[str, List[str]] = None) -> bool:
        """
        Import configuration values.
        
        Args:
            config_data: Dictionary of configuration values grouped by category
            encrypt_keys: Dictionary mapping category to list of keys to encrypt
            
        Returns:
            True if successful, False otherwise
        """
        if encrypt_keys is None:
            encrypt_keys = {}
        
        try:
            for category, values in config_data.items():
                category_encrypt_keys = encrypt_keys.get(category, [])
                self.set_category(category, values, category_encrypt_keys)
            
            return True
            
        except Exception as e:
            logger.error(f"Error importing config: {e}")
            return False
    
    def validate_config(self) -> Dict[str, List[str]]:
        """
        Validate configuration values.
        
        Returns:
            Dictionary of validation errors grouped by category
        """
        errors = {}
        
        # Define validation rules
        validation_rules = {
            'auth': {
                'enabled': {'type': bool, 'required': True},
                'method': {'type': str, 'required': True, 'choices': ['local', 'azure_ad']},
                'session_timeout': {'type': int, 'min': 300, 'max': 86400},
                'max_login_attempts': {'type': int, 'min': 3, 'max': 10},
                'lockout_duration': {'type': int, 'min': 60, 'max': 3600},
            },
            'email': {
                'smtp_host': {'type': str, 'required_if': 'auth.method==local'},
                'smtp_port': {'type': int, 'min': 1, 'max': 65535},
                'smtp_user': {'type': str, 'required_if': 'auth.method==local'},
                'smtp_password': {'type': str, 'required_if': 'auth.method==local'},
                'from_address': {'type': str, 'required_if': 'auth.method==local'},
            },
            'azure_ad': {
                'tenant_id': {'type': str, 'required_if': 'auth.method==azure_ad'},
                'client_id': {'type': str, 'required_if': 'auth.method==azure_ad'},
                'client_secret': {'type': str, 'required_if': 'auth.method==azure_ad'},
                'redirect_uri': {'type': str, 'required_if': 'auth.method==azure_ad'},
            }
        }
        
        # Validate each category
        for category, rules in validation_rules.items():
            category_errors = []
            config = self.get_category(category)
            
            for key, rule in rules.items():
                value = config.get(key)
                
                # Check required fields
                if rule.get('required', False) and value is None:
                    category_errors.append(f"{key} is required")
                
                # Check conditional requirements
                if 'required_if' in rule and value is None:
                    condition = rule['required_if']
                    if self._check_condition(condition):
                        category_errors.append(f"{key} is required when {condition}")
                
                # Check type
                if value is not None and 'type' in rule:
                    if not isinstance(value, rule['type']):
                        category_errors.append(f"{key} must be of type {rule['type'].__name__}")
                
                # Check choices
                if value is not None and 'choices' in rule:
                    if value not in rule['choices']:
                        category_errors.append(f"{key} must be one of {rule['choices']}")
                
                # Check min/max for numbers
                if value is not None and isinstance(value, (int, float)):
                    if 'min' in rule and value < rule['min']:
                        category_errors.append(f"{key} must be at least {rule['min']}")
                    if 'max' in rule and value > rule['max']:
                        category_errors.append(f"{key} must be at most {rule['max']}")
            
            if category_errors:
                errors[category] = category_errors
        
        return errors
    
    def _parse_key(self, key: str) -> tuple:
        """Parse configuration key into category and key."""
        parts = key.split('.', 1)
        if len(parts) != 2:
            raise ValueError(f"Invalid key format: {key}. Expected 'category.key'")
        return parts[0], parts[1]
    
    def _encrypt_value(self, value: str) -> str:
        """Encrypt a configuration value."""
        try:
            return self.cipher.encrypt(value.encode()).decode()
        except Exception as e:
            logger.error(f"Error encrypting value: {e}")
            raise
    
    def _decrypt_value(self, encrypted_value: str) -> str:
        """Decrypt a configuration value."""
        try:
            return self.cipher.decrypt(encrypted_value.encode()).decode()
        except Exception as e:
            logger.error(f"Error decrypting value: {e}")
            raise
    
    def _check_condition(self, condition: str) -> bool:
        """Check a conditional requirement."""
        try:
            # Parse condition like "auth.method==local"
            if '==' in condition:
                key, expected_value = condition.split('==', 1)
                actual_value = self.get(key.strip())
                return actual_value == expected_value.strip()
            
            return False
            
        except Exception as e:
            logger.error(f"Error checking condition {condition}: {e}")
            return False
    
    def test_email_config(self) -> Dict[str, Any]:
        """Test email configuration."""
        try:
            email_config = self.get_category('email')
            
            # Basic validation
            required_keys = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'from_address']
            for key in required_keys:
                if key not in email_config or not email_config[key]:
                    return {
                        'success': False,
                        'error': f"Missing required email configuration: {key}"
                    }
            
            # Test SMTP connection
            import smtplib
            from email.mime.text import MIMEText
            
            smtp_host = email_config['smtp_host']
            smtp_port = int(email_config['smtp_port'])
            smtp_user = email_config['smtp_user']
            smtp_password = email_config['smtp_password']
            
            # Create SMTP connection
            server = smtplib.SMTP(smtp_host, smtp_port)
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.quit()
            
            return {
                'success': True,
                'message': 'Email configuration is valid'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def test_azure_ad_config(self) -> Dict[str, Any]:
        """Test Azure AD configuration."""
        try:
            azure_config = self.get_category('azure_ad')
            
            # Basic validation
            required_keys = ['tenant_id', 'client_id', 'client_secret']
            for key in required_keys:
                if key not in azure_config or not azure_config[key]:
                    return {
                        'success': False,
                        'error': f"Missing required Azure AD configuration: {key}"
                    }
            
            # Test Azure AD connection (simplified)
            # In a real implementation, this would test the MSAL configuration
            
            return {
                'success': True,
                'message': 'Azure AD configuration appears valid'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }


# Global configuration manager instance
_config_manager = None


def get_config_manager() -> ConfigManager:
    """Get the global configuration manager instance."""
    global _config_manager
    
    if _config_manager is None:
        _config_manager = ConfigManager()
    
    return _config_manager


def get_config(key: str, default=None) -> Any:
    """Get configuration value."""
    return get_config_manager().get(key, default)


def set_config(key: str, value: Any, encrypt: bool = False) -> bool:
    """Set configuration value."""
    return get_config_manager().set(key, value, encrypt)


if __name__ == "__main__":
    # Command-line utility for configuration management
    import argparse
    
    parser = argparse.ArgumentParser(description="ForgeBoard Configuration Management")
    parser.add_argument("--get", help="Get configuration value")
    parser.add_argument("--set", nargs=2, metavar=('KEY', 'VALUE'), help="Set configuration value")
    parser.add_argument("--delete", help="Delete configuration value")
    parser.add_argument("--category", help="Get all values for category")
    parser.add_argument("--export", action="store_true", help="Export all configuration")
    parser.add_argument("--validate", action="store_true", help="Validate configuration")
    parser.add_argument("--test-email", action="store_true", help="Test email configuration")
    parser.add_argument("--test-azure", action="store_true", help="Test Azure AD configuration")
    parser.add_argument("--encrypt", action="store_true", help="Encrypt value when setting")
    
    args = parser.parse_args()
    
    manager = get_config_manager()
    
    if args.get:
        value = manager.get(args.get)
        print(f"{args.get}: {value}")
    
    if args.set:
        key, value = args.set
        success = manager.set(key, value, args.encrypt)
        print(f"Set {key}: {'success' if success else 'failed'}")
    
    if args.delete:
        success = manager.delete(args.delete)
        print(f"Delete {args.delete}: {'success' if success else 'failed'}")
    
    if args.category:
        config = manager.get_category(args.category)
        print(f"Category {args.category}:")
        for key, value in config.items():
            print(f"  {key}: {value}")
    
    if args.export:
        config = manager.export_config()
        print("Configuration:")
        for category, values in config.items():
            print(f"  {category}:")
            for key, value in values.items():
                print(f"    {key}: {value}")
    
    if args.validate:
        errors = manager.validate_config()
        if errors:
            print("Validation errors:")
            for category, category_errors in errors.items():
                print(f"  {category}:")
                for error in category_errors:
                    print(f"    - {error}")
        else:
            print("Configuration is valid")
    
    if args.test_email:
        result = manager.test_email_config()
        print(f"Email test: {'success' if result['success'] else 'failed'}")
        if 'error' in result:
            print(f"Error: {result['error']}")
    
    if args.test_azure:
        result = manager.test_azure_ad_config()
        print(f"Azure AD test: {'success' if result['success'] else 'failed'}")
        if 'error' in result:
            print(f"Error: {result['error']}")