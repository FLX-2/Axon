import React, { useRef } from 'react';
import { useFolderStore } from '../store/useFolderStore';

interface FolderIconUploadProps {
  folderPath: string;
  onClose: () => void;
}

export const FolderIconUpload: React.FC<FolderIconUploadProps> = ({ folderPath, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateFolderIcon = useFolderStore(state => state.updateFolderIcon);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64data = e.target?.result as string;
        
        // Just update the icon in the store directly
        updateFolderIcon(folderPath, base64data);
        
        // Close the menu
        onClose();
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to read file:', error);
    }
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        style={{ display: 'none' }}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full text-left px-2 py-1 hover:bg-buttonHover text-sm"
      >
        Custom Icon
      </button>
    </div>
  );
}; 