import React, { useState, useEffect, useRef } from 'react';
import { Trash2, ChevronRight, ChevronLeft } from 'lucide-react';
import { FolderInfo } from '../types/folder';
import { invoke } from '@tauri-apps/api/tauri';
import { useFolderStore } from '../store/useFolderStore';

interface FolderContextMenuProps {
  folder: FolderInfo;
  onClose: () => void;
  position: { x: number; y: number };
  onRemove: (path: string) => void;
}

export const FolderContextMenu: React.FC<FolderContextMenuProps> = ({ 
  folder, 
  onClose, 
  position, 
  onRemove
}) => {
  const [showIconMenu, setShowIconMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const updateFolderIcon = useFolderStore(state => state.updateFolderIcon);

  // Calculate if we need to flip the menu direction
  const [menuPosition, setMenuPosition] = useState({ x: position.x, y: position.y });
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [flipVertical, setFlipVertical] = useState(false);

  useEffect(() => {
    const calculateMenuPosition = () => {
      const menuWidth = 160; // Main menu width
      const subMenuWidth = 140; // Sub menu width
      const menuHeight = menuRef.current?.offsetHeight || 0;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      let x = position.x;
      let y = position.y;
      const needsHorizontalFlip = x + menuWidth + subMenuWidth > windowWidth;
      const needsVerticalFlip = y + menuHeight > windowHeight;

      // Adjust horizontal position if needed
      if (needsHorizontalFlip) {
        x = Math.max(subMenuWidth, x - menuWidth);
      }

      // Adjust vertical position if needed
      if (needsVerticalFlip) {
        y = Math.max(0, windowHeight - menuHeight);
      }

      setMenuPosition({ x, y });
      setFlipHorizontal(needsHorizontalFlip);
      setFlipVertical(needsVerticalFlip);
    };

    calculateMenuPosition();
  }, [position]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleRemoveIcon = async () => {
    try {
      // Still call the backend to remove any custom icon files
      await invoke<string>('remove_custom_icon', { appPath: folder.path });
      // But set the icon to null instead of using the returned system icon
      // This will make it use the generic Lucide-React Folder icon
      updateFolderIcon(folder.path, null);
      onClose();
    } catch (error) {
      console.error('Failed to remove custom icon:', error);
    }
  };

  const subMenuStyle = {
    minWidth: '140px',
    ...(flipHorizontal ? { right: '100%', left: 'auto' } : { left: '100%' }),
    ...(flipVertical ? { bottom: '0' } : { top: '0' })
  };

  return (
    <div 
      ref={menuRef}
      className="fixed z-50 bg-surfaceSecondary border border-border rounded shadow-lg"
      style={{ 
        left: menuPosition.x, 
        top: menuPosition.y,
        minWidth: '160px' 
      }}
    >
      {/* Icon Management */}
      <div className="relative">
        <button
          className="w-full text-left px-2 py-1 hover:bg-buttonHover text-sm flex items-center justify-between"
          onMouseEnter={() => setShowIconMenu(true)}
          onMouseLeave={() => setShowIconMenu(false)}
        >
          <span>Set Icon</span>
          {flipHorizontal ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {showIconMenu && (
          <div 
            className="absolute bg-surfaceSecondary border border-border rounded shadow-lg"
            style={subMenuStyle}
            onMouseEnter={() => setShowIconMenu(true)}
            onMouseLeave={() => setShowIconMenu(false)}
          >
            <button
              className="w-full text-left px-2 py-1 hover:bg-buttonHover text-sm"
              onClick={() => {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'image/*';
                fileInput.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = async (e) => {
                      const base64data = e.target?.result as string;
                      try {
                        await invoke('save_custom_icon', { appPath: folder.path, iconData: base64data });
                        updateFolderIcon(folder.path, base64data);
                        onClose();
                      } catch (error) {
                        console.error('Failed to save custom icon:', error);
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                };
                fileInput.click();
              }}
            >
              Custom Icon
            </button>
            <button
              className="w-full text-left px-2 py-1 hover:bg-buttonHover text-sm"
              onClick={handleRemoveIcon}
            >
              Reset Icon
            </button>
          </div>
        )}
      </div>
      
      <button
        className="w-full text-left px-2 py-1 hover:bg-buttonHover text-sm flex items-center gap-2 text-red-500"
        onClick={() => {
          onRemove(folder.path);
          onClose();
        }}
      >
        <Trash2 className="w-4 h-4" />
        <span>Remove Folder</span>
      </button>
    </div>
  );
};