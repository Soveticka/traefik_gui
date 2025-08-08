export interface TraefikRouter {
  entryPoints: string[];
  rule: string;
  service: string;
  tls?: {
    certResolver?: string;
  } | boolean;
  middlewares?: string[];
}

export interface TraefikService {
  loadBalancer: {
    servers: Array<{
      url: string;
    }>;
    healthCheck?: {
      interval?: string;
      path?: string;
      timeout?: string;
    };
    serversTransport?: string;
  };
}

export interface TraefikMiddleware {
  errors?: {
    query: string;
    service: string;
    status: string[];
  };
  rateLimit?: {
    average: number;
    burst: number;
  };
  headers?: {
    customRequestHeaders?: Record<string, string>;
    customResponseHeaders?: Record<string, string>;
  };
  redirectRegex?: {
    permanent: boolean;
    regex: string;
    replacement: string;
  };
}