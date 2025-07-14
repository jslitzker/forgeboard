#!/usr/bin/env python3
"""
Create the first admin user for ForgeBoard.

This script creates the initial admin user account when no users exist in the system.
"""

import os
import sys
import getpass
from flask import Flask
from database.connection import init_database
from database.models.user import User
from auth.providers.local import LocalAuthProvider
from config.manager import ConfigManager

def create_admin_user():
    """Create the first admin user."""
    
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
            print("Use the web interface to manage users or create additional accounts.")
            sys.exit(1)
        
        print("Creating first admin user for ForgeBoard...")
        print("=" * 50)
        
        # Get user input
        username = input("Enter admin username: ").strip()
        if not username:
            print("Username cannot be empty!")
            sys.exit(1)
        
        email = input("Enter admin email: ").strip()
        if not email:
            print("Email cannot be empty!")
            sys.exit(1)
        
        display_name = input("Enter display name (optional): ").strip()
        if not display_name:
            display_name = username
        
        # Get password securely
        password = getpass.getpass("Enter admin password: ")
        if not password:
            print("Password cannot be empty!")
            sys.exit(1)
        
        password_confirm = getpass.getpass("Confirm admin password: ")
        if password != password_confirm:
            print("Passwords do not match!")
            sys.exit(1)
        
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
            print(f"\\n✅ Admin user '{username}' created successfully!")
            print(f"Email: {email}")
            print(f"Display Name: {display_name}")
            print("\\nYou can now log in to ForgeBoard using these credentials.")
        else:
            print(f"\\n❌ Failed to create admin user: {result.error_message}")
            sys.exit(1)

if __name__ == "__main__":
    create_admin_user()