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
    <div className="fixed inset-0 bg-surfacePrimary flex flex-col items-center justify-center z-[9999]">
      <div className="w-full max-w-md px-8 py-12 flex flex-col items-center">
        {/* App logo */}
        <div className="mb-10 transform hover:scale-105 transition-transform duration-300">
          <img src="/icon.png" alt="Axon" className="w-24 h-24" />
        </div>
        
        {/* Progress bar */}
        <div className="w-full h-1.5 bg-surfaceSecondary rounded-full overflow-hidden mb-3">
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