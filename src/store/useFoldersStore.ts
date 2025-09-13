import { create } from 'zustand';
import { open } from '@tauri-apps/api/dialog';
import { open as openFolder } from '@tauri-apps/api/shell';
import { FolderInfo } from '../types/folder';

interface FolderState {
  folders: FolderInfo[];
  addFolder: () => Promise<void>;
  openFolder: (path: string) => Promise<void>;
  removeFolder: (path: string) => void;
  updateFolderIcon: (path: string, iconData: string) => void;
  getFolder: (path: string) => FolderInfo | undefined;
}

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

export const useFoldersStore = create<FolderState>((set, get) => ({
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
}));