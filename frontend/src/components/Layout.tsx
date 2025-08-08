import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Route, 
  Server, 
  Shield, 
  Home,
  Settings,
  Moon,
  Sun,
  Sparkles
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Routers', href: '/routers', icon: Route },
    { name: 'Services', href: '/services', icon: Server },
    { name: 'Middlewares', href: '/middlewares', icon: Shield },
  ];

  return (
    <div className="min-h-screen relative">
      {/* Simplified Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800" />

      <nav className="glass-effect border-b border-white/10 dark:border-gray-800/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <div className="relative">
                  <Settings className="h-8 w-8 text-purple-600 dark:text-purple-400 animate-float" />
                  <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-purple-500 animate-pulse" />
                </div>
                <span className="ml-3 text-xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 dark:from-purple-400 dark:to-purple-600 bg-clip-text text-transparent">
                  Traefik GUI
                </span>
              </div>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'border-purple-500 text-purple-900 dark:text-purple-100 bg-purple-50/50 dark:bg-purple-900/20 rounded-t-lg'
                          : 'border-transparent text-gray-700 dark:text-gray-300 hover:border-purple-300 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50/30 dark:hover:bg-purple-900/10 rounded-t-lg'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            
            {/* Dark Mode Toggle */}
            <div className="flex items-center">
              <button
                onClick={toggleTheme}
                className="relative p-2 rounded-xl bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 hover:bg-white/30 dark:hover:bg-gray-800/30 transition-all duration-200 group"
                aria-label="Toggle dark mode"
              >
                <div className="relative w-6 h-6">
                  <Sun className={`absolute inset-0 h-6 w-6 text-yellow-500 transition-all duration-300 ${
                    theme === 'dark' ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
                  }`} />
                  <Moon className={`absolute inset-0 h-6 w-6 text-purple-400 transition-all duration-300 ${
                    theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
                  }`} />
                </div>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-20 transition-opacity duration-200" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {children}
        </div>
      </main>

      {/* Subtle floating orbs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 dark:bg-purple-400/5 rounded-full blur-3xl animate-float" />
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-pink-500/5 dark:bg-pink-400/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
      </div>
    </div>
  );
};

export default Layout;