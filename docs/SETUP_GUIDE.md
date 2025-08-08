# Traefik GUI Setup Guide

This guide will walk you through setting up the Traefik GUI application step by step.

## Pre-Setup Checklist

Before you begin, ensure you have:

- [ ] Docker and Docker Compose installed
- [ ] Access to your Traefik server
- [ ] Current Traefik configuration file location: `/opt/traefik/data/dynamic.yml`
- [ ] Write permissions to `/opt/traefik/data/` directory

## Step-by-Step Setup

### Step 1: Prepare the GitHub Repository

1. **Create a new private repository** on GitHub:
   - Repository name: `traefik-gui`
   - Description: "GUI for managing Traefik dynamic configuration"
   - Visibility: Private
   - Initialize with README: No (we have our own)

2. **Initialize git in your project** (run these commands in `C:\Users\Soveticka\Documents\GIT\traefik_gui\`):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Traefik GUI application
   
   - Complete React + TypeScript frontend
   - Node.js + Express backend with YAML management
   - Docker containerization setup
   - Support for monolithic and split configurations
   - Router, Service, and Middleware management
   
   🤖 Generated with Claude Code
   
   Co-Authored-By: Claude <noreply@anthropic.com>"
   
   git branch -M main
   git remote add origin https://github.com/Soveticka/traefik-gui.git
   git push -u origin main
   ```

### Step 2: Prepare Your Server Environment

1. **Create deployment directory** on your server:
   ```bash
   sudo mkdir -p /opt/traefik-gui
   sudo chown $USER:$USER /opt/traefik-gui
   ```

2. **Verify Traefik directories**:
   ```bash
   ls -la /opt/traefik/data/
   # Should show dynamic.yml and dynamic/ directory
   
   # If dynamic/ directory doesn't exist:
   sudo mkdir -p /opt/traefik/data/dynamic
   sudo chown traefik:traefik /opt/traefik/data/dynamic  # or your traefik user
   ```

3. **Backup your current configuration**:
   ```bash
   sudo cp /opt/traefik/data/dynamic.yml /opt/traefik/data/dynamic.yml.backup.$(date +%Y%m%d_%H%M%S)
   ```

### Step 3: Deploy the Application

1. **Clone your repository** on the server:
   ```bash
   cd /opt/traefik-gui
   git clone https://github.com/Soveticka/traefik-gui.git .
   ```

2. **Verify the configuration** in `docker-compose.yml`:
   ```yaml
   # Should look like this for your setup:
   volumes:
     - /opt/traefik/data/dynamic:/app/config
     - /opt/traefik/data/dynamic.yml:/app/dynamic.yml
   ```

3. **Start the application**:
   ```bash
   docker-compose up -d
   ```

4. **Verify deployment**:
   ```bash
   # Check containers are running
   docker-compose ps
   
   # Check logs
   docker-compose logs -f
   
   # Test API
   curl http://localhost:3001/health
   ```

### Step 4: Configure Traefik Integration

#### Option A: Keep Monolithic Approach (Safer)
Your current setup should work as-is. The GUI will read/write to your existing `dynamic.yml`.

#### Option B: Switch to Split Files (Recommended)

1. **Update Traefik static configuration** (`traefik.yml`):
   ```yaml
   # Change from:
   providers:
     file:
       filename: /opt/traefik/data/dynamic.yml
       watch: true
   
   # To:
   providers:
     file:
       directory: /opt/traefik/data/dynamic
       watch: true
   ```

2. **Split your configuration** using the GUI:
   - Open http://your-server:3000 (or http://traefik.lab:3000)
   - Go to Dashboard
   - Click "Split Configuration Files"
   - Files will be created in `/opt/traefik/data/dynamic/`

3. **Restart Traefik** to use the new configuration:
   ```bash
   # If using Docker:
   docker restart traefik
   
   # If using systemd:
   sudo systemctl restart traefik
   ```

### Step 5: Access and Test

1. **Access the GUI**:
   - Local: http://localhost:3000
   - Network: http://your-server-ip:3000
   - Lab: http://traefik.lab:3000

2. **Test functionality**:
   - [ ] Dashboard loads and shows current statistics
   - [ ] Routers page displays your existing routers
   - [ ] Services page displays your existing services
   - [ ] Middlewares page displays your existing middlewares
   - [ ] Can create/edit/delete items
   - [ ] Changes appear in your configuration files

## Network Integration

### Add Traefik GUI to Your Traefik Routes

Add these entries to your configuration to access the GUI through Traefik:

```yaml
# Router
http:
  routers:
    traefik-gui-router:
      entryPoints:
        - websecure
      rule: Host(`traefik-gui.mkomanek.eu`) # or your preferred domain
      service: traefik-gui
      tls:
        certResolver: cloudflare
      middlewares:
        - security-headers

# Service
  services:
    traefik-gui:
      loadBalancer:
        servers:
          - url: http://traefik.lab:3000  # or your server IP
```

## Security Considerations

### Network Security
- Application runs on internal network only
- No built-in authentication (design choice for lab environment)
- All file operations are restricted to mounted volumes

### File Permissions
```bash
# Set appropriate permissions
sudo chown -R traefik:traefik /opt/traefik/data/
sudo chmod -R 755 /opt/traefik/data/
sudo chmod 644 /opt/traefik/data/dynamic.yml
sudo chmod -R 644 /opt/traefik/data/dynamic/
```

### Backup Strategy
```bash
# Create backup script
cat > /opt/traefik-gui/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/traefik/data/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup monolithic file
cp /opt/traefik/data/dynamic.yml $BACKUP_DIR/dynamic_$DATE.yml

# Backup split files (if they exist)
if [ -d "/opt/traefik/data/dynamic" ]; then
    tar -czf $BACKUP_DIR/dynamic_split_$DATE.tar.gz /opt/traefik/data/dynamic/
fi

# Keep only last 10 backups
cd $BACKUP_DIR && ls -t | tail -n +11 | xargs rm -f --

echo "Backup completed: $DATE"
EOF

chmod +x /opt/traefik-gui/backup.sh

# Add to crontab for daily backups
echo "0 2 * * * /opt/traefik-gui/backup.sh" | crontab -
```

## Maintenance

### Updates
```bash
cd /opt/traefik-gui
git pull origin main
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Monitoring
```bash
# Check application health
curl http://localhost:3001/health

# View logs
docker-compose logs -f --tail=50

# Check resource usage
docker stats traefik-gui-backend traefik-gui-frontend
```

### Development Mode
For making changes or debugging:
```bash
# Stop production containers
docker-compose down

# Start in development mode
cd backend && npm install && npm run dev &
cd frontend && npm install && npm run dev
```

## Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| Port 3000/3001 in use | Change ports in docker-compose.yml |
| Permission denied | Check file ownership and permissions |
| Configuration not loading | Verify volume mounts in docker-compose.yml |
| Changes not reflected | Check file write permissions |
| Traefik not picking up changes | Verify provider configuration and restart |
| GUI not accessible | Check firewall and network configuration |

## Support

For issues, check:
1. Application logs: `docker-compose logs`
2. File permissions: `ls -la /opt/traefik/data/`
3. Network connectivity: `curl http://localhost:3001/health`
4. Traefik logs for configuration errors

The comprehensive documentation in `docs/README.md` contains detailed troubleshooting steps and API reference.