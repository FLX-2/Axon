import React, { useState } from 'react';
import { Folder, FolderPlus } from 'lucide-react';
import { dialog } from '@tauri-apps/api';
import { invoke } from '@tauri-apps/api/tauri';
import { useUnifiedAppStore } from '../store/useUnifiedAppStore';
import { FolderContextMenu } from './FolderContextMenu';
import { InlineEditableText } from './InlineEditableText';
import { useUnifiedFolderStore } from '../store/useUnifiedFolderStore';
import { FolderInfo } from '../types/folder';

export const Folders: React.FC = () => {
  const { isGridView } = useUnifiedAppStore();
  const { folders, addFolder, removeFolder, updateFolderName } = useUnifiedFolderStore();
  const [contextMenu, setContextMenu] = useState<{
    folder: FolderInfo;
    position: { x: number; y: number };
  } | null>(null);
  const [editingFolderKey, setEditingFolderKey] = useState<string | null>(null);

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

  const startFolderRename = (key: string) => {
    setEditingFolderKey(key);
  };

  const cancelFolderRename = () => {
    setEditingFolderKey(null);
  };

  const saveFolderRename = async (path: string, newName: string) => {
    await updateFolderName(path, newName);
    setEditingFolderKey(null);
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
            : 'space-y-1'
          }
        `}>
          {folders.map((folder) => (
          <div
            key={folder.path}
            onContextMenu={(e) => handleContextMenu(e, folder)}
            className={`
              ${isGridView
                ? 'flex flex-col items-center p-4 aspect-[3/4]'
                : 'flex items-center w-full px-4 py-4'
              }
              bg-surfaceSecondary hover:bg-surfaceHover
              group
              transition-colors rounded-lg
              relative
              border border-border dark:border-transparent
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
                  <InlineEditableText
                    value={folder.name}
                    onSave={(newName) => saveFolderRename(folder.path, newName)}
                    onCancel={cancelFolderRename}
                    isEditing={editingFolderKey === `folders-${folders.indexOf(folder)}-${folder.path}`}
                    className="text-sm text-center text-textPrimary w-full"
                    placeholder="Enter folder name"
                  />
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
                  <InlineEditableText
                    value={folder.name}
                    onSave={(newName) => saveFolderRename(folder.path, newName)}
                    onCancel={cancelFolderRename}
                    isEditing={editingFolderKey === `folders-${folders.indexOf(folder)}-${folder.path}`}
                    className="text-sm text-textPrimary"
                    placeholder="Enter folder name"
                  />
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
            onRename={startFolderRename}
            section="folders"
            index={folders.indexOf(contextMenu.folder)}
          />
        </>
      )}
    </div>
  );
};