import { useState, useEffect } from 'react';

/**
 * A hook that adds a minimum duration to a loading state
 * @param isLoading The actual loading state
 * @param minDuration The minimum duration in milliseconds
 * @returns The delayed loading state
 */
export function useDelayedLoading(isLoading: boolean, minDuration: number = 1000): boolean {
  const [delayedLoading, setDelayedLoading] = useState(isLoading);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(isLoading ? Date.now() : null);

  useEffect(() => {
    if (isLoading && !delayedLoading) {
      // Started loading
      setDelayedLoading(true);
      setLoadingStartTime(Date.now());
    } else if (!isLoading && delayedLoading) {
      // Finished loading, but check if minimum duration has passed
      if (loadingStartTime) {
        const elapsedTime = Date.now() - loadingStartTime;
        if (elapsedTime >= minDuration) {
          // Minimum duration has passed, update immediately
          setDelayedLoading(false);
        } else {
          // Wait for the remaining time
          const remainingTime = minDuration - elapsedTime;
          const timer = setTimeout(() => {
            setDelayedLoading(false);
          }, remainingTime);
          
          return () => clearTimeout(timer);
        }
      } else {
        // No start time recorded, update immediately
        setDelayedLoading(false);
      }
    }
  }, [isLoading, delayedLoading, loadingStartTime, minDuration]);

  return delayedLoading;
}