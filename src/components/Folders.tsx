import React, { useState } from 'react';
import { Folder, FolderPlus } from 'lucide-react';
import { dialog } from '@tauri-apps/api';
import { invoke } from '@tauri-apps/api/tauri';
import { useUnifiedAppStore } from '../store/useUnifiedAppStore';
import { FolderContextMenu } from './FolderContextMenu';
import { useUnifiedFolderStore } from '../store/useUnifiedFolderStore';
import { FolderInfo } from '../types/folder';

export const Folders: React.FC = () => {
  const { isGridView } = useUnifiedAppStore();
  const { folders, addFolder, removeFolder } = useUnifiedFolderStore();
  const [contextMenu, setContextMenu] = useState<{
    folder: FolderInfo;
    position: { x: number; y: number };
  } | null>(null);

  const handleAddFolder = async () => {
    try {
      await addFolder();
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
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-textSecondary">Folders</h2>
      </div>

      {folders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-surfaceHover rounded-lg flex items-center justify-center mb-4">
            <Folder className="w-8 h-8 text-iconSecondary" />
          </div>
          <h3 className="text-lg font-medium text-textPrimary mb-2">No folders yet</h3>
          <p className="text-sm text-textSecondary mb-4">
            Add your first folder using the button above
          </p>
        </div>
      ) : (
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
      )}

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