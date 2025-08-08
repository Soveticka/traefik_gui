import { useState, useEffect } from 'react';
import { Route, Server, Shield, FileText } from 'lucide-react';
import { routersApi, servicesApi, middlewaresApi, configApi } from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState({
    routers: 0,
    services: 0,
    middlewares: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [routersRes, servicesRes, middlewaresRes] = await Promise.all([
          routersApi.getAll(),
          servicesApi.getAll(),
          middlewaresApi.getAll(),
        ]);

        setStats({
          routers: Object.keys(routersRes.data).length,
          services: Object.keys(servicesRes.data).length,
          middlewares: Object.keys(middlewaresRes.data).length,
        });
      } catch (error) {
        toast.error('Failed to load dashboard data');
        console.error('Dashboard error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleSplitConfig = async () => {
    try {
      await configApi.split();
      toast.success('Configuration split into separate files successfully!');
    } catch (error) {
      toast.error('Failed to split configuration');
      console.error('Split config error:', error);
    }
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your Traefik dynamic configuration
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Route className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Routers
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.routers}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Server className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Services
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.services}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Shield className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Middlewares
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.middlewares}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Configuration Management</h2>
        <p className="text-sm text-gray-600 mb-4">
          Split your monolithic dynamic.yml file into organized separate files (routers.yml, services.yml, middlewares.yml) 
          for better organization and maintainability.
        </p>
        <button
          onClick={handleSplitConfig}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <FileText className="h-4 w-4 mr-2" />
          Split Configuration Files
        </button>
      </div>
    </div>
  );
};

export default Dashboard;