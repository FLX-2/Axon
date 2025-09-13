import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/tauri';
import { getSystemAccentColor } from '../lib/system';
import { storageManager } from '../lib/storageManager';

export type ThemeMode = 'light' | 'dark' | 'black' | 'system';

interface ThemeColors {
  // Backgrounds
  surfacePrimary: string;
  surfaceSecondary: string;
  surfaceHover: string;

  // Text & Icons - Sidebar
  sidebarText: string;
  sidebarIcon: string;
  sidebarIconHover: string;

  // Text & Icons - Main Content
  textPrimary: string;
  textSecondary: string;
  textPlaceholder: string;
  iconPrimary: string;
  iconSecondary: string;

  // UI Elements
  accent: string;
  scrollbar: string;
  scrollbarHover: string;
  border: string;
  buttonHover: string;
  buttonSelected: string;
  inputBg: string;
  inputBorder: string;
}

interface SettingsState {
  themeMode: ThemeMode;
  colors: {
    light: ThemeColors;
    dark: ThemeColors;
    black: ThemeColors;
  };
  isCustomAccentColor: boolean;
  minimizeToTray: boolean;
  startupEnabled: boolean;
  startMinimized: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  isDarkMode: boolean;
  setAccentColor: (color: string) => void;
  resetToSystemAccentColor: () => Promise<void>;
  setMinimizeToTray: (enabled: boolean) => Promise<void>;
  setStartupEnabled: (enabled: boolean) => Promise<void>;
  setStartMinimized: (enabled: boolean) => Promise<void>;
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
    accent: '#ffffff',
    scrollbar: '#404040',
    scrollbarHover: '#525252',
    buttonSelected: '#454545',
    border: '#2c2d2c',
    buttonHover: '#2c2d2c',
    inputBg: '#323232',
    inputBorder: '#2c2d2c',
  },
  black: {
    // Backgrounds - Pure black with very subtle differences
    surfacePrimary: '#000000',
    surfaceSecondary: '#0a0a0a',
    surfaceHover: '#141414',

    // Text & Icons - Sidebar
    sidebarText: '#ffffff',
    sidebarIcon: '#8a8a8a',
    sidebarIconHover: '#ffffff',

    // Text & Icons - Main Content
    textPrimary: '#ffffff',
    textSecondary: '#8a8a8a',
    textPlaceholder: '#666666',
    iconPrimary: '#ffffff',
    iconSecondary: '#8a8a8a',

    // UI Elements
    accent: '#ffffff',
    scrollbar: '#1a1a1a',
    scrollbarHover: '#333333',
    buttonSelected: '#222222',
    border: '#1a1a1a',
    buttonHover: '#1a1a1a',
    inputBg: '#141414',
    inputBorder: '#1a1a1a',
  },
};

// Custom storage adapter using our centralized storage manager
const createUnifiedStorage = () => ({
  getItem: (name: string): string | null => {
    try {
      const value = storageManager.get(name);
      return typeof value === 'string' ? value : null;
    } catch (e) {
      console.error('Error getting from unified storage:', e);
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      storageManager.set(name, value);
    } catch (e) {
      console.error('Error saving to unified storage:', e);
    }
  },
  removeItem: (name: string) => {
    try {
      storageManager.delete(name);
    } catch (e) {
      console.error('Error removing from unified storage:', e);
    }
  }
});

export const useUnifiedSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      themeMode: 'system',
      colors: defaultColors,
      isCustomAccentColor: false,
      minimizeToTray: false,
      startupEnabled: false,
      startMinimized: true,
      isDarkMode: false,

      setThemeMode: (mode) => {
        set({ themeMode: mode });
      },

      setAccentColor: (color: string) => {
        set({
          colors: {
            light: { ...get().colors.light, accent: color },
            dark: { ...get().colors.dark, accent: color },
            black: { ...get().colors.black, accent: color },
          },
          isCustomAccentColor: true
        });
      },

      resetToSystemAccentColor: async () => {
        try {
          const accentColor = await getSystemAccentColor() as string;

          set({
            colors: {
              light: { ...get().colors.light, accent: accentColor },
              dark: { ...get().colors.dark, accent: accentColor },
              black: { ...get().colors.black, accent: accentColor },
            },
            isCustomAccentColor: false
          });
        } catch (error) {
          console.error('Failed to reset to system accent color:', error);
        }
      },

      setMinimizeToTray: async (enabled: boolean) => {
        try {
          await invoke('set_minimize_behavior', { minimizeToTray: enabled });
          set({ minimizeToTray: enabled });
        } catch (error) {
          console.error('Failed to update minimize behavior:', error);
          throw error;
        }
      },

      setStartupEnabled: async (enabled: boolean) => {
        try {
          await invoke('set_startup_enabled', { enabled });
          set({ startupEnabled: enabled });
        } catch (error) {
          console.error('Failed to update startup setting:', error);
          throw error;
        }
      },

      setStartMinimized: async (enabled: boolean) => {
        try {
          await invoke('set_start_minimized', { enabled });
          set({ startMinimized: enabled });
        } catch (error) {
          console.error('Failed to update start minimized setting:', error);
          throw error;
        }
      },

      initializeSettings: async () => {
        try {
          const state = get();

          // Sync backend settings
          try {
            const backendMinimizeToTray = await invoke('get_minimize_behavior') as boolean;
            set({ minimizeToTray: backendMinimizeToTray });
          } catch (error) {
            console.error('Failed to sync minimize behavior:', error);
            try {
              await invoke('set_minimize_behavior', { minimizeToTray: state.minimizeToTray });
            } catch (syncError) {
              console.error('Failed to sync minimize behavior to backend:', syncError);
            }
          }

          try {
            const backendStartupEnabled = await invoke('get_startup_enabled') as boolean;
            set({ startupEnabled: backendStartupEnabled });
          } catch (error) {
            console.error('Failed to sync startup setting:', error);
            try {
              await invoke('set_startup_enabled', { enabled: state.startupEnabled });
            } catch (syncError) {
              console.error('Failed to sync startup setting to backend:', syncError);
            }
          }

          try {
            const backendStartMinimized = await invoke('get_start_minimized') as boolean;
            set({ startMinimized: backendStartMinimized });
          } catch (error) {
            console.error('Failed to sync start minimized setting:', error);
            try {
              await invoke('set_start_minimized', { enabled: state.startMinimized });
            } catch (syncError) {
              console.error('Failed to sync start minimized setting to backend:', syncError);
            }
          }

          // Handle accent color initialization
          if (!state.isCustomAccentColor) {
            try {
              const accentColor = await getSystemAccentColor() as string;
              set({
                colors: {
                  light: { ...state.colors.light, accent: accentColor },
                  dark: { ...state.colors.dark, accent: accentColor },
                  black: { ...state.colors.black, accent: accentColor },
                }
              });
            } catch (error) {
              console.error('Failed to get system accent color:', error);
            }
          }
        } catch (error) {
          console.error('Failed to initialize settings:', error);
        }
      },
    }),
    {
      name: 'settings',
      storage: createJSONStorage(createUnifiedStorage),
      partialize: (state) => ({
        themeMode: state.themeMode,
        colors: state.colors,
        isCustomAccentColor: state.isCustomAccentColor,
        minimizeToTray: state.minimizeToTray,
        startupEnabled: state.startupEnabled,
        startMinimized: state.startMinimized
      }),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...persistedState,
        colors: {
          light: { ...currentState.colors.light, ...(persistedState.colors?.light || {}) },
          dark: { ...currentState.colors.dark, ...(persistedState.colors?.dark || {}) },
          black: { ...currentState.colors.black, ...(persistedState.colors?.black || {}) }
        }
      }),
    }
  )
);