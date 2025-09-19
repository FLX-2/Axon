import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/tauri';
import { AppInfo } from '../types/app';
import { loadStartMenuApps, refreshStartMenuApps, getAppIcon } from '../lib/system';

// Polyfill for requestIdleCallback
const requestIdleCallback =
  window.requestIdleCallback ||
  ((callback: IdleRequestCallback) => setTimeout(callback, 1));

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
      // Skip if we already have an icon (not 'loading')
      if (app.icon && app.icon !== 'loading') {
        return;
      }

      // Load icon from backend
      try {
        const icon = await getAppIcon(app.path);
        const index = result.findIndex(a => a.path === app.path);
        if (index !== -1) {
          result[index] = { ...result[index], icon: icon as string };
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
  customNames: Record<string, string>;
  pinnedApps: string[];
  lastAccessed: Record<string, string>;
  categories: Record<string, string>;
  setApps: (apps: AppInfo[]) => void;
  setSearchTerm: (term: string) => void;
  toggleView: () => void;
  setViewMode: (mode: boolean) => void;
  togglePinned: (path: string) => void;
  updateLastAccessed: (path: string, timestamp: string) => void;
  updateCategory: (path: string, category: AppInfo['category']) => void;
  loadApps: () => Promise<void>;
  refreshApps: () => Promise<void>;
  loadAppIcon: (path: string) => Promise<void>;
  updateAppIcon: (path: string, iconData: string | null) => Promise<void>;
  updateAppName: (path: string, name: string | null) => Promise<void>;
  initializeApps: () => Promise<void>;
}

const initialState = {
  apps: [],
  searchTerm: '',
  isLoading: true,
  isGridView: true,
  customIcons: {},
  customNames: {},
  pinnedApps: [],
  lastAccessed: {},
  categories: {},
};

export const useUnifiedAppStore = create<AppState>((set, get) => ({
  ...initialState,

  setApps: (apps) => set({ apps }),

  setSearchTerm: (term) => set({ searchTerm: term }),

  toggleView: async () => {
    const state = get();
    const newViewMode = !state.isGridView;

    // Update UI state immediately
    set({ isGridView: newViewMode });

    // Send to backend
    try {
      await invoke('update_preferences', {
        updates: {
          apps: {
            view_mode: newViewMode ? "grid" : "list"
          }
        }
      });
    } catch (error) {
      console.error('Failed to update view mode:', error);
      // Revert UI state on error
      set({ isGridView: state.isGridView });
    }
  },

  setViewMode: async (isGridView) => {
    const state = get();

    // Update UI state immediately
    set({ isGridView });

    // Send to backend
    try {
      await invoke('update_preferences', {
        updates: {
          apps: {
            view_mode: isGridView ? "grid" : "list"
          }
        }
      });
    } catch (error) {
      console.error('Failed to update view mode:', error);
      // Revert UI state on error
      set({ isGridView: state.isGridView });
    }
  },

  togglePinned: async (path) => {
    const state = get();
    const isPinned = state.pinnedApps.includes(path);
    const newPinnedApps = isPinned
      ? state.pinnedApps.filter(p => p !== path)
      : [...state.pinnedApps, path];

    // Update UI state immediately
    set({
      pinnedApps: newPinnedApps,
      apps: state.apps.map(app =>
        app.path === path
          ? { ...app, isPinned: !isPinned }
          : app
      )
    });

    // Send to backend
    try {
      await invoke('update_preferences', {
        updates: {
          apps: {
            pinned: newPinnedApps
          }
        }
      });
    } catch (error) {
      console.error('Failed to update pinned apps:', error);
      // Revert UI state on error
      set({
        pinnedApps: state.pinnedApps,
        apps: state.apps.map(app =>
          app.path === path
            ? { ...app, isPinned: isPinned }
            : app
        )
      });
    }
  },

  updateLastAccessed: async (path, timestamp) => {
    const state = get();
    
    // Create a new lastAccessed object and add the new entry
    const newLastAccessed = {
      ...state.lastAccessed,
      [path]: timestamp,
    };

    // Sort by timestamp and keep only the 5 most recent
    const sorted = Object.entries(newLastAccessed)
      .sort(([, a], [, b]) => new Date(b).getTime() - new Date(a).getTime())
      .slice(0, 5);

    const limitedLastAccessed = Object.fromEntries(sorted);

    // Update UI state immediately
    set({
      lastAccessed: limitedLastAccessed,
      apps: state.apps.map(app =>
        app.path === path
          ? { ...app, lastAccessed: timestamp }
          : app
      ),
    });

    // Send the limited list to the backend
    try {
      await invoke('update_preferences', {
        updates: {
          apps: {
            last_accessed: limitedLastAccessed,
          },
        },
      });
    } catch (error) {
      console.error('Failed to update last accessed:', error);
      // Revert UI state on error
      set({
        lastAccessed: state.lastAccessed,
        apps: state.apps.map(app =>
          app.path === path
            ? { ...app, lastAccessed: state.lastAccessed[path] }
            : app
        ),
      });
    }
  },

  updateCategory: async (path, category) => {
    const state = get();
    const newCategories = { ...state.categories };
    if (category) {
      newCategories[path] = category;
    } else {
      delete newCategories[path];
    }

    // Update UI state immediately
    set({
      categories: newCategories,
      apps: state.apps.map(app =>
        app.path === path
          ? { ...app, category }
          : app
      )
    });

    // Send to backend
    try {
      await invoke('update_preferences', {
        updates: {
          apps: {
            categories: newCategories
          }
        }
      });
    } catch (error) {
      console.error('Failed to update app categories:', error);
      // Revert UI state on error
      set({
        categories: state.categories,
        apps: state.apps.map(app =>
          app.path === path
            ? { ...app, category: state.categories[path] }
            : app
        )
      });
    }
  },

  loadApps: async () => {
    set({ isLoading: true });
    try {
      // First load preferences from backend
      await get().initializeApps();

      const apps = await loadStartMenuApps() as AppInfo[];
      const state = get();

      // Apply all saved settings
      const updatedApps = apps.map(newApp => {
        const category = state.categories[newApp.path] || newApp.category;
        const isPinned = state.pinnedApps.includes(newApp.path);
        const lastAccessed = state.lastAccessed[newApp.path];
        const customIcon = state.customIcons[newApp.path];
        const customName = state.customNames[newApp.path];

        return {
          ...newApp,
          originalName: newApp.name || '', // Store the original name from system
          name: customName || newApp.name || '',
          category,
          isPinned,
          lastAccessed,
          icon: customIcon || 'loading', // Use custom icon if available, otherwise 'loading'
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
        const category = state.categories[newApp.path] || newApp.category;
        const isPinned = state.pinnedApps.includes(newApp.path);
        const lastAccessed = state.lastAccessed[newApp.path];
        const customName = state.customNames[newApp.path];

        return {
          ...newApp,
          originalName: newApp.name || '', // Store the original name from system
          name: customName || newApp.name || '',
          category,
          isPinned,
          lastAccessed,
          icon: state.customIcons[newApp.path] || 'loading',
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
      const icon = await getAppIcon(path);

      set((state) => ({
        apps: state.apps.map(app =>
          app.path === path
            ? { ...app, icon: icon as string }
            : app
        )
      }));
    } catch (error) {
      console.error('Failed to load app icon:', error);
      set((state) => ({
        apps: state.apps.map(app =>
          app.path === path
            ? { ...app, icon: null }
            : app
        )
      }));
    }
  },

  updateAppIcon: async (path: string, iconData: string | null) => {
    const state = get();
    const newCustomIcons = { ...state.customIcons };

    if (iconData) {
      // Setting a custom icon - iconData is already a relative path returned from the backend
      newCustomIcons[path] = iconData;
    } else {
      // Reset to original icon - remove from custom icons and clean up file
      delete newCustomIcons[path];

      // Remove the icon file from the file system
      try {
        const result = await invoke<string>('remove_custom_icon', { appPath: path });
        console.log(`File removal result: ${result}`);
      } catch (fileError) {
        console.warn('Failed to remove custom icon file:', fileError);
        // Continue with the reset even if file removal fails
      }
    }

    // Update UI state - for reset, set icon to 'loading' to trigger icon reload
    set({
      customIcons: newCustomIcons,
      apps: state.apps.map(app =>
        app.path === path
          ? { ...app, icon: iconData || 'loading' } // 'loading' for reset to trigger icon reload
          : app
      )
    });

    // Update preferences with custom icons mapping
    try {
      await invoke('update_preferences', {
        updates: {
          apps: {
            custom_icons: newCustomIcons
          }
        }
      });

      // If resetting icon, trigger icon reload
      if (!iconData) {
        // Load the original icon immediately
        try {
          const originalIcon = await getAppIcon(path);
          set((state) => ({
            apps: state.apps.map(app =>
              app.path === path
                ? { ...app, icon: originalIcon as string }
                : app
            )
          }));
          console.log(`Loaded original icon for reset app: ${path}`);
        } catch (iconError) {
          console.warn('Failed to load original icon after reset:', iconError);
          // Set to null if loading fails
          set((state) => ({
            apps: state.apps.map(app =>
              app.path === path
                ? { ...app, icon: null }
                : app
            )
          }));
        }
      }
    } catch (error) {
      console.error('Failed to update custom icons preferences:', error);
      // Revert UI state on error
      set({
        customIcons: state.customIcons,
        apps: state.apps.map(app =>
          app.path === path
            ? { ...app, icon: state.customIcons[path] || null }
            : app
        )
      });
    }
  },

  updateAppName: async (path: string, name: string | null) => {
    const state = get();
    const newCustomNames = { ...state.customNames };

    if (name) {
      // Setting a custom name
      newCustomNames[path] = name;
    } else {
      // Reset to original name - remove from custom names
      delete newCustomNames[path];
    }

    // Update UI state
    set({
      customNames: newCustomNames,
      apps: state.apps.map(app =>
        app.path === path
          ? { ...app, name: name || (app.originalName || app.name) } // Use custom name or reset to original
          : app
      )
    });

    // Update preferences with custom names mapping
    try {
      await invoke('update_preferences', {
        updates: {
          apps: {
            custom_names: newCustomNames
          }
        }
      });
    } catch (error) {
      console.error('Failed to update custom names preferences:', error);
      // Revert UI state on error
      set({
        customNames: state.customNames,
        apps: state.apps.map(app =>
          app.path === path
            ? { ...app, name: state.customNames[path] || (app.originalName || app.name) }
            : app
        )
      });
    }
  },


  initializeApps: async () => {
    try {
      // Load preferences from backend
      const prefs = await invoke('get_preferences') as any;

      // Update UI state with loaded app preferences
      if (prefs.apps) {
        set({
          customIcons: prefs.apps.custom_icons || {},
          customNames: prefs.apps.custom_names || {},
          pinnedApps: prefs.apps.pinned || [],
          categories: prefs.apps.categories || {},
          lastAccessed: prefs.apps.last_accessed || {},
          isGridView: prefs.apps.view_mode !== 'list'
        });
      }
    } catch (error) {
      console.error('Failed to initialize apps:', error);
      // Keep default state on error
    }
  },
}));