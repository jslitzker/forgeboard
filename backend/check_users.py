#!/usr/bin/env python3
"""
Check existing users in the database.
"""

import os
from flask import Flask
from database.connection import init_database
from database.models.user import User

def main():
    """Check existing users."""
    
    # Initialize Flask app
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///forgeboard.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    with app.app_context():
        # Initialize database
        init_database(app)
        
        # Check users
        users = User.query.all()
        print(f"Found {len(users)} users:")
        
        for user in users:
            print(f"  - ID: {user.id}")
            print(f"    Username: {user.username}")
            print(f"    Email: {user.email}")
            print(f"    Display Name: {user.display_name}")
            print(f"    Is Admin: {user.is_admin}")
            print(f"    Password Change Required: {getattr(user, 'password_change_required', 'N/A')}")
            print(f"    Created: {user.created_at}")
            print()

if __name__ == "__main__":
    main()