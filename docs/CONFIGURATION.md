# ForgeBoard Configuration Guide

This guide covers the comprehensive configuration system introduced in ForgeBoard v1.1, including bootstrap configuration, database-stored settings, and encryption management.

## Table of Contents

1. [Configuration Architecture](#configuration-architecture)
2. [Bootstrap Configuration](#bootstrap-configuration)
3. [Database-Stored Configuration](#database-stored-configuration)
4. [Configuration Management](#configuration-management)
5. [Security and Encryption](#security-and-encryption)
6. [Authentication Configuration](#authentication-configuration)
7. [CLI Tools](#cli-tools)
8. [Troubleshooting](#troubleshooting)

## Configuration Architecture

ForgeBoard uses a two-tier configuration system:

### 1. Bootstrap Configuration
- **Purpose**: Minimal configuration to initialize the system
- **Location**: `config/bootstrap.json` (development) or `/opt/forgeboard/config/bootstrap.json` (production)
- **Contents**: Database path, encryption key, Flask secret key
- **Format**: JSON with environment variable substitution

### 2. Database-Stored Configuration
- **Purpose**: Runtime configuration with encryption support
- **Location**: SQLite database (`config_settings` table)
- **Contents**: Authentication settings, email configuration, Azure AD settings
- **Format**: Key-value pairs with optional encryption

### Configuration Flow
```
Environment Variables → Bootstrap JSON → Database Connection → Encrypted Config Storage
```

## Bootstrap Configuration

### File Structure

**`config/bootstrap.json`**
```json
{
  "database": {
    "path": "/opt/forgeboard/data/forgeboard.db",
    "encryption_key": "${FORGEBOARD_ENCRYPTION_KEY}"
  },
  "app": {
    "secret_key": "${FORGEBOARD_SECRET_KEY}",
    "environment": "${FORGEBOARD_ENVIRONMENT:production}"
  }
}
```

### Environment Variable Substitution

Bootstrap configuration supports environment variable substitution:
- `${VAR_NAME}` - Required variable
- `${VAR_NAME:default}` - Variable with default value

### Bootstrap Configuration Management

```bash
# Validate bootstrap configuration
python backend/config/bootstrap.py --validate

# Generate new keys
python backend/config/bootstrap.py --generate-keys

# Check configuration with specific path
python backend/config/bootstrap.py --config-path /path/to/bootstrap.json --validate
```

## Database-Stored Configuration

### Configuration Categories

ForgeBoard organizes configuration into logical categories:

- **`auth`**: Authentication settings
- **`email`**: Email/SMTP configuration
- **`azure_ad`**: Azure AD authentication
- **`system`**: System-wide settings

### Configuration Schema

Each configuration entry has:
- **Category**: Logical grouping (e.g., 'auth', 'email')
- **Key**: Setting name (e.g., 'enabled', 'smtp_host')
- **Value**: Setting value (string, supports JSON)
- **Is Encrypted**: Whether value is encrypted
- **Is Active**: Whether setting is active

### Database Schema

```sql
CREATE TABLE config_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT,
    is_encrypted BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category, key)
);
```

## Configuration Management

### Using the Configuration Manager

```python
from config.manager import get_config_manager

# Get configuration manager
config = get_config_manager()

# Get a value
auth_enabled = config.get('auth.enabled', False)

# Set a value
config.set('auth.enabled', True)

# Set an encrypted value
config.set('email.smtp_password', 'secret123', encrypt=True)

# Get category values
auth_config = config.get_category('auth')

# Delete a value
config.delete('auth.old_setting')
```

### Configuration Validation

The configuration manager includes validation rules:

```python
# Validate all configuration
errors = config.validate_config()

# Check if category is properly configured
is_configured = config.is_configured('auth', ['enabled', 'method'])
```

## Security and Encryption

### Encryption Key Management

- **Key Storage**: Encryption key stored in bootstrap configuration
- **Key Rotation**: Supported through bootstrap configuration update
- **Algorithm**: Fernet (symmetric encryption)
- **Key Generation**: `Fernet.generate_key()`

### Encrypted Configuration Values

Sensitive configuration values are encrypted:
- Email passwords
- Azure AD client secrets
- API keys
- Database connection strings

### Encryption Process

```python
# Encryption happens automatically when encrypt=True
config.set('email.smtp_password', 'mypassword', encrypt=True)

# Decryption happens automatically when retrieving
password = config.get('email.smtp_password')  # Returns decrypted value
```

## Authentication Configuration

### Local Authentication

```bash
# Enable authentication
python backend/config/manager.py --set auth.enabled true

# Set authentication method
python backend/config/manager.py --set auth.method local

# Configure session settings
python backend/config/manager.py --set auth.session_timeout 86400
python backend/config/manager.py --set auth.max_login_attempts 5
python backend/config/manager.py --set auth.lockout_duration 300

# Password requirements
python backend/config/manager.py --set auth.password_min_length 8
python backend/config/manager.py --set auth.password_require_uppercase true
python backend/config/manager.py --set auth.password_require_lowercase true
python backend/config/manager.py --set auth.password_require_numbers true
python backend/config/manager.py --set auth.password_require_special false
```

### Email Configuration

```bash
# SMTP settings
python backend/config/manager.py --set email.smtp_host smtp.gmail.com
python backend/config/manager.py --set email.smtp_port 587
python backend/config/manager.py --set email.smtp_user your-email@gmail.com --encrypt
python backend/config/manager.py --set email.smtp_password your-password --encrypt
python backend/config/manager.py --set email.from_address "ForgeBoard <noreply@yourdomain.com>"

# Test email configuration
python backend/config/manager.py --test-email
```

### Azure AD Configuration

```bash
# Set Azure AD as authentication method
python backend/config/manager.py --set auth.method azure_ad

# Configure Azure AD settings (encrypted)
python backend/config/manager.py --set azure_ad.tenant_id your-tenant-id --encrypt
python backend/config/manager.py --set azure_ad.client_id your-client-id --encrypt
python backend/config/manager.py --set azure_ad.client_secret your-client-secret --encrypt
python backend/config/manager.py --set azure_ad.redirect_uri https://yourdomain.com/api/auth/azure/callback

# Configure scopes
python backend/config/manager.py --set azure_ad.scopes '["User.Read", "email", "profile"]'

# User provisioning
python backend/config/manager.py --set azure_ad.auto_create_users true
python backend/config/manager.py --set azure_ad.default_role user

# Test Azure AD configuration
python backend/config/manager.py --test-azure
```

### Group-Based Role Mapping

```bash
# Map Azure AD groups to ForgeBoard roles
python backend/config/manager.py --set azure_ad.group_mappings '{"admins": {"group_id": "group-uuid-1", "role": "admin"}, "users": {"group_id": "group-uuid-2", "role": "user"}}'
```

## CLI Tools

### Configuration Manager CLI

```bash
# Get configuration value
python backend/config/manager.py --get auth.enabled

# Set configuration value
python backend/config/manager.py --set auth.enabled true

# Set encrypted value
python backend/config/manager.py --set email.smtp_password mypassword --encrypt

# Delete configuration value
python backend/config/manager.py --delete auth.old_setting

# Get category values
python backend/config/manager.py --category auth

# Export all configuration
python backend/config/manager.py --export

# Validate configuration
python backend/config/manager.py --validate

# Test email configuration
python backend/config/manager.py --test-email

# Test Azure AD configuration
python backend/config/manager.py --test-azure
```

### Bootstrap Configuration CLI

```bash
# Validate bootstrap configuration
python backend/config/bootstrap.py --validate

# Generate new keys
python backend/config/bootstrap.py --generate-keys

# Use custom config path
python backend/config/bootstrap.py --config-path /path/to/config.json --validate
```

### Database Management CLI

```bash
# Check database health
python backend/database/connection.py --health

# Get database information
python backend/database/connection.py --info

# Create database backup
python backend/database/connection.py --backup /path/to/backup.db

# Restore database
python backend/database/connection.py --restore /path/to/backup.db
```

## Configuration Examples

### Complete Authentication Setup

```bash
# 1. Enable authentication
python backend/config/manager.py --set auth.enabled true
python backend/config/manager.py --set auth.method local

# 2. Configure session settings
python backend/config/manager.py --set auth.session_timeout 86400
python backend/config/manager.py --set auth.refresh_enabled true
python backend/config/manager.py --set auth.refresh_timeout 604800

# 3. Configure API keys
python backend/config/manager.py --set auth.api_keys_enabled true
python backend/config/manager.py --set auth.api_keys_max_per_user 5

# 4. Configure password requirements
python backend/config/manager.py --set auth.password_min_length 8
python backend/config/manager.py --set auth.password_require_uppercase true
python backend/config/manager.py --set auth.password_require_lowercase true
python backend/config/manager.py --set auth.password_require_numbers true

# 5. Configure security settings
python backend/config/manager.py --set auth.max_login_attempts 5
python backend/config/manager.py --set auth.lockout_duration 300
python backend/config/manager.py --set auth.password_reset_expiry 3600

# 6. Configure email for password reset
python backend/config/manager.py --set email.enabled true
python backend/config/manager.py --set email.smtp_host smtp.gmail.com
python backend/config/manager.py --set email.smtp_port 587
python backend/config/manager.py --set email.smtp_user noreply@yourdomain.com --encrypt
python backend/config/manager.py --set email.smtp_password your-app-password --encrypt
python backend/config/manager.py --set email.from_address "ForgeBoard <noreply@yourdomain.com>"

# 7. Test configuration
python backend/config/manager.py --validate
python backend/config/manager.py --test-email
```

### Configuration Import/Export

```bash
# Export configuration to file
python backend/config/manager.py --export > config_backup.json

# Import configuration (using Python)
python -c "
from config.manager import get_config_manager
import json
with open('config_backup.json', 'r') as f:
    config = json.load(f)
    manager = get_config_manager()
    manager.import_config(config)
"
```

## Troubleshooting

### Common Issues

#### Configuration Not Loading

```bash
# Check bootstrap configuration
python backend/config/bootstrap.py --validate

# Check database connection
python backend/database/connection.py --health

# Check configuration validation
python backend/config/manager.py --validate
```

#### Encryption Issues

```bash
# Verify encryption key
python backend/config/bootstrap.py --validate

# Check encrypted values
python backend/config/manager.py --category email

# Regenerate encryption key (WARNING: will invalidate encrypted values)
python backend/config/bootstrap.py --generate-keys
```

#### Database Issues

```bash
# Check database health
python backend/database/connection.py --health

# Check database permissions
ls -la /opt/forgeboard/data/forgeboard.db

# Initialize database if corrupted
python -c "from database.connection import init_database; from flask import Flask; app = Flask(__name__); init_database(app)"
```

### Configuration Validation Errors

Common validation errors and solutions:

1. **Missing required configuration**
   ```bash
   # Error: auth.enabled is required
   python backend/config/manager.py --set auth.enabled true
   ```

2. **Invalid configuration type**
   ```bash
   # Error: auth.session_timeout must be integer
   python backend/config/manager.py --set auth.session_timeout 86400
   ```

3. **Conditional validation failures**
   ```bash
   # Error: email.smtp_password required when auth.method=local
   python backend/config/manager.py --set email.smtp_password mypassword --encrypt
   ```

### Performance Optimization

```bash
# Clean up old configuration
python -c "
from database.models.config_setting import ConfigSetting
# Remove inactive settings
inactive = ConfigSetting.query.filter_by(is_active=False).all()
for setting in inactive:
    setting.delete()
"

# Optimize database
python backend/database/connection.py --info
```

## Best Practices

### Security
1. **Always encrypt sensitive values** (passwords, API keys, secrets)
2. **Use strong encryption keys** (generate new keys for production)
3. **Regularly rotate encryption keys**
4. **Set proper file permissions** (600 for config files)
5. **Never commit encryption keys** to version control

### Configuration Management
1. **Use categories** to organize related settings
2. **Validate configuration** before deployment
3. **Test configuration** after changes
4. **Document configuration** requirements
5. **Use version control** for configuration changes

### Backup and Recovery
1. **Regular database backups** including configuration
2. **Test backup restoration** procedures
3. **Document encryption keys** securely
4. **Plan for key rotation** procedures
5. **Monitor configuration health**

## Advanced Configuration

### Custom Configuration Categories

```python
# Add custom configuration category
config = get_config_manager()
config.set('monitoring.enabled', True)
config.set('monitoring.interval', 30)
config.set('monitoring.webhook_url', 'https://hooks.slack.com/...', encrypt=True)
```

### Configuration Hooks

```python
# Add configuration change hooks (future feature)
def on_config_change(category, key, old_value, new_value):
    if category == 'auth' and key == 'enabled':
        # Restart authentication service
        pass
```

### Configuration Templates

```bash
# Create configuration templates for different environments
cp config/bootstrap.json config/bootstrap.development.json
cp config/bootstrap.json config/bootstrap.production.json
```

## API Reference

### Configuration Manager Methods

```python
from config.manager import get_config_manager

config = get_config_manager()

# Basic operations
config.get(key, default=None, decrypt=True)
config.set(key, value, encrypt=False)
config.delete(key)

# Category operations
config.get_category(category)
config.set_category(category, values, encrypt_keys=[])
config.is_configured(category, required_keys=[])

# Validation and testing
config.validate_config()
config.test_email_config()
config.test_azure_ad_config()

# Import/export
config.export_config(include_encrypted=False)
config.import_config(config_data, encrypt_keys={})
```

For more detailed API documentation, see the docstrings in `backend/config/manager.py`.

## Migration Guide

### From v1.0 to v1.1

1. **Install new dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Create environment configuration**
   ```bash
   cp .env.example .env
   # Edit .env with appropriate values
   ```

3. **Initialize database**
   ```bash
   python -c "from database.connection import init_database; from flask import Flask; app = Flask(__name__); init_database(app)"
   ```

4. **Configure authentication** (optional)
   ```bash
   python backend/config/manager.py --set auth.enabled true
   python backend/config/manager.py --set auth.method local
   ```

The migration preserves all existing app configurations in `apps.yml` while adding the new configuration system alongside.