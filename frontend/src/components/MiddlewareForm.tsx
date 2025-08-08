import { useState, useEffect } from 'react';
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
  // Error Pages
  errorQuery: string;
  errorService: string;
  errorStatus: { value: string }[];
  // Rate Limit
  rateLimitAverage: number;
  rateLimitBurst: number;
  // Headers
  requestHeaders: { key: string; value: string }[];
  responseHeaders: { key: string; value: string }[];
  // Redirect Regex
  redirectPermanent: boolean;
  redirectRegex: string;
  redirectReplacement: string;
}

const MiddlewareForm = ({ middleware, onSave, onClose }: MiddlewareFormProps) => {
  const { register, control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      name: '',
      type: 'headers',
      errorQuery: '/{status}',
      errorService: '',
      errorStatus: [{ value: '400-599' }],
      rateLimitAverage: 50,
      rateLimitBurst: 100,
      requestHeaders: [],
      responseHeaders: [],
      redirectPermanent: true,
      redirectRegex: '',
      redirectReplacement: '',
    },
  });

  const { fields: errorStatusFields, append: appendErrorStatus, remove: removeErrorStatus } = useFieldArray({
    control,
    name: 'errorStatus',
  });

  const { fields: requestHeaderFields, append: appendRequestHeader, remove: removeRequestHeader } = useFieldArray({
    control,
    name: 'requestHeaders',
  });

  const { fields: responseHeaderFields, append: appendResponseHeader, remove: removeResponseHeader } = useFieldArray({
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
          errorStatus: data.errors.status.map(s => ({ value: s })),
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
    }
  }, [middleware, reset]);

  const onSubmit = (data: FormData) => {
    const middlewareData: TraefikMiddleware = {};

    switch (data.type) {
      case 'errors':
        middlewareData.errors = {
          query: data.errorQuery,
          service: data.errorService,
          status: data.errorStatus.map(s => s.value).filter(Boolean),
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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-3xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center pb-3">
          <h3 className="text-lg font-medium">
            {middleware ? `Edit Middleware: ${middleware.name}` : 'Create New Middleware'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Middleware Name
            </label>
            <input
              {...register('name', { required: 'Middleware name is required' })}
              type="text"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              disabled={!!middleware}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Middleware Type
            </label>
            <select
              {...register('type', { required: 'Middleware type is required' })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              disabled={!!middleware}
            >
              <option value="headers">Headers</option>
              <option value="rateLimit">Rate Limit</option>
              <option value="errors">Error Pages</option>
              <option value="redirectRegex">Redirect Regex</option>
            </select>
          </div>

          {middlewareType === 'errors' && (
            <div className="space-y-4 p-4 bg-red-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900">Error Pages Configuration</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Query Template
                </label>
                <input
                  {...register('errorQuery', { required: 'Query template is required' })}
                  type="text"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="/{status}"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Error Service
                </label>
                <input
                  {...register('errorService', { required: 'Error service is required' })}
                  type="text"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="error-pages-service"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status Codes
                </label>
                {errorStatusFields.map((field, index) => (
                  <div key={field.id} className="flex mt-1 space-x-2">
                    <input
                      {...register(`errorStatus.${index}.value` as const, { 
                        required: 'Status code is required' 
                      })}
                      type="text"
                      className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="400-599"
                    />
                    <button
                      type="button"
                      onClick={() => removeErrorStatus(index)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                      disabled={errorStatusFields.length === 1}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => appendErrorStatus({ value: '' })}
                  className="mt-2 px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  Add Status Code
                </button>
              </div>
            </div>
          )}

          {middlewareType === 'rateLimit' && (
            <div className="space-y-4 p-4 bg-yellow-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900">Rate Limit Configuration</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Average (requests/second)
                  </label>
                  <input
                    {...register('rateLimitAverage', { 
                      required: 'Average rate is required',
                      valueAsNumber: true,
                      min: 1
                    })}
                    type="number"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Burst
                  </label>
                  <input
                    {...register('rateLimitBurst', { 
                      required: 'Burst limit is required',
                      valueAsNumber: true,
                      min: 1
                    })}
                    type="number"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {middlewareType === 'headers' && (
            <div className="space-y-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900">Headers Configuration</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Request Headers
                </label>
                {requestHeaderFields.map((field, index) => (
                  <div key={field.id} className="flex mt-1 space-x-2">
                    <input
                      {...register(`requestHeaders.${index}.key` as const)}
                      type="text"
                      placeholder="Header name"
                      className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      {...register(`requestHeaders.${index}.value` as const)}
                      type="text"
                      placeholder="Header value"
                      className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeRequestHeader(index)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => appendRequestHeader({ key: '', value: '' })}
                  className="mt-2 px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  Add Request Header
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Response Headers
                </label>
                {responseHeaderFields.map((field, index) => (
                  <div key={field.id} className="flex mt-1 space-x-2">
                    <input
                      {...register(`responseHeaders.${index}.key` as const)}
                      type="text"
                      placeholder="Header name"
                      className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      {...register(`responseHeaders.${index}.value` as const)}
                      type="text"
                      placeholder="Header value"
                      className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeResponseHeader(index)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => appendResponseHeader({ key: '', value: '' })}
                  className="mt-2 px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  Add Response Header
                </button>
              </div>
            </div>
          )}

          {middlewareType === 'redirectRegex' && (
            <div className="space-y-4 p-4 bg-purple-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900">Redirect Regex Configuration</h4>
              
              <div>
                <label className="flex items-center">
                  <input
                    {...register('redirectPermanent')}
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Permanent Redirect (301)</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Regex Pattern
                </label>
                <input
                  {...register('redirectRegex', { required: 'Regex pattern is required' })}
                  type="text"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder=".*"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Replacement URL
                </label>
                <input
                  {...register('redirectReplacement', { required: 'Replacement URL is required' })}
                  type="text"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com"
                />
              </div>
            </div>
          )}

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
              {middleware ? 'Update' : 'Create'} Middleware
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MiddlewareForm;