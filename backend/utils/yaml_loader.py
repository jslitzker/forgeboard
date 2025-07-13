import yaml
import os
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict
from datetime import datetime


@dataclass
class App:
    name: str
    slug: str
    port: int
    type: str
    status: str
    domain: str
    path: str
    virtualenv: str
    entry_point: str
    description: str = ""
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    def to_dict(self) -> Dict:
        return asdict(self)


class AppsConfig:
    def __init__(self, config_path: str = 'apps.yml'):
        self.config_path = config_path
        self._apps: List[App] = []
        self._last_loaded: Optional[datetime] = None
        self.reload()

    def reload(self) -> None:
        if not os.path.exists(self.config_path):
            self._apps = []
            return

        with open(self.config_path, 'r') as f:
            data = yaml.safe_load(f) or {}
        
        self._apps = []
        for app_data in data.get('apps', []):
            app = App(**app_data)
            self._apps.append(app)
        
        self._last_loaded = datetime.now()

    def get_all(self) -> List[App]:
        return self._apps.copy()

    def get_by_slug(self, slug: str) -> Optional[App]:
        for app in self._apps:
            if app.slug == slug:
                return app
        return None

    def add_app(self, app: App) -> None:
        if self.get_by_slug(app.slug):
            raise ValueError(f"App with slug '{app.slug}' already exists")
        
        self._apps.append(app)
        self._save()

    def update_app(self, slug: str, updates: Dict) -> Optional[App]:
        app = self.get_by_slug(slug)
        if not app:
            return None
        
        for key, value in updates.items():
            if hasattr(app, key):
                setattr(app, key, value)
        
        app.updated_at = datetime.now().isoformat()
        self._save()
        return app

    def remove_app(self, slug: str) -> bool:
        app = self.get_by_slug(slug)
        if not app:
            return False
        
        self._apps.remove(app)
        self._save()
        return True

    def _save(self) -> None:
        data = {
            'apps': [app.to_dict() for app in self._apps]
        }
        
        # Create backup
        if os.path.exists(self.config_path):
            backup_path = f"{self.config_path}.backup"
            with open(self.config_path, 'r') as src:
                with open(backup_path, 'w') as dst:
                    dst.write(src.read())
        
        # Write new config
        with open(self.config_path, 'w') as f:
            yaml.dump(data, f, default_flow_style=False, sort_keys=False)

    def get_next_available_port(self, start_port: int = 9001, end_port: int = 9999) -> int:
        used_ports = {app.port for app in self._apps}
        for port in range(start_port, end_port + 1):
            if port not in used_ports:
                return port
        raise ValueError(f"No available ports in range {start_port}-{end_port}")

    def validate_app_data(self, app_data: Dict) -> List[str]:
        errors = []
        required_fields = ['name', 'slug', 'port', 'type', 'domain', 'path', 'virtualenv', 'entry_point']
        
        for field in required_fields:
            if field not in app_data or not app_data[field]:
                errors.append(f"Missing required field: {field}")
        
        if 'port' in app_data:
            try:
                port = int(app_data['port'])
                if port < 1024 or port > 65535:
                    errors.append(f"Port must be between 1024 and 65535")
                if any(app.port == port for app in self._apps):
                    errors.append(f"Port {port} is already in use")
            except (ValueError, TypeError):
                errors.append("Port must be a valid integer")
        
        if 'slug' in app_data:
            slug = app_data['slug']
            if not slug.replace('-', '').replace('_', '').isalnum():
                errors.append("Slug must contain only letters, numbers, hyphens, and underscores")
            if self.get_by_slug(slug):
                errors.append(f"App with slug '{slug}' already exists")
        
        if 'type' in app_data and app_data['type'] not in ['flask', 'fastapi', 'django']:
            errors.append(f"Invalid app type: {app_data['type']}")
        
        return errors