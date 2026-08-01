// ─── Chya Exchange App Config ─────────────────────────────────────
// n8n Webhook for payment notifications
export const N8N_WEBHOOK_URL =
  'https://muminrtx.app.n8n.cloud/webhook/eca171fa-0983-4079-9e96-3fda1b38b440';

// Simple header auth for n8n webhook
export const N8N_AUTH_HEADER_NAME = 'value';
export const N8N_AUTH_HEADER_VALUE = 'somethingyouwillnotunderstand';

// FIB payment info
export const FIB_PHONE_NUMBER = '7509998788';
export const FIB_ACCOUNT_NUMBER = '7509998788';
export const FIB_ACCOUNT_NAME = 'Iskan Nrxakan';

// QR code for the FIB phone number (encodes the number so FIB app can read it)
export const FIB_QR_IMAGE_URL =
  'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=7509998788&color=1E3A8A&bgcolor=EFF6FF&qzone=2&format=svg';

// App store links for FIB app
export const FIB_IOS_URL = 'https://apps.apple.com/iq/app/first-iraqi-bank/id1545549339';
export const FIB_ANDROID_URL =
  'https://play.google.com/store/apps/details?id=com.firstiraqibank.personal&pcampaignid=web_share';
