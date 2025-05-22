import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { open } from '@tauri-apps/api/dialog';
import { open as openFolder } from '@tauri-apps/api/shell';

interface FolderInfo {
  name: string;
  path: string;
}

interface FoldersState {
  folders: FolderInfo[];
  addFolder: () => Promise<void>;
  openFolder: (path: string) => Promise<void>;
  removeFolder: (path: string) => void;
}

export const useFoldersStore = create<FoldersState>()(
  persist(
    (set) => ({
      folders: [
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
      ],
      addFolder: async () => {
        try {
          const selected = await open({
            directory: true,
            multiple: false,
            title: 'Select Folder'
          });

          if (selected && !Array.isArray(selected)) {
            const name = selected.split('\\').pop() || selected;
            
            set((state) => ({
              folders: [...state.folders, { name, path: selected }]
            }));
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
    }),
    {
      name: 'folders-store',
      partialize: (state) => ({
        folders: state.folders
      }),
    }
  )
);