import React, { useEffect } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { themeMode, colors } = useSettingsStore();

  const applyTheme = (isDark: boolean) => {
    const activeColors = isDark ? colors.dark : colors.light;
    
    console.log('Applying theme colors:', activeColors); // Debug log
    
    // Apply each color as a CSS variable
    Object.entries(activeColors).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--color-${key}`, value);
    });
    
    // Toggle dark mode class
    document.documentElement.classList.toggle('dark', isDark);
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateTheme = () => {
      const prefersDark = mediaQuery.matches;
      const shouldUseDark = themeMode === 'dark' || (themeMode === 'system' && prefersDark);
      applyTheme(shouldUseDark);
    };

    // Initial theme application
    updateTheme();

    // Listen for system theme changes
    mediaQuery.addEventListener('change', updateTheme);
    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [themeMode, colors]); // Re-run when theme mode or colors change

  // Apply theme immediately when colors change
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    applyTheme(isDark);
  }, [colors]);

  return <>{children}</>;
}; 