# API Configuration Guide

This guide explains how to configure API authentication for the Traefik GUI application.

## Environment Variables

The application supports several environment variables for API configuration:

### Frontend Environment Variables

Create a `.env` file in the `frontend/` directory with the following variables:

```bash
# Bearer token for Traefik API authentication (Primary method)
VITE_TRAEFIK_BEARER_TOKEN=your-bearer-token-here

# Optional: API Key for Traefik API authentication (Fallback)
VITE_TRAEFIK_API_KEY=your-api-key-here

# Optional: Direct Traefik API URL (for future direct API calls)
VITE_TRAEFIK_API_URL=http://traefik.lab:5000
```

### Backend Environment Variables (Already configured in docker-compose.yml)

```bash
# Backend server configuration
NODE_ENV=production
PORT=3001
CONFIG_PATH=/app/config
DYNAMIC_FILE_PATH=/app/dynamic.yml
```

## API Key Configuration

### Option 1: Environment Variables (Recommended)

1. **Create environment file**:
   ```bash
   cd frontend
   cp src/env.example .env
   ```

2. **Edit `.env` file**:
   ```bash
   # If your traefik.lab:5000 API requires Bearer token authentication
   VITE_TRAEFIK_BEARER_TOKEN=your-bearer-token-here
   
   # OR if using API key (fallback)
   VITE_TRAEFIK_API_KEY=your-api-key-here
   ```

3. **Rebuild the frontend**:
   ```bash
   docker-compose build traefik-gui-frontend
   docker-compose up -d
   ```

### Option 2: Direct Configuration (For development)

Edit `frontend/src/config/api.ts`:

```typescript
export const API_CONFIG = {
  baseURL: '/api',
  timeout: 10000,
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
  
  // Set your Bearer token directly (not recommended for production)
  bearerToken: 'your-bearer-token-here',
  
  // Or set API key as fallback
  apiKey: 'your-api-key-here',
};
```

## Docker Compose Configuration

If you need to pass environment variables to the containers, update `docker-compose.yml`:

```yaml
services:
  traefik-gui-frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      - VITE_TRAEFIK_BEARER_TOKEN=${TRAEFIK_BEARER_TOKEN}
      - VITE_TRAEFIK_API_KEY=${TRAEFIK_API_KEY}
    # ... rest of config

  traefik-gui-backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - TRAEFIK_API_KEY=${TRAEFIK_API_KEY}  # If backend needs API access
    # ... rest of config
```

Then create a `.env` file in the project root:

```bash
# Project root .env file
TRAEFIK_BEARER_TOKEN=your-bearer-token-here
TRAEFIK_API_KEY=your-api-key-here
```

## Authentication Methods Supported

### 1. Bearer Token Authentication (Primary)
The application will send the Bearer token in the `Authorization` header:
```
Authorization: Bearer your-bearer-token-here
```

### 2. API Key Authentication (Fallback)
The application will send the API key in the `X-API-Key` header:
```
X-API-Key: your-api-key-here
```

### 3. No Authentication
If no credentials are provided, requests are sent without authentication headers.

## Traefik API Configuration

If your `traefik.lab:5000` API requires authentication, make sure it's configured to accept the authentication method you're using.

### Example Traefik API Configuration

```yaml
# traefik.yml
api:
  dashboard: true
  debug: true
  insecure: false  # Set to false for production
  
# If using middleware for auth
http:
  middlewares:
    api-auth:
      basicAuth:
        users:
          - "admin:$2y$10$..." # bcrypt hash of password
```

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check that your API key or credentials are correct
2. **CORS Issues**: Ensure the backend proxy is configured correctly in `nginx.conf`
3. **Environment Variables Not Loading**: Rebuild the Docker image after changing `.env` files

### Debug API Calls

You can check the browser's Network tab to see the actual headers being sent:

1. Open Developer Tools (F12)
2. Go to Network tab
3. Make a request in the GUI
4. Check the request headers for authentication

### Testing API Access

Test direct API access to verify your credentials:

```bash
# Test with Bearer token
curl -H "Authorization: Bearer your-bearer-token" http://traefik.lab:5000/api/overview

# Test with API key (fallback)
curl -H "X-API-Key: your-api-key" http://traefik.lab:5000/api/overview
```

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use strong API keys** (at least 32 characters)
3. **Rotate credentials regularly**
4. **Use HTTPS** in production environments
5. **Limit API access** to necessary endpoints only

## Example Complete Setup

1. **Create frontend `.env`**:
   ```bash
   cd frontend
   echo "VITE_TRAEFIK_BEARER_TOKEN=your-actual-bearer-token" > .env
   ```

2. **Update docker-compose.yml** (if needed):
   ```yaml
   traefik-gui-frontend:
     environment:
       - VITE_TRAEFIK_BEARER_TOKEN=${TRAEFIK_BEARER_TOKEN:-}
   ```

3. **Create project root `.env`**:
   ```bash
   echo "TRAEFIK_BEARER_TOKEN=your-actual-bearer-token" > .env
   ```

4. **Rebuild and restart**:
   ```bash
   docker-compose build
   docker-compose up -d
   ```

The GUI will now authenticate with your Traefik API using the configured credentials.