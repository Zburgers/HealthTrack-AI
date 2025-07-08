/**
 * Utility functions for responsive modal and dialog positioning
 * to ensure all UI elements stay within viewport bounds
 */

export interface ViewportDimensions {
  width: number;
  height: number;
}

export interface ResponsiveModalConfig {
  maxWidth: string;
  maxHeight: string;
  padding: string;
}

/**
 * Get responsive modal configuration based on viewport size
 */
export const getResponsiveModalConfig = (viewport: ViewportDimensions): ResponsiveModalConfig => {
  const { width, height } = viewport;
  
  // Mobile devices (< 640px)
  if (width < 640) {
    return {
      maxWidth: 'calc(100vw - 1rem)', // Small margin on mobile
      maxHeight: 'calc(100vh - 2rem)', // Leave space for safe areas
      padding: '0.5rem'
    };
  }
  
  // Tablets (640px - 1024px)
  if (width < 1024) {
    return {
      maxWidth: 'calc(90vw)',
      maxHeight: 'calc(90vh)',
      padding: '1rem'
    };
  }
  
  // Desktop (≥ 1024px)
  return {
    maxWidth: 'calc(80vw)',
    maxHeight: 'calc(85vh)',
    padding: '1.5rem'
  };
};

/**
 * Check if a given size would cause viewport overflow
 */
export const wouldOverflowViewport = (
  elementWidth: number,
  elementHeight: number,
  viewport: ViewportDimensions,
  margin: number = 32 // Default 2rem margin
): boolean => {
  return (
    elementWidth > viewport.width - margin ||
    elementHeight > viewport.height - margin
  );
};

/**
 * Calculate safe position for an element to prevent viewport overflow
 */
export const calculateSafePosition = (
  elementWidth: number,
  elementHeight: number,
  preferredX: number,
  preferredY: number,
  viewport: ViewportDimensions,
  margin: number = 16
): { x: number; y: number } => {
  let safeX = preferredX;
  let safeY = preferredY;
  
  // Ensure element doesn't overflow horizontally
  if (preferredX + elementWidth > viewport.width - margin) {
    safeX = viewport.width - elementWidth - margin;
  }
  if (safeX < margin) {
    safeX = margin;
  }
  
  // Ensure element doesn't overflow vertically
  if (preferredY + elementHeight > viewport.height - margin) {
    safeY = viewport.height - elementHeight - margin;
  }
  if (safeY < margin) {
    safeY = margin;
  }
  
  return { x: safeX, y: safeY };
};

/**
 * Hook to get current viewport dimensions with debounced updates
 */
export const useViewportDimensions = (debounceMs: number = 100) => {
  if (typeof window === 'undefined') {
    return { width: 1024, height: 768 };
  }
  
  const [dimensions, setDimensions] = React.useState<ViewportDimensions>({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  
  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const updateDimensions = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, debounceMs);
    };
    
    window.addEventListener('resize', updateDimensions);
    return () => {
      window.removeEventListener('resize', updateDimensions);
      clearTimeout(timeoutId);
    };
  }, [debounceMs]);
  
  return dimensions;
};

// Note: React import needed for the hook
import * as React from 'react';
