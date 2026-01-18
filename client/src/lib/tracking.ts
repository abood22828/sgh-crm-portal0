/**
 * Utility functions for tracking user sources via UTM parameters
 */

const UTM_SOURCE_KEY = 'utm_source';
const SOURCE_STORAGE_KEY = 'registration_source';

/**
 * Get UTM source from URL query parameters
 */
export function getUtmSource(): string | null {
  if (typeof window === 'undefined') return null;
  
  const params = new URLSearchParams(window.location.search);
  return params.get(UTM_SOURCE_KEY);
}

/**
 * Save source to localStorage
 */
export function saveSource(source: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(SOURCE_STORAGE_KEY, source);
  } catch (error) {
    console.error('Failed to save source to localStorage:', error);
  }
}

/**
 * Get saved source from localStorage
 */
export function getSavedSource(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    return localStorage.getItem(SOURCE_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to get source from localStorage:', error);
    return null;
  }
}

/**
 * Get current registration source
 * Priority: UTM parameter > Saved source > 'direct'
 */
export function getRegistrationSource(): string {
  // Check for UTM parameter first
  const utmSource = getUtmSource();
  if (utmSource) {
    // Save for future use
    saveSource(utmSource);
    return utmSource;
  }
  
  // Check saved source
  const savedSource = getSavedSource();
  if (savedSource) {
    return savedSource;
  }
  
  // Default to 'direct' for direct visitors
  return 'direct';
}

/**
 * Initialize tracking on page load
 * Call this in App.tsx or main.tsx
 */
export function initializeTracking(): void {
  if (typeof window === 'undefined') return;
  
  const utmSource = getUtmSource();
  if (utmSource) {
    saveSource(utmSource);
  }
}
