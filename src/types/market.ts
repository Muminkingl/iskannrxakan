export interface BorsaItem {
  id: string;
  nameKurdish: string;
  flagCode: string; // e.g. 'US' | 'IQ' | 'TR'
  price: string;
  pillColor: string;
}

export interface RateItem {
  id: string;
  code: string;
  nameKurdish: string;
  unitLabel: string;
  flagCode: string;
  iconName: string;
  buyRate: string;
  sellRate: string;
  category: 'currency' | 'gold';
}

export interface GoldItem {
  id: string;
  karatKurdish: string;
  unitKurdish: string;
  priceFormatted: string;
  isDollar?: boolean;
}

export type TabId = 'home' | 'updates' | 'gold' | 'chart' | 'calc' | 'admin';

export type UserRole = 'owner' | 'admin' | 'user';
