# Traefik GUI

A modern web application for managing Traefik Dynamic Configuration files with a user-friendly interface.

![Traefik GUI Dashboard](https://img.shields.io/badge/status-ready-green) ![Docker](https://img.shields.io/badge/docker-ready-blue) ![License](https://img.shields.io/badge/license-MIT-green)

## Features

✅ **Router Management** - Create, edit, delete routers with entry points, rules, services, TLS, middlewares  
✅ **Service Management** - Load balancer services with health checks and server transports  
✅ **Middleware Management** - Headers, rate limiting, error pages, redirects  
✅ **File Organization** - Split monolithic `dynamic.yml` into organized files  
✅ **Modern UI** - Clean, responsive React interface with real-time validation  
✅ **Docker Support** - Fully containerized with Docker Compose  

## Quick Start

```bash
# 1. Clone your private repository
git clone https://github.com/Soveticka/traefik-gui.git
cd traefik-gui

# 2. Start the application
docker-compose up -d

# 3. Access the GUI
open http://localhost:3000
```

**That's it!** The GUI will automatically read your existing `/opt/traefik/data/dynamic.yml` configuration.

## Documentation

📖 **[Complete Documentation](docs/README.md)** - Detailed setup, configuration, and API reference  
🚀 **[Setup Guide](docs/SETUP_GUIDE.md)** - Step-by-step installation instructions  

## Architecture

```
┌─────────────────┐    HTTP API    ┌──────────────────┐    YAML I/O    ┌─────────────────┐
│   React GUI     │ ◄──────────── │   Express API    │ ◄─────────── │  Configuration  │
│   Port 3000     │                │   Port 3001      │               │     Files       │
└─────────────────┘                └──────────────────┘               └─────────────────┘
```

**Tech Stack:** React 18 + TypeScript + Node.js + Express + Docker

## File Organization Strategy

The application supports both approaches:

### Current Setup (Monolithic)
```
/opt/traefik/data/
├── dynamic.yml              ← Your current file
└── dynamic/                 ← Empty directory
```

### Recommended Setup (Split Files)
```
/opt/traefik/data/
├── dynamic.yml              ← Backup/source
└── dynamic/                 ← Traefik provider directory
    ├── routers.yml          ← Router configurations
    ├── services.yml         ← Service configurations  
    └── middlewares.yml      ← Middleware configurations
```

## Configuration Examples

### Router Configuration
```yaml
my-app-router:
  entryPoints: [websecure]
  rule: Host(`app.example.com`)
  service: my-app-service
  tls:
    certResolver: cloudflare
  middlewares:
    - security-headers
    - rate-limit
```

### Service Configuration
```yaml
my-app-service:
  loadBalancer:
    servers:
      - url: http://app.lab:8080
    healthCheck:
      path: /health
      interval: 30s
```

### Middleware Configuration
```yaml
security-headers:
  headers:
    customResponseHeaders:
      X-Frame-Options: DENY
      X-Content-Type-Options: nosniff

rate-limit:
  rateLimit:
    average: 100
    burst: 200
```

## Screenshots

| Dashboard | Router Management | Service Configuration |
|-----------|-------------------|----------------------|
| Overview with stats | CRUD operations | Load balancer setup |

## Development

```bash
# Backend development
cd backend && npm install && npm run dev

# Frontend development  
cd frontend && npm install && npm run dev
```

## Contributing

1. Fork this private repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Built for Soveticka's Lab Environment** 🏠  
*Designed to work seamlessly with your existing Traefik setup at `traefik.lab:5000`*