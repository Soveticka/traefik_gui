import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Shield } from 'lucide-react';
import { middlewaresApi } from '../services/api';
import { TraefikMiddleware } from '../types/traefik';
import MiddlewareForm from '../components/MiddlewareForm';
import toast from 'react-hot-toast';

const Middlewares = () => {
  const [middlewares, setMiddlewares] = useState<Record<string, TraefikMiddleware>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMiddleware, setEditingMiddleware] = useState<{ name: string; data: TraefikMiddleware } | null>(null);

  useEffect(() => {
    fetchMiddlewares();
  }, []);

  const fetchMiddlewares = async () => {
    try {
      const response = await middlewaresApi.getAll();
      setMiddlewares(response.data);
    } catch (error) {
      toast.error('Failed to load middlewares');
      console.error('Load middlewares error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (name: string, data: TraefikMiddleware) => {
    try {
      await middlewaresApi.save(name, data);
      toast.success(`Middleware "${name}" saved successfully!`);
      setShowForm(false);
      setEditingMiddleware(null);
      fetchMiddlewares();
    } catch (error) {
      toast.error('Failed to save middleware');
      console.error('Save middleware error:', error);
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Are you sure you want to delete middleware "${name}"?`)) {
      return;
    }

    try {
      await middlewaresApi.delete(name);
      toast.success(`Middleware "${name}" deleted successfully!`);
      fetchMiddlewares();
    } catch (error) {
      toast.error('Failed to delete middleware');
      console.error('Delete middleware error:', error);
    }
  };

  const handleEdit = (name: string, data: TraefikMiddleware) => {
    setEditingMiddleware({ name, data });
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingMiddleware(null);
  };

  const getMiddlewareType = (middleware: TraefikMiddleware): string => {
    if (middleware.errors) return 'Error Pages';
    if (middleware.rateLimit) return 'Rate Limit';
    if (middleware.headers) return 'Headers';
    if (middleware.redirectRegex) return 'Redirect Regex';
    return 'Unknown';
  };

  const getMiddlewareDescription = (middleware: TraefikMiddleware): string => {
    if (middleware.errors) {
      return `Error handling for status codes: ${middleware.errors.status.join(', ')}`;
    }
    if (middleware.rateLimit) {
      return `Rate limit: ${middleware.rateLimit.average}/s (burst: ${middleware.rateLimit.burst})`;
    }
    if (middleware.headers) {
      const reqHeaders = middleware.headers.customRequestHeaders ? Object.keys(middleware.headers.customRequestHeaders).length : 0;
      const resHeaders = middleware.headers.customResponseHeaders ? Object.keys(middleware.headers.customResponseHeaders).length : 0;
      return `Custom headers: ${reqHeaders} request, ${resHeaders} response`;
    }
    if (middleware.redirectRegex) {
      return `Redirect ${middleware.redirectRegex.permanent ? '(permanent)' : '(temporary)'}: ${middleware.redirectRegex.regex} → ${middleware.redirectRegex.replacement}`;
    }
    return 'Custom middleware configuration';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-bold text-gray-900">Middlewares</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your Traefik middlewares that modify requests and responses between routers and services.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Middleware
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {Object.entries(middlewares).map(([name, middleware]) => (
            <li key={name}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-600 truncate">
                      {name}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {getMiddlewareDescription(middleware)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getMiddlewareType(middleware)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(name, middleware)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(name)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {Object.keys(middlewares).length === 0 && (
          <div className="text-center py-12">
            <Shield className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No middlewares</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new middleware.
            </p>
          </div>
        )}
      </div>

      {showForm && (
        <MiddlewareForm
          middleware={editingMiddleware}
          onSave={handleSave}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
};

export default Middlewares;