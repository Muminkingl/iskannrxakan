import type { BorsaItem, GoldItem, RateItem } from '@/types/market';

export const REGIONAL_BORSAMARKETS: BorsaItem[] = [
  { id: 'erbil', nameKurdish: 'بۆرسەی هەولێر', flagCode: 'IQ', price: '150,200 د.ع', pillColor: '#FF4D4D' },
  { id: 'slemani', nameKurdish: 'بۆرسەی سلێمانی', flagCode: 'IQ', price: '150,300 د.ع', pillColor: '#7C828D' },
  { id: 'baghdad', nameKurdish: 'بۆرسەی بەغداد', flagCode: 'IQ', price: '150,100 د.ع', pillColor: '#FF4D4D' },
];

export const DETAILED_RATES: RateItem[] = [
  { id: 'usd', code: 'USD', nameKurdish: 'دۆلاری ئەمریکی', unitLabel: '100$', flagCode: 'US', iconName: 'logo-usd', buyRate: '149,850', sellRate: '150,300', category: 'currency' },
  { id: 'eur', code: 'EUR', nameKurdish: 'یۆرۆ', unitLabel: '100€', flagCode: 'EU', iconName: 'logo-euro', buyRate: '161,200', sellRate: '161,800', category: 'currency' },
  { id: 'gbp', code: 'GBP', nameKurdish: 'پاوەندی بریتانی', unitLabel: '100£', flagCode: 'GB', iconName: 'logo-pound', buyRate: '191,500', sellRate: '192,300', category: 'currency' },
  { id: 'try', code: 'TRY', nameKurdish: 'لیرەی تورکی', unitLabel: '1,000₺', flagCode: 'TR', iconName: 'cash-outline', buyRate: '37,200', sellRate: '37,600', category: 'currency' },
  { id: 'toman', code: 'TRR', nameKurdish: 'تۆمانی ئێرانی', unitLabel: '10M', flagCode: 'IR', iconName: 'cash-outline', buyRate: '198,000', sellRate: '200,500', category: 'currency' },
  { id: 'gold21', code: 'G21', nameKurdish: 'زێڕی عەیار ۲۱', unitLabel: '١ میسقاڵ', flagCode: 'GOLD', iconName: 'diamond-outline', buyRate: '545,000', sellRate: '550,000', category: 'gold' },
  { id: 'gold24', code: 'G24', nameKurdish: 'زێڕی عەیار ۲٤', unitLabel: '١ میسقاڵ', flagCode: 'GOLD', iconName: 'diamond-outline', buyRate: '622,000', sellRate: '628,000', category: 'gold' },
];

export const GOLD_RATES: GoldItem[] = [
  { id: 'g24', karatKurdish: 'زێڕی عەیاره ٢٤', unitKurdish: '١ مسقاڵ', priceFormatted: '994,000 د.ع' },
  { id: 'g22', karatKurdish: 'زێڕی عەیاره ٢٢', unitKurdish: '١ مسقاڵ', priceFormatted: '910,000 د.ع' },
  { id: 'g21', karatKurdish: 'زێڕی عەیاره ٢١', unitKurdish: '١ مسقاڵ', priceFormatted: '870,000 د.ع' },
  { id: 'g18', karatKurdish: 'زێڕی عەیاره ١٨', unitKurdish: '١ مسقاڵ', priceFormatted: '746,000 د.ع' },
  { id: 'ounce', karatKurdish: 'ئۆنسەیەک زێڕ', unitKurdish: '', priceFormatted: '$4,094', isDollar: true },
];
