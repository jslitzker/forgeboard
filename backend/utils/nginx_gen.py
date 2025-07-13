import os
import subprocess
from datetime import datetime
from jinja2 import Environment, FileSystemLoader
from typing import Optional
from .yaml_loader import App


class NginxConfigGenerator:
    def __init__(self, template_dir: str = 'templates', nginx_sites_dir: str = '/etc/nginx/sites-available'):
        self.template_dir = template_dir
        self.nginx_sites_dir = nginx_sites_dir
        self.nginx_enabled_dir = '/etc/nginx/sites-enabled'
        
        # Set up Jinja2 environment
        template_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), template_dir)
        self.env = Environment(loader=FileSystemLoader(template_path))
        self.template = self.env.get_template('nginx.conf.j2')

    def generate_config(self, app: App) -> str:
        context = {
            'app': app,
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        return self.template.render(context)

    def write_config(self, app: App, dry_run: bool = False, auto_reload: bool = True) -> tuple[bool, str]:
        try:
            config_content = self.generate_config(app)
            config_filename = f"forgeboard-{app.slug}.conf"
            config_path = os.path.join(self.nginx_sites_dir, config_filename)
            
            if dry_run:
                return True, config_content
            
            # Write config file (requires sudo in production)
            with open(config_path, 'w') as f:
                f.write(config_content)
            
            # Create symlink in sites-enabled
            symlink_path = os.path.join(self.nginx_enabled_dir, config_filename)
            if os.path.exists(symlink_path):
                os.remove(symlink_path)
            os.symlink(config_path, symlink_path)
            
            # Auto-reload nginx if requested
            if auto_reload:
                reload_success, reload_msg = self.reload_nginx()
                if not reload_success:
                    return True, f"Config written but reload failed: {reload_msg}"
            
            return True, f"Config written to {config_path} and nginx reloaded"
            
        except Exception as e:
            return False, str(e)

    def remove_config(self, app: App, auto_reload: bool = True) -> tuple[bool, str]:
        try:
            config_filename = f"forgeboard-{app.slug}.conf"
            config_path = os.path.join(self.nginx_sites_dir, config_filename)
            symlink_path = os.path.join(self.nginx_enabled_dir, config_filename)
            
            # Remove symlink first
            if os.path.exists(symlink_path):
                os.remove(symlink_path)
            
            # Remove config file
            if os.path.exists(config_path):
                os.remove(config_path)
            
            # Auto-reload nginx if requested
            if auto_reload:
                reload_success, reload_msg = self.reload_nginx()
                if not reload_success:
                    return True, f"Config removed but reload failed: {reload_msg}"
            
            return True, f"Config removed for {app.slug} and nginx reloaded"
            
        except Exception as e:
            return False, str(e)

    def test_config(self) -> tuple[bool, str]:
        try:
            result = subprocess.run(
                ['nginx', '-t'],
                capture_output=True,
                text=True,
                check=False
            )
            
            if result.returncode == 0:
                return True, "NGINX configuration test passed"
            else:
                return False, result.stderr
                
        except Exception as e:
            return False, str(e)

    def reload_nginx(self) -> tuple[bool, str]:
        try:
            # Test config first
            test_ok, test_msg = self.test_config()
            if not test_ok:
                return False, f"Config test failed: {test_msg}"
            
            # Reload nginx
            result = subprocess.run(
                ['nginx', '-s', 'reload'],
                capture_output=True,
                text=True,
                check=False
            )
            
            if result.returncode == 0:
                return True, "NGINX reloaded successfully"
            else:
                return False, result.stderr
                
        except Exception as e:
            return False, str(e)

    def generate_all_configs(self, apps: list[App], dry_run: bool = False) -> dict:
        results = {}
        for app in apps:
            success, message = self.write_config(app, dry_run)
            results[app.slug] = {
                'success': success,
                'message': message
            }
        return results

    def check_permissions(self) -> tuple[bool, str]:
        # Check if we can write to nginx directories
        checks = []
        
        if not os.path.exists(self.nginx_sites_dir):
            checks.append(f"NGINX sites directory not found: {self.nginx_sites_dir}")
        elif not os.access(self.nginx_sites_dir, os.W_OK):
            checks.append(f"No write permission for: {self.nginx_sites_dir}")
        
        if not os.path.exists(self.nginx_enabled_dir):
            checks.append(f"NGINX enabled directory not found: {self.nginx_enabled_dir}")
        elif not os.access(self.nginx_enabled_dir, os.W_OK):
            checks.append(f"No write permission for: {self.nginx_enabled_dir}")
        
        if checks:
            return False, "; ".join(checks)
        return True, "All permissions OK"