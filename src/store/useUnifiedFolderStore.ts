import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { open as openFolder } from '@tauri-apps/api/shell';
import { FolderInfo } from '../types/folder';

interface FolderState {
  folders: FolderInfo[];
  addFolder: () => Promise<void>;
  openFolder: (path: string) => Promise<void>;
  removeFolder: (path: string) => void;
  updateFolderIcon: (path: string, iconData: string | null) => Promise<void>;
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
          const newFolders = [...state.folders, { name, path: selected }];

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
    const newFolders = state.folders.map(folder =>
      folder.path === path
        ? { ...folder, icon: iconData || undefined }
        : folder
    );

    if (iconData === null) {
      // Reset to default icon - also remove the file from disk
      try {
        await invoke('remove_custom_folder_icon', { folderPath: path });
      } catch (fileError) {
        console.warn('Failed to remove custom folder icon file:', fileError);
        // Continue with the reset even if file removal fails
      }
    }

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
      console.error('Failed to update folder icons:', error);
      // Revert UI state on error
      set({ folders: state.folders });
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
        const defaultFolders = getDefaultFolders();

        // Create a map of existing folders by path
        const folderMap = new Map<string, FolderInfo>();

        // Add default folders first
        defaultFolders.forEach(folder => {
          folderMap.set(folder.path, folder);
        });

        // Add or override with custom folders
        customFolders.forEach((folder: FolderInfo) => {
          folderMap.set(folder.path, folder);
        });

        set({ folders: Array.from(folderMap.values()) });
      }
    } catch (error) {
      console.error('Failed to initialize folders:', error);
      // Keep default state on error
    }
  },
}));