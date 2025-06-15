import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getSystemAccentColor, setStartupLaunch } from '../lib/system';

export type ThemeMode = 'light' | 'dark' | 'system';

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
  };
  launchAtStartup: boolean;
  minimizeToTray: boolean;
  isCustomAccentColor: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setLaunchAtStartup: (launch: boolean) => void;
  setMinimizeToTray: (value: boolean) => void;
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
    surfaceHover: '#f7f6f6',    // Slightly lighter than #f3f2f2
    
    // Text & Icons - Sidebar
    sidebarText: '#111827',
    sidebarIcon: '#737272',
    sidebarIconHover: '#5b5a5a',
    
    // Text & Icons - Main Content
    textPrimary: '#111827',
    textSecondary: '#6b7280',
    textPlaceholder: '#9ca3af',
    iconPrimary: '#737272', //?
    iconSecondary: '#737272',
    
    // UI Elements
    accent: '#000000',        // Indigo accent
    scrollbar: '#e5e7eb',      // Light gray scrollbar
    scrollbarHover: '#d1d5db', // Darker gray on hover
    buttonSelected: '#d4d2d2', // Gray button background
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
    accent: '#ffffff',        // Pink accent
    scrollbar: '#404040',      // Dark gray scrollbar
    scrollbarHover: '#525252', // Lighter gray on hover
    buttonSelected: '#454545', // Dark gray button background
    border: '#2c2d2c',
    buttonHover: '#2c2d2c',
    inputBg: '#323232',
    inputBorder: '#2c2d2c',
  },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      themeMode: 'system',
      colors: defaultColors,
  launchAtStartup: false,
  minimizeToTray: true,
  isCustomAccentColor: false,
  isDarkMode: false,
      setThemeMode: (mode) => set({ themeMode: mode }),
      setLaunchAtStartup: async (launch) => {
        try {
          await setStartupLaunch(launch);
          set({ launchAtStartup: launch });
        } catch (error) {
          console.error('Failed to set launch at startup:', error);
        }
      },
  setMinimizeToTray: (value) => set({ minimizeToTray: value }),
      setAccentColor: (color: string) => set((state) => ({
        colors: {
          light: { ...state.colors.light, accent: color },
          dark: { ...state.colors.dark, accent: color },
        },
        isCustomAccentColor: true
      })),
      resetToSystemAccentColor: async () => {
        try {
          const accentColor = await getSystemAccentColor() as string;
          set((state) => ({
            colors: {
              light: { ...state.colors.light, accent: accentColor },
              dark: { ...state.colors.dark, accent: accentColor },
            },
            isCustomAccentColor: false
          }));
        } catch (error) {
          console.error('Failed to reset to system accent color:', error);
        }
      },
      initializeSettings: async () => {
        try {
          // Only get system accent color if we're not using a custom color
          const state = useSettingsStore.getState();
          if (!state.isCustomAccentColor) {
            const accentColor = await getSystemAccentColor() as string;
            set((state) => ({
              colors: {
                light: { ...state.colors.light, accent: accentColor },
                dark: { ...state.colors.dark, accent: accentColor },
              }
            }));
          }
        } catch (error) {
          console.error('Failed to get system accent color:', error);
        }
      },
    }),
    {
      name: 'app-hub-settings',
    partialize: (state) => ({
        themeMode: state.themeMode,
        colors: state.colors,
        launchAtStartup: state.launchAtStartup,
        minimizeToTray: state.minimizeToTray,
        isCustomAccentColor: state.isCustomAccentColor
      }),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...persistedState,
      }),
    }
  )
);
