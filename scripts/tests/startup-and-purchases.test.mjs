import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { test } from 'node:test';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
// Keep the optional renderer outside the app's dependency tree and EAS archive.
// npm install --prefix .expo/premium-debug/test-runtime --no-package-lock --no-audit --no-fund react-test-renderer@19.2.3 react@19.2.3
const runtime = createRequire(path.join(root, '.expo/premium-debug/test-runtime/package.json'));
const React = runtime('react');
const { act, create } = runtime('react-test-renderer');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function loadSource(relativePath, mocks, warnings = []) {
  const filename = path.join(root, relativePath);
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    fileName: filename,
  });
  const exports = {};
  const context = vm.createContext({
    exports, setTimeout, clearTimeout, Promise,
    console: { ...console, warn: (...args) => warnings.push(args) },
    require(name) {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name === 'react' || name === 'react/jsx-runtime') return runtime(name);
      throw new Error(`Unmocked import: ${name}`);
    },
  });
  vm.runInContext(outputText, context, { filename });
  return exports;
}

const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};
const session = (id = 'customer-a', token = 'first') => ({ user: { id, email: `${id}@example.test` }, access_token: token });
const account = { role: 'user', isDeleted: false, isVip: false, storePremiumActive: false };
const settle = () => new Promise(resolve => setTimeout(resolve, 10));

async function startEntry(options = {}) {
  let authListener;
  let completionWrites = 0;
  let accountReads = 0;
  let signOuts = 0;
  const warnings = [];
  const storageRead = options.storageRead ?? (() => Promise.resolve(options.completed ?? false));
  const auth = {
    getSession: () => Promise.resolve({ data: { session: options.session ?? null } }),
    onAuthStateChange: listener => { authListener = listener; return { data: { subscription: { unsubscribe() {} } } }; },
    signOut: async () => { signOuts++; authListener('SIGNED_OUT', null); return {}; },
  };
  const Entry = loadSource('src/app/index.tsx', {
    'expo-splash-screen': { hideAsync: async () => {} },
    'react-native': { ActivityIndicator: 'ActivityIndicator', StatusBar: 'StatusBar', StyleSheet: { create: x => x }, Text: 'Text', View: 'View' },
    'react-native-reanimated': { __esModule: true, default: { View: 'AnimatedView' }, FadeIn: { duration: () => ({}) } },
    'expo-router': { useLocalSearchParams: () => options.params ?? {} },
    '@/components/auth/auth-screen': { AuthScreen: 'AuthScreen' },
    '@/components/home-screen': { HomeScreen: 'HomeScreen' },
    '@/components/onboarding/onboarding-flow': { OnboardingFlow: 'OnboardingFlow' },
    '@/components/common/iskan-logo': { IskanLogo: 'IskanLogo' },
    '@/lib/onboarding': {
      hasCompletedOnboarding: storageRead,
      completeOnboarding: async () => { completionWrites++; if (options.failSave) throw new Error('Storage blocked'); },
    },
    '@/lib/auth-roles': { fetchAccountState: () => { accountReads++; return options.fetchAccount ? options.fetchAccount() : Promise.resolve(account); } },
    '@/lib/supabase': { supabase: { auth } },
  }, warnings).default;
  let screen;
  await act(async () => { screen = create(React.createElement(Entry)); });
  await act(settle);
  return {
    screen, warnings,
    get writes() { return completionWrites; },
    get reads() { return accountReads; },
    get signOuts() { return signOuts; },
    count: type => screen.root.findAllByType(type).length,
    complete: () => act(async () => screen.root.findByType('OnboardingFlow').props.onComplete()),
    emit: (event, next) => act(async () => { authListener(event, next); await settle(); }),
    close: () => act(async () => screen.unmount()),
  };
}

test('a new signed-out visitor sees onboarding before login', async () => {
  const entry = await startEntry();
  try {
    assert.equal(entry.count('OnboardingFlow'), 1);
    assert.equal(entry.count('AuthScreen'), 0);
    assert.equal(entry.writes, 0);
    await entry.complete();
    assert.equal(entry.count('AuthScreen'), 1);
    assert.equal(entry.writes, 1);
  } finally { await entry.close(); }
});

test('an existing session does not mark unseen onboarding completed', async () => {
  const entry = await startEntry({ session: session() });
  try {
    assert.equal(entry.count('OnboardingFlow'), 1);
    assert.equal(entry.count('HomeScreen'), 0);
    assert.equal(entry.writes, 0);
    await entry.complete();
    assert.equal(entry.count('HomeScreen'), 1);
    assert.equal(entry.reads, 1);
  } finally { await entry.close(); }
});

test('completed onboarding stays completed on return and sign-out', async () => {
  const entry = await startEntry({ completed: true, session: session() });
  try {
    assert.equal(entry.count('HomeScreen'), 1);
    await entry.emit('SIGNED_OUT', null);
    assert.equal(entry.count('AuthScreen'), 1);
    assert.equal(entry.count('OnboardingFlow'), 0);
    assert.equal(entry.writes, 0);
  } finally { await entry.close(); }
});

test('a storage read failure still displays onboarding', async () => {
  const entry = await startEntry({ storageRead: () => Promise.reject(new Error('Storage blocked')) });
  try { assert.equal(entry.count('OnboardingFlow'), 1); }
  finally { await entry.close(); }
});

test('a storage write failure does not crash or trap the visitor', async () => {
  const entry = await startEntry({ failSave: true });
  try {
    await entry.complete();
    assert.equal(entry.count('AuthScreen'), 1);
    assert.equal(entry.warnings.length, 1);
  } finally { await entry.close(); }
});

test('a late account check cannot restore a signed-out session', async () => {
  const pending = deferred();
  const entry = await startEntry({ completed: true, session: session(), fetchAccount: () => pending.promise });
  try {
    assert.equal(entry.count('HomeScreen'), 0);
    await entry.emit('SIGNED_OUT', null);
    await act(async () => { pending.resolve(account); });
    assert.equal(entry.count('AuthScreen'), 1);
    assert.equal(entry.count('HomeScreen'), 0);
  } finally { await entry.close(); }
});

test('switching accounts ignores the old account response', async () => {
  const pending = [deferred(), deferred()];
  let calls = 0;
  const entry = await startEntry({ completed: true, session: session(), fetchAccount: () => pending[calls++].promise });
  try {
    await entry.emit('SIGNED_IN', session('customer-b'));
    await act(async () => { pending[1].resolve(account); });
    await act(async () => { pending[0].resolve({ ...account, isVip: true }); });
    assert.equal(entry.screen.root.findByType('HomeScreen').props.session.user.id, 'customer-b');
    assert.equal(entry.screen.root.findByType('HomeScreen').props.initialAccountState.isVip, false);
  } finally { await entry.close(); }
});

test('duplicate sign-in and token refresh do not repeat or bypass account verification', async () => {
  const pending = deferred();
  const entry = await startEntry({ completed: true, session: session(), fetchAccount: () => pending.promise });
  try {
    await entry.emit('SIGNED_IN', session());
    await entry.emit('TOKEN_REFRESHED', session('customer-a', 'updated'));
    assert.equal(entry.reads, 1);
    assert.equal(entry.count('HomeScreen'), 0);
    await act(async () => { pending.resolve(account); });
    assert.equal(entry.screen.root.findByType('HomeScreen').props.session.access_token, 'updated');
  } finally { await entry.close(); }
});

test('a deleted account is signed out without rendering the protected screen', async () => {
  const entry = await startEntry({ completed: true, session: session(), fetchAccount: async () => ({ ...account, isDeleted: true }) });
  try {
    assert.equal(entry.count('HomeScreen'), 0);
    assert.equal(entry.count('AuthScreen'), 1);
    assert.equal(entry.signOuts, 1);
    assert.equal(entry.screen.root.findByType('AuthScreen').props.deletedAccountEmail, 'customer-a@example.test');
  } finally { await entry.close(); }
});

test('onboarding persists only actual completion using platform-neutral storage', async () => {
  const values = new Map([['onboarding_done', '1']]);
  const onboarding = loadSource('src/lib/onboarding.ts', {
    '@react-native-async-storage/async-storage': { __esModule: true, default: {
      getItem: async key => values.get(key) ?? null,
      setItem: async (key, value) => { values.set(key, value); },
    } },
  });
  assert.equal(await onboarding.hasCompletedOnboarding(), false);
  await onboarding.completeOnboarding();
  assert.equal(await onboarding.hasCompletedOnboarding(), true);
  assert.equal(values.get('onboarding_completed_v1'), '1');
});

const productId = 'com.trxstudio.iskannrxakan.premium.monthly';
const monthlyPackage = { identifier: '$rc_monthly', product: { identifier: productId, subscriptionPeriod: 'P1M', priceString: '$19.99' } };
const freeInfo = { entitlements: { active: {}, all: {} } };
const activeInfo = { entitlements: { active: { premium: {} }, all: { premium: {} } } };

function purchasesFixture(overrides = {}, platform = 'ios') {
  let configured = false;
  let currentUser;
  const warnings = [];
  const sdk = {
    isConfigured: async () => configured,
    configure: ({ appUserID }) => { configured = true; currentUser = appUserID; },
    getAppUserID: async () => currentUser,
    logIn: async id => { currentUser = id; },
    invalidateCustomerInfoCache: async () => {},
    getCustomerInfo: async () => freeInfo,
    getOfferings: async () => ({ all: { default: { availablePackages: [monthlyPackage] } } }),
    purchasePackage: async () => ({ customerInfo: activeInfo }),
    restorePurchases: async () => freeInfo,
    ...overrides,
  };
  const api = loadSource('src/lib/purchases.ts', {
    'expo-constants': { __esModule: true, default: { executionEnvironment: 'standalone' }, ExecutionEnvironment: { StoreClient: 'storeClient' } },
    'react-native': { NativeModules: { RNPurchases: {} }, Platform: { OS: platform } },
    'react-native-purchases': { __esModule: true, default: sdk },
    '@/constants/config': { PREMIUM_ENTITLEMENT_ID: 'premium', PREMIUM_OFFERING_ID: 'default', PREMIUM_PRODUCT_ID: productId, REVENUECAT_IOS_API_KEY: 'appl_testOnly' },
    '@/lib/supabase': { supabase: { functions: { invoke: async () => ({ error: null }) } } },
  }, warnings);
  return { api, warnings };
}

test('Apple monthly product loads with its store price', async () => {
  const { api, warnings } = purchasesFixture();
  const loaded = await api.loadApplePurchases('customer-a');
  assert.equal(loaded.purchasePackage.product.priceString, '$19.99');
  assert.equal(warnings.length, 0);
});

test('a customer-info failure does not hide a successfully loaded Apple price', async () => {
  const { api, warnings } = purchasesFixture({ getCustomerInfo: async () => { throw { code: '10', message: 'Offline' }; } });
  const loaded = await api.loadApplePurchases('customer-a');
  assert.equal(loaded.purchasePackage, monthlyPackage);
  assert.equal(loaded.customerInfo, null);
  assert.equal(warnings[0][1].stage, 'customer_info');
});

test('an Apple product-loading failure preserves known entitlements and its diagnostic', async () => {
  const { api, warnings } = purchasesFixture({ getCustomerInfo: async () => activeInfo, getOfferings: async () => { throw { code: '23', message: 'Products unavailable from Apple' }; } });
  const loaded = await api.loadApplePurchases('customer-a');
  assert.equal(api.hasApplePremium(loaded.customerInfo), true);
  assert.equal(loaded.purchasePackage, null);
  assert.equal(warnings[0][1].code, '23');
});

test('a missing or non-monthly product never becomes a purchase option', async () => {
  const { api, warnings } = purchasesFixture({ getOfferings: async () => ({ all: { default: { availablePackages: [{ ...monthlyPackage, product: { ...monthlyPackage.product, subscriptionPeriod: 'P1Y' } }] } } }) });
  assert.equal((await api.loadApplePurchases('customer-a')).purchasePackage, null);
  assert.equal(warnings[0][1].code, 'MONTHLY_PRODUCT_MISSING');
  await assert.rejects(api.buyApplePremium('customer-a', { ...monthlyPackage, product: { ...monthlyPackage.product, identifier: 'another-product' } }), /Unexpected Premium product/);
});

test('restore without a purchase returns inactive customer data', async () => {
  const { api } = purchasesFixture();
  assert.equal(api.hasApplePremium(await api.restoreApplePurchases('customer-a')), false);
});

test('diagnostics redact keys and bearer credentials', () => {
  const { api, warnings } = purchasesFixture();
  api.logApplePurchaseError('offerings', { code: '23', message: 'appl_privateValue sk_secretValue Bearer private-token', userInfo: { underlyingErrorMessage: 'Bearer hidden-token' } });
  const message = JSON.stringify(warnings);
  for (const secret of ['appl_privateValue', 'sk_secretValue', 'private-token', 'hidden-token']) assert.equal(message.includes(secret), false);
});

test('web does not invoke the native Apple SDK', async () => {
  const { api } = purchasesFixture({}, 'web');
  assert.equal(api.canUseApplePurchases(), false);
  await assert.rejects(api.loadApplePurchases('customer-a'), /unavailable/);
});

test('support keeps WhatsApp and removes the account refresh action in every language', () => {
  const modal = fs.readFileSync(path.join(root, 'src/components/plan/premium-plan-modal.tsx'), 'utf8');
  const supportPage = modal.slice(modal.indexOf("{page === 'support'"), modal.indexOf("{(page === 'privacy'"));
  assert.ok(supportPage.includes('wa.me/'));
  assert.ok(supportPage.includes('txt.whatsapp'));
  assert.equal(supportPage.includes('handleRefresh'), false);
  assert.equal(supportPage.includes('txt.refresh'), false);
});
