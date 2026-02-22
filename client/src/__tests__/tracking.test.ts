import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getRegistrationSource, getTrackingData, initializeTracking, saveTrackingData, getSavedTrackingData, getSourceDisplayName, getCompleteTrackingData } from '@/lib/tracking';

describe('UTM Tracking System', () => {
  // Store original location
  const originalLocation = window.location;

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    // Restore location
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
  });

  describe('getTrackingData', () => {
    it('should capture UTM parameters from URL', () => {
      delete (window as any).location;
      window.location = {
        ...originalLocation,
        search: '?utm_source=facebook&utm_medium=cpc&utm_campaign=summer2024',
      } as any;

      const data = getTrackingData();

      expect(data.source).toBe('facebook');
      expect(data.utmSource).toBe('facebook');
      expect(data.utmMedium).toBe('cpc');
      expect(data.utmCampaign).toBe('summer2024');
    });

    it('should handle utm_source=instagram', () => {
      delete (window as any).location;
      window.location = {
        ...originalLocation,
        search: '?utm_source=instagram&utm_medium=story',
      } as any;

      const data = getTrackingData();

      expect(data.source).toBe('instagram');
      expect(data.utmSource).toBe('instagram');
    });

    it('should handle utm_source=telegram', () => {
      delete (window as any).location;
      window.location = {
        ...originalLocation,
        search: '?utm_source=telegram&utm_campaign=bot',
      } as any;

      const data = getTrackingData();

      expect(data.source).toBe('telegram');
    });

    it('should default to "direct" when no UTM parameters', () => {
      delete (window as any).location;
      window.location = {
        ...originalLocation,
        search: '',
      } as any;

      const data = getTrackingData();

      expect(data.source).toBe('direct');
    });

    it('should handle custom utm_source values', () => {
      delete (window as any).location;
      window.location = {
        ...originalLocation,
        search: '?utm_source=google_ads&utm_medium=cpc',
      } as any;

      const data = getTrackingData();

      expect(data.source).toBe('google_ads');
    });

    it('should detect facebook from fbclid parameter', () => {
      delete (window as any).location;
      window.location = {
        ...originalLocation,
        search: '?fbclid=abc123',
      } as any;

      const data = getTrackingData();

      expect(data.source).toBe('facebook');
      expect(data.fbclid).toBe('abc123');
    });

    it('should detect google from gclid parameter', () => {
      delete (window as any).location;
      window.location = {
        ...originalLocation,
        search: '?gclid=xyz789',
      } as any;

      const data = getTrackingData();

      expect(data.source).toBe('google');
      expect(data.gclid).toBe('xyz789');
    });

    it('should include timestamp', () => {
      const data = getTrackingData();
      expect(data.timestamp).toBeGreaterThan(0);
    });
  });

  describe('getRegistrationSource', () => {
    it('should return stored source from localStorage', () => {
      const trackingData = {
        source: 'facebook',
        timestamp: Date.now(),
      };
      localStorage.setItem('tracking_data', JSON.stringify(trackingData));

      // With no URL params, should use saved data
      delete (window as any).location;
      window.location = {
        ...originalLocation,
        search: '',
      } as any;

      const source = getRegistrationSource();
      expect(source).toBe('facebook');
    });

    it('should return "direct" when no source is stored and no URL params', () => {
      delete (window as any).location;
      window.location = {
        ...originalLocation,
        search: '',
      } as any;

      const source = getRegistrationSource();
      expect(source).toBe('direct');
    });
  });

  describe('saveTrackingData and getSavedTrackingData', () => {
    it('should save and retrieve tracking data', () => {
      const data = {
        source: 'instagram',
        utmSource: 'instagram',
        utmMedium: 'story',
        timestamp: Date.now(),
      };

      saveTrackingData(data);
      const saved = getSavedTrackingData();

      expect(saved).not.toBeNull();
      expect(saved!.source).toBe('instagram');
      expect(saved!.utmSource).toBe('instagram');
    });

    it('should also save simple source for backward compatibility', () => {
      const data = {
        source: 'telegram',
        timestamp: Date.now(),
      };

      saveTrackingData(data);
      expect(localStorage.getItem('registration_source')).toBe('telegram');
    });
  });

  describe('getSourceDisplayName', () => {
    it('should return Arabic names for known sources', () => {
      expect(getSourceDisplayName('facebook')).toBe('فيسبوك');
      expect(getSourceDisplayName('instagram')).toBe('انستجرام');
      expect(getSourceDisplayName('whatsapp')).toBe('واتساب');
      expect(getSourceDisplayName('direct')).toBe('مباشر');
    });

    it('should return the original string for unknown sources', () => {
      expect(getSourceDisplayName('custom_source')).toBe('custom_source');
    });
  });
});
