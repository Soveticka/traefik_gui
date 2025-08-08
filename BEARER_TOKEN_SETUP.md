# Quick Bearer Token Setup

## 🔑 For traefik.lab:5000 Bearer Token Authentication

### Step 1: Create Environment File
```bash
cd frontend
echo "VITE_TRAEFIK_BEARER_TOKEN=your-bearer-token-here" > .env
```

### Step 2: Rebuild Frontend
```bash
docker-compose build traefik-gui-frontend
docker-compose up -d
```

### Step 3: Test the Connection
The GUI will now send requests with this header:
```
Authorization: Bearer your-bearer-token-here
```

## ✅ That's it!

Your Traefik GUI will now authenticate with your API using the Bearer token.

---

### Alternative: Docker Environment Variable

If you prefer to use docker-compose environment variables:

1. **Create project root `.env`**:
   ```bash
   echo "TRAEFIK_BEARER_TOKEN=your-bearer-token-here" > .env
   ```

2. **Update docker-compose.yml**:
   ```yaml
   traefik-gui-frontend:
     environment:
       - VITE_TRAEFIK_BEARER_TOKEN=${TRAEFIK_BEARER_TOKEN}
   ```

3. **Rebuild**:
   ```bash
   docker-compose build && docker-compose up -d
   ```

### 🔍 Debug

Check the browser Network tab to verify the `Authorization: Bearer ...` header is being sent with API requests.