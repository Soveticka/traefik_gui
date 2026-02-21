import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Route,
  Server,
  Shield,
  LayoutDashboard,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { routersApi, servicesApi, middlewaresApi } from '../services/api';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [counts, setCounts] = useState({ routers: 0, services: 0, middlewares: 0 });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [r, s, m] = await Promise.all([
          routersApi.getAll(),
          servicesApi.getAll(),
          middlewaresApi.getAll(),
        ]);
        setCounts({
          routers: Object.keys(r.data).length,
          services: Object.keys(s.data).length,
          middlewares: Object.keys(m.data).length,
        });
      } catch {
        // silently fail — counts are non-critical
      }
    };
    fetchCounts();
  }, [location.pathname]); // refresh counts on navigation

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, section: 'Overview' },
    { name: 'Routers', href: '/routers', icon: Route, section: 'Configuration', count: counts.routers },
    { name: 'Services', href: '/services', icon: Server, section: 'Configuration', count: counts.services },
    { name: 'Middlewares', href: '/middlewares', icon: Shield, section: 'Configuration', count: counts.middlewares },
  ];

  // Group items by section
  const sections: Record<string, typeof navigation> = {};
  navigation.forEach(item => {
    if (!sections[item.section]) sections[item.section] = [];
    sections[item.section].push(item);
  });

  const currentPage = navigation.find(item => item.href === location.pathname)?.name || 'Dashboard';

  return (
    <div className="min-h-screen flex bg-[var(--bg-primary)]">
      {/* Sidebar */}
      <nav className={`fixed top-0 bottom-0 left-0 z-10 flex flex-col bg-[var(--bg-sidebar)] border-r border-[var(--border)] transition-all duration-200 ${collapsed ? 'w-16' : 'w-60'}`}>
        {/* Logo */}
        <div className="px-4 py-5 border-b border-[var(--border)] flex items-center gap-3">
          <Settings className="w-7 h-7 text-accent-teal flex-shrink-0" />
          {!collapsed && (
            <>
              <span className="font-mono font-bold text-base text-accent-teal tracking-tight">traefik</span>
              <span className="ml-auto text-[10px] text-[var(--text-muted)] bg-[var(--bg-card)] px-1.5 py-0.5 rounded font-mono">v2</span>
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 py-4 px-2 overflow-y-auto">
          {Object.entries(sections).map(([section, items]) => (
            <div key={section}>
              {!collapsed && (
                <div className="px-3 py-2 mt-2 first:mt-0 text-[10px] uppercase tracking-[1.5px] text-[var(--text-muted)] font-medium">
                  {section}
                </div>
              )}
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium mb-0.5 transition-all duration-150 ${isActive
                        ? 'bg-accent-teal/10 text-accent-teal border border-accent-teal/20'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)] border border-transparent'
                      }`}
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                    {!collapsed && (
                      <>
                        <span>{item.name}</span>
                        {item.count !== undefined && (
                          <span className="ml-auto font-mono text-[11px] text-[var(--text-muted)] bg-[var(--bg-primary)] px-2 py-0.5 rounded-full">
                            {item.count}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="px-3 py-3 border-t border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-all duration-150 flex items-center justify-center"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </nav>

      {/* Main content */}
      <div className={`flex-1 transition-all duration-200 ${collapsed ? 'ml-16' : 'ml-60'}`}>
        {/* Top bar */}
        <div className="sticky top-0 z-5 px-8 py-4 border-b border-[var(--border)] bg-[var(--bg-secondary)] backdrop-blur-xl flex items-center justify-between">
          <div className="text-[13px] text-[var(--text-muted)] flex items-center gap-2">
            <span>Home</span>
            <span>›</span>
            <span className="text-[var(--text-primary)] font-semibold">{currentPage}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse-glow" style={{ '--glow-color': '#22c55e' } as React.CSSProperties} />
            Traefik Connected
          </div>
        </div>

        {/* Page content */}
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;