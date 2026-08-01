import type { BorsaItem, GoldItem, RateItem } from '@/types/market';

export const CURRENCY_SORT_ORDER = [
  'IQD',
  'EUR',
  'GBP',
  'TRY',
  'AED',
  'SAR',
  'JOD',
  'CHF',
  'SEK',
  'NOK',
  'DKK',
  'CAD',
  'AUD',
  'G21',
  'G24',
];

export const REGIONAL_BORSAMARKETS: BorsaItem[] = [
  { id: 'erbil', nameKurdish: 'بۆرسەی هەولێر', flagCode: 'IQ', price: '150,200 د.ع', pillColor: '#FF4D4D' },
  { id: 'slemani', nameKurdish: 'بۆرسەی سلێمانی', flagCode: 'IQ', price: '150,300 د.ع', pillColor: '#7C828D' },
  { id: 'baghdad', nameKurdish: 'بۆرسەی بەغداد', flagCode: 'IQ', price: '150,100 د.ع', pillColor: '#FF4D4D' },
];

export const DETAILED_RATES: RateItem[] = [
  { id: 'iqd', code: 'IQD', nameKurdish: 'دیناری عێراقی', unitLabel: 'IQD', flagCode: 'IQ', iconName: 'cash-outline', buyRate: '78,767', sellRate: '155,781', category: 'currency' },
  { id: 'eur', code: 'EUR', nameKurdish: 'یۆرۆی ئەوروپی', unitLabel: 'EUR', flagCode: 'EU', iconName: 'logo-euro', buyRate: '113.15', sellRate: '113.9', category: 'currency' },
  { id: 'gbp', code: 'GBP', nameKurdish: 'پاوەندی بەریتانی', unitLabel: 'GBP', flagCode: 'GB', iconName: 'logo-pound', buyRate: '131.5', sellRate: '133', category: 'currency' },
  { id: 'try', code: 'TRY', nameKurdish: 'لیرەی تورکی', unitLabel: 'TUR', flagCode: 'TR', iconName: 'cash-outline', buyRate: '4,720', sellRate: '4,600', category: 'currency' },
  { id: 'aed', code: 'AED', nameKurdish: 'درهمی ئیماراتی', unitLabel: 'AED', flagCode: 'AE', iconName: 'cash-outline', buyRate: '153,900', sellRate: '366', category: 'currency' },
  { id: 'sar', code: 'SAR', nameKurdish: 'ڕیاڵی سعودی', unitLabel: 'SAR', flagCode: 'SA', iconName: 'cash-outline', buyRate: '380', sellRate: '365', category: 'currency' },
  { id: 'jod', code: 'JOD', nameKurdish: 'دیناری ئوردنی', unitLabel: 'JOD', flagCode: 'JO', iconName: 'cash-outline', buyRate: '71', sellRate: '68', category: 'currency' },
  { id: 'chf', code: 'CHF', nameKurdish: 'فرانکی سویسری', unitLabel: 'CHF', flagCode: 'CH', iconName: 'cash-outline', buyRate: '121.5', sellRate: '124', category: 'currency' },
  { id: 'sek', code: 'SEK', nameKurdish: 'کرۆنی سویدی', unitLabel: 'SEK', flagCode: 'SE', iconName: 'cash-outline', buyRate: '93.75', sellRate: '96.25', category: 'currency' },
  { id: 'nok', code: 'NOK', nameKurdish: 'کرۆنی نەرویجی', unitLabel: 'NOK', flagCode: 'NO', iconName: 'cash-outline', buyRate: '88', sellRate: '90.5', category: 'currency' },
  { id: 'dkk', code: 'DKK', nameKurdish: 'کرۆنی دانیمارکی', unitLabel: 'DKK', flagCode: 'DK', iconName: 'cash-outline', buyRate: '139', sellRate: '142', category: 'currency' },
  { id: 'cad', code: 'CAD', nameKurdish: 'دۆلاری کەنەدی', unitLabel: 'CAD', flagCode: 'CA', iconName: 'cash-outline', buyRate: '68', sellRate: '70', category: 'currency' },
  { id: 'aud', code: 'AUD', nameKurdish: 'دۆلاری ئوسترالی', unitLabel: 'AUD', flagCode: 'AU', iconName: 'cash-outline', buyRate: '67', sellRate: '68.5', category: 'currency' },

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
