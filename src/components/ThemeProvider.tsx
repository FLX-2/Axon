import React, { useEffect } from 'react';
import { useSettingsStore, ThemeMode } from '../store/useSettingsStore';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { themeMode, colors } = useSettingsStore();

  const applyTheme = (themeType: ThemeMode | boolean) => {
    // Convert boolean to theme type for backward compatibility
    let actualTheme: ThemeMode;
    
    if (typeof themeType === 'boolean') {
      actualTheme = themeType ? 'dark' : 'light';
    } else {
      actualTheme = themeType;
    }
    
    // Get colors based on theme type - handle all possible theme types
    let activeColors;
    if (actualTheme === 'light') {
      activeColors = colors.light;
    } else if (actualTheme === 'dark') {
      activeColors = colors.dark;
    } else if (actualTheme === 'black') {
      // @ts-ignore - TypeScript doesn't know about the black theme yet
      activeColors = colors.black;
    } else {
      activeColors = colors.light; // Default fallback
    }
    
    // Apply each color as a CSS variable
    Object.entries(activeColors).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--color-${key}`, value as string);
    });
    
    // Toggle dark mode class (for both dark and black themes)
    document.documentElement.classList.toggle('dark', actualTheme !== 'light');
    
    // Add a specific class for black theme
    document.documentElement.classList.toggle('theme-black', actualTheme === 'black');
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateTheme = () => {
      const prefersDark = mediaQuery.matches;
      
      // Determine which theme to use based on mode and system preference
      let themeToApply: ThemeMode;
      
      if (themeMode === 'light') {
        themeToApply = 'light';
      } else if (themeMode === 'dark') {
        themeToApply = 'dark';
      } else if (themeMode === 'black') {
        themeToApply = 'black';
      } else {
        // System preference
        themeToApply = prefersDark ? 'dark' : 'light';
      }
      
      applyTheme(themeToApply);
    };

    // Initial theme application
    updateTheme();

    // Listen for system theme changes
    mediaQuery.addEventListener('change', updateTheme);
    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [themeMode, colors]); // Re-run when theme mode or colors change

  // Apply theme immediately when colors change
  useEffect(() => {
    // Determine current theme based on classes
    let currentTheme: ThemeMode = 'light';
    
    if (document.documentElement.classList.contains('theme-black')) {
      currentTheme = 'black';
    } else if (document.documentElement.classList.contains('dark')) {
      currentTheme = 'dark';
    }
    
    // Reapply the current theme with updated colors
    applyTheme(currentTheme);
  }, [colors]);

  return <>{children}</>;
}; 