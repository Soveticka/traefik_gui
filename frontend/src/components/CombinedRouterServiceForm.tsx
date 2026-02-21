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
  entryPoints: { value: string }[];
  rule: string;
  tlsEnabled: boolean;
  certResolver: string;
  middlewares: string[];
  servers: { url: string }[];
  healthCheckEnabled: boolean;
  healthCheckPath: string;
  healthCheckInterval: string;
  healthCheckTimeout: string;
  serversTransport: string;
}

const CombinedRouterServiceForm = ({ onSave, onClose }: CombinedFormProps) => {
  const [availableMiddlewares, setAvailableMiddlewares] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      routerName: '',
      serviceName: '',
      entryPoints: [{ value: 'websecure' }],
      rule: '',
      tlsEnabled: false,
      certResolver: '',
      middlewares: [],
      servers: [{ url: '' }],
      healthCheckEnabled: false,
      healthCheckPath: '/health',
      healthCheckInterval: '30s',
      healthCheckTimeout: '10s',
      serversTransport: '',
    },
  });

  const { fields: entryPointFields, append: appendEntryPoint, remove: removeEntryPoint } = useFieldArray({
    control,
    name: 'entryPoints',
  });

  const { fields: serverFields, append: appendServer, remove: removeServer } = useFieldArray({
    control,
    name: 'servers',
  });

  const tlsEnabled = watch('tlsEnabled');
  const healthCheckEnabled = watch('healthCheckEnabled');
  const routerName = watch('routerName');

  // Auto-generate service name based on router name
  useEffect(() => {
    if (routerName) {
      const serviceName = routerName.endsWith('-router')
        ? routerName.replace('-router', '-service')
        : `${routerName}-service`;
      setValue('serviceName', serviceName);
    }
  }, [routerName, setValue]);

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

  const onSubmit = (data: FormData) => {
    const router: TraefikRouter = {
      entryPoints: data.entryPoints.map(ep => ep.value).filter(Boolean),
      rule: data.rule,
      service: data.serviceName,
    };

    if (data.tlsEnabled) {
      if (data.certResolver) {
        router.tls = { certResolver: data.certResolver };
      } else {
        router.tls = true;
      }
    }

    if (data.middlewares.length > 0) {
      router.middlewares = data.middlewares;
    }

    const service: TraefikService = {
      loadBalancer: {
        servers: data.servers.filter(server => server.url.trim()),
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
      <div className="modal-card max-w-4xl top-10 mb-10">
        <div className="flex justify-between items-center pb-4 border-b border-[var(--border)]">
          <div>
            <h3 className="text-xl font-bold text-[var(--text-primary)]">
              Create Router + Service
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Create both router and service in a single step
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
          {/* Names Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">
                Router Name
              </label>
              <input
                {...register('routerName', { required: 'Router name is required' })}
                type="text"
                className="form-input"
                placeholder="my-app-router"
              />
              {errors.routerName && (
                <p className="mt-1 text-sm text-red-600">{errors.routerName.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">
                Service Name (Auto-generated)
              </label>
              <input
                {...register('serviceName', { required: 'Service name is required' })}
                type="text"
                className="form-input opacity-70"
                placeholder="my-app-service"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Router Configuration */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-accent-teal border-b border-accent-teal/20 pb-2">
                Router Configuration
              </h4>

              <div>
                <label className="form-label">
                  Entry Points
                </label>
                {entryPointFields.map((field, index) => (
                  <div key={field.id} className="flex mt-1 space-x-2">
                    <input
                      {...register(`entryPoints.${index}.value` as const, {
                        required: 'Entry point is required'
                      })}
                      type="text"
                      className="flex-1 form-input"
                      placeholder="websecure, web"
                    />
                    <button
                      type="button"
                      onClick={() => removeEntryPoint(index)}
                      className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-colors"
                      disabled={entryPointFields.length === 1}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => appendEntryPoint({ value: '' })}
                  className="mt-2 px-3 py-1 border border-[var(--border)] rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Add Entry Point
                </button>
              </div>

              <div>
                <label className="form-label">
                  Rule
                </label>
                <input
                  {...register('rule', { required: 'Rule is required' })}
                  type="text"
                  className="form-input"
                  placeholder="Host(`app.example.com`)"
                />
                {errors.rule && (
                  <p className="mt-1 text-sm text-red-600">{errors.rule.message}</p>
                )}
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    {...register('tlsEnabled')}
                    type="checkbox"
                    className="form-checkbox"
                  />
                  <span className="ml-2 text-sm text-[var(--text-secondary)]">Enable TLS</span>
                </label>
              </div>

              {tlsEnabled && (
                <div>
                  <label className="form-label">
                    Certificate Resolver (Optional)
                  </label>
                  <input
                    {...register('certResolver')}
                    type="text"
                    className="form-input"
                    placeholder="cloudflare"
                  />
                </div>
              )}

              <div>
                <label className="form-label mb-2">
                  Middlewares
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-[var(--border)] rounded-lg p-3 bg-[var(--bg-primary)]">
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
                    <p className="text-sm text-[var(--text-muted)] italic">
                      No middlewares available
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Service Configuration */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-accent-cyan border-b border-accent-cyan/20 pb-2">
                Service Configuration
              </h4>

              <div>
                <label className="form-label">
                  Servers
                </label>
                {serverFields.map((field, index) => (
                  <div key={field.id} className="flex mt-1 space-x-2">
                    <input
                      {...register(`servers.${index}.url` as const, {
                        required: 'Server URL is required',
                        pattern: {
                          value: /^https?:\/\/.+/,
                          message: 'Please enter a valid HTTP/HTTPS URL'
                        }
                      })}
                      type="text"
                      className="flex-1 form-input"
                      placeholder="http://app.lab:8080"
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
                  <input
                    {...register('healthCheckEnabled')}
                    type="checkbox"
                    className="form-checkbox"
                  />
                  <span className="ml-2 text-sm text-[var(--text-secondary)]">Enable Health Check</span>
                </label>
              </div>

              {healthCheckEnabled && (
                <div className="space-y-3 pl-4 border-l-2 border-accent-teal/30">
                  <div>
                    <label className="form-label">
                      Health Check Path
                    </label>
                    <input
                      {...register('healthCheckPath', { required: 'Health check path is required' })}
                      type="text"
                      className="form-input"
                      placeholder="/health"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">
                        Interval
                      </label>
                      <input
                        {...register('healthCheckInterval')}
                        type="text"
                        className="form-input"
                        placeholder="30s"
                      />
                    </div>

                    <div>
                      <label className="form-label">
                        Timeout
                      </label>
                      <input
                        {...register('healthCheckTimeout')}
                        type="text"
                        className="form-input"
                        placeholder="10s"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="form-label">
                  Servers Transport (Optional)
                </label>
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
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
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