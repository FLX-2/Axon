import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {}

export const LoadingScreen: React.FC<LoadingScreenProps> = () => {
  const [progress, setProgress] = useState(0);
  
  // Simulate progress
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (Math.random() * 5);
        return newProgress > 100 ? 100 : newProgress;
      });
    }, 150);
    
    return () => clearInterval(interval);
  }, []);

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
            className="h-full bg-textSecondary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
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