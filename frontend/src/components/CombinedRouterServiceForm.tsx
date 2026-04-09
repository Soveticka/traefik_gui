import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { TraefikRouter, TraefikService } from '../types/traefik';
import { middlewaresApi } from '../services/api';

interface CombinedFormProps {
  onSave: (data: {
    routerName: string;
    serviceName: string;
    router: TraefikRouter;
    service: TraefikService;
  }) => void;
  onClose: () => void;
}

interface FormData {
  routerName: string;
  serviceName: string;
  host: string;
  pathPrefix: string;
  manualRule: boolean;
  rule: string;
  entryPoints: string[];
  tlsEnabled: boolean;
  certResolver: string;
  middlewares: string[];
  serverScheme: 'http' | 'https';
  serverHost: string;
  serverPort: string;
  servers: { url: string }[];
  healthCheckEnabled: boolean;
  healthCheckPath: string;
  healthCheckInterval: string;
  healthCheckTimeout: string;
  serversTransport: string;
}

const ENTRY_POINT_OPTIONS = ['websecure', 'web'];
const DEFAULT_CERT_RESOLVER = 'cloudflare';

const buildRule = (host: string, pathPrefix: string) => {
  const cleanHost = host.trim();
  if (!cleanHost) {
    return '';
  }

  const cleanPath = pathPrefix.trim();
  if (!cleanPath) {
    return `Host(\`${cleanHost}\`)`;
  }

  const normalizedPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  return `Host(\`${cleanHost}\`) && PathPrefix(\`${normalizedPath}\`)`;
};

const buildAddressPreview = (host: string, pathPrefix: string) => {
  const cleanHost = host.trim();
  if (!cleanHost) {
    return '';
  }

  const cleanPath = pathPrefix.trim();
  if (!cleanPath) {
    return cleanHost;
  }

  const normalizedPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  return `${cleanHost}${normalizedPath}`;
};

const buildServerUrl = (scheme: 'http' | 'https', host: string, port: string) => {
  const cleanHost = host.trim();
  if (!cleanHost) {
    return '';
  }

  const cleanPort = port.trim();
  if (!cleanPort) {
    return `${scheme}://${cleanHost}`;
  }

  return `${scheme}://${cleanHost}:${cleanPort}`;
};

const hostToBaseName = (host: string) => {
  const cleaned = host
    .trim()
    .toLowerCase()
    .replace(/\.+/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (!cleaned) {
    return '';
  }

  return cleaned;
};

const CombinedRouterServiceForm = ({ onSave, onClose }: CombinedFormProps) => {
  const [availableMiddlewares, setAvailableMiddlewares] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, dirtyFields },
  } = useForm<FormData>({
    defaultValues: {
      routerName: '',
      serviceName: '',
      host: '',
      pathPrefix: '',
      manualRule: false,
      rule: '',
      entryPoints: ['websecure'],
      tlsEnabled: true,
      certResolver: DEFAULT_CERT_RESOLVER,
      middlewares: [],
      serverScheme: 'http',
      serverHost: '',
      serverPort: '8080',
      servers: [{ url: '' }],
      healthCheckEnabled: true,
      healthCheckPath: '/health',
      healthCheckInterval: '30s',
      healthCheckTimeout: '10s',
      serversTransport: '',
    },
  });

  const { fields: serverFields, append: appendServer, remove: removeServer } = useFieldArray({
    control,
    name: 'servers',
  });

  const host = watch('host');
  const pathPrefix = watch('pathPrefix');
  const manualRule = watch('manualRule');
  const tlsEnabled = watch('tlsEnabled');
  const healthCheckEnabled = watch('healthCheckEnabled');
  const serverScheme = watch('serverScheme');
  const serverHost = watch('serverHost');
  const serverPort = watch('serverPort');
  const selectedEntryPoints = watch('entryPoints');
  const addressPreview = buildAddressPreview(host, pathPrefix);

  useEffect(() => {
    const baseName = hostToBaseName(host);
    if (!baseName) {
      return;
    }

    if (!dirtyFields.routerName) {
      setValue('routerName', `${baseName}-router`, { shouldDirty: false });
    }

    if (!dirtyFields.serviceName) {
      setValue('serviceName', `${baseName}-service`, { shouldDirty: false });
    }
  }, [host, dirtyFields.routerName, dirtyFields.serviceName, setValue]);

  useEffect(() => {
    if (manualRule) {
      return;
    }

    setValue('rule', buildRule(host, pathPrefix), {
      shouldDirty: false,
      shouldValidate: true,
    });
  }, [host, pathPrefix, manualRule, setValue]);

  useEffect(() => {
    setValue('servers.0.url', buildServerUrl(serverScheme, serverHost, serverPort), {
      shouldDirty: false,
      shouldValidate: true,
    });
  }, [serverScheme, serverHost, serverPort, setValue]);

  useEffect(() => {
    const fetchMiddlewares = async () => {
      try {
        const response = await middlewaresApi.getAll();
        setAvailableMiddlewares(Object.keys(response.data));
      } catch (error) {
        console.error('Failed to load middlewares:', error);
        setAvailableMiddlewares([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMiddlewares();
  }, []);

  const toggleEntryPoint = (entryPoint: string) => {
    const current = getValues('entryPoints') || [];
    const exists = current.includes(entryPoint);

    if (exists) {
      const next = current.filter((item) => item !== entryPoint);
      if (next.length > 0) {
        setValue('entryPoints', next, { shouldValidate: true, shouldDirty: true });
      }
      return;
    }

    setValue('entryPoints', [...current, entryPoint], { shouldValidate: true, shouldDirty: true });
  };

  const applyRecommendedMiddlewares = () => {
    const preferredOrder = ['error-pages', 'csp-strict'];
    const lowerMap = new Map(availableMiddlewares.map((name) => [name.toLowerCase(), name]));
    const suggested = preferredOrder
      .map((name) => lowerMap.get(name))
      .filter((name): name is string => Boolean(name));

    if (suggested.length > 0) {
      setValue('middlewares', suggested, { shouldDirty: true });
    }
  };

  const onSubmit = (data: FormData) => {
    const router: TraefikRouter = {
      entryPoints: data.entryPoints,
      rule: data.rule,
      service: data.serviceName,
    };

    if (data.tlsEnabled) {
      router.tls = data.certResolver ? { certResolver: data.certResolver } : true;
    }

    if (data.middlewares.length > 0) {
      router.middlewares = data.middlewares;
    }

    const service: TraefikService = {
      loadBalancer: {
        servers: data.servers.filter((server) => server.url.trim()),
      },
    };

    if (data.healthCheckEnabled) {
      service.loadBalancer.healthCheck = {
        path: data.healthCheckPath,
        interval: data.healthCheckInterval,
        timeout: data.healthCheckTimeout,
      };
    }

    if (data.serversTransport.trim()) {
      service.loadBalancer.serversTransport = data.serversTransport;
    }

    onSave({
      routerName: data.routerName,
      serviceName: data.serviceName,
      router,
      service,
    });
  };

  if (loading) {
    return (
      <div className="modal-overlay flex items-center justify-center">
        <div className="card rounded-xl p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent-teal border-t-transparent mx-auto"></div>
          <p className="text-center mt-2 text-[var(--text-secondary)]">Loading middlewares...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card max-w-5xl top-10 mb-10">
        <div className="flex justify-between items-center pb-4 border-b border-[var(--border)]">
          <div>
            <h3 className="text-xl font-bold text-[var(--text-primary)]">Create Router + Service</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Host-first flow with smart defaults for your lab setup.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Public Host</label>
              <input
                {...register('host', { required: 'Host is required' })}
                type="text"
                className="form-input"
                placeholder="app.lab.example"
              />
              {errors.host && <p className="mt-1 text-sm text-red-600">{errors.host.message}</p>}
            </div>

            <div>
              <label className="form-label">Path Prefix (Optional)</label>
              <input
                {...register('pathPrefix')}
                type="text"
                className="form-input"
                placeholder="/api"
              />
            </div>

            <div>
              <label className="form-label">Address Preview</label>
              <input
                value={addressPreview}
                readOnly
                className="form-input opacity-80"
                placeholder="app.lab.example/api"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Router Name</label>
              <input
                {...register('routerName', { required: 'Router name is required' })}
                type="text"
                className="form-input"
                placeholder="app-lab-example-router"
              />
              {errors.routerName && <p className="mt-1 text-sm text-red-600">{errors.routerName.message}</p>}
            </div>

            <div>
              <label className="form-label">Service Name</label>
              <input
                {...register('serviceName', { required: 'Service name is required' })}
                type="text"
                className="form-input"
                placeholder="app-lab-example-service"
              />
            </div>

            <div className="space-y-2">
              <label className="form-label">Advanced Rule</label>
              <label className="flex items-center">
                <input {...register('manualRule')} type="checkbox" className="form-checkbox" />
                <span className="ml-2 text-sm text-[var(--text-secondary)]">Edit rule manually</span>
              </label>
            </div>
          </div>

          {manualRule && (
            <div>
              <label className="form-label">Custom Rule</label>
              <input
                {...register('rule', { required: 'Rule is required' })}
                type="text"
                className="form-input"
                placeholder="Host(`app.lab.example`) && PathPrefix(`/api`)"
              />
              {errors.rule && <p className="mt-1 text-sm text-red-600">{errors.rule.message}</p>}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-accent-teal border-b border-accent-teal/20 pb-2">Router</h4>

              <div>
                <label className="form-label mb-2">Entry Points</label>
                <div className="flex flex-wrap gap-2">
                  {ENTRY_POINT_OPTIONS.map((entryPoint) => (
                    <button
                      key={entryPoint}
                      type="button"
                      onClick={() => toggleEntryPoint(entryPoint)}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                        selectedEntryPoints.includes(entryPoint)
                          ? 'border-accent-teal/60 bg-accent-teal/20 text-[var(--text-primary)]'
                          : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
                      }`}
                    >
                      {entryPoint}
                    </button>
                  ))}
                </div>
                {selectedEntryPoints.length === 0 && (
                  <p className="mt-1 text-sm text-red-600">Select at least one entry point.</p>
                )}
              </div>

              <div className="space-y-3">
                <label className="flex items-center">
                  <input {...register('tlsEnabled')} type="checkbox" className="form-checkbox" />
                  <span className="ml-2 text-sm text-[var(--text-secondary)]">Enable TLS (recommended)</span>
                </label>

                {tlsEnabled && (
                  <div>
                    <label className="form-label">Certificate Resolver</label>
                    <input
                      {...register('certResolver')}
                      type="text"
                      className="form-input"
                      placeholder="cloudflare"
                    />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="form-label">Middlewares</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={applyRecommendedMiddlewares}
                      className="px-2.5 py-1 text-xs rounded-md border border-accent-teal/40 text-accent-teal hover:bg-accent-teal/10"
                    >
                      Pick Recommended
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue('middlewares', [], { shouldDirty: true })}
                      className="px-2.5 py-1 text-xs rounded-md border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-44 overflow-y-auto border border-[var(--border)] rounded-lg p-3 bg-[var(--bg-primary)]">
                  {availableMiddlewares.map((middleware) => (
                    <label key={middleware} className="flex items-center">
                      <input
                        {...register('middlewares')}
                        type="checkbox"
                        value={middleware}
                        className="form-checkbox"
                      />
                      <span className="ml-2 text-sm text-[var(--text-secondary)]">{middleware}</span>
                    </label>
                  ))}
                  {availableMiddlewares.length === 0 && (
                    <p className="text-sm text-[var(--text-muted)] italic">No middlewares available</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-accent-cyan border-b border-accent-cyan/20 pb-2">Service</h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="form-label">Backend Scheme</label>
                  <select {...register('serverScheme')} className="form-input">
                    <option value="http">http</option>
                    <option value="https">https</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Backend Host</label>
                  <input
                    {...register('serverHost', { required: 'Backend host is required' })}
                    type="text"
                    className="form-input"
                    placeholder="app-service.lab"
                  />
                  {errors.serverHost && <p className="mt-1 text-sm text-red-600">{errors.serverHost.message}</p>}
                </div>
                <div>
                  <label className="form-label">Backend Port</label>
                  <input
                    {...register('serverPort', { required: 'Port is required' })}
                    type="text"
                    className="form-input"
                    placeholder="8080"
                  />
                </div>
              </div>

              <div>
                {serverFields.map((field, index) => (
                  <div key={field.id} className="flex mt-1 space-x-2">
                    <input
                      {...register(`servers.${index}.url` as const, {
                        required: 'Server URL is required',
                        pattern: {
                          value: /^https?:\/\/.+/,
                          message: 'Please enter a valid HTTP/HTTPS URL',
                        },
                      })}
                      type="text"
                      className="flex-1 form-input"
                      placeholder="http://app-service.lab:8080"
                      disabled={index === 0}
                    />
                    <button
                      type="button"
                      onClick={() => removeServer(index)}
                      className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-colors"
                      disabled={serverFields.length === 1}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => appendServer({ url: '' })}
                  className="mt-2 px-3 py-1 border border-[var(--border)] rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Add Server
                </button>
              </div>

              <div>
                <label className="flex items-center">
                  <input {...register('healthCheckEnabled')} type="checkbox" className="form-checkbox" />
                  <span className="ml-2 text-sm text-[var(--text-secondary)]">Enable Health Check</span>
                </label>
              </div>

              {healthCheckEnabled && (
                <div className="space-y-3 pl-4 border-l-2 border-accent-teal/30">
                  <div>
                    <label className="form-label">Health Check Path</label>
                    <input
                      {...register('healthCheckPath', { required: 'Health check path is required' })}
                      type="text"
                      className="form-input"
                      placeholder="/health"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Interval</label>
                      <input {...register('healthCheckInterval')} type="text" className="form-input" placeholder="30s" />
                    </div>

                    <div>
                      <label className="form-label">Timeout</label>
                      <input {...register('healthCheckTimeout')} type="text" className="form-input" placeholder="10s" />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="form-label">Servers Transport (Optional)</label>
                <input
                  {...register('serversTransport')}
                  type="text"
                  className="form-input"
                  placeholder="insecure-transport"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-[var(--border)]">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={selectedEntryPoints.length === 0}
            >
              Create Router + Service
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CombinedRouterServiceForm;
