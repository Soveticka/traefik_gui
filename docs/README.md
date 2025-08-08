# Traefik GUI Documentation

A modern web application for managing Traefik Dynamic Configuration files with a user-friendly interface.

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

## Overview

This application provides a web-based GUI for managing Traefik dynamic configuration files. It supports both monolithic and split configuration approaches, allowing you to:

- Manage routers, services, and middlewares through a web interface
- Split large configuration files into organized separate files
- Maintain backwards compatibility with existing setups
- Validate configurations before saving

### Key Features

- ✅ **Router Management** - Entry points, rules, services, TLS, middlewares
- ✅ **Service Management** - Load balancers, health checks, server transports
- ✅ **Middleware Management** - Headers, rate limiting, error pages, redirects
- ✅ **File Organization** - Split configurations for better maintainability
- ✅ **Docker Support** - Fully containerized with Docker Compose
- ✅ **Real-time Validation** - Form validation and error handling

## Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Storage**: YAML files (compatible with Traefik)
- **Containerization**: Docker + Docker Compose

### File Structure
```
traefik_gui/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   └── types/          # TypeScript definitions
│   ├── package.json
│   └── Dockerfile
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client
│   │   └── types/          # TypeScript definitions
│   ├── package.json
│   └── Dockerfile
├── docs/                   # Documentation
├── docker-compose.yml      # Docker orchestration
└── README.md
```

### Data Flow

```
┌─────────────────┐    HTTP API    ┌──────────────────┐    YAML I/O    ┌─────────────────┐
│   React GUI     │ ◄──────────── │   Express API    │ ◄─────────── │  Configuration  │
│   (Frontend)    │                │   (Backend)      │               │     Files       │
└─────────────────┘                └──────────────────┘               └─────────────────┘
      Port 3000                           Port 3001                    /opt/traefik/data/
```

## Installation

### Prerequisites

- Docker and Docker Compose
- Access to your Traefik configuration directory
- Network connectivity to `traefik.lab:5000` (if using in lab environment)

### Quick Start

1. **Clone/Download** the project to your server:
   ```bash
   # If using git
   git clone <your-private-repo-url> traefik_gui
   cd traefik_gui
   
   # Or download and extract the files
   ```

2. **Verify paths** in `docker-compose.yml` match your setup:
   ```yaml
   volumes:
     - /opt/traefik/data/dynamic:/app/config      # Split files directory
     - /opt/traefik/data/dynamic.yml:/app/dynamic.yml  # Original file
   ```

3. **Start the application**:
   ```bash
   docker-compose up -d
   ```

4. **Access the GUI**:
   - Local: http://localhost:3000
   - Lab network: http://traefik.lab:3000

### Development Setup

For local development with hot reload:

**Backend:**
```bash
cd backend
npm install
cp /path/to/your/dynamic.yml ./dynamic.yml  # Copy your config
npm run dev  # Starts on port 3001
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev  # Starts on port 5173
```

## Configuration

### File Organization Strategy

The application supports two configuration approaches:

#### Approach 1: Monolithic (Current)
```
/opt/traefik/data/
├── dynamic.yml              ← Single file with all config
└── dynamic/                 ← Empty directory (Traefik provider)
```

#### Approach 2: Split Files (Recommended)
```
/opt/traefik/data/
├── dynamic.yml              ← Backup/source file
└── dynamic/                 ← Traefik provider directory
    ├── routers.yml          ← Router configurations
    ├── services.yml         ← Service configurations  
    └── middlewares.yml      ← Middleware configurations
```

### Traefik Provider Configuration

Update your Traefik static config to use the directory provider:

```yaml
# traefik.yml
providers:
  file:
    directory: /opt/traefik/data/dynamic
    watch: true
```

### Environment Variables

The backend supports these environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Backend server port |
| `NODE_ENV` | `development` | Environment mode |
| `CONFIG_PATH` | `./config` | Directory for split files |
| `DYNAMIC_FILE_PATH` | `./dynamic.yml` | Path to monolithic config |

### Docker Compose Configuration

```yaml
# docker-compose.yml
services:
  traefik-gui-backend:
    build:
      context: ./backend
    ports:
      - "3001:3001"
    volumes:
      - /opt/traefik/data/dynamic:/app/config
      - /opt/traefik/data/dynamic.yml:/app/dynamic.yml
    environment:
      - NODE_ENV=production
      - CONFIG_PATH=/app/config
      - DYNAMIC_FILE_PATH=/app/dynamic.yml
    restart: unless-stopped
```

## Usage

### Dashboard Overview

The dashboard provides:
- **Statistics** - Count of routers, services, middlewares
- **Quick Actions** - Split configuration files
- **Health Status** - Application status

### Managing Routers

Routers define how incoming requests are handled:

1. **Create Router**:
   - Name: Unique identifier
   - Entry Points: `websecure`, `web`, etc.
   - Rule: `Host(\`example.com\`)`, `PathPrefix(\`/api\`)`, etc.
   - Service: Target service name
   - TLS: Enable/configure certificates
   - Middlewares: Apply middleware chain

2. **Edit Router**: Click edit icon to modify existing router
3. **Delete Router**: Click delete icon (with confirmation)

### Managing Services

Services define backend targets:

1. **Create Service**:
   - Name: Unique identifier
   - Servers: List of backend URLs
   - Health Check: Optional monitoring
   - Server Transport: Custom transport settings

2. **Load Balancer Options**:
   - Multiple servers for load balancing
   - Health check configuration
   - Custom transport settings

### Managing Middlewares

Middlewares modify requests/responses:

#### Headers Middleware
- Custom request headers
- Custom response headers
- Security headers

#### Rate Limit Middleware
- Average requests per second
- Burst capacity
- Per-IP rate limiting

#### Error Pages Middleware
- Custom error page service
- Status code ranges
- Query templates

#### Redirect Middleware
- Regex pattern matching
- Replacement URLs
- Permanent vs temporary redirects

### File Operations

#### Splitting Configuration

1. Go to Dashboard
2. Click "Split Configuration Files"
3. Files are created in `/opt/traefik/data/dynamic/`
4. Update Traefik to use directory provider
5. Original `dynamic.yml` remains as backup

#### Backup Strategy

Before making changes:
```bash
# Backup current configuration
cp /opt/traefik/data/dynamic.yml /opt/traefik/data/dynamic.yml.backup.$(date +%Y%m%d_%H%M%S)

# Backup split files (if using)
tar -czf /opt/traefik/data/dynamic_backup_$(date +%Y%m%d_%H%M%S).tar.gz /opt/traefik/data/dynamic/
```

## API Reference

### Routers API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/routers` | List all routers |
| `GET` | `/api/routers/:name` | Get specific router |
| `POST` | `/api/routers/:name` | Create/update router |
| `DELETE` | `/api/routers/:name` | Delete router |

### Services API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/services` | List all services |
| `GET` | `/api/services/:name` | Get specific service |
| `POST` | `/api/services/:name` | Create/update service |
| `DELETE` | `/api/services/:name` | Delete service |

### Middlewares API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/middlewares` | List all middlewares |
| `GET` | `/api/middlewares/:name` | Get specific middleware |
| `POST` | `/api/middlewares/:name` | Create/update middleware |
| `DELETE` | `/api/middlewares/:name` | Delete middleware |

### Configuration API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/config` | Get full configuration |
| `POST` | `/api/config/split` | Split into separate files |

### Example API Usage

```javascript
// Get all routers
const response = await fetch('/api/routers');
const routers = await response.json();

// Create a router
const router = {
  entryPoints: ['websecure'],
  rule: 'Host(`example.com`)',
  service: 'my-service',
  tls: { certResolver: 'cloudflare' }
};

await fetch('/api/routers/my-router', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(router)
});
```

## Troubleshooting

### Common Issues

#### 1. Permission Errors
```bash
# Fix file permissions
sudo chown -R $USER:$USER /opt/traefik/data/
sudo chmod -R 755 /opt/traefik/data/
```

#### 2. Port Conflicts
```bash
# Check if ports are in use
netstat -tulpn | grep -E ':3000|:3001'

# Change ports in docker-compose.yml if needed
ports:
  - "3010:3000"  # Frontend
  - "3011:3001"  # Backend
```

#### 3. Volume Mount Issues
```bash
# Verify paths exist
ls -la /opt/traefik/data/
ls -la /opt/traefik/data/dynamic.yml

# Create directories if missing
sudo mkdir -p /opt/traefik/data/dynamic
```

#### 4. Configuration Validation Errors
- Check YAML syntax with: `yamllint /opt/traefik/data/dynamic.yml`
- Verify required fields are present
- Check for duplicate names

### Logs and Debugging

```bash
# View application logs
docker-compose logs -f traefik-gui-backend
docker-compose logs -f traefik-gui-frontend

# Debug mode (development)
cd backend && npm run dev
cd frontend && npm run dev
```

### Health Checks

```bash
# Backend health
curl http://localhost:3001/health

# Check if files are being read
curl http://localhost:3001/api/routers

# Frontend health
curl http://localhost:3000
```

### Performance Considerations

- **File Size**: Large configurations (>1000 entries) may take longer to load
- **Memory**: Backend uses ~50MB RAM, Frontend ~20MB RAM
- **Disk**: Split files use slightly more disk space due to YAML overhead
- **Network**: All operations are local, minimal network impact

### Security Notes

- Application runs on local network only
- No authentication built-in (relies on network security)
- File system access limited to configured volumes
- Input validation on all API endpoints

For additional support or bug reports, check the application logs and verify your configuration matches the examples in this documentation.