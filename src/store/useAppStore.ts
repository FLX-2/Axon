import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppInfo } from '../types/app';
import { loadStartMenuApps, getAppIcon } from '../lib/system';

interface AppState {
  apps: AppInfo[];
  searchTerm: string;
  isLoading: boolean;
  isGridView: boolean;
  customIcons: Record<string, string>;
  movedApps: Record<string, string>;
  pinnedApps: string[];
  lastAccessed: Record<string, string>;
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
}

const initialState = {
  apps: [],
  searchTerm: '',
  isLoading: false,
  isGridView: true,
  customIcons: {},
  movedApps: {},
  pinnedApps: [],
  lastAccessed: {},
  categories: {},
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,
  setApps: (apps) => set({ apps }),
  
  setSearchTerm: (term) => set({ searchTerm: term }),
  
  toggleView: () => {
    set((state) => ({ isGridView: !state.isGridView }));
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
  },

  updateLastAccessed: (path, timestamp) => {
    set((state) => {
      return {
        lastAccessed: {
          ...state.lastAccessed,
          [path]: timestamp
        },
        apps: state.apps.map(app => 
          app.path === path 
            ? { ...app, lastAccessed: timestamp } 
            : app
        )
      };
    });
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
  },

  loadApps: async () => {
    set({ isLoading: true });
    try {
      const apps = await loadStartMenuApps() as AppInfo[];
      const state = get();
      
      // Apply all saved settings
      const updatedApps = apps.map(newApp => {
        const movedPath = state.movedApps[newApp.path] || newApp.path;
        const category = state.categories[newApp.path] || newApp.category;
        const isPinned = state.pinnedApps.includes(movedPath);
        const lastAccessed = state.lastAccessed[newApp.path];

        return {
          ...newApp,
          path: movedPath,
          category,
          isPinned,
          lastAccessed,
        };
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
  }
    }),
    {
      name: 'app-hub-app-data',
      partialize: (state) => ({
        customIcons: state.customIcons,
        movedApps: state.movedApps,
        pinnedApps: state.pinnedApps,
        lastAccessed: state.lastAccessed,
        isGridView: state.isGridView,
        categories: state.categories
      }),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...persistedState,
      }),
    }
  )
);
