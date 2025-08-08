import { useState, useEffect } from 'react';
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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center pb-3">
          <h3 className="text-lg font-medium">
            {service ? `Edit Service: ${service.name}` : 'Create New Service'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Service Name
            </label>
            <input
              {...register('name', { required: 'Service name is required' })}
              type="text"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              disabled={!!service}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
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
                  className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="http://example.com:8080"
                />
                <button
                  type="button"
                  onClick={() => removeServer(index)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                  disabled={serverFields.length === 1}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => appendServer({ url: '' })}
              className="mt-2 px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              Add Server
            </button>
          </div>

          <div>
            <label className="flex items-center">
              <input
                {...register('healthCheckEnabled')}
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Enable Health Check</span>
            </label>
          </div>

          {healthCheckEnabled && (
            <div className="space-y-3 pl-4 border-l-2 border-blue-200">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Health Check Path
                </label>
                <input
                  {...register('healthCheckPath', { required: 'Health check path is required' })}
                  type="text"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="/health"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Interval
                  </label>
                  <input
                    {...register('healthCheckInterval')}
                    type="text"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="30s"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Timeout
                  </label>
                  <input
                    {...register('healthCheckTimeout')}
                    type="text"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="10s"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Servers Transport (Optional)
            </label>
            <input
              {...register('serversTransport')}
              type="text"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., insecure-transport"
            />
            <p className="mt-1 text-xs text-gray-500">
              Reference to a servers transport configuration for custom transport settings
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
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