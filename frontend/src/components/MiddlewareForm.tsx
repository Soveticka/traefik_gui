import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { TraefikMiddleware } from '../types/traefik';

interface MiddlewareFormProps {
  middleware?: { name: string; data: TraefikMiddleware } | null;
  onSave: (name: string, data: TraefikMiddleware) => void;
  onClose: () => void;
}

interface FormData {
  name: string;
  type: 'errors' | 'rateLimit' | 'headers' | 'redirectRegex';
  errorQuery: string;
  errorService: string;
  errorStatus: { value: string }[];
  rateLimitAverage: number;
  rateLimitBurst: number;
  requestHeaders: { key: string; value: string }[];
  responseHeaders: { key: string; value: string }[];
  redirectPermanent: boolean;
  redirectRegex: string;
  redirectReplacement: string;
}

const SECURITY_HEADERS: Array<{ key: string; value: string }> = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const MiddlewareForm = ({ middleware, onSave, onClose }: MiddlewareFormProps) => {
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      type: 'headers',
      errorQuery: '/{status}',
      errorService: '',
      errorStatus: [{ value: '400-599' }],
      rateLimitAverage: 100,
      rateLimitBurst: 200,
      requestHeaders: [],
      responseHeaders: SECURITY_HEADERS,
      redirectPermanent: true,
      redirectRegex: '^http://(.*)',
      redirectReplacement: 'https://$1',
    },
  });

  const {
    fields: errorStatusFields,
    append: appendErrorStatus,
    remove: removeErrorStatus,
    replace: replaceErrorStatus,
  } = useFieldArray({
    control,
    name: 'errorStatus',
  });

  const {
    fields: requestHeaderFields,
    append: appendRequestHeader,
    remove: removeRequestHeader,
    replace: replaceRequestHeaders,
  } = useFieldArray({
    control,
    name: 'requestHeaders',
  });

  const {
    fields: responseHeaderFields,
    append: appendResponseHeader,
    remove: removeResponseHeader,
    replace: replaceResponseHeaders,
  } = useFieldArray({
    control,
    name: 'responseHeaders',
  });

  const middlewareType = watch('type');

  useEffect(() => {
    if (middleware) {
      const data = middleware.data;
      let type: FormData['type'] = 'headers';
      let formData: Partial<FormData> = {
        name: middleware.name,
      };

      if (data.errors) {
        type = 'errors';
        formData = {
          ...formData,
          type,
          errorQuery: data.errors.query,
          errorService: data.errors.service,
          errorStatus: data.errors.status.map((s) => ({ value: s })),
        };
      } else if (data.rateLimit) {
        type = 'rateLimit';
        formData = {
          ...formData,
          type,
          rateLimitAverage: data.rateLimit.average,
          rateLimitBurst: data.rateLimit.burst,
        };
      } else if (data.headers) {
        type = 'headers';
        formData = {
          ...formData,
          type,
          requestHeaders: Object.entries(data.headers.customRequestHeaders || {}).map(([key, value]) => ({ key, value })),
          responseHeaders: Object.entries(data.headers.customResponseHeaders || {}).map(([key, value]) => ({ key, value })),
        };
      } else if (data.redirectRegex) {
        type = 'redirectRegex';
        formData = {
          ...formData,
          type,
          redirectPermanent: data.redirectRegex.permanent,
          redirectRegex: data.redirectRegex.regex,
          redirectReplacement: data.redirectRegex.replacement,
        };
      }

      reset(formData as FormData);
      return;
    }

    reset({
      name: '',
      type: 'headers',
      errorQuery: '/{status}',
      errorService: '',
      errorStatus: [{ value: '400-599' }],
      rateLimitAverage: 100,
      rateLimitBurst: 200,
      requestHeaders: [],
      responseHeaders: SECURITY_HEADERS,
      redirectPermanent: true,
      redirectRegex: '^http://(.*)',
      redirectReplacement: 'https://$1',
    });
  }, [middleware, reset]);

  const setNameIfNotEdited = (nextName: string) => {
    if (!dirtyFields.name) {
      setValue('name', nextName, { shouldDirty: false });
    }
  };

  const applySecurityHeadersPreset = () => {
    setValue('type', 'headers', { shouldDirty: true });
    replaceRequestHeaders([]);
    replaceResponseHeaders(SECURITY_HEADERS);
    setNameIfNotEdited('security-headers');
  };

  const applyRateLimitPreset = () => {
    setValue('type', 'rateLimit', { shouldDirty: true });
    setValue('rateLimitAverage', 100, { shouldDirty: true });
    setValue('rateLimitBurst', 200, { shouldDirty: true });
    setNameIfNotEdited('rate-limit');
  };

  const applyErrorPagesPreset = () => {
    setValue('type', 'errors', { shouldDirty: true });
    setValue('errorQuery', '/{status}', { shouldDirty: true });
    replaceErrorStatus([{ value: '400-599' }]);
    setNameIfNotEdited('error-pages');
  };

  const applyHttpsRedirectPreset = () => {
    setValue('type', 'redirectRegex', { shouldDirty: true });
    setValue('redirectPermanent', true, { shouldDirty: true });
    setValue('redirectRegex', '^http://(.*)', { shouldDirty: true });
    setValue('redirectReplacement', 'https://$1', { shouldDirty: true });
    setNameIfNotEdited('https-redirect');
  };

  const onSubmit = (data: FormData) => {
    const middlewareData: TraefikMiddleware = {};

    switch (data.type) {
      case 'errors':
        middlewareData.errors = {
          query: data.errorQuery,
          service: data.errorService,
          status: data.errorStatus.map((s) => s.value).filter(Boolean),
        };
        break;
      case 'rateLimit':
        middlewareData.rateLimit = {
          average: data.rateLimitAverage,
          burst: data.rateLimitBurst,
        };
        break;
      case 'headers':
        middlewareData.headers = {};
        if (data.requestHeaders.length > 0) {
          middlewareData.headers.customRequestHeaders = {};
          data.requestHeaders.forEach(({ key, value }) => {
            if (key && value) {
              middlewareData.headers!.customRequestHeaders![key] = value;
            }
          });
        }
        if (data.responseHeaders.length > 0) {
          middlewareData.headers.customResponseHeaders = {};
          data.responseHeaders.forEach(({ key, value }) => {
            if (key && value) {
              middlewareData.headers!.customResponseHeaders![key] = value;
            }
          });
        }
        break;
      case 'redirectRegex':
        middlewareData.redirectRegex = {
          permanent: data.redirectPermanent,
          regex: data.redirectRegex,
          replacement: data.redirectReplacement,
        };
        break;
    }

    onSave(data.name, middlewareData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card max-w-3xl">
        <div className="flex justify-between items-center pb-3">
          <h3 className="text-lg font-medium text-[var(--text-primary)]">
            {middleware ? `Edit Middleware: ${middleware.name}` : 'Create New Middleware'}
          </h3>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!middleware && (
          <div className="mb-5 p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)]">
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">Quick Presets</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={applySecurityHeadersPreset}
                className="px-3 py-1.5 text-sm rounded-md border border-accent-cyan/40 text-accent-cyan hover:bg-accent-cyan/10"
              >
                Security Headers
              </button>
              <button
                type="button"
                onClick={applyRateLimitPreset}
                className="px-3 py-1.5 text-sm rounded-md border border-accent-yellow/40 text-accent-yellow hover:bg-accent-yellow/10"
              >
                Rate Limit
              </button>
              <button
                type="button"
                onClick={applyErrorPagesPreset}
                className="px-3 py-1.5 text-sm rounded-md border border-accent-red/40 text-accent-red hover:bg-accent-red/10"
              >
                Error Pages
              </button>
              <button
                type="button"
                onClick={applyHttpsRedirectPreset}
                className="px-3 py-1.5 text-sm rounded-md border border-accent-purple/40 text-accent-purple hover:bg-accent-purple/10"
              >
                HTTP to HTTPS Redirect
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="form-label">Middleware Name</label>
            <input
              {...register('name', { required: 'Middleware name is required' })}
              type="text"
              className="form-input"
              disabled={!!middleware}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label className="form-label">Middleware Type</label>
            <select
              {...register('type', { required: 'Middleware type is required' })}
              className="form-input"
              disabled={!!middleware}
            >
              <option value="headers">Headers</option>
              <option value="rateLimit">Rate Limit</option>
              <option value="errors">Error Pages</option>
              <option value="redirectRegex">Redirect Regex</option>
            </select>
          </div>

          {middlewareType === 'errors' && (
            <div className="space-y-4 p-4 bg-accent-red/5 border border-accent-red/10 rounded-lg">
              <h4 className="text-sm font-medium text-[var(--text-primary)]">Error Pages Configuration</h4>

              <div>
                <label className="form-label">Query Template</label>
                <input
                  {...register('errorQuery', { required: 'Query template is required' })}
                  type="text"
                  className="form-input"
                  placeholder="/{status}"
                />
              </div>

              <div>
                <label className="form-label">Error Service</label>
                <input
                  {...register('errorService', { required: 'Error service is required' })}
                  type="text"
                  className="form-input"
                  placeholder="error-pages-service"
                />
              </div>

              <div>
                <label className="form-label">Status Codes</label>
                {errorStatusFields.map((field, index) => (
                  <div key={field.id} className="flex mt-1 space-x-2">
                    <input
                      {...register(`errorStatus.${index}.value` as const, {
                        required: 'Status code is required',
                      })}
                      type="text"
                      className="flex-1 form-input"
                      placeholder="400-599"
                    />
                    <button
                      type="button"
                      onClick={() => removeErrorStatus(index)}
                      className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-colors"
                      disabled={errorStatusFields.length === 1}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => appendErrorStatus({ value: '' })}
                  className="mt-2 px-3 py-1 border border-[var(--border)] rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Add Status Code
                </button>
              </div>
            </div>
          )}

          {middlewareType === 'rateLimit' && (
            <div className="space-y-4 p-4 bg-accent-yellow/5 border border-accent-yellow/10 rounded-lg">
              <h4 className="text-sm font-medium text-[var(--text-primary)]">Rate Limit Configuration</h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Average (requests/second)</label>
                  <input
                    {...register('rateLimitAverage', {
                      required: 'Average rate is required',
                      valueAsNumber: true,
                      min: 1,
                    })}
                    type="number"
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Burst</label>
                  <input
                    {...register('rateLimitBurst', {
                      required: 'Burst limit is required',
                      valueAsNumber: true,
                      min: 1,
                    })}
                    type="number"
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          )}

          {middlewareType === 'headers' && (
            <div className="space-y-6 p-4 bg-accent-cyan/5 border border-accent-cyan/10 rounded-lg">
              <h4 className="text-sm font-medium text-[var(--text-primary)]">Headers Configuration</h4>

              <div>
                <label className="form-label mb-2">Custom Request Headers</label>
                {requestHeaderFields.map((field, index) => (
                  <div key={field.id} className="flex mt-1 space-x-2">
                    <input
                      {...register(`requestHeaders.${index}.key` as const)}
                      type="text"
                      placeholder="Header name"
                      className="flex-1 form-input"
                    />
                    <input
                      {...register(`requestHeaders.${index}.value` as const)}
                      type="text"
                      placeholder="Header value"
                      className="flex-1 form-input"
                    />
                    <button
                      type="button"
                      onClick={() => removeRequestHeader(index)}
                      className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => appendRequestHeader({ key: '', value: '' })}
                  className="mt-2 px-3 py-1 border border-[var(--border)] rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Add Request Header
                </button>
              </div>

              <div>
                <label className="form-label mb-2">Custom Response Headers</label>
                {responseHeaderFields.map((field, index) => (
                  <div key={field.id} className="flex mt-1 space-x-2">
                    <input
                      {...register(`responseHeaders.${index}.key` as const)}
                      type="text"
                      placeholder="Header name"
                      className="flex-1 form-input"
                    />
                    <input
                      {...register(`responseHeaders.${index}.value` as const)}
                      type="text"
                      placeholder="Header value"
                      className="flex-1 form-input"
                    />
                    <button
                      type="button"
                      onClick={() => removeResponseHeader(index)}
                      className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => appendResponseHeader({ key: '', value: '' })}
                  className="mt-2 px-3 py-1 border border-[var(--border)] rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Add Response Header
                </button>
              </div>
            </div>
          )}

          {middlewareType === 'redirectRegex' && (
            <div className="space-y-4 p-4 bg-accent-purple/5 border border-accent-purple/10 rounded-lg">
              <h4 className="text-sm font-medium text-[var(--text-primary)]">Redirect Regex Configuration</h4>

              <div>
                <label className="flex items-center">
                  <input {...register('redirectPermanent')} type="checkbox" className="form-checkbox" />
                  <span className="ml-2 text-sm text-[var(--text-secondary)]">Permanent Redirect (301)</span>
                </label>
              </div>

              <div>
                <label className="form-label">Regex Pattern</label>
                <input
                  {...register('redirectRegex', { required: 'Regex pattern is required' })}
                  type="text"
                  className="form-input"
                  placeholder="^http://(.*)"
                />
              </div>

              <div>
                <label className="form-label">Replacement URL</label>
                <input
                  {...register('redirectReplacement', { required: 'Replacement URL is required' })}
                  type="text"
                  className="form-input"
                  placeholder="https://$1"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {middleware ? 'Update' : 'Create'} Middleware
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MiddlewareForm;
