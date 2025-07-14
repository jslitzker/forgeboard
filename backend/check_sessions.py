#!/usr/bin/env python3
"""
Check existing sessions in the database.
"""

import os
from flask import Flask
from database.connection import init_database
from database.models.session import Session

def main():
    """Check existing sessions."""
    
    # Initialize Flask app
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///forgeboard.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    with app.app_context():
        # Initialize database
        init_database(app)
        
        # Check sessions
        sessions = Session.query.all()
        print(f"Found {len(sessions)} sessions:")
        
        for session in sessions:
            print(f"  - ID: {session.id}")
            print(f"    User ID: {session.user_id}")
            print(f"    Token: {session.token}")
            print(f"    Valid: {session.is_valid()}")
            print(f"    Created: {session.created_at}")
            print(f"    Expires: {session.expires_at}")
            print()

if __name__ == "__main__":
    main()