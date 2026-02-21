import { createContext, useContext, useEffect } from 'react';

interface ThemeContextType {
  theme: 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  useEffect(() => {
    // Always enforce dark mode
    document.documentElement.classList.add('dark');
  }, []);

  const toggleTheme = () => {
    // No-op: Design A is dark-only
  };

  return (
    <ThemeContext.Provider value={{ theme: 'dark', toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};