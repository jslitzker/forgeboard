# ForgeBoard Setup Guide

This guide provides detailed instructions for setting up ForgeBoard in both development and production environments, including the new authentication system.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Setup](#development-setup)
3. [Production Setup](#production-setup)
4. [Authentication Configuration](#authentication-configuration)
5. [Database Management](#database-management)
6. [Security Considerations](#security-considerations)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- **Operating System**: Ubuntu 22.04+ (or similar Linux distribution)
- **Python**: 3.11 or higher
- **Node.js**: 18.0 or higher
- **System Access**: Root or sudo privileges
- **Network**: Port 80 and 443 available for web traffic

### Required System Packages
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y python3 python3-pip python3-venv nodejs npm nginx git curl
```

## Development Setup

### 1. Clone and Configure Environment

```bash
# Clone the repository
git clone https://github.com/jslitzker/forgeboard.git
cd forgeboard

# Set up environment variables
cp .env.example .env
```

### 2. Generate Secure Keys

Edit the `.env` file and generate secure keys:

```bash
# Generate encryption key
python3 -c "from cryptography.fernet import Fernet; print('FORGEBOARD_ENCRYPTION_KEY=' + Fernet.generate_key().decode())"

# Generate Flask secret key
python3 -c "import secrets; print('FORGEBOARD_SECRET_KEY=' + secrets.token_urlsafe(32))"

# Set development database path
echo "FORGEBOARD_DATABASE_PATH=./data/forgeboard.db" >> .env
echo "FORGEBOARD_ENVIRONMENT=development" >> .env
```

Or use the built-in key generator:

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install cryptography
python config/bootstrap.py --generate-keys
```

### 3. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create data directory
mkdir -p ../data

# Initialize database
python -c "from database.connection import init_database; from flask import Flask; app = Flask(__name__); init_database(app)"

# Verify database health
python database/connection.py --health

# Start development server
python main.py
```

The backend will be available at `http://localhost:5000`.

### 4. Frontend Setup

```bash
# Open new terminal
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

### 5. Verify Installation

1. Visit `http://localhost:5173` in your browser
2. Check that the dashboard loads correctly
3. Test API endpoints at `http://localhost:5000/docs`
4. Verify database connectivity:
   ```bash
   python backend/database/connection.py --info
   ```

## Production Setup

### 1. Automated Installation (Recommended)

```bash
# Clone repository
git clone https://github.com/jslitzker/forgeboard.git
cd forgeboard

# Run automated setup
sudo ./setup.sh
```

The setup script will:
- Install all system dependencies
- Set up ForgeBoard in `/opt/forgeboard`
- Configure systemd services
- Set up NGINX reverse proxy
- Initialize database with production settings
- Start all services

### 2. Manual Production Setup

If you prefer manual installation:

```bash
# 1. Create production directory
sudo mkdir -p /opt/forgeboard
sudo chown $USER:$USER /opt/forgeboard

# 2. Copy application files
cp -r . /opt/forgeboard/

# 3. Set up production environment
cd /opt/forgeboard
cp .env.example .env

# 4. Generate production keys
python3 -c "from cryptography.fernet import Fernet; print('FORGEBOARD_ENCRYPTION_KEY=' + Fernet.generate_key().decode())" >> .env
python3 -c "import secrets; print('FORGEBOARD_SECRET_KEY=' + secrets.token_urlsafe(32))" >> .env

# 5. Configure production settings
echo "FORGEBOARD_DATABASE_PATH=/opt/forgeboard/data/forgeboard.db" >> .env
echo "FORGEBOARD_ENVIRONMENT=production" >> .env

# 6. Set up backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 7. Initialize database
mkdir -p /opt/forgeboard/data
python -c "from database.connection import init_database; from flask import Flask; app = Flask(__name__); init_database(app)"

# 8. Set secure permissions
sudo chown -R forgeboard:forgeboard /opt/forgeboard
sudo chmod 600 /opt/forgeboard/data/forgeboard.db
sudo chmod 600 /opt/forgeboard/.env

# 9. Build frontend
cd ../frontend
npm install
npm run build

# 10. Configure systemd and NGINX (see setup.sh for details)
```

## Authentication Configuration

### Initial Setup

After installation, authentication is disabled by default. To enable:

```bash
# Enable authentication
python backend/config/manager.py --set auth.enabled true

# Set authentication method (local or azure_ad)
python backend/config/manager.py --set auth.method local

# Configure session settings
python backend/config/manager.py --set auth.session_timeout 86400
python backend/config/manager.py --set auth.max_login_attempts 5
python backend/config/manager.py --set auth.lockout_duration 300
```

### Local Authentication Setup

```bash
# Create first admin user (this will be added to Phase 2)
# python backend/auth/cli.py create-user --username admin --email admin@example.com --admin

# Configure password requirements
python backend/config/manager.py --set auth.password_min_length 8
python backend/config/manager.py --set auth.password_require_uppercase true
python backend/config/manager.py --set auth.password_require_lowercase true
python backend/config/manager.py --set auth.password_require_numbers true
```

### Email Configuration (for password reset)

```bash
# SMTP settings (encrypted)
python backend/config/manager.py --set email.smtp_host smtp.gmail.com
python backend/config/manager.py --set email.smtp_port 587
python backend/config/manager.py --set email.smtp_user your-email@gmail.com --encrypt
python backend/config/manager.py --set email.smtp_password your-app-password --encrypt
python backend/config/manager.py --set email.from_address "ForgeBoard <noreply@yourdomain.com>"

# Test email configuration
python backend/config/manager.py --test-email
```

### Azure AD Authentication Setup

```bash
# Set authentication method
python backend/config/manager.py --set auth.method azure_ad

# Configure Azure AD settings (all encrypted)
python backend/config/manager.py --set azure_ad.tenant_id your-tenant-id --encrypt
python backend/config/manager.py --set azure_ad.client_id your-client-id --encrypt
python backend/config/manager.py --set azure_ad.client_secret your-client-secret --encrypt
python backend/config/manager.py --set azure_ad.redirect_uri https://yourdomain.com/api/auth/azure/callback

# Configure user provisioning
python backend/config/manager.py --set azure_ad.auto_create_users true
python backend/config/manager.py --set azure_ad.default_role user

# Test Azure AD configuration
python backend/config/manager.py --test-azure
```

### Group-Based Role Mapping (Azure AD)

```bash
# Map Azure AD groups to ForgeBoard roles
python backend/config/manager.py --set azure_ad.group_mappings.admins.group_id "group-id-for-admins"
python backend/config/manager.py --set azure_ad.group_mappings.admins.role admin
python backend/config/manager.py --set azure_ad.group_mappings.users.group_id "group-id-for-users"
python backend/config/manager.py --set azure_ad.group_mappings.users.role user
```

## Database Management

### Database Operations

```bash
# Check database health
python backend/database/connection.py --health

# Get database information
python backend/database/connection.py --info

# Create database backup
python backend/database/connection.py --backup /path/to/backup.db

# Restore from backup
python backend/database/connection.py --restore /path/to/backup.db

# Run database migrations
python backend/database/migrations/migration_manager.py --migrate

# Check migration status
python backend/database/migrations/migration_manager.py --status
```

### Configuration Management

```bash
# View all configuration
python backend/config/manager.py --export

# View specific category
python backend/config/manager.py --category auth

# Set configuration value
python backend/config/manager.py --set auth.enabled true

# Set encrypted value
python backend/config/manager.py --set email.smtp_password secret123 --encrypt

# Delete configuration value
python backend/config/manager.py --delete auth.old_setting

# Validate configuration
python backend/config/manager.py --validate
```

## Security Considerations

### File Permissions

```bash
# Set secure permissions for production
sudo chown -R forgeboard:forgeboard /opt/forgeboard
sudo chmod 600 /opt/forgeboard/.env
sudo chmod 600 /opt/forgeboard/data/forgeboard.db
sudo chmod 600 /opt/forgeboard/config/bootstrap.json
```

### Key Management

1. **Generate Strong Keys**: Always generate new keys for production
2. **Key Rotation**: Regularly rotate encryption and secret keys
3. **Environment Variables**: Never commit `.env` files to version control
4. **Database Encryption**: Sensitive config values are encrypted at rest
5. **Backup Security**: Encrypt database backups in production

### Network Security

```bash
# Configure firewall (example)
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw --force enable
```

### SSL/TLS Configuration

```bash
# Install Let's Encrypt certificate
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database file exists and is readable
ls -la /opt/forgeboard/data/forgeboard.db

# Verify database health
python backend/database/connection.py --health

# Check database permissions
sudo chown forgeboard:forgeboard /opt/forgeboard/data/forgeboard.db
sudo chmod 600 /opt/forgeboard/data/forgeboard.db
```

#### Configuration Issues
```bash
# Validate configuration
python backend/config/manager.py --validate

# Check bootstrap configuration
python backend/config/bootstrap.py --validate

# Regenerate keys if corrupted
python backend/config/bootstrap.py --generate-keys
```

#### Service Issues
```bash
# Check systemd services
sudo systemctl status forgeboard-api
sudo systemctl status forgeboard-frontend

# View service logs
sudo journalctl -u forgeboard-api -f
sudo journalctl -u forgeboard-frontend -f

# Restart services
sudo systemctl restart forgeboard-api
sudo systemctl restart forgeboard-frontend
```

#### NGINX Issues
```bash
# Test NGINX configuration
sudo nginx -t

# View NGINX logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Restart NGINX
sudo systemctl restart nginx
```

### Logs and Debugging

```bash
# Application logs
tail -f /opt/forgeboard/logs/forgeboard.log

# Database logs
python backend/database/connection.py --health

# Configuration validation
python backend/config/manager.py --validate

# API health check
curl http://localhost:5000/api/health
```

### Performance Optimization

```bash
# Database optimization
python backend/database/connection.py --info

# Clean up old sessions
python -c "from database.models.session import Session; Session.cleanup_expired_sessions()"

# Clean up old API keys
python -c "from database.models.api_key import ApiKey; ApiKey.cleanup_expired_keys()"

# Clean up old audit logs (keep 90 days)
python -c "from database.models.audit_log import AuditLog; AuditLog.cleanup_old_logs(90)"
```

## Getting Help

- **Documentation**: Check the `/docs` directory
- **API Documentation**: Visit `http://localhost:5000/docs`
- **Configuration Reference**: See `CONFIGURATION.md`
- **Issues**: Report issues on GitHub
- **Community**: Join our community discussions

## Next Steps

After setup:
1. Configure authentication method (local or Azure AD)
2. Create initial admin user
3. Set up SSL certificates for production
4. Configure backup strategy
5. Set up monitoring and alerting
6. Review security configuration

For more detailed information, see the individual documentation files in the `/docs` directory.