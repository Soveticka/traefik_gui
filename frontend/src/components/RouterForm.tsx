import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { TraefikRouter } from '../types/traefik';
import { middlewaresApi } from '../services/api';

interface RouterFormProps {
  router?: { name: string; data: TraefikRouter } | null;
  onSave: (name: string, data: TraefikRouter) => void;
  onClose: () => void;
}

interface FormData {
  name: string;
  entryPoints: { value: string }[];
  rule: string;
  service: string;
  tlsEnabled: boolean;
  certResolver: string;
  middlewares: string[];
}

const RouterForm = ({ router, onSave, onClose }: RouterFormProps) => {
  const [availableMiddlewares, setAvailableMiddlewares] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const { register, control, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      name: '',
      entryPoints: [{ value: 'websecure' }],
      rule: '',
      service: '',
      tlsEnabled: false,
      certResolver: '',
      middlewares: [],
    },
  });

  const { fields: entryPointFields, append: appendEntryPoint, remove: removeEntryPoint } = useFieldArray({
    control,
    name: 'entryPoints',
  });

  const tlsEnabled = watch('tlsEnabled');

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

  useEffect(() => {
    if (router) {
      const tlsConfig = typeof router.data.tls === 'object' ? router.data.tls : null;
      reset({
        name: router.name,
        entryPoints: router.data.entryPoints.map(ep => ({ value: ep })),
        rule: router.data.rule,
        service: router.data.service,
        tlsEnabled: !!router.data.tls,
        certResolver: tlsConfig?.certResolver || '',
        middlewares: router.data.middlewares || [],
      });
    }
  }, [router, reset]);

  const onSubmit = (data: FormData) => {
    const routerData: TraefikRouter = {
      entryPoints: data.entryPoints.map(ep => ep.value).filter(Boolean),
      rule: data.rule,
      service: data.service,
    };

    if (data.tlsEnabled) {
      if (data.certResolver) {
        routerData.tls = { certResolver: data.certResolver };
      } else {
        routerData.tls = true;
      }
    }

    if (data.middlewares.length > 0) {
      routerData.middlewares = data.middlewares;
    }

    onSave(data.name, routerData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="flex justify-between items-center pb-3">
          <h3 className="text-lg font-medium text-[var(--text-primary)]">
            {router ? `Edit Router: ${router.name}` : 'Create New Router'}
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
              Router Name
            </label>
            <input
              {...register('name', { required: 'Router name is required' })}
              type="text"
              className="form-input"
              disabled={!!router}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

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
                  placeholder="e.g., websecure, web"
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
              placeholder="e.g., Host(`example.com`)"
            />
            {errors.rule && (
              <p className="mt-1 text-sm text-red-600">{errors.rule.message}</p>
            )}
          </div>

          <div>
            <label className="form-label">
              Service
            </label>
            <input
              {...register('service', { required: 'Service is required' })}
              type="text"
              className="form-input"
              placeholder="service-name"
            />
            {errors.service && (
              <p className="mt-1 text-sm text-red-600">{errors.service.message}</p>
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
                placeholder="e.g., cloudflare"
              />
            </div>
          )}

          <div>
            <label className="form-label mb-2">
              Middlewares (Optional)
            </label>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-accent-teal border-t-transparent"></div>
                <span className="ml-2 text-sm text-[var(--text-secondary)]">Loading middlewares...</span>
              </div>
            ) : (
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
            )}
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
              {router ? 'Update' : 'Create'} Router
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RouterForm;