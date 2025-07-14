# ForgeBoard Authentication Implementation Plan

> **📋 DOCUMENT STATUS**: This is a historical development planning document. Authentication implementation is now COMPLETE as of ForgeBoard v1.5. This document is preserved for reference and understanding the design decisions made during development.

## Overview

This document outlines the comprehensive plan for implementing authentication in ForgeBoard. The system will support both local authentication and Azure AD/MSAL integration, using SQLite as the database backend while maintaining ForgeBoard's philosophy of simplicity.

**IMPLEMENTATION STATUS**: ✅ **COMPLETED** - All phases except Azure AD integration have been successfully implemented and are production-ready.

## Architecture Overview

### Revised Configuration Approach

- **YAML (apps.yml)**: Continues to store app configurations (static, version-controlled)
- **SQLite Database**: Stores dynamic user data, sessions, audit logs, and configuration
- **Bootstrap JSON**: Minimal configuration file for database connection and encryption keys
- **Database-Stored Configuration**: All runtime configuration stored securely in database with encryption

### Database Choice: SQLite

SQLite was chosen to maintain ForgeBoard's simplicity:
- Single file database (no external database server required)
- Excellent performance for our use case (< 10,000 users)
- Built-in support in Python
- Easy backup/restore (single file copy)
- Transactional integrity for user data

## Phase 1: Database Architecture

### Database Location
```
Primary: /opt/forgeboard/data/forgeboard.db
Backups: /opt/forgeboard/data/backups/
```

### Database Schema

```sql
-- Users table (supports both local and Azure AD)
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,  -- NULL for Azure AD only users
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    auth_provider TEXT NOT NULL CHECK (auth_provider IN ('local', 'azure_ad')),
    external_id TEXT,  -- Azure AD Object ID
    password_hash TEXT,  -- NULL for Azure AD users
    is_active BOOLEAN DEFAULT 1,
    is_admin BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    failed_login_count INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    UNIQUE(auth_provider, external_id)
);

-- Sessions table
CREATE TABLE sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    refresh_token TEXT,  -- For Azure AD
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- API Keys table
CREATE TABLE api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    key_hash TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    permissions TEXT,  -- JSON string
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Password Reset Tokens (local auth only)
CREATE TABLE password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP,
    ip_address TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User Preferences (key-value store)
CREATE TABLE user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    key TEXT NOT NULL,
    value TEXT,  -- JSON string for complex values
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, key),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Audit Log
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    details TEXT,  -- JSON string
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Azure AD Group Mappings (if using Azure AD)
CREATE TABLE azure_group_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id TEXT UNIQUE NOT NULL,
    group_name TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Schema migrations tracking
CREATE TABLE schema_migrations (
    version INTEGER PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Database Indexes for Performance
```sql
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_external_id ON users(external_id);
```

## Phase 2: Authentication Provider System

### Base Provider Interface

```python
# backend/auth/providers/base.py
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any

class AuthProvider(ABC):
    @abstractmethod
    async def authenticate(self, credentials: Dict[str, Any]) -> Optional[User]:
        """Authenticate user with provided credentials"""
        pass
    
    @abstractmethod
    async def get_user_info(self, token: str) -> Optional[Dict[str, Any]]:
        """Get user information from token"""
        pass
    
    @abstractmethod
    async def refresh_token(self, refresh_token: str) -> Optional[Dict[str, Any]]:
        """Refresh authentication token"""
        pass
    
    @abstractmethod
    def get_login_url(self) -> Optional[str]:
        """Get OAuth login URL if applicable"""
        pass
    
    @abstractmethod
    def handle_callback(self, code: str) -> Optional[User]:
        """Handle OAuth callback if applicable"""
        pass
```

### Local Authentication Provider

Features:
- Username/password authentication
- Password hashing with bcrypt
- Password complexity requirements
- Account lockout after failed attempts
- Email-based password reset

### Azure AD Authentication Provider

Features:
- MSAL integration for authentication
- Support for authorization code flow (web) and device code flow (CLI)
- Automatic user provisioning from Azure AD
- Group-based role mapping
- Token refresh handling
- Multi-tenant support (optional)

## Phase 3: API Endpoints

### Authentication Endpoints (Method-Agnostic)
- `GET /api/auth/method` - Get current auth method and configuration
- `POST /api/auth/login` - Unified login endpoint
- `GET /api/auth/azure/login` - Initiate Azure AD login
- `GET /api/auth/azure/callback` - Azure AD callback handler
- `POST /api/auth/logout` - Unified logout
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user info

### User Management (Admin Only)
- `GET /api/users` - List all users with filtering
- `POST /api/users` - Create user (local auth only)
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Deactivate user
- `POST /api/users/:id/admin` - Grant/revoke admin rights
- `POST /api/users/sync` - Sync users from Azure AD

### API Key Management
- `GET /api/me/api-keys` - List current user's API keys
- `POST /api/me/api-keys` - Create new API key
- `DELETE /api/me/api-keys/:id` - Revoke API key
- `PUT /api/me/api-keys/:id` - Update API key

### Password Management (Local Auth)
- `POST /api/auth/forgot-password` - Initiate password reset
- `POST /api/auth/reset-password` - Complete password reset
- `POST /api/auth/change-password` - Change own password

## Phase 4: Configuration System

### Authentication Configuration (`/opt/forgeboard/config/auth.yml`)

```yaml
auth:
  # Enable/disable authentication
  enabled: true
  
  # Authentication method: 'local' or 'azure_ad'
  method: local
  
  # Session configuration
  session:
    timeout: 86400  # 24 hours
    refresh_enabled: true
    refresh_timeout: 604800  # 7 days
  
  # API key configuration
  api_keys:
    enabled: true
    max_per_user: 5
    default_expiry: null  # or number of days
  
  # Local authentication settings
  local:
    # Password requirements
    password:
      min_length: 8
      require_uppercase: true
      require_lowercase: true
      require_numbers: true
      require_special: false
    
    # Security settings
    security:
      max_login_attempts: 5
      lockout_duration: 300  # 5 minutes
      password_reset_expiry: 3600  # 1 hour
    
    # Email configuration for password reset
    email:
      enabled: true
      smtp_host: "smtp.gmail.com"
      smtp_port: 587
      smtp_user: "noreply@forgeboard.local"
      smtp_password: "${SMTP_PASSWORD}"
      from_address: "ForgeBoard <noreply@forgeboard.local>"
  
  # Azure AD authentication settings
  azure_ad:
    # Azure AD Application settings
    tenant_id: "${AZURE_TENANT_ID}"
    client_id: "${AZURE_CLIENT_ID}"
    client_secret: "${AZURE_CLIENT_SECRET}"
    
    # Redirect URI
    redirect_uri: "https://forgeboard.example.com/api/auth/azure/callback"
    
    # Scopes to request
    scopes:
      - "User.Read"
      - "email"
      - "profile"
    
    # User provisioning
    auto_create_users: true
    default_role: "user"
    
    # Group-based role mapping
    group_mappings:
      admins:
        group_id: "azure-group-id-for-admins"
        role: "admin"
      users:
        group_id: "azure-group-id-for-users"
        role: "user"
```

### Database Configuration (`/opt/forgeboard/config/database.yml`)

```yaml
database:
  path: /opt/forgeboard/data/forgeboard.db
  backup:
    enabled: true
    path: /opt/forgeboard/data/backups
    retention_days: 30
    schedule: "daily"
  
  # SQLite specific settings
  sqlite:
    journal_mode: WAL  # Better concurrency
    synchronous: NORMAL
    cache_size: -64000  # 64MB cache
    busy_timeout: 5000  # 5 second timeout
```

## Phase 5: Frontend Implementation

### Authentication Components

1. **Login Page**
   - Adaptive UI based on auth method
   - Local: username/password form
   - Azure AD: "Sign in with Microsoft" button

2. **Authentication Context**
   - JWT token management
   - Automatic token refresh
   - User info caching
   - Permission checking

3. **Protected Routes**
   - HOC for route protection
   - Role-based access control
   - Loading states during auth check

### User Management UI

1. **User List (Admin Only)**
   - Display all users with auth provider indicator
   - Filter and search capabilities
   - Bulk actions
   - Azure AD sync status

2. **User Profile**
   - View/edit own profile
   - API key management
   - Active sessions view
   - Preference management

## Phase 6: Security Considerations

### Security Features
- Rate limiting on authentication endpoints
- Brute force protection
- Session fingerprinting
- Audit logging for all auth events
- CSRF protection
- Secure cookie handling

### Database Security
- File permissions (600, owned by forgeboard user)
- Encrypted sensitive fields
- Parameterized queries
- Regular automated backups

## Phase 7: Migration Strategy

### For New Installations
1. Authentication disabled by default
2. Run `forgeboard-cli auth enable` to activate
3. Choose authentication method
4. Create initial admin user

### For Existing Installations
1. Apps remain in apps.yml (no changes)
2. Run `forgeboard-cli migrate auth`
3. Database created alongside existing config
4. Gradual feature enablement

### Backward Compatibility
- Authentication is opt-in
- Existing API endpoints continue working
- API keys provide compatibility for automation
- No changes to app deployment process

## Phase 8: CLI Integration

### Authentication Commands
```bash
# Enable/disable authentication
forgeboard-cli auth enable
forgeboard-cli auth disable

# Configure auth method
forgeboard-cli auth config --method local
forgeboard-cli auth config --method azure_ad

# User management
forgeboard-cli user create --admin
forgeboard-cli user list
forgeboard-cli user reset-password <email>

# Database management
forgeboard-cli db init
forgeboard-cli db migrate
forgeboard-cli db backup
forgeboard-cli db restore <file>

# API key management
forgeboard-cli auth generate-key --name "CI/CD"
```

## Implementation Timeline

### Week 1: Database Foundation
- SQLite setup with SQLAlchemy
- Database schema creation
- Migration system
- Basic CRUD operations

### Week 2: Local Authentication
- User authentication implementation
- Session management
- Password reset flow
- API key generation

### Week 3: Azure AD Integration
- MSAL integration
- OAuth flow handling
- User synchronization
- Group mapping

### Week 4: Frontend & Polish
- Login UI implementation
- User management interface
- Security hardening
- Documentation

## Technical Requirements

### New Backend Dependencies
```
Flask-JWT-Extended==4.6.0
Flask-SQLAlchemy==3.1.1
Flask-Bcrypt==1.0.1
Flask-Migrate==4.0.5
python-dotenv==1.0.0
msal==1.26.0  # For Azure AD
email-validator==2.1.0
```

### New Frontend Dependencies
```
axios interceptors (already available)
js-cookie==3.0.5
```

## Testing Strategy

### Unit Tests
- Authentication providers
- Database operations
- Permission checks
- API endpoint security

### Integration Tests
- Full authentication flows
- Azure AD integration
- Session management
- API key authentication

### Security Tests
- Rate limiting verification
- SQL injection prevention
- XSS protection
- CSRF protection

## Success Metrics

- Zero-downtime migration for existing users
- < 100ms authentication response time
- Support for 10,000+ users
- 99.9% authentication availability
- Seamless provider switching

## Future Enhancements

- Two-factor authentication
- WebAuthn/Passkeys support
- LDAP integration
- SAML support
- OAuth2 provider mode
- Advanced RBAC with custom roles

---

## Implementation Progress Checklist

### Phase 1: Database Foundation ✅ COMPLETED
- [x] **1.1 Bootstrap Configuration**
  - [x] Create minimal JSON bootstrap file (`/opt/forgeboard/config/bootstrap.json`)
  - [x] Only store database path, encryption key, and Flask secret key
  - [x] Add environment variable support for sensitive bootstrap values
  - [x] Create configuration validation system

- [x] **1.2 Database Setup**
  - [x] Create SQLite database initialization system
  - [x] Add SQLAlchemy ORM integration to Flask app
  - [x] Configure database connection using bootstrap config
  - [x] Create database directory structure (`/opt/forgeboard/data/`)

- [x] **1.3 Enhanced Schema Implementation**
  - [x] Create all authentication tables (users, sessions, api_keys, etc.)
  - [x] Add `config_settings` and `config_encryption_keys` tables
  - [x] Implement database indexes for performance
  - [x] Add schema migration system for future updates

- [x] **1.4 Configuration Manager**
  - [x] Create `ConfigManager` class for database-stored configuration
  - [x] Implement encryption/decryption for sensitive values
  - [x] Add configuration categories (auth, email, azure_ad, etc.)
  - [x] Create configuration validation and testing methods

### Phase 2: Local Authentication ✅ COMPLETED
- [x] **2.1 Authentication Provider System**
  - [x] Create base authentication provider interface
  - [x] Implement provider factory pattern
  - [x] Add authentication result handling
  - [x] Create provider configuration system

- [x] **2.2 Local Auth Implementation**
  - [x] Implement local authentication provider
  - [x] Add password hashing with bcrypt
  - [x] Create password complexity validation
  - [x] Add account lockout functionality

- [x] **2.3 Session Management**
  - [x] Create session management system
  - [x] Implement JWT token handling
  - [x] Add session refresh capabilities
  - [x] Create session cleanup utilities

- [x] **2.4 API Key System**
  - [x] Implement API key generation
  - [x] Add API key validation
  - [x] Create permission system for API keys
  - [x] Add API key management endpoints

### Phase 3: Configuration UI ✅ COMPLETED
- [x] **3.1 Admin Settings API**
- [x] **3.2 Configuration Management UI**
- [x] **3.3 Configuration Testing**
- [x] **3.4 Import/Export Tools**

### Phase 4: Authentication API ✅ COMPLETED
- [x] **4.1 Authentication Endpoints**
- [x] **4.2 User Management API**
- [x] **4.3 Security Middleware**
- [x] **4.4 API Documentation**

### Phase 5: Frontend Authentication ✅ COMPLETED
- [x] **5.1 Authentication Context**
- [x] **5.2 Login Components**
- [x] **5.3 Protected Routes**
- [x] **5.4 User Management UI**

### Phase 6: Azure AD Integration 📅 PLANNED (v1.3)
- [ ] **6.1 MSAL Setup**
- [ ] **6.2 OAuth Flow**
- [ ] **6.3 User Synchronization**
- [ ] **6.4 Group Mapping**

### Phase 7: Security & Testing ✅ COMPLETED
- [x] **7.1 Security Hardening**
- [x] **7.2 Rate Limiting**
- [x] **7.3 Audit Logging**
- [x] **7.4 Testing Suite**

### Phase 8: CLI Integration 📅 PLANNED (v1.4)
- [ ] **8.1 CLI Authentication Commands**
- [ ] **8.2 Database Management**
- [ ] **8.3 User Management**
- [ ] **8.4 Migration Tools**

### Files Created in Phase 1:
```
backend/
├── config/
│   ├── __init__.py
│   ├── bootstrap.py         # Bootstrap configuration system
│   └── manager.py           # Database configuration manager
├── database/
│   ├── __init__.py
│   ├── connection.py        # Database connection and initialization
│   ├── models/
│   │   ├── __init__.py
│   │   ├── base.py          # Base model classes
│   │   ├── user.py          # User model
│   │   ├── session.py       # Session model
│   │   ├── api_key.py       # API key model
│   │   ├── user_preference.py # User preferences model
│   │   ├── password_reset.py # Password reset model
│   │   ├── audit_log.py     # Audit log model
│   │   ├── azure_group_mapping.py # Azure AD group mappings
│   │   ├── config_setting.py # Configuration settings model
│   │   └── schema_migration.py # Schema migration tracking
│   └── migrations/
│       ├── __init__.py
│       └── migration_manager.py # Migration management system
├── main.py                  # Updated with database initialization
└── requirements.txt         # Updated with new dependencies

config/
└── bootstrap.json          # Bootstrap configuration file

.env.example                # Environment variables template
```

---

This plan ensures ForgeBoard maintains its simplicity while adding enterprise-ready authentication capabilities. The database-centric configuration approach provides better security and flexibility than file-based configuration.