#!/usr/bin/env python3
"""
Create the first admin user for ForgeBoard (non-interactive version).
"""

import os
import sys
from flask import Flask
from database.connection import init_database
from database.models.user import User
from auth.providers.local import LocalAuthProvider
from config.manager import ConfigManager

def create_admin_user():
    """Create the first admin user."""
    
    # Default admin credentials
    username = "admin"
    email = "admin@forgeboard.local"
    password = "admin123"
    display_name = "Administrator"
    
    # Initialize Flask app
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///forgeboard.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    with app.app_context():
        # Initialize database
        init_database(app)
        
        # Check if any users exist
        existing_users = User.query.count()
        if existing_users > 0:
            print(f"Users already exist in the system ({existing_users} users found).")
            print("Default admin user creation skipped.")
            return
        
        print("Creating default admin user for ForgeBoard...")
        print("=" * 50)
        
        # Create authentication provider
        config_manager = ConfigManager()
        auth_config = config_manager.get_config('auth', {})
        local_provider = LocalAuthProvider(auth_config)
        
        # Create admin user
        result = local_provider.register_user(
            username=username,
            email=email,
            password=password,
            display_name=display_name,
            is_admin=True
        )
        
        if result.success:
            print(f"✅ Default admin user created successfully!")
            print(f"Username: {username}")
            print(f"Email: {email}")
            print(f"Password: {password}")
            print(f"Display Name: {display_name}")
            print()
            print("⚠️  IMPORTANT: Please log in and change the default password immediately!")
            print("   You can access the user management interface in Settings > Users")
        else:
            print(f"❌ Failed to create admin user: {result.error_message}")
            sys.exit(1)

if __name__ == "__main__":
    create_admin_user()