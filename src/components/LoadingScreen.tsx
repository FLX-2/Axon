import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Loading apps...' 
}) => {
  return (
    <div className="fixed inset-0 bg-surfacePrimary bg-opacity-90 flex flex-col items-center justify-center z-[9999] backdrop-blur-sm">
      <div className="bg-surfaceSecondary p-8 rounded-lg shadow-lg flex flex-col items-center">
        <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
        <p className="text-textPrimary text-lg font-medium">{message}</p>
      </div>
    </div>
  );
};