import { create } from 'zustand';
import { AppInfo } from '../types/app';
import { loadStartMenuApps, getAppIcon } from '../lib/system';
import { invoke } from '@tauri-apps/api/tauri';

interface AppSettings {
  custom_icons: Record<string, string>;
  moved_apps: Record<string, string>;
  pinned_apps: string[];
  recent_apps: string[];
  is_grid_view: boolean;
  categories: Record<string, string>;
}

interface AppState {
  apps: AppInfo[];
  searchTerm: string;
  isLoading: boolean;
  isGridView: boolean;
  customIcons: Record<string, string>;
  movedApps: Record<string, string>;
  pinnedApps: string[];
  recentApps: string[];
  categories: Record<string, string>;
  setApps: (apps: AppInfo[]) => void;
  setSearchTerm: (term: string) => void;
  toggleView: () => void;
  togglePinned: (path: string) => void;
  updateLastAccessed: (path: string, timestamp: string) => void;
  updateCategory: (path: string, category: AppInfo['category']) => void;
  loadApps: () => Promise<void>;
  loadAppIcon: (path: string) => Promise<void>;
  updateAppIcon: (path: string, iconData: string | null) => void;
  moveApp: (path: string, newPath: string) => void;
  saveSettings: () => Promise<void>;
}

const initialState = {
  apps: [],
  searchTerm: '',
  isLoading: false,
  isGridView: true,
  customIcons: {},
  movedApps: {},
  pinnedApps: [],
  recentApps: [],
  categories: {},
};

export const useAppStore = create<AppState>()((set, get) => ({
  ...initialState,

  saveSettings: async () => {
    const state = get();
    console.log('Saving settings:', {
      custom_icons: state.customIcons,
      moved_apps: state.movedApps,
      pinned_apps: state.pinnedApps,
      recent_apps: state.recentApps,
      is_grid_view: state.isGridView,
      categories: state.categories,
    });
    
    await invoke('save_app_settings', {
      settings: {
        custom_icons: state.customIcons,
        moved_apps: state.movedApps,
        pinned_apps: state.pinnedApps,
        recent_apps: state.recentApps,
        is_grid_view: state.isGridView,
        categories: state.categories,
      }
    });
  },

  setApps: (apps) => set({ apps }),
  
  setSearchTerm: (term) => set({ searchTerm: term }),
  
  toggleView: () => {
    set((state) => ({ isGridView: !state.isGridView }));
    get().saveSettings();
  },

  togglePinned: (path) => {
    set((state) => {
      const isPinned = state.pinnedApps.includes(path);
      const newPinnedApps = isPinned
        ? state.pinnedApps.filter(p => p !== path)
        : [...state.pinnedApps, path];

      return {
        pinnedApps: newPinnedApps,
        apps: state.apps.map(app => 
          app.path === path 
            ? { ...app, isPinned: !isPinned }
            : app
        )
      };
    });
    get().saveSettings();
  },

  updateLastAccessed: (path, timestamp) => {
    set((state) => {
      // Keep only the last 20 recent apps
      const newRecentApps = [
        path,
        ...state.recentApps.filter(p => p !== path)
      ].slice(0, 20);

      return {
        recentApps: newRecentApps,
        apps: state.apps.map(app =>
          app.path === path
            ? { ...app, lastAccessed: timestamp }
            : app
        )
      };
    });
    get().saveSettings();
  },

  updateCategory: (path, category) => {
    set((state) => {
      const newCategories = { ...state.categories };
      if (category) {
        newCategories[path] = category;
      } else {
        delete newCategories[path];
      }

      return {
        categories: newCategories,
        apps: state.apps.map(app =>
          app.path === path
            ? { ...app, category }
            : app
        )
      };
    });
    get().saveSettings();
  },

  loadApps: async () => {
    set({ isLoading: true });
    try {
      // Load saved settings first
      const settings = await invoke<AppSettings>('load_app_settings');
      console.log('Loaded settings:', settings);
      
      set({ 
        customIcons: settings.custom_icons || {},
        movedApps: settings.moved_apps || {},
        pinnedApps: settings.pinned_apps || [],
        recentApps: settings.recent_apps || [],
        isGridView: settings.is_grid_view,
        categories: settings.categories || {},
      });

      const apps = await loadStartMenuApps() as AppInfo[];
      const state = get();
      
      // Apply all saved settings
      const updatedApps = apps.map(newApp => {
        const movedPath = state.movedApps[newApp.path];
        const category = state.categories[newApp.path];
        const isPinned = state.pinnedApps.includes(movedPath || newApp.path);
        const lastAccessed = state.recentApps.includes(movedPath || newApp.path) 
          ? new Date().toISOString()
          : undefined;

        const appWithSettings = {
          ...newApp,
          path: movedPath || newApp.path,
          category: category || newApp.category,
          isPinned,
          lastAccessed,
        };

        return appWithSettings;
      });
      
      // Load icons in batches of 5
      const batchSize = 5;
      const appsWithIcons: AppInfo[] = [];
      
      for (let i = 0; i < updatedApps.length; i += batchSize) {
        const batch = updatedApps.slice(i, i + batchSize);
        const iconPromises = batch.map(async (app) => {
          // Check for custom icon first
          if (state.customIcons[app.path]) {
            return { ...app, icon: state.customIcons[app.path] };
          }
          
          // Load default icon if no custom icon exists
          try {
            const icon = await getAppIcon(app.path);
            return { ...app, icon: icon as string };
          } catch (error) {
            console.error(`Failed to load icon for ${app.name}:`, error);
            return { ...app, icon: null };
          }
        });
        
        const batchResults = await Promise.all(iconPromises);
        appsWithIcons.push(...batchResults);
      }
      
      set({ apps: appsWithIcons, isLoading: false });
    } catch (error) {
      console.error('Failed to load apps:', error);
      set({ isLoading: false });
    }
  },

  loadAppIcon: async (path: string) => {
    try {
      const icon = await getAppIcon(path);
      set((state) => ({
        apps: state.apps.map(app =>
          app.path === path
            ? { ...app, icon: icon as string }
            : app
        )
      }));
    } catch (error) {
      console.error(`Failed to load icon for ${path}:`, error);
    }
  },

  updateAppIcon: async (path: string, iconData: string | null) => {
    set((state) => {
      const newCustomIcons = { ...state.customIcons };
      
      if (iconData) {
        newCustomIcons[path] = iconData;
      } else {
        delete newCustomIcons[path];
      }

      return {
        customIcons: newCustomIcons,
        apps: state.apps.map(app =>
          app.path === path
            ? { ...app, icon: iconData }
            : app
        )
      };
    });
    get().saveSettings();
  },

  moveApp: (path: string, newPath: string) => {
    set((state) => {
      const newMovedApps = { ...state.movedApps };
      newMovedApps[path] = newPath;

      return {
        movedApps: newMovedApps,
        apps: state.apps.map(app =>
          app.path === path
            ? { ...app, path: newPath }
            : app
        )
      };
    });
    get().saveSettings();
  }
}));