import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { configApi } from '../services/api';
import { AuditEvent } from '../types/traefik';

const actionOptions = [
  '',
  'router.save',
  'router.delete',
  'service.save',
  'service.delete',
  'middleware.save',
  'middleware.delete',
  'combined.router-service.create',
  'config.split',
];

const sinceOptions = [
  { value: '', label: 'Any Time' },
  { value: '1h', label: 'Last Hour' },
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
];

interface AuditFilters {
  action: string;
  resource: string;
  sinceRange: string;
  limit: number;
  autoRefresh: boolean;
}

function toSinceIso(range: string): string | undefined {
  const now = Date.now();

  if (range === '1h') return new Date(now - 60 * 60 * 1000).toISOString();
  if (range === '24h') return new Date(now - 24 * 60 * 60 * 1000).toISOString();
  if (range === '7d') return new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  if (range === '30d') return new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

  return undefined;
}

function parseFilters(params: URLSearchParams): AuditFilters {
  const action = params.get('action') || '';
  const resource = params.get('resource') || '';
  const sinceRange = params.get('sinceRange') || '24h';

  const rawLimit = Number.parseInt(params.get('limit') || '100', 10);
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(rawLimit, 500)) : 100;

  const autoRefresh = params.get('autoRefresh') === '1';

  return { action, resource, sinceRange, limit, autoRefresh };
}

function buildSearchParams(filters: AuditFilters): URLSearchParams {
  const next = new URLSearchParams();

  if (filters.action) next.set('action', filters.action);
  if (filters.resource.trim()) next.set('resource', filters.resource.trim());
  if (filters.sinceRange) next.set('sinceRange', filters.sinceRange);
  if (filters.limit !== 100) next.set('limit', String(filters.limit));
  if (filters.autoRefresh) next.set('autoRefresh', '1');

  return next;
}

const Audit = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilters = useMemo(() => parseFilters(searchParams), [searchParams]);

  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEventKey, setExpandedEventKey] = useState<string | null>(null);

  const [action, setAction] = useState(initialFilters.action);
  const [resource, setResource] = useState(initialFilters.resource);
  const [sinceRange, setSinceRange] = useState(initialFilters.sinceRange);
  const [limit, setLimit] = useState(initialFilters.limit);
  const [autoRefresh, setAutoRefresh] = useState(initialFilters.autoRefresh);

  const fetchEvents = async (filters: AuditFilters, silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      const response = await configApi.getAudit({
        action: filters.action || undefined,
        resource: filters.resource || undefined,
        since: toSinceIso(filters.sinceRange),
        limit: filters.limit,
      });

      setEvents(response.data.entries);
    } catch (error) {
      toast.error('Failed to load audit events');
      console.error('Audit page load error:', error);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const parsed = parseFilters(searchParams);
    setAction(parsed.action);
    setResource(parsed.resource);
    setSinceRange(parsed.sinceRange);
    setLimit(parsed.limit);
    setAutoRefresh(parsed.autoRefresh);
    void fetchEvents(parsed);
  }, [searchParams]);

  useEffect(() => {
    if (!autoRefresh) {
      return;
    }

    const interval = window.setInterval(() => {
      const parsed = parseFilters(searchParams);
      void fetchEvents(parsed, true);
    }, 15000);

    return () => window.clearInterval(interval);
  }, [autoRefresh, searchParams]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();

    const filters: AuditFilters = {
      action,
      resource,
      sinceRange,
      limit,
      autoRefresh,
    };

    setSearchParams(buildSearchParams(filters));
  };

  const formatTimestamp = (timestamp: string): string => {
    const parsed = new Date(timestamp);
    if (Number.isNaN(parsed.getTime())) {
      return timestamp;
    }
    return parsed.toLocaleString();
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[var(--text-primary)] mb-1">Audit Log</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Review configuration changes with server-side filters and detailed event metadata.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void fetchEvents({ action, resource, sinceRange, limit, autoRefresh })}
          className="btn-secondary"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <form onSubmit={onSubmit} className="card rounded-xl p-5 mb-5 grid grid-cols-1 md:grid-cols-5 gap-3">
        <select value={action} onChange={(e) => setAction(e.target.value)} className="form-input">
          {actionOptions.map((item) => (
            <option key={item || 'all'} value={item}>
              {item || 'All Actions'}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={resource}
          onChange={(e) => setResource(e.target.value)}
          placeholder="Resource contains..."
          className="form-input"
        />

        <select value={sinceRange} onChange={(e) => setSinceRange(e.target.value)} className="form-input">
          {sinceOptions.map((option) => (
            <option key={option.value || 'any'} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            max={500}
            value={limit}
            onChange={(e) => setLimit(Number.parseInt(e.target.value, 10) || 100)}
            className="form-input"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <label className="text-sm text-[var(--text-secondary)] flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="form-checkbox"
            />
            Auto Refresh
          </label>
          <button type="submit" className="btn-primary whitespace-nowrap">
            Apply
          </button>
        </div>
      </form>

      <div className="text-xs text-[var(--text-muted)] mb-3 font-mono">
        Shareable URL filters are active. Auto refresh interval: 15s.
      </div>

      <div className="list-container">
        {loading && <div className="text-center py-8 text-sm text-[var(--text-secondary)]">Loading events...</div>}

        {!loading && events.length === 0 && (
          <div className="text-center py-8 text-sm text-[var(--text-muted)]">No matching audit events.</div>
        )}

        {!loading &&
          events.map((event, idx) => {
            const key = `${event.timestamp}-${idx}`;
            const isExpanded = expandedEventKey === key;

            return (
              <div key={key} className="list-item flex-col gap-2 cursor-default">
                <div className="w-full flex items-start gap-4">
                  <div className="status-dot" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="tag tag-teal">{event.action}</span>
                      {event.resourceName && <span className="tag tag-purple">{event.resourceName}</span>}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">{formatTimestamp(event.timestamp)}</p>
                  </div>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => setExpandedEventKey(isExpanded ? null : key)}
                  >
                    {isExpanded ? 'Hide' : 'Details'}
                  </button>
                </div>

                {isExpanded && (
                  <div className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] p-3 font-mono text-xs text-[var(--text-secondary)] space-y-1">
                    <div>revision: {event.revision || 'n/a'}</div>
                    <div>ip: {event.actorIp || 'unknown'}</div>
                    <div className="break-all">user-agent: {event.actorUserAgent || 'unknown'}</div>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default Audit;
