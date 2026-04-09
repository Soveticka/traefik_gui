import axios from 'axios';
import { AuditEvent, TraefikMiddleware, TraefikRouter, TraefikService } from '../types/traefik';

const API_CONFIG = {
  baseURL: '/api/v1',
  timeout: 10000,
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
};

let configRevision: string | undefined;

const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    ...API_CONFIG.defaultHeaders,
  },
});

api.interceptors.response.use((response) => {
  const revisionHeader = response.headers['x-config-revision'];
  if (typeof revisionHeader === 'string' && revisionHeader.trim().length > 0) {
    configRevision = revisionHeader.trim();
  }
  return response;
});

api.interceptors.request.use((request) => {
  const method = request.method?.toLowerCase();
  const isMutation = method === 'post' || method === 'put' || method === 'patch' || method === 'delete';

  if (isMutation && configRevision) {
    request.headers = request.headers ?? {};
    (request.headers as Record<string, string>)['x-config-revision'] = configRevision;
  }

  return request;
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
  getAudit: (params?: { action?: string; resource?: string; since?: string; limit?: number }) =>
    api.get<{ entries: AuditEvent[] }>('/config/audit', { params }),
  dryRun: (config: unknown) => api.post('/config/dry-run', { config }),
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

export const healthApi = {
  getStatus: () => axios.get<{ status: string; timestamp: string }>('/health', { timeout: API_CONFIG.timeout }),
};
