#!/usr/bin/env python3
"""
Audit log model for ForgeBoard.

This model tracks user actions and system events for security and compliance.
"""

import json
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy import Column, String, Integer, ForeignKey, Index, Text
from sqlalchemy.orm import relationship, validates
from database.models.base import BaseModel


class AuditLog(BaseModel):
    """Audit log model for tracking user actions and system events."""
    
    __tablename__ = 'audit_logs'
    
    user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(50), nullable=True)
    resource_id = Column(String(255), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    
    # Relationships
    user = relationship("User")
    
    # Indexes
    __table_args__ = (
        Index('idx_audit_log_user_id', 'user_id'),
        Index('idx_audit_log_action', 'action'),
        Index('idx_audit_log_resource', 'resource_type', 'resource_id'),
        Index('idx_audit_log_created_at', 'created_at'),
    )
    
    def __repr__(self):
        return f"<AuditLog(user_id={self.user_id}, action={self.action})>"
    
    @validates('action')
    def validate_action(self, key, action):
        """Validate audit action."""
        if not action or len(action.strip()) == 0:
            raise ValueError("Action cannot be empty")
        if len(action) > 100:
            raise ValueError("Action cannot exceed 100 characters")
        return action.strip()
    
    @validates('resource_type')
    def validate_resource_type(self, key, resource_type):
        """Validate resource type."""
        if resource_type and len(resource_type) > 50:
            raise ValueError("Resource type cannot exceed 50 characters")
        return resource_type
    
    @validates('resource_id')
    def validate_resource_id(self, key, resource_id):
        """Validate resource ID."""
        if resource_id and len(resource_id) > 255:
            raise ValueError("Resource ID cannot exceed 255 characters")
        return resource_id
    
    @validates('ip_address')
    def validate_ip_address(self, key, ip_address):
        """Validate IP address."""
        if ip_address and len(ip_address) > 45:
            raise ValueError("IP address cannot exceed 45 characters")
        return ip_address
    
    @validates('user_agent')
    def validate_user_agent(self, key, user_agent):
        """Validate user agent."""
        if user_agent and len(user_agent) > 500:
            user_agent = user_agent[:500]
        return user_agent
    
    def get_details(self) -> Dict[str, Any]:
        """Get parsed details."""
        if not self.details:
            return {}
        
        try:
            return json.loads(self.details)
        except (json.JSONDecodeError, TypeError):
            return {'raw': self.details}
    
    def set_details(self, details: Dict[str, Any]):
        """Set details with JSON serialization."""
        if details is None:
            self.details = None
        else:
            try:
                self.details = json.dumps(details)
            except (TypeError, ValueError):
                self.details = str(details)
    
    def to_dict(self):
        """Convert to dictionary."""
        result = super().to_dict()
        result['details'] = self.get_details()
        return result
    
    @classmethod
    def log_action(cls, action: str, user_id: Optional[int] = None, 
                  resource_type: Optional[str] = None, resource_id: Optional[str] = None,
                  details: Optional[Dict[str, Any]] = None, ip_address: Optional[str] = None,
                  user_agent: Optional[str] = None):
        """Log an action."""
        log_entry = cls(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        if details:
            log_entry.set_details(details)
        
        return log_entry.save()
    
    @classmethod
    def log_authentication(cls, action: str, user_id: Optional[int] = None, 
                          success: bool = True, details: Optional[Dict[str, Any]] = None,
                          ip_address: Optional[str] = None, user_agent: Optional[str] = None):
        """Log authentication events."""
        auth_details = {
            'success': success,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        if details:
            auth_details.update(details)
        
        return cls.log_action(
            action=action,
            user_id=user_id,
            resource_type='authentication',
            details=auth_details,
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    @classmethod
    def log_user_action(cls, action: str, user_id: int, target_user_id: Optional[int] = None,
                       details: Optional[Dict[str, Any]] = None, ip_address: Optional[str] = None,
                       user_agent: Optional[str] = None):
        """Log user management actions."""
        user_details = {
            'target_user_id': target_user_id,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        if details:
            user_details.update(details)
        
        return cls.log_action(
            action=action,
            user_id=user_id,
            resource_type='user',
            resource_id=str(target_user_id) if target_user_id else None,
            details=user_details,
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    @classmethod
    def log_app_action(cls, action: str, app_slug: str, user_id: Optional[int] = None,
                      details: Optional[Dict[str, Any]] = None, ip_address: Optional[str] = None,
                      user_agent: Optional[str] = None):
        """Log application management actions."""
        app_details = {
            'app_slug': app_slug,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        if details:
            app_details.update(details)
        
        return cls.log_action(
            action=action,
            user_id=user_id,
            resource_type='app',
            resource_id=app_slug,
            details=app_details,
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    @classmethod
    def log_config_action(cls, action: str, config_key: str, user_id: Optional[int] = None,
                         details: Optional[Dict[str, Any]] = None, ip_address: Optional[str] = None,
                         user_agent: Optional[str] = None):
        """Log configuration changes."""
        config_details = {
            'config_key': config_key,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        if details:
            config_details.update(details)
        
        return cls.log_action(
            action=action,
            user_id=user_id,
            resource_type='config',
            resource_id=config_key,
            details=config_details,
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    @classmethod
    def get_user_logs(cls, user_id: int, limit: int = 100):
        """Get logs for a specific user."""
        return cls.query.filter_by(user_id=user_id).order_by(
            cls.created_at.desc()
        ).limit(limit).all()
    
    @classmethod
    def get_action_logs(cls, action: str, limit: int = 100):
        """Get logs for a specific action."""
        return cls.query.filter_by(action=action).order_by(
            cls.created_at.desc()
        ).limit(limit).all()
    
    @classmethod
    def get_resource_logs(cls, resource_type: str, resource_id: str = None, limit: int = 100):
        """Get logs for a specific resource."""
        query = cls.query.filter_by(resource_type=resource_type)
        if resource_id:
            query = query.filter_by(resource_id=resource_id)
        return query.order_by(cls.created_at.desc()).limit(limit).all()
    
    @classmethod
    def get_recent_logs(cls, limit: int = 100):
        """Get most recent logs."""
        return cls.query.order_by(cls.created_at.desc()).limit(limit).all()
    
    @classmethod
    def get_logs_by_ip(cls, ip_address: str, limit: int = 100):
        """Get logs for a specific IP address."""
        return cls.query.filter_by(ip_address=ip_address).order_by(
            cls.created_at.desc()
        ).limit(limit).all()
    
    @classmethod
    def cleanup_old_logs(cls, days: int = 90):
        """Clean up old audit logs."""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        old_logs = cls.query.filter(cls.created_at < cutoff_date).all()
        
        for log in old_logs:
            log.delete()
        
        return len(old_logs)
    
    @classmethod
    def get_audit_stats(cls) -> Dict[str, Any]:
        """Get audit log statistics."""
        total_logs = cls.query.count()
        
        # Count by action type
        action_counts = {}
        actions = cls.query.with_entities(cls.action).distinct().all()
        for action in actions:
            action_counts[action[0]] = cls.query.filter_by(action=action[0]).count()
        
        # Count by resource type
        resource_counts = {}
        resources = cls.query.with_entities(cls.resource_type).distinct().all()
        for resource in resources:
            if resource[0]:
                resource_counts[resource[0]] = cls.query.filter_by(resource_type=resource[0]).count()
        
        return {
            'total_logs': total_logs,
            'action_counts': action_counts,
            'resource_counts': resource_counts
        }