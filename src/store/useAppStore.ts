import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppInfo } from '../types/app';
import { loadStartMenuApps, getAppIcon } from '../lib/system';

// Helper functions for icon loading and caching
// Polyfill for requestIdleCallback
const requestIdleCallback =
  window.requestIdleCallback ||
  ((callback: IdleRequestCallback) => setTimeout(callback, 1));

// Load icons progressively with priority for visible apps
const loadIconsProgressively = (
  apps: AppInfo[],
  state: any,
  updateCallback: (apps: AppInfo[]) => void
) => {
  const appsToProcess = [...apps];
  const result = [...apps];
  
  // Process icons in small batches to avoid freezing the UI
  const processBatch = async () => {
    if (appsToProcess.length === 0) return;
    
    // Take first 3 apps from the queue
    const batch = appsToProcess.splice(0, 3);
    
    // Process this batch
    await Promise.all(batch.map(async (app) => {
      // Skip if we already have a custom icon
      if (state.customIcons[app.path]) {
        return;
      }
      
      // Check cache first
      const cachedIcon = getIconFromCache(app.path);
      if (cachedIcon) {
        const index = result.findIndex(a => a.path === app.path);
        if (index !== -1) {
          result[index] = { ...result[index], icon: cachedIcon };
        }
        return;
      }
      
      // If not in cache, load from backend
      try {
        const icon = await getAppIcon(app.path);
        const index = result.findIndex(a => a.path === app.path);
        if (index !== -1) {
          result[index] = { ...result[index], icon: icon as string };
          saveIconToCache(app.path, icon as string);
        }
      } catch (error) {
        // Silently fail on icon loading errors
      }
    }));
    
    // Update UI with latest results
    updateCallback([...result]);
    
    // Process next batch during idle time
    if (appsToProcess.length > 0) {
      requestIdleCallback(() => processBatch());
    }
  };
  
  // Start processing
  processBatch();
};

// Icon cache management
const ICON_CACHE_PREFIX = 'app_icon_';
const ICON_CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

const getIconFromCache = (path: string): string | null => {
  try {
    const cacheKey = ICON_CACHE_PREFIX + btoa(path);
    const cachedData = localStorage.getItem(cacheKey);
    
    if (!cachedData) return null;
    
    const { icon, timestamp } = JSON.parse(cachedData);
    
    // Check if cache has expired
    if (Date.now() - timestamp > ICON_CACHE_EXPIRY) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    return icon;
  } catch (error) {
    // Silent error for cache reads
    return null;
  }
};

const saveIconToCache = (path: string, icon: string): void => {
  try {
    const cacheKey = ICON_CACHE_PREFIX + btoa(path);
    const cacheData = {
      icon,
      timestamp: Date.now()
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    // Silent error for cache writes
  }
};

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
      // STEP 1: Load app metadata quickly (cached in backend)
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
          // Initialize with placeholder icon
          icon: state.customIcons[movedPath] || null,
        };
      });
      
      // STEP 2: Set apps without icons first for immediate display
      set({ apps: updatedApps, isLoading: false });
      
      // STEP 3: Load icons in background with priority for visible apps
      requestIdleCallback(() => {
        loadIconsProgressively(updatedApps, state, (updatedAppsWithIcons) => {
          set({ apps: updatedAppsWithIcons });
        });
      });
    } catch (error) {
      // Log to app logger instead of console
      set({ isLoading: false });
    }
  },

  loadAppIcon: async (path: string) => {
    try {
      // Check if we already have this icon in localStorage cache
      const cachedIcon = getIconFromCache(path);
      if (cachedIcon) {
        set((state) => ({
          apps: state.apps.map(app =>
            app.path === path
              ? { ...app, icon: cachedIcon }
              : app
          )
        }));
        return;
      }
      
      // If not cached, fetch from backend
      const icon = await getAppIcon(path);
      
      // Save to cache
      saveIconToCache(path, icon as string);
      
      // Update app state
      set((state) => ({
        apps: state.apps.map(app =>
          app.path === path
            ? { ...app, icon: icon as string }
            : app
        )
      }));
    } catch (error) {
      // Silently fail on icon loading errors
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
