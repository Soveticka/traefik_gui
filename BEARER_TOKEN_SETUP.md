# API Authentication Setup

The GUI no longer stores API secrets in frontend environment variables.

## Backend token (recommended)

1. Set a backend token:
```bash
export API_AUTH_TOKEN=replace-with-a-strong-token
```

2. Start services:
```bash
docker-compose up -d --build
```

3. Send the token from your client/proxy to the backend as either:
```text
Authorization: Bearer <token>
```
or
```text
X-API-Key: <token>
```

## Local development only

If you are running on a trusted local machine, you can disable backend auth explicitly:
```bash
export ALLOW_UNAUTHENTICATED_API=true
```

Do not use `ALLOW_UNAUTHENTICATED_API=true` in shared or exposed environments.
