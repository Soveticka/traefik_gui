import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { TraefikService } from '../types/traefik';

interface ServiceFormProps {
  service?: { name: string; data: TraefikService } | null;
  onSave: (name: string, data: TraefikService) => void;
  onClose: () => void;
}

interface FormData {
  name: string;
  servers: { url: string }[];
  healthCheckEnabled: boolean;
  healthCheckPath: string;
  healthCheckInterval: string;
  healthCheckTimeout: string;
  serversTransport: string;
}

const ServiceForm = ({ service, onSave, onClose }: ServiceFormProps) => {
  const { register, control, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      name: '',
      servers: [{ url: '' }],
      healthCheckEnabled: false,
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

  const healthCheckEnabled = watch('healthCheckEnabled');

  useEffect(() => {
    if (service) {
      reset({
        name: service.name,
        servers: service.data.loadBalancer.servers,
        healthCheckEnabled: !!service.data.loadBalancer.healthCheck,
        healthCheckPath: service.data.loadBalancer.healthCheck?.path || '/health',
        healthCheckInterval: service.data.loadBalancer.healthCheck?.interval || '30s',
        healthCheckTimeout: service.data.loadBalancer.healthCheck?.timeout || '10s',
        serversTransport: service.data.loadBalancer.serversTransport || '',
      });
    }
  }, [service, reset]);

  const onSubmit = (data: FormData) => {
    const serviceData: TraefikService = {
      loadBalancer: {
        servers: data.servers.filter(server => server.url.trim()),
      },
    };

    if (data.healthCheckEnabled) {
      serviceData.loadBalancer.healthCheck = {
        path: data.healthCheckPath,
        interval: data.healthCheckInterval,
        timeout: data.healthCheckTimeout,
      };
    }

    if (data.serversTransport.trim()) {
      serviceData.loadBalancer.serversTransport = data.serversTransport;
    }

    onSave(data.name, serviceData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="flex justify-between items-center pb-3">
          <h3 className="text-lg font-medium text-[var(--text-primary)]">
            {service ? `Edit Service: ${service.name}` : 'Create New Service'}
          </h3>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="form-label">
              Service Name
            </label>
            <input
              {...register('name', { required: 'Service name is required' })}
              type="text"
              className="form-input"
              disabled={!!service}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

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
                  placeholder="http://example.com:8080"
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
              placeholder="e.g., insecure-transport"
            />
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Reference to a servers transport configuration for custom transport settings
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
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
              {service ? 'Update' : 'Create'} Service
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceForm;