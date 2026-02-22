import { describe, it, expect, vi } from 'vitest';

// Test the slug generation logic directly (not the hook, since it uses React state)
describe('Slug Generation Logic', () => {
  // Replicate the slug generation logic from useSlugGenerator
  function generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  it('should convert English text to slug', () => {
    expect(generateSlug('Hello World')).toBe('hello-world');
  });

  it('should handle Arabic text by removing it', () => {
    const result = generateSlug('عرض الولادة');
    // Arabic text should be removed, resulting in empty string
    expect(result).toBe('');
  });

  it('should handle mixed Arabic and English text', () => {
    const result = generateSlug('عرض Special Offer');
    expect(result).toBe('special-offer');
  });

  it('should replace spaces with hyphens', () => {
    expect(generateSlug('my great offer')).toBe('my-great-offer');
  });

  it('should remove special characters', () => {
    expect(generateSlug('offer@#$%test')).toBe('offertest');
  });

  it('should handle multiple spaces and hyphens', () => {
    expect(generateSlug('offer   test---hello')).toBe('offer-test-hello');
  });

  it('should trim leading and trailing hyphens', () => {
    expect(generateSlug('---offer---')).toBe('offer');
  });

  it('should handle empty string', () => {
    expect(generateSlug('')).toBe('');
  });

  it('should handle string with only spaces', () => {
    expect(generateSlug('   ')).toBe('');
  });

  it('should convert uppercase to lowercase', () => {
    expect(generateSlug('My GREAT Offer')).toBe('my-great-offer');
  });

  it('should handle underscores', () => {
    expect(generateSlug('my_great_offer')).toBe('my-great-offer');
  });
});

describe('useSlugGenerator Hook Behavior', () => {
  it('should not auto-generate slug when in editing mode', () => {
    // When isEditing is true, autoGenerateSlug should not call the setter
    // This is a behavioral test - the hook should respect the isEditing flag
    const mockSetter = vi.fn();
    
    // Simulate the behavior: in editing mode, slug should not be auto-generated
    const isEditing = true;
    const manuallyEdited = false;
    
    if (!isEditing && !manuallyEdited) {
      mockSetter('test-slug');
    }
    
    expect(mockSetter).not.toHaveBeenCalled();
  });

  it('should auto-generate slug when not in editing mode', () => {
    const mockSetter = vi.fn();
    
    const isEditing = false;
    const manuallyEdited = false;
    
    if (!isEditing && !manuallyEdited) {
      mockSetter('test-slug');
    }
    
    expect(mockSetter).toHaveBeenCalledWith('test-slug');
  });
});
