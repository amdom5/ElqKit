# ElqKit Docker Deployment Guide

This guide provides instructions for deploying ElqKit on a Docker server in both development and production environments.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 512MB RAM available
- Port 8847 available (or configure alternative)

## Quick Start

### 1. Clone and Navigate
```bash
git clone <your-repo-url>
cd elqkit
```

### 2. Development Deployment
```bash
# Build and start the application
docker-compose up -d

# View logs
docker-compose logs -f elqkit

# Access the application
# Open http://localhost:8847 in your browser
```

### 3. Production Deployment
```bash
# Create production docker-compose override
cp docker-compose.yml docker-compose.prod.yml

# Edit production settings (see Production Configuration below)
nano docker-compose.prod.yml

# Deploy in production mode
docker-compose -f docker-compose.prod.yml up -d
```

## Production Configuration

### Environment Variables

Create a `.env` file for production secrets:

```bash
# .env file
SECRET_KEY=your-very-secure-random-secret-key-here
FLASK_ENV=production
FLASK_DEBUG=false
PORT=8847
```

### Production docker-compose.prod.yml

```yaml
version: '3.8'

services:
  elqkit:
    build: .
    container_name: elqkit-prod
    ports:
      - "8847:8847"
    environment:
      - FLASK_ENV=production
      - FLASK_DEBUG=false
      - PORT=8847
      - SECRET_KEY=${SECRET_KEY}
    restart: always
    healthcheck:
      test: ["CMD", "python", "-c", "import requests; requests.get('http://localhost:8847/', timeout=5)"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    # Remove volume mounts for production
    # volumes: []

networks:
  default:
    name: elqkit-prod-network
```

## Server Deployment Commands

### Build and Deploy
```bash
# Build the Docker image
docker build -t elqkit:latest .

# Run container directly (alternative to docker-compose)
docker run -d \
  --name elqkit \
  --restart unless-stopped \
  -p 8847:8847 \
  -e FLASK_ENV=production \
  -e FLASK_DEBUG=false \
  -e SECRET_KEY=your-secret-key-here \
  elqkit:latest
```

### Management Commands
```bash
# View running containers
docker ps

# View logs
docker logs elqkit -f

# Stop the application
docker stop elqkit

# Start the application
docker start elqkit

# Restart the application
docker restart elqkit

# Remove container
docker rm elqkit

# Remove image
docker rmi elqkit:latest
```

## Reverse Proxy Setup (Recommended for Production)

### Nginx Configuration

Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream elqkit {
        server elqkit:8847;
    }

    server {
        listen 80;
        server_name your-domain.com;

        location / {
            proxy_pass http://elqkit;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### Docker Compose with Nginx

```yaml
version: '3.8'

services:
  elqkit:
    build: .
    container_name: elqkit-prod
    expose:
      - "8847"
    environment:
      - FLASK_ENV=production
      - FLASK_DEBUG=false
      - SECRET_KEY=${SECRET_KEY}
    restart: always

  nginx:
    image: nginx:alpine
    container_name: elqkit-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - elqkit
    restart: always

networks:
  default:
    name: elqkit-prod-network
```

## SSL/TLS Setup with Let's Encrypt

### Using Certbot
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal (crontab)
0 12 * * * /usr/bin/certbot renew --quiet
```

## Monitoring and Maintenance

### Health Checks
```bash
# Check application health
curl http://localhost:8847/

# Check container health
docker inspect elqkit --format='{{.State.Health.Status}}'
```

### Log Management
```bash
# View recent logs
docker logs elqkit --tail 100

# Follow logs in real-time
docker logs elqkit -f

# Configure log rotation
docker run -d \
  --log-driver=json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  --name elqkit \
  elqkit:latest
```

### Backup and Updates

#### Backup
```bash
# Backup application data (if any persistent volumes)
docker run --rm -v elqkit_data:/backup alpine tar czf - /backup > elqkit-backup.tar.gz
```

#### Updates
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Security Considerations

### Container Security
- Non-root user (already configured in Dockerfile)
- Read-only root filesystem (optional)
- Resource limits

```bash
# Run with additional security options
docker run -d \
  --name elqkit \
  --restart unless-stopped \
  --read-only \
  --tmpfs /tmp \
  --security-opt no-new-privileges \
  --cpus="0.5" \
  --memory="256m" \
  -p 8847:8847 \
  elqkit:latest
```

### Firewall Configuration
```bash
# Allow only necessary ports
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 8847  # Only if direct access needed
sudo ufw enable
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Find process using port 8847
   sudo lsof -i :8847
   # Kill process or change port in docker-compose.yml
   ```

2. **Permission denied**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   ```

3. **Container won't start**
   ```bash
   # Check logs for errors
   docker logs elqkit
   
   # Check container status
   docker ps -a
   ```

4. **Health check failing**
   ```bash
   # Test health check manually
   docker exec elqkit python -c "import requests; print(requests.get('http://localhost:8847/').status_code)"
   ```

### Performance Tuning

```yaml
# docker-compose.yml additions for performance
services:
  elqkit:
    # ... other config
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

## Support

For issues related to deployment:
1. Check the application logs: `docker logs elqkit`
2. Verify Docker and Docker Compose versions
3. Ensure all environment variables are properly set
4. Check firewall and network connectivity

---

**Note**: Replace `your-domain.com` and `your-secret-key-here` with your actual values before deploying to production.