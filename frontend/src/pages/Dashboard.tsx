import { useState, useEffect, type FormEvent } from 'react';
import { Route, Server, Shield, FileText, RefreshCw } from 'lucide-react';
import { AuditEvent } from '../types/traefik';
import { routersApi, servicesApi, middlewaresApi, configApi } from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState({
    routers: 0,
    services: 0,
    middlewares: 0,
  });
  const [loading, setLoading] = useState(true);

  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditAction, setAuditAction] = useState('');
  const [auditResource, setAuditResource] = useState('');
  const [auditLimit, setAuditLimit] = useState(20);

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

  useEffect(() => {
    void fetchAuditEvents();
  }, []);

  const fetchAuditEvents = async () => {
    try {
      setAuditLoading(true);
      const response = await configApi.getAudit({
        action: auditAction || undefined,
        resource: auditResource || undefined,
        limit: auditLimit,
      });
      setAuditEvents(response.data.entries);
    } catch (error) {
      toast.error('Failed to load audit events');
      console.error('Audit load error:', error);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleSplitConfig = async () => {
    try {
      await configApi.split();
      toast.success('Configuration split into separate files successfully!');
      void fetchAuditEvents();
    } catch (error) {
      toast.error('Failed to split configuration');
      console.error('Split config error:', error);
    }
  };

  const handleAuditFilterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await fetchAuditEvents();
  };

  const formatAuditTime = (timestamp: string): string => {
    const parsed = new Date(timestamp);
    if (Number.isNaN(parsed.getTime())) {
      return timestamp;
    }

    return parsed.toLocaleString();
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

      <div className="card rounded-xl p-7">
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">Configuration Management</h2>
        <p className="text-[13px] text-[var(--text-secondary)] mb-5 max-w-lg leading-relaxed">
          Split your monolithic dynamic.yml file into organized separate files (routers.yml, services.yml,
          middlewares.yml) for better organization and maintainability.
        </p>
        <button onClick={handleSplitConfig} className="btn-primary">
          <FileText className="w-4 h-4" />
          Split Configuration Files
        </button>
      </div>

      <div className="card rounded-xl p-7">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1">Audit Activity</h2>
            <p className="text-[13px] text-[var(--text-secondary)]">
              Inspect recent configuration changes with filters for action and resource.
            </p>
          </div>
          <button type="button" onClick={() => void fetchAuditEvents()} className="btn-secondary" disabled={auditLoading}>
            <RefreshCw className={`w-4 h-4 ${auditLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <form onSubmit={handleAuditFilterSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <select
            value={auditAction}
            onChange={(e) => setAuditAction(e.target.value)}
            className="form-input"
          >
            <option value="">All Actions</option>
            <option value="router.save">router.save</option>
            <option value="router.delete">router.delete</option>
            <option value="service.save">service.save</option>
            <option value="service.delete">service.delete</option>
            <option value="middleware.save">middleware.save</option>
            <option value="middleware.delete">middleware.delete</option>
            <option value="combined.router-service.create">combined.router-service.create</option>
            <option value="config.split">config.split</option>
          </select>

          <input
            type="text"
            value={auditResource}
            onChange={(e) => setAuditResource(e.target.value)}
            placeholder="Resource contains..."
            className="form-input"
          />

          <input
            type="number"
            min={1}
            max={200}
            value={auditLimit}
            onChange={(e) => setAuditLimit(Number.parseInt(e.target.value, 10) || 20)}
            className="form-input"
          />

          <button type="submit" className="btn-primary">Apply Filters</button>
        </form>

        <div className="list-container">
          {auditLoading && (
            <div className="text-center py-6 text-sm text-[var(--text-secondary)]">Loading audit events...</div>
          )}

          {!auditLoading && auditEvents.length === 0 && (
            <div className="text-center py-8 text-sm text-[var(--text-muted)]">No audit events found for current filters.</div>
          )}

          {!auditLoading &&
            auditEvents.map((event, index) => (
              <div key={`${event.timestamp}-${index}`} className="list-item">
                <div className="status-dot" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="tag tag-teal">{event.action}</span>
                    {event.resourceName && <span className="tag tag-purple">{event.resourceName}</span>}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">{formatAuditTime(event.timestamp)}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1 truncate">
                    {event.actorIp || 'unknown-ip'} | {event.actorUserAgent || 'unknown-agent'}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
