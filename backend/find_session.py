#!/usr/bin/env python3
"""
Find a specific session by JTI.
"""

import os
import sys
from flask import Flask
from database.connection import init_database
from database.models.session import Session

def main():
    if len(sys.argv) != 2:
        print("Usage: python find_session.py <jti>")
        sys.exit(1)
    
    jti = sys.argv[1]
    
    # Initialize Flask app
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///forgeboard.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    with app.app_context():
        # Initialize database
        init_database(app)
        
        # Find session by token
        session = Session.find_by_token(jti)
        if session:
            print(f"Found session:")
            print(f"  ID: {session.id}")
            print(f"  User ID: {session.user_id}")
            print(f"  Token: {session.token}")
            print(f"  Valid: {session.is_valid()}")
            print(f"  Created: {session.created_at}")
            print(f"  Expires: {session.expires_at}")
        else:
            print(f"No session found with JTI: {jti}")

if __name__ == "__main__":
    main()