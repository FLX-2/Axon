import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/tauri';
import { getSystemAccentColor } from '../lib/system';

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
  // UI State (no persistence)
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
  globalHotkey: string | null;

  // Actions
  setThemeMode: (mode: ThemeMode) => void;
  setAccentColor: (color: string) => void;
  resetToSystemAccentColor: () => Promise<void>;
  setMinimizeToTray: (enabled: boolean) => Promise<void>;
  setStartupEnabled: (enabled: boolean) => Promise<void>;
  setStartMinimized: (enabled: boolean) => Promise<void>;
  setGlobalHotkey: (hotkey: string | null) => Promise<void>;
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
    accent: '#007acc', // Windows blue as fallback
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

export const useUnifiedSettingsStore = create<SettingsState>((set, get) => ({
  // Default UI state
  themeMode: 'system',
  colors: defaultColors,
  isCustomAccentColor: false,
  minimizeToTray: false,
  startupEnabled: false,
  startMinimized: true,
  globalHotkey: null,

  setThemeMode: (mode) => {
    // Update UI state immediately
    set({ themeMode: mode });

    // Send to backend
    invoke('update_preferences', {
      updates: {
        theme: { mode }
      }
    }).catch(error => {
      console.error('Failed to update theme mode:', error);
    });
  },

  setAccentColor: (color: string) => {
    // Update UI state immediately
    set({
      colors: {
        light: { ...get().colors.light, accent: color },
        dark: { ...get().colors.dark, accent: color },
        black: { ...get().colors.black, accent: color },
      },
      isCustomAccentColor: true
    });

    // Send to backend
    invoke('update_preferences', {
      updates: {
        theme: {
          accent_color: color,
          use_custom_accent: true
        }
      }
    }).catch(error => {
      console.error('Failed to update accent color:', error);
    });
  },

  resetToSystemAccentColor: async () => {
    try {
      const accentColor = await getSystemAccentColor() as string;

      // Update UI state
      set({
        colors: {
          light: { ...get().colors.light, accent: accentColor },
          dark: { ...get().colors.dark, accent: accentColor },
          black: { ...get().colors.black, accent: accentColor },
        },
        isCustomAccentColor: false
      });

      // Send to backend
      await invoke('update_preferences', {
        updates: {
          theme: {
            accent_color: accentColor, // Store the system color for faster loading next time
            use_custom_accent: false
          }
        }
      });
    } catch (error) {
      console.error('Failed to reset to system accent color:', error);
      // Fallback to default blue
      const fallbackColor = '#007acc';
      set({
        colors: {
          light: { ...get().colors.light, accent: fallbackColor },
          dark: { ...get().colors.dark, accent: fallbackColor },
          black: { ...get().colors.black, accent: fallbackColor },
        },
        isCustomAccentColor: false
      });
    }
  },

  setMinimizeToTray: async (enabled: boolean) => {
    // Update UI state immediately
    set({ minimizeToTray: enabled });

    // Send to backend
    try {
      await invoke('update_preferences', {
        updates: {
          behavior: { minimize_to_tray: enabled }
        }
      });
    } catch (error) {
      console.error('Failed to update minimize behavior:', error);
      // Revert UI state on error
      set({ minimizeToTray: !enabled });
    }
  },

  setStartupEnabled: async (enabled: boolean) => {
    // Update UI state immediately
    set({ startupEnabled: enabled });

    // Send to backend
    try {
      await invoke('update_preferences', {
        updates: {
          behavior: { startup_enabled: enabled }
        }
      });
    } catch (error) {
      console.error('Failed to update startup setting:', error);
      // Revert UI state on error
      set({ startupEnabled: !enabled });
    }
  },

  setStartMinimized: async (enabled: boolean) => {
    // Update UI state immediately
    set({ startMinimized: enabled });

    // Send to backend
    try {
      await invoke('update_preferences', {
        updates: {
          behavior: { start_minimized: enabled }
        }
      });
    } catch (error) {
      console.error('Failed to update start minimized setting:', error);
      // Revert UI state on error
      set({ startMinimized: !enabled });
    }
  },

  setGlobalHotkey: async (hotkey: string | null) => {
    // Update UI state immediately
    set({ globalHotkey: hotkey });

    try {
      // First validate the hotkey format if provided
      if (hotkey) {
        const isValid = await invoke('validate_hotkey_format', { hotkey });
        if (!isValid) {
          throw new Error('Invalid hotkey format');
        }
      }

      // Update preferences
      await invoke('update_preferences', {
        updates: {
          behavior: { global_hotkey: hotkey }
        }
      });

      // Register or unregister the hotkey
      if (hotkey) {
        await invoke('register_global_hotkey', { hotkey });
      } else {
        await invoke('unregister_global_hotkey');
      }
    } catch (error) {
      console.error('Failed to update global hotkey setting:', error);
      // Revert UI state on error
      set({ globalHotkey: get().globalHotkey });
      throw error;
    }
  },

  initializeSettings: async () => {
    try {
      // Load preferences from backend
      const prefs = await invoke('get_preferences') as any;

      // Determine accent color
      let accentColor: string;
      const hasCustomAccent = prefs.theme?.use_custom_accent || false;

      if (hasCustomAccent && prefs.theme?.accent_color) {
        // Use stored custom accent color
        accentColor = prefs.theme.accent_color;
      } else {
        // Fetch system accent color as fallback
        try {
          accentColor = await getSystemAccentColor() as string;
        } catch (systemError) {
          console.warn('Failed to get system accent color, using default:', systemError);
          // Use a reasonable default that's not black
          accentColor = '#007acc'; // Windows blue accent
        }
      }

      // Update UI state with loaded preferences
      set({
        themeMode: prefs.theme?.mode || 'system',
        minimizeToTray: prefs.behavior?.minimize_to_tray || false,
        startupEnabled: prefs.behavior?.startup_enabled || false,
        startMinimized: prefs.behavior?.start_minimized ?? true,
        globalHotkey: prefs.behavior?.global_hotkey || null,
        isCustomAccentColor: hasCustomAccent,
        colors: {
          light: {
            ...defaultColors.light,
            accent: accentColor
          },
          dark: {
            ...defaultColors.dark,
            accent: accentColor
          },
          black: {
            ...defaultColors.black,
            accent: accentColor
          }
        }
      });
    } catch (error) {
      console.error('Failed to initialize settings:', error);
      // Fallback: try to get system accent color
      try {
        const systemAccent = await getSystemAccentColor() as string;
        set({
          colors: {
            light: { ...defaultColors.light, accent: systemAccent },
            dark: { ...defaultColors.dark, accent: systemAccent },
            black: { ...defaultColors.black, accent: systemAccent }
          }
        });
      } catch (fallbackError) {
        console.error('Failed to get system accent color in fallback:', fallbackError);
        // Keep default state on error
      }
    }
  },
}));