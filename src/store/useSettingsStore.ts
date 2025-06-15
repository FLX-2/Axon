import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/tauri';
import { getSystemAccentColor, setStartupLaunch } from '../lib/system';

export type ThemeMode = 'light' | 'dark' | 'black' | 'system';

interface ThemeColors {
  // Backgrounds
  surfacePrimary: string;   // Main background color
  surfaceSecondary: string; // Secondary surfaces (sidebar, header)
  surfaceHover: string;     // Hover state for buttons/cards
  
  // Text & Icons - Sidebar
  sidebarText: string;          // Sidebar text
  sidebarIcon: string;          // Default sidebar icon
  sidebarIconHover: string;     // Sidebar icon on hover
  
  // Text & Icons - Main Content
  textPrimary: string;     // Primary content text
  textSecondary: string;   // Secondary/muted text
  textPlaceholder: string; // Input placeholder text
  iconPrimary: string;     // Main content icons
  iconSecondary: string;   // Secondary icons
  
  // UI Elements
  accent: string;         // Accent color (pins, selected icons)
  scrollbar: string;      // Scrollbar color
  scrollbarHover: string; // Scrollbar hover color
  border: string;         // Border color
  buttonHover: string;    // Button hover background
  buttonSelected: string; // Selected button background (sidebar)
  inputBg: string;        // Input field background
  inputBorder: string;    // Input field border
}

interface SettingsState {
  themeMode: ThemeMode;
  colors: {
    light: ThemeColors;
    dark: ThemeColors;
    black: ThemeColors;
  };
  launchAtStartup: boolean;
  isCustomAccentColor: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setLaunchAtStartup: (launch: boolean) => void;
  isDarkMode: boolean;
  setAccentColor: (color: string) => void;
  resetToSystemAccentColor: () => Promise<void>;
  initializeSettings: () => Promise<void>;
}

const defaultColors = {
  light: {
    // Backgrounds
    surfacePrimary: '#fcfafd',
    surfaceSecondary: '#f3f2f2',
    surfaceHover: '#f7f6f6',

    // Text & Icons - Sidebar
    sidebarText: '#111827',
    sidebarIcon: '#737272',
    sidebarIconHover: '#5b5a5a',
    
    // Text & Icons - Main Content
    textPrimary: '#111827',
    textSecondary: '#6b7280',
    textPlaceholder: '#9ca3af',
    iconPrimary: '#737272',
    iconSecondary: '#737272',
    
    // UI Elements
    accent: '#000000',
    scrollbar: '#e5e7eb',
    scrollbarHover: '#d1d5db',
    buttonSelected: '#d4d2d2',
    border: '#d4d2d2',
    buttonHover: '#e3e1e1',
    inputBg: '#ffffff',
    inputBorder: '#e5e7eb',
  },
  dark: {
    // Backgrounds
    surfacePrimary: '#272626',
    surfaceSecondary: '#202121',
    surfaceHover: '#323232',
    
    // Text & Icons - Sidebar
    sidebarText: '#fefffe',
    sidebarIcon: '#9b9b9a',
    sidebarIconHover: '#fefffe',
    
    // Text & Icons - Main Content
    textPrimary: '#fefffe',
    textSecondary: '#9b9b9a',
    textPlaceholder: '#9b9b9a',
    iconPrimary: '#fefffe',
    iconSecondary: '#9b9b9a',
    
    // UI Elements
    accent: '#ffffff',        // White accent
    scrollbar: '#404040',      // Dark gray scrollbar
    scrollbarHover: '#525252', // Lighter gray on hover
    buttonSelected: '#454545', // Dark gray button background
    border: '#2c2d2c',
    buttonHover: '#2c2d2c',
    inputBg: '#323232',
    inputBorder: '#2c2d2c',
  },
  black: {
    // Backgrounds - Pure black with very subtle differences
    surfacePrimary: '#000000',    // Pure black
    surfaceSecondary: '#0a0a0a',  // Very dark gray (almost black)
    surfaceHover: '#141414',      // Slightly lighter but still very dark
    
    // Text & Icons - Sidebar
    sidebarText: '#ffffff',       // Pure white
    sidebarIcon: '#8a8a8a',       // Medium gray
    sidebarIconHover: '#ffffff',  // White on hover
    
    // Text & Icons - Main Content
    textPrimary: '#ffffff',       // White text
    textSecondary: '#8a8a8a',     // Medium gray
    textPlaceholder: '#666666',   // Darker gray
    iconPrimary: '#ffffff',       // White icons
    iconSecondary: '#8a8a8a',     // Gray icons
    
    // UI Elements
    accent: '#ffffff',           // White accent (like dark mode - will be replaced by user color)
    scrollbar: '#1a1a1a',        // Very dark scrollbar
    scrollbarHover: '#333333',   // Dark gray on hover
    buttonSelected: '#222222',   // Very dark button background
    border: '#1a1a1a',          // Very dark borders
    buttonHover: '#1a1a1a',     // Very dark hover state
    inputBg: '#141414',         // Very dark input background
    inputBorder: '#1a1a1a',     // Very dark input border
  },
};

// Helper for efficient storage
const createEfficientStorage = () => {
  return createJSONStorage(() => ({
    getItem: (name: string) => {
      try {
        return localStorage.getItem(name);
      } catch (e) {
        console.error('Error getting settings from localStorage:', e);
        return null;
      }
    },
    setItem: (name: string, value: unknown) => {
      try {
        const serialized = JSON.stringify(value);
        localStorage.setItem(name, serialized);
      } catch (e) {
        console.error('Error saving settings to localStorage:', e);
      }
    },
    removeItem: (name: string) => {
      try {
        localStorage.removeItem(name);
      } catch (e) {
        console.error('Error removing settings from localStorage:', e);
      }
    }
  }));
};

// Cache keys
const ACCENT_COLOR_CACHE_KEY = 'system_accent_color_cache';
const THEME_MODE_BACKUP_KEY = 'app-hub-theme-mode-backup';
const CUSTOM_ACCENT_KEY = 'app-hub-custom-accent';
const IS_CUSTOM_ACCENT_KEY = 'app-hub-is-custom-accent'; // New key for flag
const ACCENT_COLOR_CACHE_TTL = 60 * 60 * 1000; // 1 hour in ms

// Temporary fix for TypeScript types
const fixedDefaultColors = {
  light: defaultColors.light,
  dark: defaultColors.dark,
  black: defaultColors.black
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      themeMode: 'system',
      colors: fixedDefaultColors,
      launchAtStartup: false,
      isCustomAccentColor: false,
      isDarkMode: false,
      setThemeMode: (mode) => {
        // Save the theme mode in a separate localStorage entry
        // as a backup in case the Zustand persist doesn't work properly
        try {
          localStorage.setItem(THEME_MODE_BACKUP_KEY, JSON.stringify({
            mode: mode,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.error('Error saving theme mode backup:', e);
        }
        
        set({ themeMode: mode });
      },
      setLaunchAtStartup: async (launch) => {
        try {
          await setStartupLaunch(launch);
          set({ launchAtStartup: launch });
        } catch (error) {
          console.error('Failed to set launch at startup:', error);
        }
      },
      setAccentColor: (color: string) => {
        // Save the custom accent color in a separate localStorage entry
        try {
          // Store the color data
          localStorage.setItem(CUSTOM_ACCENT_KEY, JSON.stringify({
            color: color,
            timestamp: Date.now()
          }));
          
          // Store the flag separately
          localStorage.setItem(IS_CUSTOM_ACCENT_KEY, 'true');
        } catch (e) {
          console.error('Error saving custom accent color backup:', e);
        }
        
        // Update state in Zustand
        set({
          colors: {
            light: {
              ...get().colors.light,
              accent: color
            },
            dark: {
              ...get().colors.dark,
              accent: color
            },
            black: {
              ...get().colors.black,
              accent: color
            }
          },
          isCustomAccentColor: true
        });
      },
      resetToSystemAccentColor: async () => {
        try {
          // Check cache first
          let accentColor: string;
          // Remove the custom accent color flag
          localStorage.removeItem(IS_CUSTOM_ACCENT_KEY);
          localStorage.removeItem(CUSTOM_ACCENT_KEY);
          
          // Get system color from cache
          const cached = localStorage.getItem(ACCENT_COLOR_CACHE_KEY);
          
          if (cached) {
            const { color, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < ACCENT_COLOR_CACHE_TTL) {
              accentColor = color;
            } else {
              // Cache expired, fetch new
              accentColor = await getSystemAccentColor() as string;
              localStorage.setItem(ACCENT_COLOR_CACHE_KEY, JSON.stringify({
                color: accentColor,
                timestamp: Date.now()
              }));
            }
          } else {
            // No cache, fetch new
            accentColor = await getSystemAccentColor() as string;
            localStorage.setItem(ACCENT_COLOR_CACHE_KEY, JSON.stringify({
              color: accentColor,
              timestamp: Date.now()
            }));
          }
          
          set((state) => ({
            colors: {
              light: { ...state.colors.light, accent: accentColor },
              dark: { ...state.colors.dark, accent: accentColor },
              black: { ...state.colors.black, accent: accentColor },
            },
            isCustomAccentColor: false
          }));
        } catch (error) {
          console.error('Failed to reset to system accent color:', error);
        }
      },
      initializeSettings: async () => {
        try {
          const state = get();
          
          // First check for theme mode backup
          const themeModeBackup = localStorage.getItem(THEME_MODE_BACKUP_KEY);
          if (themeModeBackup) {
            try {
              const { mode } = JSON.parse(themeModeBackup);
              
              // Apply the theme mode
              set({ themeMode: mode });
            } catch (e) {
              console.error("Error parsing theme mode backup:", e);
            }
          }
          
          // Check for our custom accent flag first - this is the most reliable indicator
          const hasCustomAccent = localStorage.getItem(IS_CUSTOM_ACCENT_KEY) === 'true';
          
          if (hasCustomAccent) {
            // We have a custom accent, get its value
            const customAccentBackup = localStorage.getItem(CUSTOM_ACCENT_KEY);
            if (customAccentBackup) {
              try {
                const { color } = JSON.parse(customAccentBackup);
                
                // Apply this color and set the custom flag
                set({
                  colors: {
                    light: { ...state.colors.light, accent: color },
                    dark: { ...state.colors.dark, accent: color },
                    black: { ...state.colors.black, accent: color },
                  },
                  isCustomAccentColor: true
                });
                return; // Early return since we've found and applied custom color
              } catch (e) {
                console.error("Error parsing backup accent color:", e);
              }
            }
          }
          
          // If we get here, there was no valid backup, so check the persisted state
          if (state.isCustomAccentColor) {
            console.log("Using custom accent color from persisted state");
            // The custom color should already be in the state, so no need to set anything
          } else {
            // Use system color since no custom color is set
            console.log("Using system accent color");
            let accentColor: string;
            
            // Try to get from cache first
            const cached = localStorage.getItem(ACCENT_COLOR_CACHE_KEY);
            if (cached) {
              try {
                const { color, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < ACCENT_COLOR_CACHE_TTL) {
                  accentColor = color;
                } else {
                  // Cache expired, fetch new
                  accentColor = await getSystemAccentColor() as string;
                  localStorage.setItem(ACCENT_COLOR_CACHE_KEY, JSON.stringify({
                    color: accentColor,
                    timestamp: Date.now()
                  }));
                }
              } catch (e) {
                console.error("Error parsing system accent color cache:", e);
                accentColor = await getSystemAccentColor() as string;
              }
            } else {
              // No cache, fetch new
              accentColor = await getSystemAccentColor() as string;
              localStorage.setItem(ACCENT_COLOR_CACHE_KEY, JSON.stringify({
                color: accentColor,
                timestamp: Date.now()
              }));
            }
            
            set({
              colors: {
                light: { ...state.colors.light, accent: accentColor },
                dark: { ...state.colors.dark, accent: accentColor },
                black: { ...state.colors.black, accent: accentColor },
              }
            });
          }
        } catch (error) {
          console.error('Failed to get system accent color:', error);
        }
        
        // Let's also update our local storage with the current state to ensure consistency
        try {
          const state = get();
          if (state.isCustomAccentColor) {
            // Save the accent colors to both storages
            const accentColor = state.colors.light.accent; // Use light theme accent as reference
            localStorage.setItem(IS_CUSTOM_ACCENT_KEY, 'true');
            localStorage.setItem(CUSTOM_ACCENT_KEY, JSON.stringify({
              color: accentColor,
              timestamp: Date.now()
            }));
          }
        } catch (e) {
          // Silently fail, this is just extra redundancy
        }
      },
    }),
    {
      name: 'app-hub-settings',
      storage: createEfficientStorage(),
      partialize: (state) => ({
        themeMode: state.themeMode,
        colors: state.colors,
        launchAtStartup: state.launchAtStartup,
        isCustomAccentColor: state.isCustomAccentColor
      }),
      merge: (persistedState: any, currentState) => {
        // Deep merge to handle nested properties correctly
        const customAccentColor = persistedState.isCustomAccentColor;
        
        return {
          ...currentState,
          ...persistedState,
          colors: {
            light: {
              ...currentState.colors.light,
              ...(persistedState.colors?.light || {})
            },
            dark: {
              ...currentState.colors.dark,
              ...(persistedState.colors?.dark || {})
            },
            black: {
              ...currentState.colors.black,
              ...(persistedState.colors?.black || {})
            }
          },
          // Explicitly set isCustomAccentColor
          isCustomAccentColor: customAccentColor
        };
      },
    }
  )
);
