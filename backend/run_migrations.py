#!/usr/bin/env python3
"""
Run database migrations for ForgeBoard.
"""

import os
import sys
from flask import Flask
from database.connection import init_database
from database.migrations.migration_manager import get_migration_manager

def main():
    """Run database migrations."""
    
    # Initialize Flask app
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///forgeboard.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    with app.app_context():
        # Initialize database
        init_database(app)
        
        # Get migration manager and run pending migrations
        manager = get_migration_manager()
        
        print("Current migration status:")
        status = manager.get_migration_status()
        print(f"  Current Version: {status['current_version']}")
        print(f"  Latest Version: {status['latest_version']}")
        print(f"  Pending Migrations: {status['pending_migrations']}")
        
        if status['pending_migrations']:
            print("\nRunning pending migrations...")
            results = manager.run_migrations()
            
            print(f"\nExecuted {len(results)} migrations:")
            for result in results:
                status_icon = "✅" if result['status'] == 'success' else "❌"
                print(f"  {status_icon} {result['version']}: {result['name']} - {result['status']}")
                if result['status'] == 'failed':
                    print(f"    Error: {result.get('error', 'Unknown error')}")
        else:
            print("\nDatabase is up to date!")

if __name__ == "__main__":
    main()