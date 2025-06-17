import React, { useState } from 'react';
import { Folder, FolderPlus } from 'lucide-react';
import { dialog } from '@tauri-apps/api';
import { invoke } from '@tauri-apps/api/tauri';
import { useAppStore } from '../store/useAppStore';
import { FolderContextMenu } from './FolderContextMenu';
import { useFolderStore } from '../store/useFolderStore';
import { FolderInfo } from '../types/folder';

export const Folders: React.FC = () => {
  const { isGridView } = useAppStore();
  const { folders, addFolder, removeFolder } = useFolderStore();
  const [contextMenu, setContextMenu] = useState<{
    folder: FolderInfo;
    position: { x: number; y: number };
  } | null>(null);

  const handleAddFolder = async () => {
    try {
      const selected = await dialog.open({
        directory: true,
        multiple: false,
        title: 'Select Folder'
      });

      if (selected && typeof selected === 'string') {
        const folderPath = selected;
        const folderName = folderPath.split('\\').pop() || folderPath;
        
        addFolder({
          name: folderName,
          path: folderPath
        });
      }
    } catch (error) {
      console.error('Failed to add folder:', error);
    }
  };

  const handleOpenFolder = async (path: string) => {
    try {
      await invoke('shell_open', { path });
    } catch (error) {
      console.error('Failed to open folder:', error);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, folder: FolderInfo) => {
    e.preventDefault();
    setContextMenu({
      folder,
      position: { x: e.clientX, y: e.clientY }
    });
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-textSecondary">Folders</h2>
        <button
          onClick={handleAddFolder}
          className="p-2 hover:bg-surfaceHover rounded-lg transition-colors"
          title="Add folder"
        >
          <FolderPlus className="w-5 h-5 text-iconPrimary hover:text-iconSecondary" />
        </button>
      </div>

      <div className={`
        ${isGridView 
          ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4' 
          : 'space-y-2'
        }
      `}>
        {folders.map((folder) => (
          <div
            key={folder.path}
            onContextMenu={(e) => handleContextMenu(e, folder)}
            className={`
              ${isGridView
                ? 'flex flex-col items-center p-4 aspect-[3/4] bg-surfaceSecondary hover:bg-surfaceHover'
                : 'flex items-center w-full px-4 py-2 hover:bg-surfaceHover'
              }
              group
              transition-colors rounded-lg
              relative
            `}
          >
            <button
              onClick={() => handleOpenFolder(folder.path)}
              className={isGridView ? "flex-1 flex flex-col items-center justify-center w-full" : "flex items-center space-x-3 flex-grow"}
            >
              {isGridView ? (
                <>
                  {folder.icon ? (
                    <img 
                      src={folder.icon} 
                      alt={folder.name}
                      className="w-20 h-20 mb-4 app-icon"
                    />
                  ) : (
                    <div className="w-20 h-20 mb-4 bg-surfaceHover rounded-lg flex items-center justify-center">
                      <Folder className="w-8 h-8 text-iconSecondary" />
                    </div>
                  )}
                  <span className="text-sm text-center text-textPrimary">{folder.name}</span>
                </>
              ) : (
                <>
                  {folder.icon ? (
                    <img 
                      src={folder.icon} 
                      alt={folder.name}
                      className="w-8 h-8 app-icon"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-surfaceHover rounded-lg flex items-center justify-center">
                      <Folder className="w-5 h-5 text-iconSecondary" />
                    </div>
                  )}
                  <span className="text-sm text-textPrimary">{folder.name}</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <FolderContextMenu
            folder={contextMenu.folder}
            position={contextMenu.position}
            onClose={() => setContextMenu(null)}
            onRemove={removeFolder}
          />
        </>
      )}
    </div>
  );
};