import React, { useEffect, useState, useRef } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAppStore } from '../store/useAppStore';

interface LoadingScreenProps {}

export const LoadingScreen: React.FC<LoadingScreenProps> = () => {
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get the accent color from the settings store
  const { colors, themeMode } = useSettingsStore();
  const activeColors = themeMode === 'dark' || themeMode === 'black' ? colors.dark : colors.light;
  const accentColor = activeColors.accent;
  
  // Get the actual loading state
  const { isLoading } = useAppStore();
  
  // Simulate progress with acceleration when actual loading completes
  useEffect(() => {
    // Clear any existing interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    // Set up the progress simulation
    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        // If actual loading is complete, accelerate progress
        if (!isLoading) {
          // Accelerate based on how far we are from 100%
          const remainingProgress = 100 - prev;
          const increment = Math.max(remainingProgress * 0.2, 5); // At least 5% or 20% of remaining
          const newProgress = prev + increment;
          return newProgress > 100 ? 100 : newProgress;
        } else {
          // Normal progress during loading
          const newProgress = prev + (Math.random() * 3);
          return newProgress > 95 ? 95 : newProgress; // Cap at 95% during actual loading
        }
      });
    }, isLoading ? 150 : 50); // Faster updates when loading is complete
    
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isLoading]);

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