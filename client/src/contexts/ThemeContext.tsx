import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  sidebarTheme: 'dark' | 'light';
  toggleSidebarTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [sidebarTheme, setSidebarTheme] = useState<'dark' | 'light'>('dark');

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('sidebar-theme') as 'dark' | 'light';
    if (savedTheme) {
      setSidebarTheme(savedTheme);
    }
  }, []);

  const toggleSidebarTheme = () => {
    const newTheme = sidebarTheme === 'dark' ? 'light' : 'dark';
    setSidebarTheme(newTheme);
    localStorage.setItem('sidebar-theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ sidebarTheme, toggleSidebarTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}