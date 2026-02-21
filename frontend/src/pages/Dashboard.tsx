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
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-accent-teal border-t-transparent"></div>
      </div>
    );
  }

  const statCards = [
    { label: 'Routers', value: stats.routers, icon: Route, color: 'teal' },
    { label: 'Services', value: stats.services, icon: Server, color: 'cyan' },
    { label: 'Middlewares', value: stats.middlewares, icon: Shield, color: 'purple' },
  ];

  const colorMap: Record<string, { icon: string; border: string; glow: string }> = {
    teal: {
      icon: 'bg-accent-teal/15 text-accent-teal',
      border: 'bg-gradient-to-r from-accent-teal to-transparent',
      glow: 'hover:shadow-[0_8px_32px_rgba(0,212,170,0.08)]',
    },
    cyan: {
      icon: 'bg-accent-cyan/15 text-accent-cyan',
      border: 'bg-gradient-to-r from-accent-cyan to-transparent',
      glow: 'hover:shadow-[0_8px_32px_rgba(14,165,233,0.08)]',
    },
    purple: {
      icon: 'bg-accent-purple/15 text-accent-purple',
      border: 'bg-gradient-to-r from-accent-purple to-transparent',
      glow: 'hover:shadow-[0_8px_32px_rgba(139,92,246,0.08)]',
    },
  };

  return (
    <div className="space-y-8">
      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {statCards.map(({ label, value, icon: Icon, color }) => {
          const colors = colorMap[color];
          return (
            <div
              key={label}
              className={`stat-card ${colors.glow} hover:border-[var(--border-hover)] hover:-translate-y-0.5`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium">
                  {label}
                </span>
                <div className={`p-2.5 rounded-xl ${colors.icon}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="font-mono text-4xl font-bold text-[var(--text-primary)] tracking-tight">
                {value}
              </div>
              <div className={`mt-4 h-0.5 rounded-full ${colors.border}`} />
            </div>
          );
        })}
      </div>

      {/* Configuration Management */}
      <div className="card rounded-xl p-7">
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">
          Configuration Management
        </h2>
        <p className="text-[13px] text-[var(--text-secondary)] mb-5 max-w-lg leading-relaxed">
          Split your monolithic dynamic.yml file into organized separate files (routers.yml, services.yml, middlewares.yml) for better organization and maintainability.
        </p>
        <button onClick={handleSplitConfig} className="btn-primary">
          <FileText className="w-4 h-4" />
          Split Configuration Files
        </button>
      </div>
    </div>
  );
};

export default Dashboard;