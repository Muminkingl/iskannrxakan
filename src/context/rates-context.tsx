import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { CURRENCY_SORT_ORDER, DETAILED_RATES } from '@/constants/market-data';
import type { RateItem } from '@/types/market';

const SNAPSHOT_STORAGE_KEY = 'iskan-rates-snapshot-v1';
// Five minutes keeps the Worker request volume well below Cloudflare's Free
// daily request allowance for a thousand daily users while still keeping
// rates fresh for a manually managed market feed.
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 10 * 1000;

/**
 * Public, read-only endpoint served by the Cloudflare Worker.
 * Set EXPO_PUBLIC_RATES_SNAPSHOT_URL in the EAS environment before building.
 */
const SNAPSHOT_URL = process.env.EXPO_PUBLIC_RATES_SNAPSHOT_URL?.trim() || '';

type SnapshotPayload = {
  rates: RateItem[];
  generatedAt?: string;
};

type StoredSnapshot = SnapshotPayload & {
  savedAt: number;
};

type RatesContextValue = {
  rates: RateItem[];
  lastUpdated: number | null;
  isRefreshing: boolean;
  refreshRates: () => Promise<boolean>;
};

const RatesContext = createContext<RatesContextValue | null>(null);

function sortRates(rates: RateItem[]): RateItem[] {
  return [...rates].sort((a, b) => {
    const indexA = CURRENCY_SORT_ORDER.indexOf(a.code);
    const indexB = CURRENCY_SORT_ORDER.indexOf(b.code);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });
}

function mapSnapshotRow(row: Record<string, unknown>): RateItem | null {
  const code = typeof row.base_currency_code === 'string' ? row.base_currency_code : '';
  if (!code || row.buy_rate == null || row.sell_rate == null) return null;

  const category = row.category === 'gold' ? 'gold' : 'currency';
  return {
    id: String(row.id ?? code.toLowerCase()),
    code,
    nameKurdish: String(row.base_currency_name ?? code),
    unitLabel: String(row.unit_label ?? code),
    flagCode: String(row.base_flag_emoji ?? 'US'),
    iconName: category === 'gold' ? 'diamond-outline' : 'cash-outline',
    buyRate: Number(row.buy_rate).toLocaleString(),
    sellRate: Number(row.sell_rate).toLocaleString(),
    category,
  };
}

function parseSnapshot(value: unknown): SnapshotPayload | null {
  const rows = Array.isArray(value)
    ? value
    : value && typeof value === 'object' && Array.isArray((value as { rates?: unknown }).rates)
      ? (value as { rates: unknown[] }).rates
      : null;

  if (!rows) return null;
  const rates = rows
    .filter((row): row is Record<string, unknown> => Boolean(row && typeof row === 'object'))
    .map(mapSnapshotRow)
    .filter((row): row is RateItem => row !== null);

  return rates.length > 0 ? { rates: sortRates(rates) } : null;
}

async function loadStoredSnapshot(): Promise<StoredSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(SNAPSHOT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSnapshot;
    if (!Array.isArray(parsed.rates) || parsed.rates.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function RatesProvider({ children }: { children: React.ReactNode }) {
  const [rates, setRates] = useState<RateItem[]>(DETAILED_RATES);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const refreshPromise = useRef<Promise<boolean> | null>(null);

  const refreshRates = useCallback(async (): Promise<boolean> => {
    if (refreshPromise.current) return refreshPromise.current;
    if (!SNAPSHOT_URL) {
      if (__DEV__) console.warn('EXPO_PUBLIC_RATES_SNAPSHOT_URL is not configured.');
      return false;
    }

    const request = (async () => {
      setIsRefreshing(true);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(SNAPSHOT_URL, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Snapshot request failed (${response.status})`);

        const parsed = parseSnapshot(await response.json());
        if (!parsed) throw new Error('Snapshot response was empty or invalid');

        const savedAt = Date.now();
        setRates(parsed.rates);
        setLastUpdated(savedAt);
        await AsyncStorage.setItem(
          SNAPSHOT_STORAGE_KEY,
          JSON.stringify({ ...parsed, savedAt }),
        );
        return true;
      } catch (error) {
        if (__DEV__) console.warn('Rate snapshot refresh failed; using cached rates.', error);
        return false;
      } finally {
        clearTimeout(timeout);
        setIsRefreshing(false);
        refreshPromise.current = null;
      }
    })();

    refreshPromise.current = request;
    return request;
  }, []);

  useEffect(() => {
    let mounted = true;
    void loadStoredSnapshot().then((stored) => {
      if (!mounted || !stored) return;
      setRates(sortRates(stored.rates));
      setLastUpdated(stored.savedAt);
    });

    void refreshRates();

    const timer = setInterval(() => {
      if (appState.current === 'active') void refreshRates();
    }, REFRESH_INTERVAL_MS);

    const subscription = AppState.addEventListener('change', (nextState) => {
      const wasInactive = appState.current !== 'active';
      appState.current = nextState;
      if (nextState === 'active' && wasInactive) void refreshRates();
    });

    return () => {
      mounted = false;
      clearInterval(timer);
      subscription.remove();
    };
  }, [refreshRates]);

  const value = useMemo(
    () => ({ rates, lastUpdated, isRefreshing, refreshRates }),
    [rates, lastUpdated, isRefreshing, refreshRates],
  );

  return <RatesContext.Provider value={value}>{children}</RatesContext.Provider>;
}

export function useRates(): RatesContextValue {
  const value = useContext(RatesContext);
  if (!value) throw new Error('useRates must be used inside RatesProvider');
  return value;
}
