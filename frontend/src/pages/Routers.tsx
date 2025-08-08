import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ExternalLink } from 'lucide-react';
import { routersApi } from '../services/api';
import { TraefikRouter } from '../types/traefik';
import RouterForm from '../components/RouterForm';
import toast from 'react-hot-toast';

const Routers = () => {
  const [routers, setRouters] = useState<Record<string, TraefikRouter>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRouter, setEditingRouter] = useState<{ name: string; data: TraefikRouter } | null>(null);

  useEffect(() => {
    fetchRouters();
  }, []);

  const fetchRouters = async () => {
    try {
      const response = await routersApi.getAll();
      setRouters(response.data);
    } catch (error) {
      toast.error('Failed to load routers');
      console.error('Load routers error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (name: string, data: TraefikRouter) => {
    try {
      await routersApi.save(name, data);
      toast.success(`Router "${name}" saved successfully!`);
      setShowForm(false);
      setEditingRouter(null);
      fetchRouters();
    } catch (error) {
      toast.error('Failed to save router');
      console.error('Save router error:', error);
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Are you sure you want to delete router "${name}"?`)) {
      return;
    }

    try {
      await routersApi.delete(name);
      toast.success(`Router "${name}" deleted successfully!`);
      fetchRouters();
    } catch (error) {
      toast.error('Failed to delete router');
      console.error('Delete router error:', error);
    }
  };

  const handleEdit = (name: string, data: TraefikRouter) => {
    setEditingRouter({ name, data });
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRouter(null);
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
      <div className="sm:flex sm:items-center mb-8">
        <div className="sm:flex-auto">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-2">
            Routers
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            Manage your Traefik routers that define how incoming requests are routed to services.
          </p>
        </div>
        <div className="mt-6 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="group relative inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-purple-500/50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Router
            <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {Object.entries(routers).map(([name, router]) => (
            <li key={name} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors duration-150">
              <div className="px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-purple-600 dark:text-purple-400 truncate">
                      {name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {router.rule}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {router.service}
                      </span>
                      {router.entryPoints?.map((entryPoint) => (
                        <span key={entryPoint} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {entryPoint}
                        </span>
                      ))}
                      {router.middlewares?.map((middleware) => (
                        <span key={middleware} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {middleware}
                        </span>
                      ))}
                      {router.tls && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          TLS
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(name, router)}
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
        {Object.keys(routers).length === 0 && (
          <div className="text-center py-12">
            <ExternalLink className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No routers</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new router.
            </p>
          </div>
        )}
      </div>

      {showForm && (
        <RouterForm
          router={editingRouter}
          onSave={handleSave}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
};

export default Routers;