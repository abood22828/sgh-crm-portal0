import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { captureUTMParameters, getRegistrationSource } from '@/lib/tracking';

describe('UTM Tracking System', () => {
  // Mock sessionStorage
  const sessionStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      clear: () => {
        store = {};
      },
    };
  })();

  beforeEach(() => {
    // Replace sessionStorage with mock
    Object.defineProperty(window, 'sessionStorage', {
      value: sessionStorageMock,
      writable: true,
    });
    sessionStorageMock.clear();
  });

  afterEach(() => {
    sessionStorageMock.clear();
  });

  describe('captureUTMParameters', () => {
    it('should capture UTM parameters from URL', () => {
      // Mock window.location
      delete (window as any).location;
      window.location = {
        search: '?utm_source=facebook&utm_medium=cpc&utm_campaign=summer2024',
      } as any;

      captureUTMParameters();

      expect(sessionStorageMock.getItem('registration_source')).toBe('facebook');
    });

    it('should handle utm_source=instagram', () => {
      delete (window as any).location;
      window.location = {
        search: '?utm_source=instagram&utm_medium=story',
      } as any;

      captureUTMParameters();

      expect(sessionStorageMock.getItem('registration_source')).toBe('instagram');
    });

    it('should handle utm_source=telegram', () => {
      delete (window as any).location;
      window.location = {
        search: '?utm_source=telegram&utm_campaign=bot',
      } as any;

      captureUTMParameters();

      expect(sessionStorageMock.getItem('registration_source')).toBe('telegram');
    });

    it('should default to "direct" when no UTM parameters', () => {
      delete (window as any).location;
      window.location = {
        search: '',
      } as any;

      captureUTMParameters();

      expect(sessionStorageMock.getItem('registration_source')).toBe('direct');
    });

    it('should handle custom utm_source values', () => {
      delete (window as any).location;
      window.location = {
        search: '?utm_source=google_ads&utm_medium=cpc',
      } as any;

      captureUTMParameters();

      expect(sessionStorageMock.getItem('registration_source')).toBe('google_ads');
    });

    it('should not overwrite existing source in sessionStorage', () => {
      sessionStorageMock.setItem('registration_source', 'facebook');

      delete (window as any).location;
      window.location = {
        search: '?utm_source=instagram',
      } as any;

      captureUTMParameters();

      // Should keep the first source (facebook)
      expect(sessionStorageMock.getItem('registration_source')).toBe('facebook');
    });
  });

  describe('getRegistrationSource', () => {
    it('should return stored source from sessionStorage', () => {
      sessionStorageMock.setItem('registration_source', 'facebook');

      const source = getRegistrationSource();

      expect(source).toBe('facebook');
    });

    it('should return "direct" when no source is stored', () => {
      const source = getRegistrationSource();

      expect(source).toBe('direct');
    });

    it('should handle different source values', () => {
      const sources = ['facebook', 'instagram', 'telegram', 'google', 'direct'];

      sources.forEach((expectedSource) => {
        sessionStorageMock.clear();
        sessionStorageMock.setItem('registration_source', expectedSource);

        const source = getRegistrationSource();

        expect(source).toBe(expectedSource);
      });
    });
  });

  describe('Integration: Full tracking flow', () => {
    it('should capture UTM on page load and retrieve on form submit', () => {
      // Simulate page load with UTM parameters
      delete (window as any).location;
      window.location = {
        search: '?utm_source=facebook&utm_medium=ad&utm_campaign=winter2024',
      } as any;

      // Capture UTM (this would happen on page load)
      captureUTMParameters();

      // Later, when submitting form, retrieve source
      const source = getRegistrationSource();

      expect(source).toBe('facebook');
    });

    it('should persist source across multiple getRegistrationSource calls', () => {
      sessionStorageMock.setItem('registration_source', 'instagram');

      const source1 = getRegistrationSource();
      const source2 = getRegistrationSource();
      const source3 = getRegistrationSource();

      expect(source1).toBe('instagram');
      expect(source2).toBe('instagram');
      expect(source3).toBe('instagram');
    });
  });
});
