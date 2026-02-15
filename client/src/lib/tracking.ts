/**
 * Utility functions for tracking user sources via UTM parameters, referrer, and click IDs
 * نظام تتبع شامل لمصادر الزوار والحجوزات
 */

// Storage keys
const SOURCE_STORAGE_KEY = 'registration_source';
const TRACKING_DATA_KEY = 'tracking_data';

/**
 * Interface for complete tracking data
 */
export interface TrackingData {
  source: string; // Main source identifier
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  utmPlacement?: string;
  referrer?: string;
  fbclid?: string; // Facebook Click ID
  gclid?: string; // Google Click ID
  timestamp: number;
}

/**
 * Get all URL parameters
 */
function getUrlParams(): URLSearchParams {
  if (typeof window === 'undefined') return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

/**
 * Get referrer domain
 */
function getReferrerDomain(): string | null {
  if (typeof window === 'undefined' || !document.referrer) return null;
  
  try {
    const url = new URL(document.referrer);
    return url.hostname;
  } catch {
    return null;
  }
}

/**
 * Detect source from referrer
 */
function detectSourceFromReferrer(): string | null {
  const referrer = getReferrerDomain();
  if (!referrer) return null;
  
  // Social media platforms
  if (referrer.includes('facebook.com') || referrer.includes('fb.com')) return 'facebook';
  if (referrer.includes('instagram.com')) return 'instagram';
  if (referrer.includes('twitter.com') || referrer.includes('t.co')) return 'twitter';
  if (referrer.includes('linkedin.com')) return 'linkedin';
  if (referrer.includes('tiktok.com')) return 'tiktok';
  if (referrer.includes('youtube.com')) return 'youtube';
  
  // Search engines
  if (referrer.includes('google.com')) return 'google';
  if (referrer.includes('bing.com')) return 'bing';
  if (referrer.includes('yahoo.com')) return 'yahoo';
  
  // Messaging apps
  if (referrer.includes('whatsapp.com') || referrer.includes('wa.me')) return 'whatsapp';
  if (referrer.includes('telegram.org') || referrer.includes('t.me')) return 'telegram';
  
  // Other referrer
  return 'referral';
}

/**
 * Get comprehensive tracking data from current URL and context
 */
export function getTrackingData(): TrackingData {
  const params = getUrlParams();
  
  // Get UTM parameters
  const utmSource = params.get('utm_source') || undefined;
  const utmMedium = params.get('utm_medium') || undefined;
  const utmCampaign = params.get('utm_campaign') || undefined;
  const utmContent = params.get('utm_content') || undefined;
  const utmTerm = params.get('utm_term') || undefined;
  const utmPlacement = params.get('utm_placement') || undefined;
  
  // Get click IDs
  const fbclid = params.get('fbclid') || undefined;
  const gclid = params.get('gclid') || undefined;
  
  // Get referrer
  const referrer = document.referrer || undefined;
  
  // Determine main source with priority:
  // 1. UTM source (most reliable)
  // 2. Facebook Click ID → facebook
  // 3. Google Click ID → google
  // 4. Referrer detection
  // 5. Direct
  let source = 'direct';
  
  if (utmSource) {
    source = utmSource;
  } else if (fbclid) {
    source = 'facebook';
  } else if (gclid) {
    source = 'google';
  } else {
    const detectedSource = detectSourceFromReferrer();
    if (detectedSource) {
      source = detectedSource;
    }
  }
  
  return {
    source,
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent,
    utmTerm,
    utmPlacement,
    referrer,
    fbclid,
    gclid,
    timestamp: Date.now(),
  };
}

/**
 * Save tracking data to localStorage
 */
export function saveTrackingData(data: TrackingData): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(TRACKING_DATA_KEY, JSON.stringify(data));
    // Also save simple source for backward compatibility
    localStorage.setItem(SOURCE_STORAGE_KEY, data.source);
  } catch (error) {
    console.error('Failed to save tracking data to localStorage:', error);
  }
}

/**
 * Get saved tracking data from localStorage
 */
export function getSavedTrackingData(): TrackingData | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const saved = localStorage.getItem(TRACKING_DATA_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to get tracking data from localStorage:', error);
  }
  
  return null;
}

/**
 * Get current registration source (simplified)
 * Returns the main source identifier
 */
export function getRegistrationSource(): string {
  // Check for new tracking data first
  const currentData = getTrackingData();
  
  // If we have UTM or click IDs in URL, use current data
  if (currentData.utmSource || currentData.fbclid || currentData.gclid || currentData.referrer) {
    saveTrackingData(currentData);
    return currentData.source;
  }
  
  // Otherwise, check saved data
  const savedData = getSavedTrackingData();
  if (savedData) {
    return savedData.source;
  }
  
  // Default to direct
  return 'direct';
}

/**
 * Get complete tracking data for registration
 * Use this when submitting forms to capture all tracking information
 */
export function getCompleteTrackingData(): TrackingData {
  // Try to get current tracking data
  const currentData = getTrackingData();
  
  // If we have fresh tracking data (UTM, click IDs, or referrer), use it
  if (currentData.utmSource || currentData.fbclid || currentData.gclid || currentData.referrer) {
    saveTrackingData(currentData);
    return currentData;
  }
  
  // Otherwise, use saved data if available
  const savedData = getSavedTrackingData();
  if (savedData) {
    return savedData;
  }
  
  // Return current data (which will be 'direct')
  return currentData;
}

/**
 * Initialize tracking on page load
 * Call this in App.tsx or main.tsx
 */
export function initializeTracking(): void {
  if (typeof window === 'undefined') return;
  
  const trackingData = getTrackingData();
  
  // Only save if we have meaningful tracking data
  if (trackingData.utmSource || trackingData.fbclid || trackingData.gclid || trackingData.referrer) {
    saveTrackingData(trackingData);
  }
}

/**
 * Get human-readable source name in Arabic
 */
export function getSourceDisplayName(source: string): string {
  const sourceMap: Record<string, string> = {
    'facebook': 'فيسبوك',
    'instagram': 'انستجرام',
    'google': 'جوجل',
    'whatsapp': 'واتساب',
    'telegram': 'تيليجرام',
    'twitter': 'تويتر',
    'linkedin': 'لينكد إن',
    'tiktok': 'تيك توك',
    'youtube': 'يوتيوب',
    'bing': 'بينج',
    'yahoo': 'ياهو',
    'direct': 'مباشر',
    'referral': 'إحالة',
    'email': 'بريد إلكتروني',
    'sms': 'رسالة نصية',
    'phone': 'هاتف',
    'manual': 'يدوي',
  };
  
  return sourceMap[source.toLowerCase()] || source;
}
