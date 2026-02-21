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

  const getTypeTagColor = (middleware: TraefikMiddleware): string => {
    if (middleware.errors) return 'tag-blue';
    if (middleware.rateLimit) return 'tag-yellow';
    if (middleware.headers) return 'tag-purple';
    if (middleware.redirectRegex) return 'tag-teal';
    return 'tag-blue';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-accent-teal border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[var(--text-primary)] mb-1">Middlewares</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Manage your Traefik middlewares that modify requests and responses between routers and services.
          </p>
        </div>
        <div className="flex-shrink-0 ml-8">
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" />
            Add Middleware
          </button>
        </div>
      </div>

      {/* Middlewares list */}
      <div className="list-container">
        {Object.entries(middlewares).map(([name, middleware]) => (
          <div key={name} className="list-item group">
            <div className="status-dot" />
            <div className="flex-1 min-w-0">
              <p className="font-mono text-sm font-semibold text-accent-teal truncate">
                {name}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {getMiddlewareDescription(middleware)}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className={`tag ${getTypeTagColor(middleware)}`}>
                  {getMiddlewareType(middleware)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <button
                onClick={() => handleEdit(name, middleware)}
                className="icon-btn"
              >
                <Edit className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleDelete(name)}
                className="icon-btn icon-btn-danger"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
        {Object.keys(middlewares).length === 0 && (
          <div className="text-center py-12">
            <Shield className="mx-auto h-10 w-10 text-[var(--text-muted)]" />
            <h3 className="mt-2 text-sm font-medium text-[var(--text-primary)]">No middlewares</h3>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
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