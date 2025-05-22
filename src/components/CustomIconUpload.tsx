import React, { useRef } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { useAppStore } from '../store/useAppStore';

interface CustomIconUploadProps {
  appPath: string;
  onClose: () => void;
}

export const CustomIconUpload: React.FC<CustomIconUploadProps> = ({ appPath, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateAppIcon = useAppStore(state => state.updateAppIcon);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64data = e.target?.result as string;
        
        try {
          // First update the icon in the store to prevent UI flicker
          updateAppIcon(appPath, base64data);
          
          // Then save the custom icon on the backend
          await invoke('save_custom_icon', {
            appPath,
            iconData: base64data
          });
          
          // Close the menu
          onClose();
        } catch (error) {
          console.error('Failed to save custom icon:', error);
          // If backend save fails, we could potentially revert the icon here
          // but for now we'll just log the error
        }
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