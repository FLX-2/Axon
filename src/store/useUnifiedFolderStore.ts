import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { open as openFolder } from '@tauri-apps/api/shell';
import { FolderInfo } from '../types/folder';

interface FolderState {
  folders: FolderInfo[];
  customNames: Record<string, string>;
  addFolder: () => Promise<void>;
  openFolder: (path: string) => Promise<void>;
  removeFolder: (path: string) => void;
  updateFolderIcon: (path: string, iconData: string | null) => Promise<void>;
  updateFolderName: (path: string, name: string | null) => Promise<void>;
  getFolder: (path: string) => FolderInfo | undefined;
  initializeFolders: () => Promise<void>;
}

// Default folders for quick access - only show folders that actually exist
const getDefaultFolders = (): FolderInfo[] => {
  const possibleFolders = [
    { name: "Documents", path: "C:\\Users\\${username}\\Documents" },
    { name: "Downloads", path: "C:\\Users\\${username}\\Downloads" },
    { name: "Pictures", path: "C:\\Users\\${username}\\Pictures" },
    { name: "Music", path: "C:\\Users\\${username}\\Music" },
    { name: "Videos", path: "C:\\Users\\${username}\\Videos" }
  ];

  // For now, return empty array to avoid showing non-existent folders
  // In a future update, we could check if these paths exist
  return [];
};

export const useUnifiedFolderStore = create<FolderState>((set, get) => ({
  folders: getDefaultFolders(),
  customNames: {},

  addFolder: async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Folder'
      });

      if (selected && !Array.isArray(selected)) {
        const name = selected.split('\\').pop() || selected;

        // Check if folder already exists
        const state = get();
        const exists = state.folders.some(folder => folder.path === selected);

        if (!exists) {
          const newFolders = [...state.folders, { name, originalName: name, path: selected }];

          // Update UI state immediately
          set({ folders: newFolders });

          // Send to backend
          try {
            await invoke('update_preferences', {
              updates: {
                folders: {
                  custom_folders: newFolders.filter(folder =>
                    !getDefaultFolders().some(defaultFolder => defaultFolder.path === folder.path)
                  )
                }
              }
            });
          } catch (error) {
            console.error('Failed to update folders:', error);
            // Revert UI state on error
            set({ folders: state.folders });
          }
        }
      }
    } catch (error) {
      console.error('Failed to add folder:', error);
    }
  },

  openFolder: async (path: string) => {
    try {
      await openFolder(path);
    } catch (error) {
      console.error('Failed to open folder:', error);
    }
  },

  removeFolder: (path: string) => {
    const state = get();
    const newFolders = state.folders.filter(folder => folder.path !== path);

    // Update UI state immediately
    set({ folders: newFolders });

    // Send to backend
    invoke('update_preferences', {
      updates: {
        folders: {
          custom_folders: newFolders.filter(folder =>
            !getDefaultFolders().some(defaultFolder => defaultFolder.path === folder.path)
          )
        }
      }
    }).catch(error => {
      console.error('Failed to update folders:', error);
      // Revert UI state on error
      set({ folders: state.folders });
    });
  },

  updateFolderIcon: async (path: string, iconData: string | null) => {
    const state = get();

    // Handle icon reset (same pattern as app store)
    if (iconData === null) {
      // Reset to default icon - remove from both file system and preferences
      try {
        const result = await invoke<string>('remove_custom_folder_icon', { folderPath: path });
        console.log(`Folder icon file removal result: ${result}`);
      } catch (fileError) {
        console.warn('Failed to remove custom folder icon file:', fileError);
        // Continue with the reset even if file removal fails
      }
    }

    const newFolders = state.folders.map(folder =>
      folder.path === path
        ? { ...folder, icon: iconData || undefined }
        : folder
    );

    // Update UI state immediately
    set({ folders: newFolders });

    // Send to backend
    try {
      const updates: any = {
        folders: {
          custom_folders: newFolders.filter(folder =>
            !getDefaultFolders().some(defaultFolder => defaultFolder.path === folder.path)
          )
        }
      };

      // Always include custom_icons in updates to handle both setting and resetting
      const customIcons: Record<string, string> = {};

      // If we have a custom icon, add it to the mapping
      if (iconData && iconData !== null) {
        // Calculate hash for the icon filename (same as backend)
        const hash = btoa(path).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
        customIcons[path] = `custom_icons/${hash}.png`;
      }
      // If resetting (iconData is null), customIcons will be empty, effectively removing the mapping

      updates.folders.custom_icons = customIcons;

      await invoke('update_preferences', { updates });
    } catch (error) {
      console.error('Failed to update folder icons:', error);
      // Revert UI state on error
      set({ folders: state.folders });
    }
  },

  updateFolderName: async (path: string, name: string | null) => {
    const state = get();
    const newCustomNames = { ...state.customNames };

    if (name) {
      // Setting a custom name
      newCustomNames[path] = name;
    } else {
      // Reset to original name - remove from custom names
      delete newCustomNames[path];
    }

    const newFolders = state.folders.map(folder =>
      folder.path === path
        ? { ...folder, name: name || folder.originalName }
        : folder
    );

    // Update UI state immediately
    set({
      customNames: newCustomNames,
      folders: newFolders
    });

    // Send to backend
    try {
      const updates: any = {
        folders: {
          custom_folders: newFolders.filter(folder =>
            !getDefaultFolders().some(defaultFolder => defaultFolder.path === folder.path)
          ),
          custom_names: newCustomNames
        }
      };

      await invoke('update_preferences', { updates });
    } catch (error) {
      console.error('Failed to update folder names:', error);
      // Revert UI state on error
      set({
        customNames: state.customNames,
        folders: state.folders
      });
    }
  },

  getFolder: (path: string) => {
    return get().folders.find(folder => folder.path === path);
  },

  initializeFolders: async () => {
    try {
      // Load preferences from backend
      const prefs = await invoke('get_preferences') as any;

      // Update UI state with loaded folder preferences
      if (prefs.folders?.custom_folders) {
        const customFolders = prefs.folders.custom_folders;
        const customIcons = prefs.folders.custom_icons || {};
        const customNames = prefs.folders.custom_names || {};
        const defaultFolders = getDefaultFolders();

        // Create a map of existing folders by path
        const folderMap = new Map<string, FolderInfo>();

        // Add default folders first
        defaultFolders.forEach(folder => {
          folderMap.set(folder.path, folder);
        });

        // Add or override with custom folders
        customFolders.forEach((folder: any) => {
          const folderInfo: FolderInfo = {
            name: customNames[folder.path] || folder.name,
            originalName: folder.name,
            path: folder.path,
            icon: customIcons[folder.path] || folder.icon
          };
          folderMap.set(folder.path, folderInfo);
        });

        set({
          folders: Array.from(folderMap.values()),
          customNames
        });
      }
    } catch (error) {
      console.error('Failed to initialize folders:', error);
      // Keep default state on error
    }
  },
}));