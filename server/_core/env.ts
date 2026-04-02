export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",

  // ── Meta (Facebook / Instagram / WhatsApp) ────────────────────────────────
  /**
   * التوكن الموحد لجميع خدمات Meta.
   * ⚠️  لا تستخدم process.env.META_ACCESS_TOKEN مباشرة في كود الخادم.
   *     استخدم MetaApiService: import { meta } from '../MetaApiService';
   *     أو ENV.metaAccessToken هنا فقط للتحقق من وجود التوكن.
   */
  metaAccessToken: process.env.META_ACCESS_TOKEN ?? "",
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
  instagramBusinessAccountId: process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID ?? "",
  facebookPageId: process.env.FACEBOOK_PAGE_ID ?? "",
  metaPixelId: process.env.META_PIXEL_ID ?? "",
  metaTestEventCode: process.env.META_TEST_EVENT_CODE ?? "",
  whatsappBusinessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID ?? "",
  webhookVerifyToken: process.env.WEBHOOK_VERIFY_TOKEN ?? "",
};
