"""
Authentication provider factory for ForgeBoard.

This module creates and manages authentication provider instances.
"""

from typing import Dict, Any, Optional
from .base import AuthProvider
from .local import LocalAuthProvider
from ..models.auth_result import AuthError


class AuthProviderFactory:
    """Factory class for creating authentication providers."""
    
    _providers = {
        'local': LocalAuthProvider,
        # Future providers can be added here
        # 'azure_ad': AzureADAuthProvider,
    }
    
    @classmethod
    def create_provider(cls, provider_type: str, config: Dict[str, Any]) -> AuthProvider:
        """
        Create an authentication provider instance.
        
        Args:
            provider_type: Type of provider ('local', 'azure_ad', etc.)
            config: Configuration dictionary for the provider
        
        Returns:
            AuthProvider: Instance of the requested provider
        
        Raises:
            ValueError: If provider type is not supported
        """
        if provider_type not in cls._providers:
            raise ValueError(f"Unsupported authentication provider: {provider_type}")
        
        provider_class = cls._providers[provider_type]
        return provider_class(config)
    
    @classmethod
    def get_available_providers(cls) -> list:
        """
        Get list of available authentication providers.
        
        Returns:
            list: List of available provider names
        """
        return list(cls._providers.keys())
    
    @classmethod
    def is_provider_supported(cls, provider_type: str) -> bool:
        """
        Check if a provider type is supported.
        
        Args:
            provider_type: Type of provider to check
        
        Returns:
            bool: True if provider is supported
        """
        return provider_type in cls._providers
    
    @classmethod
    def register_provider(cls, provider_type: str, provider_class: type):
        """
        Register a new authentication provider.
        
        Args:
            provider_type: Name of the provider
            provider_class: Class implementing AuthProvider
        """
        if not issubclass(provider_class, AuthProvider):
            raise ValueError(f"Provider class must inherit from AuthProvider")
        
        cls._providers[provider_type] = provider_class