import Constants, { ExecutionEnvironment } from 'expo-constants';
import { NativeModules, Platform } from 'react-native';
import type { CustomerInfo, PurchasesPackage } from 'react-native-purchases';

import {
  PREMIUM_ENTITLEMENT_ID,
  PREMIUM_OFFERING_ID,
  PREMIUM_PRODUCT_ID,
  REVENUECAT_IOS_API_KEY,
} from '@/constants/config';
import { supabase } from '@/lib/supabase';

type PurchasesSdk = typeof import('react-native-purchases').default;
let operationQueue: Promise<unknown> = Promise.resolve();

// Keep the useful SDK failure in device logs without logging credentials or
// customer records. A successful customer lookup does not prove StoreKit can
// resolve a product, and a failed lookup must not hide an existing purchase.
export function logApplePurchaseError(stage: string, error: unknown) {
  const details = error as { code?: unknown; message?: unknown; userInfo?: { underlyingErrorMessage?: unknown } } | null;
  const redact = (value: unknown) => String(value ?? '')
    .replace(/(?:appl|sk)_[A-Za-z0-9]+/g, '[redacted]')
    .replace(/Bearer\s+\S+/gi, 'Bearer [redacted]')
    .slice(0, 600);
  console.warn('[Premium] Apple purchase request failed', {
    stage, code: redact(details?.code), message: redact(details?.message),
    underlyingError: redact(details?.userInfo?.underlyingErrorMessage),
  });
}

export function canUseApplePurchases(): boolean {
  return (
    Platform.OS === 'ios' &&
    Constants.executionEnvironment !== ExecutionEnvironment.StoreClient &&
    !!NativeModules.RNPurchases &&
    REVENUECAT_IOS_API_KEY.startsWith('appl_')
  );
}

// Serializing identity changes with purchases prevents a transaction from being
// attributed to a different account during sign-out or a fast account switch.
function withUser<T>(userId: string, action: (sdk: PurchasesSdk) => Promise<T>): Promise<T> {
  const result = operationQueue.catch(() => undefined).then(async () => {
    if (!canUseApplePurchases()) throw new Error('Apple purchases are unavailable');
    const sdk = (await import('react-native-purchases')).default;
    if (!(await sdk.isConfigured())) {
      sdk.configure({ apiKey: REVENUECAT_IOS_API_KEY, appUserID: userId });
    } else if ((await sdk.getAppUserID()) !== userId) {
      await sdk.logIn(userId);
    }
    return action(sdk);
  });
  operationQueue = result.then(() => undefined, () => undefined);
  return result;
}

export function hasApplePremium(info: CustomerInfo): boolean {
  return !!info.entitlements.active[PREMIUM_ENTITLEMENT_ID];
}

export function loadApplePurchases(userId: string) {
  return withUser(userId, async (sdk) => {
    await sdk.invalidateCustomerInfoCache();
    // Resolve the price independently of the entitlement lookup. These are
    // separate requests, and either one can succeed while the other fails.
    const [customer, catalog] = await Promise.allSettled([
      sdk.getCustomerInfo(), sdk.getOfferings(),
    ]);
    const customerInfo = customer.status === 'fulfilled' ? customer.value : null;
    if (customer.status === 'rejected') logApplePurchaseError('customer_info', customer.reason);
    const offerings = catalog.status === 'fulfilled' ? catalog.value : null;
    if (catalog.status === 'rejected') logApplePurchaseError('offerings', catalog.reason);
    const offering = PREMIUM_OFFERING_ID
      ? offerings?.all[PREMIUM_OFFERING_ID]
      : offerings?.current;
    const purchasePackage = offering?.availablePackages.find(
      (item) => item.product.identifier === PREMIUM_PRODUCT_ID &&
        item.product.subscriptionPeriod === 'P1M',
    ) ?? null;
    if (catalog.status === 'fulfilled' && !purchasePackage) {
      logApplePurchaseError('product_selection', {
        code: offering ? 'MONTHLY_PRODUCT_MISSING' : 'OFFERING_MISSING',
        message: `Expected monthly product ${PREMIUM_PRODUCT_ID} in offering ${PREMIUM_OFFERING_ID || 'current'}.`,
      });
    }
    return { customerInfo, purchasePackage };
  });
}

export function buyApplePremium(userId: string, purchasePackage: PurchasesPackage) {
  return withUser(userId, async (sdk) => {
    if (purchasePackage.product.identifier !== PREMIUM_PRODUCT_ID ||
        purchasePackage.product.subscriptionPeriod !== 'P1M') {
      throw new Error('Unexpected Premium product');
    }
    return (await sdk.purchasePackage(purchasePackage)).customerInfo;
  });
}

export function restoreApplePurchases(userId: string) {
  return withUser(userId, (sdk) => sdk.restorePurchases());
}

export function observeApplePurchases(userId: string, listener: (info: CustomerInfo) => void) {
  return withUser(userId, async (sdk) => {
    const scopedListener = (info: CustomerInfo) => {
      void sdk.getAppUserID().then((currentId) => {
        if (currentId === userId) listener(info);
      }).catch(() => undefined);
    };
    sdk.addCustomerInfoUpdateListener(scopedListener);
    return () => sdk.removeCustomerInfoUpdateListener(scopedListener);
  });
}

export function disconnectApplePurchases(userId: string) {
  const result = operationQueue.catch(() => undefined).then(async () => {
    if (!canUseApplePurchases()) return;
    const sdk = (await import('react-native-purchases')).default;
    if (await sdk.isConfigured() && (await sdk.getAppUserID()) === userId) {
      await sdk.logOut();
    }
  });
  operationQueue = result.then(() => undefined, () => undefined);
  return result;
}

export async function syncApplePremium(): Promise<void> {
  // The server identifies the caller from their JWT and asks RevenueCat for
  // verified entitlement data. No client-supplied expiry or user ID is accepted.
  const { error } = await supabase.functions.invoke('sync-premium-purchase', { body: {} });
  if (error) throw new Error('Could not confirm Premium access');
}
