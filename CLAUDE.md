# Traefik GUI - Project Memory

## Project Overview
A modern web application for managing Traefik Dynamic Configuration files with a user-friendly interface, built for Soveticka's lab environment.

## Key Features Implemented ✅

### 🔧 Core Functionality
- **Smart Configuration Management**: Automatically detects and works with both monolithic (`dynamic.yml`) and split configuration files (`routers.yml`, `services.yml`, `middlewares.yml`)
- **Full CRUD Operations**: Create, read, update, delete for routers, services, and middlewares
- **File Organization**: Can split monolithic configuration into organized separate files
- **Real-time Validation**: Form validation with proper error handling

### 🎨 User Interface
- **Dark/Light Mode**: Toggle with automatic system preference detection and localStorage persistence
- **Purple Theme**: Beautiful purple gradients and accents throughout the application
- **Glass Morphism**: Modern glass effects with backdrop blur on cards and navigation
- **Responsive Design**: Works on desktop and mobile devices
- **Smooth Animations**: Hover effects, transitions, and floating elements

### 🛠 Advanced Features
- **Combined Router + Service Creation**: Single form to create both router and service together with auto-naming
- **Middleware Selection**: Dropdown checkboxes instead of manual text input - loads available middlewares dynamically
- **Bearer Token Authentication**: Supports `Authorization: Bearer <token>` for Traefik API authentication
- **Split File Detection**: Automatically detects if configuration is split and edits appropriate files
- **Health Checks**: Support for service health check configuration
- **TLS Configuration**: Certificate resolver and TLS enablement options

## Technical Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript + YAML parsing
- **Authentication**: Bearer token support for traefik.lab:5000
- **Containerization**: Docker + Docker Compose
- **File Management**: Direct YAML file editing with split file support

## Architecture
```
Frontend (React)  ←→  Backend API (Express)  ←→  Configuration Files
     ↓                       ↓                        ↓
Port 3000               Port 3001              /opt/traefik/data/
                                              ├── dynamic.yml (monolithic)
                                              └── dynamic/ (split files)
                                                  ├── routers.yml
                                                  ├── services.yml
                                                  └── middlewares.yml
```

## Configuration Approach
The application intelligently handles both configuration approaches:
1. **Monolithic**: All config in `dynamic.yml` - reads/writes to this file
2. **Split Files**: Separate files for each component - reads/writes to appropriate split files
3. **Auto-detection**: Uses `hasSplitFiles()` method to determine which approach is active

## UI/UX Improvements Made
- **Dark Mode Contrast**: Fixed all text readability issues in dark theme
- **Form Organization**: Logical grouping of related fields
- **Loading States**: Spinner and loading messages for async operations
- **Error Handling**: Toast notifications for success/error states
- **Intuitive Navigation**: Clear section headers and navigation structure

## Authentication Setup
For Bearer token authentication with traefik.lab:5000:
```bash
# Create frontend/.env
VITE_TRAEFIK_BEARER_TOKEN=your-bearer-token-here

# Rebuild frontend
docker-compose build traefik-gui-frontend
docker-compose up -d
```

## File Structure
```
traefik_gui/
├── backend/                 # Node.js API
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   └── types/          # TypeScript types
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client
│   │   └── contexts/       # Theme context
├── docs/                   # Documentation
└── docker-compose.yml     # Container orchestration
```

## Key Components

### Backend Services
- `ConfigService`: Smart configuration management with split file detection
- Router/Service/Middleware APIs: CRUD operations with validation
- Combined API: Creates router + service in single operation

### Frontend Components  
- `Layout`: Navigation with dark mode toggle
- `RouterForm`: Enhanced router creation with middleware dropdowns
- `CombinedRouterServiceForm`: Single form for creating router + service
- `ThemeProvider`: Dark/light mode context management

## Recent Improvements
1. **Smart File Detection**: Backend automatically detects split vs monolithic configuration
2. **Combined Creation Form**: Beautiful side-by-side router + service creation
3. **Middleware Dropdowns**: Dynamic loading of available middlewares with checkboxes
4. **Dark Mode Contrast**: Fixed all text readability issues in dark theme
5. **Glass Effects**: Modern UI with backdrop blur and transparency
6. **Purple Branding**: Consistent purple theme throughout application

## Development Commands
```bash
# Build and run
docker-compose build
docker-compose up -d

# Development mode
cd backend && npm run dev    # Backend on port 3001
cd frontend && npm run dev   # Frontend on port 5173
```

## API Endpoints
- `GET/POST/DELETE /api/routers/:name` - Router management
- `GET/POST/DELETE /api/services/:name` - Service management  
- `GET/POST/DELETE /api/middlewares/:name` - Middleware management
- `POST /api/combined/router-service` - Combined router + service creation
- `POST /api/config/split` - Split configuration files

## Environment Variables
- `VITE_TRAEFIK_BEARER_TOKEN` - Bearer token for API authentication
- `VITE_TRAEFIK_API_KEY` - API key fallback authentication
- `CONFIG_PATH` - Path to split configuration directory
- `DYNAMIC_FILE_PATH` - Path to monolithic configuration file

## Project Status: ✅ COMPLETE
All requested features have been implemented:
- ✅ GUI for managing routers, services, middlewares
- ✅ Dark mode with purple theme
- ✅ Split configuration file support
- ✅ Combined router + service creation
- ✅ Middleware selection dropdowns
- ✅ Bearer token authentication
- ✅ Beautiful modern UI with animations
- ✅ Mobile responsive design
- ✅ Text contrast improvements

The application is production-ready and fully functional for managing Traefik dynamic configuration in Soveticka's lab environment.