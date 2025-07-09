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
      reader.onload = (e) => {
        const img = new Image();
        img.onload = async () => {
          const MAX_WIDTH = 128;
          const MAX_HEIGHT = 128;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const base64data = canvas.toDataURL(file.type);

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
        img.src = e.target?.result as string;
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