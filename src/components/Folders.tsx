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
            <Folder className="w-8 h-8 text-iconDefault" />
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
            onClick={() => handleOpenFolder(folder.path)}
            className={`
              ${isGridView
                ? 'flex flex-col items-center p-4 aspect-[3/4] overflow-hidden'
                : 'flex items-center w-full px-4 py-4'
              }
              bg-surfaceSecondary
              ${!isGridView ? 'hover:bg-surfaceHover' : ''}
              group
              transition-colors rounded-lg
              relative
              border border-border dark:border-transparent
            `}
          >
            {isGridView ? (
              <>
                {/* Top 40% background - matches input background color */}
                <div 
                  className="absolute top-0 left-0 right-0 rounded-t-lg bg-inputBg" 
                  style={{ 
                    height: '40%',
                    zIndex: 0,
                    opacity: 0.8,
                  }} 
                />

                {/* Hover overlay that covers entire card */}
                <div className="absolute inset-0 bg-surfaceHover opacity-0 group-hover:opacity-30 transition-opacity rounded-lg" style={{ zIndex: 1 }} />

                {/* Blurred background layer - 40% height */}
                {folder.icon && (
                  <div 
                    className="absolute top-0 left-0 right-0 overflow-hidden rounded-t-lg"
                    style={{ 
                      height: '40%',
                      zIndex: 2 
                    }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `url(${folder.icon})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'blur(40px)',
                        opacity: 0.1,
                        transform: 'scale(1.2)',
                      }}
                    />
                  </div>
                )}

                {/* Icon centered on the 40/60 dividing line */}
                <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center" style={{ zIndex: 4 }}>
                  {folder.icon ? (
                    <img 
                      src={folder.icon} 
                      alt={folder.name}
                      className="w-[88px] h-[88px] app-icon"
                    />
                  ) : (
                    <div className="w-[88px] h-[88px] bg-surfaceHover rounded-lg flex items-center justify-center">
                      <Folder className="w-9 h-9 text-iconDefault" />
                    </div>
                  )}
                </div>

                {/* Text in the bottom area */}
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center pb-4 px-3" style={{ zIndex: 2, top: 'calc(40% + 50px)' }}>
                  <InlineEditableText
                    value={folder.name}
                    onSave={(newName) => saveFolderRename(folder.path, newName)}
                    onCancel={cancelFolderRename}
                    isEditing={editingFolderKey === `folders-${folders.indexOf(folder)}-${folder.path}`}
                    className="text-sm text-center text-textPrimary w-full font-medium"
                    placeholder="Enter folder name"
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3 flex-grow">
                {folder.icon ? (
                  <img 
                    src={folder.icon} 
                    alt={folder.name}
                    className="w-8 h-8 app-icon"
                  />
                ) : (
                  <div className="w-8 h-8 bg-surfaceHover rounded-lg flex items-center justify-center">
                    <Folder className="w-5 h-5 text-iconDefault" />
                  </div>
                )}
                <InlineEditableText
                  value={folder.name}
                  onSave={(newName) => saveFolderRename(folder.path, newName)}
                  onCancel={cancelFolderRename}
                  isEditing={editingFolderKey === `folders-${folders.indexOf(folder)}-${folder.path}`}
                  className="text-sm text-textPrimary font-medium"
                  placeholder="Enter folder name"
                />
              </div>
            )}
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