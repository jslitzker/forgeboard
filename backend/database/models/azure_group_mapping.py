#!/usr/bin/env python3
"""
Azure AD group mapping model for ForgeBoard.

This model maps Azure AD groups to ForgeBoard roles.
"""

from typing import List, Dict, Any
from sqlalchemy import Column, String, CheckConstraint, Index
from sqlalchemy.orm import validates
from database.models.base import BaseModel


class AzureGroupMapping(BaseModel):
    """Azure AD group mapping model for role-based access control."""
    
    __tablename__ = 'azure_group_mappings'
    
    group_id = Column(String(255), unique=True, nullable=False)
    group_name = Column(String(255), nullable=True)
    role = Column(String(20), nullable=False)
    
    # Constraints and indexes
    __table_args__ = (
        CheckConstraint(
            "role IN ('admin', 'user')",
            name='ck_azure_group_role'
        ),
        Index('idx_azure_group_id', 'group_id'),
        Index('idx_azure_group_role', 'role'),
    )
    
    def __repr__(self):
        return f"<AzureGroupMapping(group_id={self.group_id}, role={self.role})>"
    
    @validates('group_id')
    def validate_group_id(self, key, group_id):
        """Validate Azure AD group ID."""
        if not group_id or len(group_id.strip()) == 0:
            raise ValueError("Group ID cannot be empty")
        if len(group_id) > 255:
            raise ValueError("Group ID cannot exceed 255 characters")
        return group_id.strip()
    
    @validates('group_name')
    def validate_group_name(self, key, group_name):
        """Validate Azure AD group name."""
        if group_name and len(group_name) > 255:
            raise ValueError("Group name cannot exceed 255 characters")
        return group_name.strip() if group_name else None
    
    @validates('role')
    def validate_role(self, key, role):
        """Validate role."""
        if role not in ['admin', 'user']:
            raise ValueError("Role must be 'admin' or 'user'")
        return role
    
    def to_dict(self):
        """Convert to dictionary."""
        result = super().to_dict()
        return result
    
    @classmethod
    def create_mapping(cls, group_id: str, role: str, group_name: str = None):
        """Create a new Azure AD group mapping."""
        mapping = cls(
            group_id=group_id,
            group_name=group_name,
            role=role
        )
        return mapping.save()
    
    @classmethod
    def find_by_group_id(cls, group_id: str):
        """Find mapping by Azure AD group ID."""
        return cls.query.filter_by(group_id=group_id).first()
    
    @classmethod
    def get_role_for_group(cls, group_id: str) -> str:
        """Get role for Azure AD group."""
        mapping = cls.find_by_group_id(group_id)
        return mapping.role if mapping else 'user'
    
    @classmethod
    def get_role_for_groups(cls, group_ids: List[str]) -> str:
        """Get highest role for list of Azure AD groups."""
        if not group_ids:
            return 'user'
        
        mappings = cls.query.filter(cls.group_id.in_(group_ids)).all()
        
        # Return highest role (admin > user)
        for mapping in mappings:
            if mapping.role == 'admin':
                return 'admin'
        
        return 'user'
    
    @classmethod
    def get_all_mappings(cls) -> List['AzureGroupMapping']:
        """Get all Azure AD group mappings."""
        return cls.query.order_by(cls.group_name, cls.group_id).all()
    
    @classmethod
    def get_mappings_by_role(cls, role: str) -> List['AzureGroupMapping']:
        """Get all mappings for a specific role."""
        return cls.query.filter_by(role=role).order_by(cls.group_name, cls.group_id).all()
    
    @classmethod
    def update_mapping(cls, group_id: str, role: str, group_name: str = None):
        """Update an existing mapping."""
        mapping = cls.find_by_group_id(group_id)
        
        if mapping:
            mapping.role = role
            if group_name:
                mapping.group_name = group_name
            mapping.save()
        else:
            mapping = cls.create_mapping(group_id, role, group_name)
        
        return mapping
    
    @classmethod
    def delete_mapping(cls, group_id: str):
        """Delete a group mapping."""
        mapping = cls.find_by_group_id(group_id)
        if mapping:
            mapping.delete()
        return mapping
    
    @classmethod
    def sync_mappings(cls, group_mappings: Dict[str, Dict[str, str]]):
        """Sync group mappings from configuration."""
        # Get existing mappings
        existing_mappings = {m.group_id: m for m in cls.get_all_mappings()}
        
        # Process new mappings
        processed_group_ids = set()
        for mapping_name, mapping_config in group_mappings.items():
            group_id = mapping_config.get('group_id')
            role = mapping_config.get('role', 'user')
            
            if not group_id:
                continue
            
            processed_group_ids.add(group_id)
            
            if group_id in existing_mappings:
                # Update existing mapping
                existing_mapping = existing_mappings[group_id]
                existing_mapping.role = role
                existing_mapping.group_name = mapping_name
                existing_mapping.save()
            else:
                # Create new mapping
                cls.create_mapping(group_id, role, mapping_name)
        
        # Remove mappings that are no longer in config
        for group_id, mapping in existing_mappings.items():
            if group_id not in processed_group_ids:
                mapping.delete()
    
    @classmethod
    def get_mapping_stats(cls) -> Dict[str, Any]:
        """Get Azure AD group mapping statistics."""
        total_mappings = cls.query.count()
        admin_mappings = cls.query.filter_by(role='admin').count()
        user_mappings = cls.query.filter_by(role='user').count()
        
        return {
            'total_mappings': total_mappings,
            'admin_mappings': admin_mappings,
            'user_mappings': user_mappings
        }