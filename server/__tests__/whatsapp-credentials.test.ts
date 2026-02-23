import { describe, it, expect } from 'vitest';

describe('WhatsApp API Credentials', () => {
  it('should have META_ACCESS_TOKEN set', () => {
    const token = process.env.META_ACCESS_TOKEN;
    expect(token).toBeDefined();
    expect(token!.length).toBeGreaterThan(50);
    expect(token).toMatch(/^EAA/); // Meta access tokens start with EAA
  });

  it('should have WHATSAPP_PHONE_NUMBER_ID set', () => {
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    expect(phoneId).toBeDefined();
    expect(phoneId).toBe('1041261595730760');
  });

  it('should validate META_ACCESS_TOKEN against Graph API', async () => {
    const token = process.env.META_ACCESS_TOKEN;
    if (!token) {
      throw new Error('META_ACCESS_TOKEN is not set');
    }

    const response = await fetch(
      `https://graph.facebook.com/v21.0/me?access_token=${token}`
    );
    const data = await response.json() as any;
    
    // Should return user info, not an error
    expect(response.ok).toBe(true);
    expect(data.id).toBeDefined();
    expect(data.error).toBeUndefined();
  });

  it('should validate WHATSAPP_PHONE_NUMBER_ID against Graph API', async () => {
    const token = process.env.META_ACCESS_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    if (!token || !phoneId) {
      throw new Error('Credentials not set');
    }

    const response = await fetch(
      `https://graph.facebook.com/v21.0/${phoneId}?fields=display_phone_number,platform_type,verified_name&access_token=${token}`
    );
    const data = await response.json() as any;
    
    expect(response.ok).toBe(true);
    expect(data.display_phone_number).toContain('967');
    expect(data.platform_type).toBe('CLOUD_API');
    expect(data.error).toBeUndefined();
  });
});
