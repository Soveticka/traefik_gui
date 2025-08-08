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
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-4">
          Dashboard
        </h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
          Manage your Traefik dynamic configuration with style ✨
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="glass-card rounded-xl overflow-hidden transform hover:scale-105 transition-all duration-200">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                  <Route className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                    Routers
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.routers}
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4 h-1 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full" />
          </div>
        </div>

        <div className="glass-card rounded-xl overflow-hidden transform hover:scale-105 transition-all duration-200">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl">
                  <Server className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                    Services
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.services}
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4 h-1 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full" />
          </div>
        </div>

        <div className="glass-card rounded-xl overflow-hidden transform hover:scale-105 transition-all duration-200">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                  <Shield className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                    Middlewares
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.middlewares}
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" />
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Configuration Management</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Split your monolithic dynamic.yml file into organized separate files (routers.yml, services.yml, middlewares.yml) 
            for better organization and maintainability.
          </p>
        </div>
        
        <div className="flex justify-center">
          <button
            onClick={handleSplitConfig}
            className="group relative inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-purple-500/50"
          >
            <FileText className="h-5 w-5 mr-3" />
            Split Configuration Files
            <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;