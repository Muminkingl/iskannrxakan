// ─── Chya Exchange App Config ─────────────────────────────────────
// Support & Contact info
export const SUPPORT_PHONE_NUMBER = '7510201840';
export const SUPPORT_WHATSAPP_NUMBER = '9647510201840';

// Public SDK configuration only. RevenueCat secret keys belong on the server.
export const REVENUECAT_IOS_API_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY?.trim() || '';
export const PREMIUM_ENTITLEMENT_ID =
  process.env.EXPO_PUBLIC_PREMIUM_ENTITLEMENT_ID?.trim() || 'premium';
export const PREMIUM_PRODUCT_ID =
  process.env.EXPO_PUBLIC_PREMIUM_PRODUCT_ID?.trim() ||
  'com.trxstudio.iskannrxakan.premium.monthly';
export const PREMIUM_OFFERING_ID =
  process.env.EXPO_PUBLIC_PREMIUM_OFFERING_ID?.trim() || '';
