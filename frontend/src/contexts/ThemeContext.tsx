import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeName, applyTheme } from '@/lib/themes';

interface ThemeContextType {
  currentTheme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  isTransitioning: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('default');
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Load saved theme preference
    const savedTheme = localStorage.getItem('theme-preference') as ThemeName;
    if (savedTheme) {
      applyTheme(savedTheme);
      setCurrentTheme(savedTheme);
    } else {
      applyTheme('default');
    }
  }, []);

  const setTheme = (theme: ThemeName) => {
    setIsTransitioning(true);
    
    // Apply theme with smooth transition
    applyTheme(theme);
    setCurrentTheme(theme);
    
    // Reset transition state after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, isTransitioning }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
