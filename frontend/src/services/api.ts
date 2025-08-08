import axios from 'axios';
import { TraefikRouter, TraefikService, TraefikMiddleware } from '../types/traefik';

// API Configuration
const API_CONFIG = {
  baseURL: '/api',
  timeout: 10000,
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
  bearerToken: import.meta.env.VITE_TRAEFIK_BEARER_TOKEN || '',
  apiKey: import.meta.env.VITE_TRAEFIK_API_KEY || '',
};

const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    ...API_CONFIG.defaultHeaders,
    ...(API_CONFIG.bearerToken && { 'Authorization': `Bearer ${API_CONFIG.bearerToken}` }),
    ...(API_CONFIG.apiKey && { 'X-API-Key': API_CONFIG.apiKey }),
  },
});

export const routersApi = {
  getAll: () => api.get<Record<string, TraefikRouter>>('/routers'),
  get: (name: string) => api.get<TraefikRouter>(`/routers/${name}`),
  save: (name: string, data: TraefikRouter) => api.post(`/routers/${name}`, data),
  delete: (name: string) => api.delete(`/routers/${name}`),
};

export const servicesApi = {
  getAll: () => api.get<Record<string, TraefikService>>('/services'),
  get: (name: string) => api.get<TraefikService>(`/services/${name}`),
  save: (name: string, data: TraefikService) => api.post(`/services/${name}`, data),
  delete: (name: string) => api.delete(`/services/${name}`),
};

export const middlewaresApi = {
  getAll: () => api.get<Record<string, TraefikMiddleware>>('/middlewares'),
  get: (name: string) => api.get<TraefikMiddleware>(`/middlewares/${name}`),
  save: (name: string, data: TraefikMiddleware) => api.post(`/middlewares/${name}`, data),
  delete: (name: string) => api.delete(`/middlewares/${name}`),
};

export const configApi = {
  getAll: () => api.get('/config'),
  split: () => api.post('/config/split'),
};

export const combinedApi = {
  createRouterService: (data: {
    routerName: string;
    serviceName: string;
    router: TraefikRouter;
    service: TraefikService;
  }) => api.post('/combined/router-service', data),
};