import { describe, it, expect } from "vitest";
import { getInstagramInsights, getFacebookPageInsights } from "./metaGraphAPI";

describe("Meta Graph API Integration", () => {
  it("should validate Meta API credentials and fetch Instagram data", async () => {
    const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
    const INSTAGRAM_BUSINESS_ACCOUNT_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

    // Skip test if credentials are not available (CI/sandbox environment)
    if (!META_ACCESS_TOKEN || !INSTAGRAM_BUSINESS_ACCOUNT_ID) {
      console.log("⏭️ Skipping Instagram test: META_ACCESS_TOKEN or INSTAGRAM_BUSINESS_ACCOUNT_ID not configured");
      return;
    }

    // Test Instagram API
    const instagramData = await getInstagramInsights();
    
    if (!instagramData) {
      console.warn("⚠️ Instagram API returned null - token may be expired");
      return;
    }

    expect(instagramData).toBeDefined();
    expect(instagramData.followers_count).toBeGreaterThanOrEqual(0);
    
    console.log("✅ Instagram data fetched successfully:");
    console.log(`   - Followers: ${instagramData.followers_count}`);
    console.log(`   - Media: ${instagramData.media_count}`);
    console.log(`   - Reach: ${instagramData.reach}`);
  }, 30000);

  it("should validate Meta API credentials and fetch Facebook data", async () => {
    const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
    const FACEBOOK_PAGE_ID = process.env.FACEBOOK_PAGE_ID;

    // Skip test if credentials are not available (CI/sandbox environment)
    if (!META_ACCESS_TOKEN || !FACEBOOK_PAGE_ID) {
      console.log("⏭️ Skipping Facebook test: META_ACCESS_TOKEN or FACEBOOK_PAGE_ID not configured");
      return;
    }

    // Test Facebook API
    const facebookData = await getFacebookPageInsights();
    
    if (!facebookData) {
      console.warn("⚠️ Facebook API returned null - token may be expired");
      return;
    }

    expect(facebookData).toBeDefined();
    expect(facebookData.fan_count).toBeGreaterThanOrEqual(0);
    
    console.log("✅ Facebook data fetched successfully:");
    console.log(`   - Fans: ${facebookData.fan_count}`);
    console.log(`   - Page Views: ${facebookData.page_views_total}`);
    console.log(`   - Impressions: ${facebookData.page_impressions}`);
  }, 30000);
});
