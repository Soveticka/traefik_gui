import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ExternalLink, Layers, Search } from 'lucide-react';
import { routersApi, combinedApi } from '../services/api';
import { TraefikRouter, TraefikService } from '../types/traefik';
import RouterForm from '../components/RouterForm';
import CombinedRouterServiceForm from '../components/CombinedRouterServiceForm';
import toast from 'react-hot-toast';

const Routers = () => {
  const [routers, setRouters] = useState<Record<string, TraefikRouter>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCombinedForm, setShowCombinedForm] = useState(false);
  const [editingRouter, setEditingRouter] = useState<{ name: string; data: TraefikRouter } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleSaveCombined = async (data: {
    routerName: string;
    serviceName: string;
    router: TraefikRouter;
    service: TraefikService;
  }) => {
    try {
      await combinedApi.createRouterService(data);
      toast.success(`Router "${data.routerName}" and service "${data.serviceName}" created successfully!`);
      setShowCombinedForm(false);
      fetchRouters();
    } catch (error) {
      toast.error('Failed to create router and service');
      console.error('Create combined error:', error);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRouter(null);
  };

  const handleCloseCombinedForm = () => {
    setShowCombinedForm(false);
  };

  // Filter routers by search query
  const filteredRouters = Object.entries(routers).filter(([name, router]) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      name.toLowerCase().includes(q) ||
      router.rule.toLowerCase().includes(q) ||
      router.service.toLowerCase().includes(q)
    );
  });

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
          <h1 className="text-[22px] font-bold text-[var(--text-primary)] mb-1">Routers</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Manage your Traefik routers that define how incoming requests are routed to services.
          </p>
        </div>
        <div className="flex gap-2.5 flex-shrink-0 ml-8">
          <button
            type="button"
            onClick={() => setShowCombinedForm(true)}
            className="btn-primary"
          >
            <Layers className="h-4 w-4" />
            Router + Service
          </button>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="btn-secondary"
          >
            <Plus className="h-4 w-4" />
            Router Only
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="search-bar">
        <Search className="w-4 h-4 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="Search routers... (name, host, service)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Router list */}
      <div className="list-container">
        {filteredRouters.map(([name, router]) => (
          <div key={name} className="list-item group">
            <div className="status-dot" />
            <div className="flex-1 min-w-0">
              <p className="font-mono text-sm font-semibold text-accent-teal truncate">
                {name}
              </p>
              <p className="font-mono text-xs text-[var(--text-muted)] mt-0.5">
                {router.rule}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="tag tag-green">{router.service}</span>
                {router.entryPoints?.map((entryPoint) => (
                  <span key={entryPoint} className="tag tag-blue">
                    {entryPoint}
                  </span>
                ))}
                {router.middlewares?.map((middleware) => (
                  <span key={middleware} className="tag tag-yellow">
                    {middleware}
                  </span>
                ))}
                {router.tls && (
                  <span className="tag tag-purple">TLS</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <button
                onClick={() => handleEdit(name, router)}
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
        {filteredRouters.length === 0 && (
          <div className="text-center py-12">
            <ExternalLink className="mx-auto h-10 w-10 text-[var(--text-muted)]" />
            <h3 className="mt-2 text-sm font-medium text-[var(--text-primary)]">
              {searchQuery ? 'No matching routers' : 'No routers'}
            </h3>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {searchQuery ? 'Try a different search term.' : 'Get started by creating a new router.'}
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

      {showCombinedForm && (
        <CombinedRouterServiceForm
          onSave={handleSaveCombined}
          onClose={handleCloseCombinedForm}
        />
      )}
    </div>
  );
};

export default Routers;