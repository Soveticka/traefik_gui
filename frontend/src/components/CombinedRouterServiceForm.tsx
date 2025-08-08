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
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="glass-card rounded-xl p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-center mt-2 text-gray-600 dark:text-gray-400">Loading middlewares...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl glass-card rounded-2xl shadow-2xl mb-10">
        <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Create Router + Service
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Create both router and service in a single step
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
          {/* Names Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Router Name
              </label>
              <input
                {...register('routerName', { required: 'Router name is required' })}
                type="text"
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:text-white"
                placeholder="my-app-router"
              />
              {errors.routerName && (
                <p className="mt-1 text-sm text-red-600">{errors.routerName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Service Name (Auto-generated)
              </label>
              <input
                {...register('serviceName', { required: 'Service name is required' })}
                type="text"
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:text-white bg-gray-50 dark:bg-gray-700"
                placeholder="my-app-service"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Router Configuration */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-purple-600 dark:text-purple-400 border-b border-purple-200 dark:border-purple-800 pb-2">
                Router Configuration
              </h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Entry Points
                </label>
                {entryPointFields.map((field, index) => (
                  <div key={field.id} className="flex mt-1 space-x-2">
                    <input
                      {...register(`entryPoints.${index}.value` as const, { 
                        required: 'Entry point is required' 
                      })}
                      type="text"
                      className="flex-1 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:text-white"
                      placeholder="websecure, web"
                    />
                    <button
                      type="button"
                      onClick={() => removeEntryPoint(index)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      disabled={entryPointFields.length === 1}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => appendEntryPoint({ value: '' })}
                  className="mt-2 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Add Entry Point
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Rule
                </label>
                <input
                  {...register('rule', { required: 'Rule is required' })}
                  type="text"
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:text-white"
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
                    className="rounded border-gray-300 text-purple-600 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable TLS</span>
                </label>
              </div>

              {tlsEnabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Certificate Resolver (Optional)
                  </label>
                  <input
                    {...register('certResolver')}
                    type="text"
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:text-white"
                    placeholder="cloudflare"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Middlewares
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3 dark:bg-gray-800">
                  {availableMiddlewares.map((middleware) => (
                    <label key={middleware} className="flex items-center">
                      <input
                        {...register('middlewares')}
                        type="checkbox"
                        value={middleware}
                        className="rounded border-gray-300 text-purple-600 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{middleware}</span>
                    </label>
                  ))}
                  {availableMiddlewares.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                      No middlewares available
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Service Configuration */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-pink-600 dark:text-pink-400 border-b border-pink-200 dark:border-pink-800 pb-2">
                Service Configuration
              </h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                      className="flex-1 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:text-white"
                      placeholder="http://app.lab:8080"
                    />
                    <button
                      type="button"
                      onClick={() => removeServer(index)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      disabled={serverFields.length === 1}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => appendServer({ url: '' })}
                  className="mt-2 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Add Server
                </button>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    {...register('healthCheckEnabled')}
                    type="checkbox"
                    className="rounded border-gray-300 text-purple-600 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable Health Check</span>
                </label>
              </div>

              {healthCheckEnabled && (
                <div className="space-y-3 pl-4 border-l-2 border-purple-200 dark:border-purple-800">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Health Check Path
                    </label>
                    <input
                      {...register('healthCheckPath', { required: 'Health check path is required' })}
                      type="text"
                      className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:text-white"
                      placeholder="/health"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Interval
                      </label>
                      <input
                        {...register('healthCheckInterval')}
                        type="text"
                        className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:text-white"
                        placeholder="30s"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Timeout
                      </label>
                      <input
                        {...register('healthCheckTimeout')}
                        type="text"
                        className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:text-white"
                        placeholder="10s"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Servers Transport (Optional)
                </label>
                <input
                  {...register('serversTransport')}
                  type="text"
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:text-white"
                  placeholder="insecure-transport"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
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