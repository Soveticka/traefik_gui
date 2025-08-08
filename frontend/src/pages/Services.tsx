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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-bold text-gray-900">Services</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your Traefik services that define the actual backends where requests are forwarded.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {Object.entries(services).map(([name, service]) => (
            <li key={name}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-600 truncate">
                      {name}
                    </p>
                    <div className="mt-2 space-y-1">
                      {service.loadBalancer.servers.map((server, index) => (
                        <p key={index} className="text-sm text-gray-500">
                          {server.url}
                        </p>
                      ))}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {service.loadBalancer.servers.length} server(s)
                      </span>
                      {service.loadBalancer.healthCheck && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Health Check
                        </span>
                      )}
                      {service.loadBalancer.serversTransport && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {service.loadBalancer.serversTransport}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(name, service)}
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
        {Object.keys(services).length === 0 && (
          <div className="text-center py-12">
            <Server className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No services</h3>
            <p className="mt-1 text-sm text-gray-500">
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