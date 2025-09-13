import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { open } from '@tauri-apps/api/dialog';
import { open as openFolder } from '@tauri-apps/api/shell';
import { FolderInfo } from '../types/folder';
import { storageManager } from '../lib/storageManager';

interface FolderState {
  folders: FolderInfo[];
  addFolder: () => Promise<void>;
  openFolder: (path: string) => Promise<void>;
  removeFolder: (path: string) => void;
  updateFolderIcon: (path: string, iconData: string) => void;
  getFolder: (path: string) => FolderInfo | undefined;
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

// Default folders for quick access
const getDefaultFolders = (): FolderInfo[] => [
  {
    name: "Documents",
    path: "C:\\Users\\User\\Documents"
  },
  {
    name: "Downloads",
    path: "C:\\Users\\User\\Downloads"
  },
  {
    name: "Pictures",
    path: "C:\\Users\\User\\Pictures"
  },
  {
    name: "Music",
    path: "C:\\Users\\User\\Music"
  },
  {
    name: "Videos",
    path: "C:\\Users\\User\\Videos"
  }
];

export const useUnifiedFolderStore = create<FolderState>()(
  persist(
    (set, get) => ({
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
              set((state) => ({
                folders: [...state.folders, { name, path: selected }]
              }));
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
        set((state) => ({
          folders: state.folders.filter(folder => folder.path !== path)
        }));
      },

      updateFolderIcon: (path: string, iconData: string) => {
        set((state) => ({
          folders: state.folders.map(folder =>
            folder.path === path
              ? { ...folder, icon: iconData }
              : folder
          )
        }));
      },

      getFolder: (path: string) => {
        return get().folders.find(folder => folder.path === path);
      }
    }),
    {
      name: 'folders',
      storage: createJSONStorage(createUnifiedStorage),
      partialize: (state) => ({
        folders: state.folders
      }),
      merge: (persistedState: any, currentState) => {
        // If no persisted state, use current state
        if (!persistedState) {
          return currentState;
        }

        // Merge persisted folders with defaults, avoiding duplicates
        const persistedFolders = persistedState.folders || [];
        const defaultFolders = getDefaultFolders();

        // Create a map of existing folders by path
        const folderMap = new Map<string, FolderInfo>();

        // Add default folders first
        defaultFolders.forEach(folder => {
          folderMap.set(folder.path, folder);
        });

        // Add or override with persisted folders
        persistedFolders.forEach((folder: FolderInfo) => {
          folderMap.set(folder.path, folder);
        });

        return {
          ...currentState,
          folders: Array.from(folderMap.values())
        };
      },
    }
  )
);