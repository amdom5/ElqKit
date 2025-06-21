# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in ElqKit, please report it responsibly:

1. **Do not** create a public GitHub issue for security vulnerabilities
2. Send an email to the project maintainer with details
3. Allow reasonable time for the issue to be addressed before public disclosure

## Security Considerations for Deployment

### Required Security Measures

Before deploying ElqKit in production, ensure you implement these security measures:

#### 1. Environment Variables
- Set a secure `SECRET_KEY` environment variable (minimum 32 characters)
- Never use the default development key in production
- Use environment-specific configuration files

```bash
# Generate a secure secret key
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

#### 2. CSRF Protection (Recommended)
ElqKit does not currently implement CSRF protection. For production use, consider adding Flask-WTF:

```bash
pip install Flask-WTF
```

Add to your application:
```python
from flask_wtf.csrf import CSRFProtect
csrf = CSRFProtect(app)
```

#### 3. Security Headers (Recommended)
Add security headers using Flask-Talisman:

```bash
pip install flask-talisman
```

```python
from flask_talisman import Talisman
Talisman(app, force_https=False)  # Set force_https=True in production with SSL
```

#### 4. Rate Limiting (Recommended)
For production deployments, implement rate limiting:

```bash
pip install Flask-Limiter
```

#### 5. Input Validation
- ElqKit validates file types and sizes
- Ensure CSV files don't contain malicious content
- Validate all user inputs on the server side

### Docker Security

The provided Dockerfile follows security best practices:
- Runs as non-root user
- Uses minimal base image
- Includes health checks
- Sets appropriate environment variables

### Network Security

- ElqKit runs on port 8847 by default (non-standard, higher port)
- Use a reverse proxy (nginx) for production
- Implement SSL/TLS termination at the proxy level
- Configure firewall rules appropriately

### File Upload Security

ElqKit implements several file upload security measures:
- File type validation (CSV only)
- File size limits (5MB maximum)
- Server-side processing validation

### Data Privacy

- ElqKit processes CSV files in memory
- No persistent storage of uploaded files
- Files are processed and discarded
- Consider data retention policies for your organization

## Known Limitations

### 1. XSS Prevention
- Some dynamic content uses `innerHTML` which could be vulnerable to XSS
- Recommendation: Sanitize all user-provided content
- Use `textContent` instead of `innerHTML` where possible

### 2. CSRF Protection
- No built-in CSRF protection
- Recommendation: Implement Flask-WTF for production use

### 3. Session Security
- Basic Flask session handling
- Recommendation: Configure secure session cookies for production

## Security Headers Recommended

```nginx
# Add these headers in your reverse proxy
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
```

## Monitoring and Logging

- Monitor for unusual file upload patterns
- Log authentication attempts and failures
- Set up alerts for high error rates
- Monitor resource usage for DoS detection

## Updates and Patches

- Regularly update Python dependencies
- Monitor security advisories for Flask and related packages
- Keep Docker base images updated
- Test security updates in staging before production

## Compliance Considerations

Depending on your use case, you may need to consider:
- GDPR compliance for EU data
- SOC 2 compliance for enterprise use
- Industry-specific regulations (HIPAA, PCI-DSS, etc.)

## Contact

For security-related questions or concerns, please contact the project maintainers.