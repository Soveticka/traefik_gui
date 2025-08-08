import axios from 'axios';
import { TraefikRouter, TraefikService, TraefikMiddleware } from '../types/traefik';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
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