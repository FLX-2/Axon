import React, { useEffect, useState, useRef } from 'react';
import { useUnifiedSettingsStore } from '../store/useUnifiedSettingsStore';
import { useUnifiedAppStore } from '../store/useUnifiedAppStore';

interface LoadingScreenProps {}

export const LoadingScreen: React.FC<LoadingScreenProps> = () => {
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get the accent color from the settings store
  const { colors, themeMode } = useUnifiedSettingsStore();
  const activeColors = themeMode === 'black' ? colors.black : (themeMode === 'dark' ? colors.dark : colors.light);
  const accentColor = activeColors.interactive.accent;

  // Get the actual loading state and icon progress
  const { isLoading, iconLoadingProgress } = useUnifiedAppStore();
  
  // Use real icon loading progress (no animation, instant update)
  useEffect(() => {
    setProgress(iconLoadingProgress);
  }, [iconLoadingProgress]);

  return (
    <div className="fixed inset-0 bg-surfacePrimary flex items-center justify-center z-[9999]">
      <div className="flex flex-col items-center w-full max-w-xs px-6">
        {/* Loading text */}
        <div className="mb-6 text-center">
          <p className="text-textPrimary text-xl font-medium">Loading apps</p>
        </div>
        
        {/* Progress bar */}
        <div className="w-full h-1.5 bg-surfaceSecondary rounded-full overflow-hidden mb-2">
          <div
            className="h-full transition-all duration-300 ease-out"
            style={{
              width: `${progress}%`,
              backgroundColor: accentColor
            }}
          ></div>
        </div>
        
        {/* Progress percentage */}
        <p className="text-textSecondary text-sm">
          {Math.round(progress)}%
        </p>
      </div>
    </div>
  );
};