import { useState, useEffect } from "react";
import { useLocation } from "wouter";

interface NavigationState {
  isNavigating: boolean;
  previousPath: string | null;
  currentPath: string;
}

export function useNavigationLoading() {
  const [location] = useLocation();
  const [navigationState, setNavigationState] = useState<NavigationState>({
    isNavigating: false,
    previousPath: null,
    currentPath: location
  });

  useEffect(() => {
    if (location !== navigationState.currentPath) {
      // Start navigation loading
      setNavigationState(prev => ({
        isNavigating: true,
        previousPath: prev.currentPath,
        currentPath: location
      }));

      // End navigation loading after a short delay to allow components to load
      const timer = setTimeout(() => {
        setNavigationState(prev => ({
          ...prev,
          isNavigating: false
        }));
      }, 500); // Minimum loading time for smooth UX

      return () => clearTimeout(timer);
    }
  }, [location, navigationState.currentPath]);

  return {
    isNavigating: navigationState.isNavigating,
    previousPath: navigationState.previousPath,
    currentPath: navigationState.currentPath
  };
}