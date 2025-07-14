"""
SSL Certificate model for ForgeBoard.

This model stores SSL certificates and related configuration.
"""

from datetime import datetime
from database.connection import db


class SSLCertificate(db.Model):
    """SSL Certificate model."""
    
    __tablename__ = 'ssl_certificates'
    
    id = db.Column(db.Integer, primary_key=True)
    domain = db.Column(db.String(255), nullable=False, unique=True)
    certificate_type = db.Column(db.String(50), nullable=False)  # 'manual', 'letsencrypt'
    
    # Certificate data (encrypted)
    certificate_pem = db.Column(db.Text)  # Public certificate
    private_key_pem = db.Column(db.Text)  # Private key (encrypted)
    chain_pem = db.Column(db.Text)  # Certificate chain
    
    # CSR data
    csr_pem = db.Column(db.Text)  # Certificate Signing Request
    csr_generated_at = db.Column(db.DateTime)
    
    # Let's Encrypt specific
    acme_account_key = db.Column(db.Text)  # ACME account key (encrypted)
    acme_challenge_type = db.Column(db.String(50))  # 'dns-01', 'http-01'
    
    # Cloudflare integration
    cloudflare_api_key = db.Column(db.Text)  # Cloudflare API key (encrypted)
    cloudflare_zone_id = db.Column(db.String(100))
    
    # Certificate metadata
    issued_at = db.Column(db.DateTime)
    expires_at = db.Column(db.DateTime)
    auto_renew = db.Column(db.Boolean, default=True)
    last_renewal_attempt = db.Column(db.DateTime)
    renewal_status = db.Column(db.String(50))  # 'success', 'failed', 'pending'
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<SSLCertificate {self.domain}>'
    
    @classmethod
    def get_by_domain(cls, domain):
        """Get SSL certificate by domain."""
        return cls.query.filter_by(domain=domain).first()
    
    @classmethod
    def get_active_certificates(cls):
        """Get all active certificates."""
        return cls.query.filter(
            cls.certificate_pem.isnot(None),
            cls.expires_at > datetime.utcnow()
        ).all()
    
    @classmethod
    def get_expiring_certificates(cls, days_ahead=30):
        """Get certificates expiring within specified days."""
        from datetime import timedelta
        expiry_threshold = datetime.utcnow() + timedelta(days=days_ahead)
        
        return cls.query.filter(
            cls.certificate_pem.isnot(None),
            cls.expires_at <= expiry_threshold,
            cls.auto_renew == True
        ).all()
    
    def is_valid(self):
        """Check if certificate is valid and not expired."""
        if not self.certificate_pem or not self.expires_at:
            return False
        return self.expires_at > datetime.utcnow()
    
    def days_until_expiry(self):
        """Get number of days until certificate expires."""
        if not self.expires_at:
            return None
        delta = self.expires_at - datetime.utcnow()
        return delta.days
    
    def to_dict(self, include_sensitive=False):
        """Convert to dictionary."""
        data = {
            'id': self.id,
            'domain': self.domain,
            'certificate_type': self.certificate_type,
            'issued_at': self.issued_at.isoformat() if self.issued_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'auto_renew': self.auto_renew,
            'last_renewal_attempt': self.last_renewal_attempt.isoformat() if self.last_renewal_attempt else None,
            'renewal_status': self.renewal_status,
            'is_valid': self.is_valid(),
            'days_until_expiry': self.days_until_expiry(),
            'has_certificate': bool(self.certificate_pem),
            'has_csr': bool(self.csr_pem),
            'csr_generated_at': self.csr_generated_at.isoformat() if self.csr_generated_at else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        
        if include_sensitive:
            data.update({
                'certificate_pem': self.certificate_pem,
                'chain_pem': self.chain_pem,
                'csr_pem': self.csr_pem
            })
        
        return data