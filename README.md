# ElqKit

[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Flask](https://img.shields.io/badge/flask-%23000.svg?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Python](https://img.shields.io/badge/python-3.11+-blue.svg?style=for-the-badge&logo=python&logoColor=white)](https://python.org)

**ElqKit** is a web application toolkit designed specifically for the Oracle Eloqua marketing automation platform.

## 🎯 Overview

Oracle Eloqua is a powerful marketing automation platform used by enterprises for email marketing, lead generation, and customer journey management. ElqKit addresses common operational challenges by providing:

- **Dependency Deletion**: Handle deletion of dependencies that aren't available via the UI
- **API Automation**: Streamline repetitive API operations  
- **Testing Utilities**: Simplify testing workflows

## ✨ Features

### 🚀 AutoSubmit (Active)
Convert CSV files to HTTP POST requests for Eloqua forms with enterprise-grade reliability.

**Key Capabilities:**
- **Drag-and-drop file upload** with 5MB limit
- **Real-time progress tracking** with detailed status updates
- **Comprehensive validation** and error reporting
- **Results download** capability for audit trails
- **Column-to-field mapping** for flexible data structure
- **Batch processing** with timeout handling

**How it works:**
1. Upload CSV file with form data
2. Configure Site ID and elqFormName
3. Each CSV row becomes a form submission
4. Get detailed success/failure results

## 🚀 Quick Start

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 512MB RAM available
- Port 8847 available (configurable)

### Development Setup

```bash
# Clone the repository
git clone https://github.com/amdom5/ElqKit.git
cd ElqKit

# Start the application
docker-compose up -d

# View logs
docker-compose logs -f elqkit

# Access the application
open http://localhost:8847
```

### Production Deployment

```bash
# Create production environment file
cat > .env << EOF
SECRET_KEY=your-super-secure-secret-key-here
FLASK_ENV=production
FLASK_DEBUG=false
PORT=8847
EOF

# Create production docker-compose file
cp docker-compose.yml docker-compose.prod.yml

# Edit production settings
nano docker-compose.prod.yml

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

## 📦 Docker Deployment

### Single Container Deployment

```bash
# Build the image
docker build -t elqkit:latest .

# Run production container
docker run -d \
  --name elqkit \
  --restart unless-stopped \
  -p 8847:8847 \
  -e FLASK_ENV=production \
  -e SECRET_KEY=your-secret-key \
  elqkit:latest
```

### With Reverse Proxy (Recommended)

```bash
# Deploy with Nginx reverse proxy
docker-compose -f docker-compose.prod.yml up -d
```

For detailed deployment instructions including SSL setup, monitoring, and troubleshooting, see [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md).

## 🏗 Architecture

```
elqkit/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── Dockerfile            # Production container config
├── docker-compose.yml    # Development orchestration
├── routes/               # Modular route handlers
│   ├── main.py          # Landing page and navigation
│   ├── autosubmit.py    # CSV to API converter
│   ├── bulkdelete.py    # Bulk deletion tool
│   └── testemail.py     # Email testing utilities
├── templates/            # Jinja2 HTML templates
│   ├── base.html        # Base template with layout
│   ├── index.html       # Landing page
│   └── */               # Tool-specific templates
├── static/              # Frontend assets
│   ├── css/            # Modern CSS with design system
│   ├── js/             # ES6+ JavaScript modules
│   └── images/         # SVG icons and branding
└── docs/               # Documentation
```

## 🔒 Security

ElqKit is built with security as a priority:

- **Container Security**: Non-root user execution
- **Input Validation**: Comprehensive sanitization and validation
- **File Security**: Type and size restrictions (CSV only, 5MB max)
- **No Persistent Storage**: Privacy-focused, files processed in memory
- **Security Headers**: Recommendations for production deployment
- **Secret Management**: Environment variable configuration

For detailed security information, see [SECURITY.md](SECURITY.md).

## 🔧 Configuration

### Environment Variables

```bash
# Required for production
SECRET_KEY=your-secure-secret-key

# Optional configuration  
FLASK_ENV=production          # production or development
FLASK_DEBUG=false            # true for development
PORT=8847                    # Application port
```

### Security Recommendations

For production deployments:

```bash
# Install additional security packages
pip install Flask-WTF flask-talisman Flask-Limiter

# Configure in your application
from flask_wtf.csrf import CSRFProtect
from flask_talisman import Talisman

csrf = CSRFProtect(app)
Talisman(app)
```

## 🧪 Development

### Local Development Setup

```bash
# Clone and setup virtual environment
git clone https://github.com/amdom5/ElqKit.git
cd ElqKit
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server
python app.py
```


## 📋 Requirements

### System Requirements
- Python 3.11+
- Docker Engine 20.10+
- 512MB RAM minimum
- 1GB disk space

## 🆘 Support

### Documentation
- [Deployment Guide](DOCKER_DEPLOYMENT.md)
- [Security Policy](SECURITY.md)

### Troubleshooting

**Common Issues:**

1. **Port 8847 in use**: Change port in `docker-compose.yml` or kill conflicting process
2. **Permission denied**: Check file permissions with `sudo chown -R $USER:$USER .`
3. **Container won't start**: Check logs with `docker logs elqkit`
4. **Health check failing**: Verify application is responding on configured port

**Made with ❤️ for the Eloqua community**

*ElqKit is not officially affiliated with Oracle Corporation or Oracle Eloqua.*
