import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppInfo } from '../types/app';
import { loadStartMenuApps, refreshStartMenuApps, getAppIcon } from '../lib/system';
import { storageManager } from '../lib/storageManager';

// Polyfill for requestIdleCallback
const requestIdleCallback =
  window.requestIdleCallback ||
  ((callback: IdleRequestCallback) => setTimeout(callback, 1));

// Unified icon cache management
class IconCache {
  private static readonly CACHE_PREFIX = 'app_icon_';
  private static readonly CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

  static getCacheKey(path: string): string {
    return `${this.CACHE_PREFIX}${btoa(path)}`;
  }

  static get(path: string): string | null {
    try {
      const cacheKey = this.getCacheKey(path);
      const cached = storageManager.get(cacheKey);

      if (!cached || typeof cached !== 'object') return null;

      const { icon, timestamp } = cached as { icon: string; timestamp: number };

      // Check if cache has expired
      if (Date.now() - timestamp > this.CACHE_EXPIRY) {
        storageManager.delete(cacheKey);
        return null;
      }

      return icon;
    } catch (error) {
      return null;
    }
  }

  static set(path: string, icon: string): void {
    try {
      const cacheKey = this.getCacheKey(path);
      const cacheData = {
        icon,
        timestamp: Date.now()
      };

      storageManager.set(cacheKey, cacheData, this.CACHE_EXPIRY);
    } catch (error) {
      // Silent error for cache writes
    }
  }

  static cleanup(): void {
    // The storage manager handles cleanup automatically
  }
}

// Load icons progressively with priority for visible apps
const loadIconsProgressively = (
  apps: AppInfo[],
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
      if (app.icon && app.icon !== 'loading') {
        return;
      }

      // Check cache first
      const cachedIcon = IconCache.get(app.path);
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
          IconCache.set(app.path, icon as string);
        }
      } catch (error) {
        // Silently fail on icon loading errors
        const index = result.findIndex(a => a.path === app.path);
        if (index !== -1) {
          result[index] = { ...result[index], icon: null };
        }
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
  refreshApps: () => Promise<void>;
  loadAppIcon: (path: string) => Promise<void>;
  updateAppIcon: (path: string, iconData: string | null) => void;
  moveApp: (path: string, newPath: string) => void;
}

// Custom storage adapter for unified storage
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

const initialState = {
  apps: [],
  searchTerm: '',
  isLoading: true,
  isGridView: true,
  customIcons: {},
  movedApps: {},
  pinnedApps: [],
  lastAccessed: {},
  categories: {},
};

export const useUnifiedAppStore = create<AppState>()(
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
        set((state) => ({
          lastAccessed: {
            ...state.lastAccessed,
            [path]: timestamp
          },
          apps: state.apps.map(app =>
            app.path === path
              ? { ...app, lastAccessed: timestamp }
              : app
          )
        }));
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
              icon: state.customIcons[movedPath] || 'loading', // Placeholder for icon loading
            };
          });

          // Set apps without icons first for immediate display
          set({ apps: updatedApps, isLoading: false });

          // Load icons in background with priority for visible apps
          requestIdleCallback(() => {
            loadIconsProgressively(updatedApps, (updatedAppsWithIcons) => {
              set({ apps: updatedAppsWithIcons });
            });
          });
        } catch (error) {
          console.error('Failed to load apps:', error);
          set({ isLoading: false });
        }
      },

      refreshApps: async () => {
        set({ isLoading: true });
        try {
          const apps = await refreshStartMenuApps() as AppInfo[];
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
              icon: state.customIcons[movedPath] || 'loading',
            };
          });

          // Set apps without icons first for immediate display
          set({ apps: updatedApps, isLoading: false });

          // Load icons in background with priority for visible apps
          requestIdleCallback(() => {
            loadIconsProgressively(updatedApps, (updatedAppsWithIcons) => {
              set({ apps: updatedAppsWithIcons });
            });
          });
        } catch (error) {
          console.error('Failed to refresh apps:', error);
          set({ isLoading: false });
        }
      },

      loadAppIcon: async (path: string) => {
        try {
          // Check if we already have this icon in cache
          const cachedIcon = IconCache.get(path);
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
          IconCache.set(path, icon as string);

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
          set((state) => ({
            apps: state.apps.map(app =>
              app.path === path
                ? { ...app, icon: null }
                : app
            )
          }));
        }
      },

      updateAppIcon: (path: string, iconData: string | null) => {
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
      name: 'app-data',
      storage: createJSONStorage(createUnifiedStorage),
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