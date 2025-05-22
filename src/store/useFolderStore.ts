import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { FolderInfo } from '../types/folder';

interface FolderState {
  folders: FolderInfo[];
  addFolder: (folder: FolderInfo) => void;
  removeFolder: (path: string) => void;
  updateFolderIcon: (path: string, iconData: string) => void;
}

export const useFolderStore = create<FolderState>()(
  persist(
    (set) => ({
      folders: [],
      addFolder: (folder) => 
        set((state) => ({
          folders: [...state.folders, folder]
        })),
      removeFolder: (path) =>
        set((state) => ({
          folders: state.folders.filter(f => f.path !== path)
        })),
      updateFolderIcon: (path, iconData) =>
        set((state) => ({
          folders: state.folders.map(folder =>
            folder.path === path
              ? { ...folder, icon: iconData }
              : folder
          )
        })),
    }),
    {
      name: 'folder-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
); 