import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Server } from 'lucide-react';
import { servicesApi } from '../services/api';
import { TraefikService } from '../types/traefik';
import ServiceForm from '../components/ServiceForm';
import toast from 'react-hot-toast';

const Services = () => {
  const [services, setServices] = useState<Record<string, TraefikService>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<{ name: string; data: TraefikService } | null>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await servicesApi.getAll();
      setServices(response.data);
    } catch (error) {
      toast.error('Failed to load services');
      console.error('Load services error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (name: string, data: TraefikService) => {
    try {
      await servicesApi.save(name, data);
      toast.success(`Service "${name}" saved successfully!`);
      setShowForm(false);
      setEditingService(null);
      fetchServices();
    } catch (error) {
      toast.error('Failed to save service');
      console.error('Save service error:', error);
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Are you sure you want to delete service "${name}"?`)) {
      return;
    }

    try {
      await servicesApi.delete(name);
      toast.success(`Service "${name}" deleted successfully!`);
      fetchServices();
    } catch (error) {
      toast.error('Failed to delete service');
      console.error('Delete service error:', error);
    }
  };

  const handleEdit = (name: string, data: TraefikService) => {
    setEditingService({ name, data });
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingService(null);
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
          <h1 className="text-[22px] font-bold text-[var(--text-primary)] mb-1">Services</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Manage your Traefik services that define the actual backends where requests are forwarded.
          </p>
        </div>
        <div className="flex-shrink-0 ml-8">
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" />
            Add Service
          </button>
        </div>
      </div>

      {/* Services list */}
      <div className="list-container">
        {Object.entries(services).map(([name, service]) => (
          <div key={name} className="list-item group">
            <div className="status-dot" />
            <div className="flex-1 min-w-0">
              <p className="font-mono text-sm font-semibold text-accent-teal truncate">
                {name}
              </p>
              <div className="mt-1 space-y-0.5">
                {service.loadBalancer.servers.map((server, index) => (
                  <p key={index} className="font-mono text-xs text-[var(--text-muted)]">
                    {server.url}
                  </p>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="tag tag-teal">
                  {service.loadBalancer.servers.length} server(s)
                </span>
                {service.loadBalancer.healthCheck && (
                  <span className="tag tag-blue">Health Check</span>
                )}
                {service.loadBalancer.serversTransport && (
                  <span className="tag tag-yellow">{service.loadBalancer.serversTransport}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <button
                onClick={() => handleEdit(name, service)}
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
        {Object.keys(services).length === 0 && (
          <div className="text-center py-12">
            <Server className="mx-auto h-10 w-10 text-[var(--text-muted)]" />
            <h3 className="mt-2 text-sm font-medium text-[var(--text-primary)]">No services</h3>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Get started by creating a new service.
            </p>
          </div>
        )}
      </div>

      {showForm && (
        <ServiceForm
          service={editingService}
          onSave={handleSave}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
};

export default Services;