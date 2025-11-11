/**
 * Slug Utility Functions
 * وظائف مساعدة لإدارة الروابط الودية (slugs)
 * 
 * This module provides utilities for generating and validating URL-friendly slugs
 * used throughout the application for offers, doctors, and camps landing pages.
 */

/**
 * Converts a string to a URL-friendly slug
 * تحويل نص إلى رابط ودي للـ URL
 * 
 * @param text - The text to convert (e.g., "OB/GYN Delivery Special")
 * @returns The slug (e.g., "ob-gyn-delivery-special")
 * 
 * @example
 * generateSlug("OB/GYN Delivery Special") // "ob-gyn-delivery-special"
 * generateSlug("General Surgery Camp 2025") // "general-surgery-camp-2025"
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase() // Convert to lowercase
    .trim() // Remove leading/trailing whitespace
    .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Converts a slug to a readable title
 * تحويل رابط إلى عنوان قابل للقراءة
 * 
 * @param slug - The slug string (e.g., "ob-gyn-delivery-special")
 * @returns The formatted title (e.g., "OB GYN Delivery Special")
 * 
 * @example
 * slugToTitle("ob-gyn-delivery-special") // "OB GYN Delivery Special"
 * slugToTitle("general-surgery-camp-2025") // "General Surgery Camp 2025"
 */
export function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Validates if a string is a valid slug format
 * التحقق من صحة صيغة الرابط
 * 
 * @param slug - The slug to validate
 * @returns true if valid, false otherwise
 * 
 * @example
 * isValidSlug("ob-gyn-delivery-special") // true
 * isValidSlug("Invalid Slug!") // false
 */
export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length > 0 && slug.length <= 255;
}

/**
 * Generates a unique slug by appending a number if the slug already exists
 * توليد رابط فريد بإضافة رقم إذا كان الرابط موجودًا بالفعل
 * 
 * @param baseSlug - The base slug (e.g., "ob-gyn-delivery-special")
 * @param existingSlugs - Array of existing slugs to check against
 * @returns A unique slug (e.g., "ob-gyn-delivery-special-2" if original exists)
 * 
 * @example
 * generateUniqueSlug("ob-gyn-delivery-special", ["ob-gyn-delivery-special"])
 * // Returns: "ob-gyn-delivery-special-2"
 */
export function generateUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  let counter = 2;
  let uniqueSlug = `${baseSlug}-${counter}`;

  while (existingSlugs.includes(uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }

  return uniqueSlug;
}
