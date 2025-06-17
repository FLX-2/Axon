import React from 'react';
import { X, Minus, Square } from 'lucide-react';
import { appWindow } from '@tauri-apps/api/window';

export const Titlebar: React.FC = () => {
  return (
    <div 
      data-tauri-drag-region 
      className="h-8 flex justify-between items-center bg-surfaceSecondary border-b border-border"
    >
      <div className="px-3 flex items-center">
        <img src="/icon.png" alt="Axon" className="w-4 h-4" />
      </div>
      <div className="flex">
        <button
          onClick={() => appWindow.minimize()}
          className="h-8 w-12 flex items-center justify-center hover:bg-buttonHover"
        >
          <Minus className="w-4 h-4 text-iconSecondary" />
        </button>
        <button
          onClick={() => appWindow.toggleMaximize()}
          className="h-8 w-12 flex items-center justify-center hover:bg-buttonHover"
        >
          <Square className="w-4 h-4 text-iconSecondary" />
        </button>
        <button
          onClick={() => appWindow.hide()}
          className="h-8 w-12 flex items-center justify-center hover:bg-buttonHover text-red-500"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};