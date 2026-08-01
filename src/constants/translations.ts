export type Language = 'kurdish' | 'arabic' | 'english';

export interface TranslationKeys {
  // Settings
  settingsTitle: string;
  languageLabel: string;
  themeLabel: string;
  themeLight: string;
  themeDark: string;
  notificationsTitle: string;
  notificationsSub: string;
  doneBtn: string;
  kurdish: string;
  arabic: string;
  english: string;

  // Tabs
  homeTab: string;
  goldTab: string;
  calcTab: string;
  chartTab: string;
  adminTab: string;

  // Gold screen
  goldTitle: string;
  goldNoticeTitle: string;
  goldNoticeText: string;

  // Notice banner
  noticeBannerTitle: string;
  noticeBannerText: string;

  // Chart screen
  chartTitle: string;
  chartSub: string;

  // About app
  aboutTitle: string;
  developedBy: string;

  // Hero header
  heroCity: string;
  heroKicker: string;
  heroCurrencyUnit: string;

  // Rates table
  sellLabel: string;
  sellSub: string;
  buyLabel: string;
  buySub: string;
  currencyLabel: string;
  currencySub: string;

  // Calculator
  calcLiveRate: string;

  // Drawer
  drawerBannerTitle: string;
  drawerBannerSub: string;
  drawerOwnerTitle: string;
  drawerOwnerSub: string;
  drawerAdmin: string;
  drawerChart: string;
  drawerPlans: string;
  drawerCalc: string;
  drawerSettings: string;
  drawerAbout: string;
  drawerSignOut: string;

  // Chart modal
  chartPickerTitle: string;
  updatesTitle: string;
  updatesSub: string;

  // Chart screen
  chartNoData: string;
  chartLoading: string;
  chartLiveRateLabel: string;
  chart7d: string;
  chart1m: string;
  chart1y: string;
  chartCustom: string;
  chartCustomTitle: string;
  chartDateFrom: string;
  chartDateTo: string;
  chartPresetLastWeek: string;
  chartPresetLastMonth: string;
  chartPresetThisYear: string;
  chartStatHigh: string;
  chartStatLow: string;
  chartStatAvg: string;

  // Calculator
  calcFrom: string;
  calcTo: string;
  calcPickerFrom: string;
  calcPickerTo: string;

  // Drawer
  drawerPlanBtnTitle: string;
  drawerPlanBtnSub: string;

  // Gold Calculator Modal
  goldCalcTitle: string;
  goldCalcMithqal: string;
  goldCalcGram: string;
  goldCalcInputMithqal: string;
  goldCalcInputGram: string;
  closeBtn: string;
  gold18: string;
  gold21: string;
  gold22: string;
  gold24: string;
}

export const TRANSLATIONS: Record<Language, TranslationKeys> = {
  kurdish: {
    settingsTitle: 'ڕێکخستنەکان',
    languageLabel: 'زمان',
    themeLabel: 'ڕووکار',
    themeLight: 'ڕووناک',
    themeDark: 'تاریک',
    notificationsTitle: 'ئاگادارکردنەوەی نرخ',
    notificationsSub: 'وەرگرتنی ئاگاداری ڕاستەوخۆ کاتێک نرخ گۆڕا',
    doneBtn: 'تەواو',
    kurdish: 'کوردی',
    arabic: 'عربی',
    english: 'English',
    homeTab: 'سەرەتا',
    goldTab: 'زێڕ',
    calcTab: 'ئاڵوگۆڕ',
    chartTab: 'هێڵکاری',
    adminTab: 'بەڕێوەبەر',
    goldTitle: 'فڕۆشتنی زێڕ',
    goldNoticeTitle: 'زانیاری بازاڕی زێڕ',
    goldNoticeText: 'نرخەکان بەپێی مسقاڵ (٥ گرام) و ئۆنسەی جیهانی دیاریکراون. ۱ ئۆنسە = ۳۱.۱ گرام زێڕ.',
    noticeBannerTitle: 'ئاگاداری ڕۆژانەی بۆرسە',
    noticeBannerText: 'نرخەکان ڕاستەوخۆ بەپێی بازاڕی دراو و بۆرسەی هەولێر نوێ دەکرێنەوە.',
    chartTitle: 'هێڵکاری نرخەکان',
    chartSub: 'شیکاری بەراوردکاری گۆڕانکاریەکانی بڕی دراو بەپێی بنکەدایە',
    aboutTitle: 'دەربارەی بەرنامە',
    developedBy: 'گەشەپێدراوە لەلایەن',
    heroCity: 'بۆرسەی هەولێر',
    heroKicker: 'نرخی ئەمڕۆی ١٠٠ دۆلاری ئەمریکی',
    heroCurrencyUnit: 'د.ع',
    sellLabel: 'SELL',
    sellSub: 'فڕۆشتن',
    buyLabel: 'BUY',
    buySub: 'کڕین',
    currencyLabel: 'CURRENCY',
    currencySub: 'دراو',
    calcLiveRate: 'نرخی ڕاستەوخۆی ئاڵوگۆڕ',
    drawerBannerTitle: 'بەشداری پلانێک بکە',
    drawerBannerSub: 'تایبەتمەندی زیاتر بە دەست بهێنە',
    drawerOwnerTitle: 'دەستەی بەڕێوەبەرایەتی',
    drawerOwnerSub: 'ڕێکخستن و زیادکردنی ئیمەیڵی بەڕێوەبەران',
    drawerAdmin: 'بەڕێوەبردنی نرخەکان',
    drawerChart: 'هێڵکاری',
    drawerPlans: 'پلانەکان',
    drawerCalc: 'حاسیبە',
    drawerSettings: 'ڕێکخستنەکان',
    drawerAbout: 'دەربارەی بەرنامە',
    drawerSignOut: 'چوونە دەرەوە',
    chartPickerTitle: 'هەڵبژاردنی جۆری دراو',
    updatesTitle: 'ئاڵوگۆڕی ڕۆژانە',
    updatesSub: 'ئاگاداری و گۆڕانکاریەکانی بازاڕی کوردستان',
    chartNoData: 'هێڵکاری بەردەست نیە لەم کاتەدا',
    chartLoading: 'چارت باردەکرێت...',
    chartLiveRateLabel: 'نرخی ڕاستەوخۆ',
    chart7d: '٧ ڕۆژ',
    chart1m: '١ مانگ',
    chart1y: '١ ساڵ',
    chartCustom: 'دیاریکراو',
    chartCustomTitle: 'دیاریکردنی مەودای ڕێکەوت',
    chartDateFrom: 'لە (سەرەتا)',
    chartDateTo: 'بۆ (کۆتایی)',
    chartPresetLastWeek: 'هەفتەی ڕابردوو',
    chartPresetLastMonth: 'مانگی ڕابردوو',
    chartPresetThisYear: 'ئەمساڵ',
    chartStatHigh: 'بەرزترین',
    chartStatLow: 'نزمترین',
    chartStatAvg: 'تێکڕا',
    calcFrom: 'لە',
    calcTo: 'بۆ',
    calcPickerFrom: 'هەڵبژاردنی دراوی سەرەتایی',
    calcPickerTo: 'هەڵبژاردنی دراوی ئامانج',
    drawerPlanBtnTitle: 'بەشداری پلانێک بکە',
    drawerPlanBtnSub: 'تایبەتمەندی زیاتر بە دەست بهێنە',
    goldCalcTitle: 'حاسیبەی نرخی زێڕ',
    goldCalcMithqal: 'میسقاڵ',
    goldCalcGram: 'گرام',
    goldCalcInputMithqal: 'ژمارەی مسقاڵەکان',
    goldCalcInputGram: 'ژمارەی گرامەکان',
    closeBtn: 'داخستن',
    gold18: 'زێڕی عەیاره 18',
    gold21: 'زێڕی عەیاره 21',
    gold22: 'زێڕی عەیاره 22',
    gold24: 'زێڕی عەیاره 24',
  },
  arabic: {
    settingsTitle: 'الإعدادات',
    languageLabel: 'اللغة',
    themeLabel: 'المظهر',
    themeLight: 'فاتح',
    themeDark: 'داكن',
    notificationsTitle: 'تنبيهات الأسعار',
    notificationsSub: 'إشعارات فورية عند تغير الأسعار',
    doneBtn: 'تم',
    kurdish: 'کوردی',
    arabic: 'عربی',
    english: 'English',
    homeTab: 'الرئيسية',
    goldTab: 'الذهب',
    calcTab: 'الحاسبة',
    chartTab: 'الرسم البياني',
    adminTab: 'الإدارة',
    goldTitle: 'أسعار الذهب',
    goldNoticeTitle: 'معلومات سوق الذهب',
    goldNoticeText: 'الأسعار محددة بالمثقال (٥ غرامات) والأونصة العالمية. ١ أونصة = ٣١.١ غرام.',
    noticeBannerTitle: 'إشعار السوق اليومي',
    noticeBannerText: 'تحديث الأسعار مباشر وفقاً لبورصة أربيل وسوق العملات.',
    chartTitle: 'الرسم البياني للأسعار',
    chartSub: 'تحليل مقارن لتغيرات العملات بناءً على قاعدة البيانات',
    aboutTitle: 'عن التطبيق',
    developedBy: 'تم التطوير بواسطة',
    heroCity: 'بورصة أربيل',
    heroKicker: 'سعر اليوم لـ 100 دولار أمريكي',
    heroCurrencyUnit: 'د.ع',
    sellLabel: 'SELL',
    sellSub: 'بيع',
    buyLabel: 'BUY',
    buySub: 'شراء',
    currencyLabel: 'CURRENCY',
    currencySub: 'العملة',
    calcLiveRate: 'سعر الصرف المباشر',
    drawerBannerTitle: 'اشترك في خطة',
    drawerBannerSub: 'احصل على مزايا إضافية',
    drawerOwnerTitle: 'لوحة الإدارة',
    drawerOwnerSub: 'إدارة المشرفين وإعداداتهم',
    drawerAdmin: 'إدارة الأسعار',
    drawerChart: 'الرسم البياني',
    drawerPlans: 'الخطط',
    drawerCalc: 'الحاسبة',
    drawerSettings: 'الإعدادات',
    drawerAbout: 'عن التطبيق',
    drawerSignOut: 'تسجيل الخروج',
    chartPickerTitle: 'اختيار نوع العملة',
    updatesTitle: 'التحديثات اليومية',
    updatesSub: 'أخبار وتحديثات بورصة كوردستان',
    chartNoData: 'لا يتوفر رسم بياني في الوقت الحالي',
    chartLoading: 'جارٍ تحميل الرسم البياني...',
    chartLiveRateLabel: 'السعر المباشر',
    chart7d: '٧ أيام',
    chart1m: 'شهر',
    chart1y: 'سنة',
    chartCustom: 'مخصص',
    chartCustomTitle: 'تحديد نطاق التاريخ',
    chartDateFrom: 'من (البداية)',
    chartDateTo: 'إلى (النهاية)',
    chartPresetLastWeek: 'الأسبوع الماضي',
    chartPresetLastMonth: 'الشهر الماضي',
    chartPresetThisYear: 'هذه السنة',
    chartStatHigh: 'الأعلى',
    chartStatLow: 'الأدنى',
    chartStatAvg: 'المتوسط',
    calcFrom: 'من',
    calcTo: 'إلى',
    calcPickerFrom: 'اختر العملة الأصلية',
    calcPickerTo: 'اختر العملة الهدف',
    drawerPlanBtnTitle: 'اشترك في خطة',
    drawerPlanBtnSub: 'احصل على مزايا إضافية',
    goldCalcTitle: 'حاسبة أسعار الذهب',
    goldCalcMithqal: 'مثقال',
    goldCalcGram: 'غرام',
    goldCalcInputMithqal: 'عدد المثاقيل',
    goldCalcInputGram: 'عدد الغرامات',
    closeBtn: 'إغلاق',
    gold18: 'ذهب عيار 18',
    gold21: 'ذهب عيار 21',
    gold22: 'ذهب عيار 22',
    gold24: 'ذهب عيار 24',
  },
  english: {
    settingsTitle: 'Settings',
    languageLabel: 'Language',
    themeLabel: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    notificationsTitle: 'Rate Alerts',
    notificationsSub: 'Live notifications when market rates change',
    doneBtn: 'Done',
    kurdish: 'Kurdish',
    arabic: 'Arabic',
    english: 'English',
    homeTab: 'Home',
    goldTab: 'Gold',
    calcTab: 'Calc',
    chartTab: 'Charts',
    adminTab: 'Admin',
    goldTitle: 'Gold Selling Rates',
    goldNoticeTitle: 'Gold Market Info',
    goldNoticeText: 'Prices shown per Mithqal (5g) and Oz. 1 Oz = 31.1g.',
    noticeBannerTitle: 'Daily Market Notice',
    noticeBannerText: 'Rates updated real-time based on Erbil Exchange & FX Market.',
    chartTitle: 'Market Rate Charts',
    chartSub: 'Comparative rate analytics powered by database',
    aboutTitle: 'About App',
    developedBy: 'Developed by',
    heroCity: 'Erbil Exchange',
    heroKicker: "Today's Rate: 100 USD",
    heroCurrencyUnit: 'IQD',
    sellLabel: 'SELL',
    sellSub: 'Sell',
    buyLabel: 'BUY',
    buySub: 'Buy',
    currencyLabel: 'CURRENCY',
    currencySub: 'Currency',
    calcLiveRate: 'Live Exchange Rate',
    drawerBannerTitle: 'Join a Plan',
    drawerBannerSub: 'Get more premium features',
    drawerOwnerTitle: 'Admin Management',
    drawerOwnerSub: 'Manage admin emails and settings',
    drawerAdmin: 'Manage Rates',
    drawerChart: 'Charts',
    drawerPlans: 'Plans',
    drawerCalc: 'Calculator',
    drawerSettings: 'Settings',
    drawerAbout: 'About App',
    drawerSignOut: 'Sign Out',
    chartPickerTitle: 'Select Currency Pair',
    updatesTitle: 'Daily Updates',
    updatesSub: 'News and updates from Kurdistan Exchange Market',
    chartNoData: 'No chart data available right now',
    chartLoading: 'Loading chart...',
    chartLiveRateLabel: 'Live Rate',
    chart7d: '7 Days',
    chart1m: '1 Month',
    chart1y: '1 Year',
    chartCustom: 'Custom',
    chartCustomTitle: 'Select Date Range',
    chartDateFrom: 'From (Start)',
    chartDateTo: 'To (End)',
    chartPresetLastWeek: 'Last Week',
    chartPresetLastMonth: 'Last Month',
    chartPresetThisYear: 'This Year',
    chartStatHigh: 'High',
    chartStatLow: 'Low',
    chartStatAvg: 'Average',
    calcFrom: 'From',
    calcTo: 'To',
    calcPickerFrom: 'Select Source Currency',
    calcPickerTo: 'Select Target Currency',
    drawerPlanBtnTitle: 'Join a Plan',
    drawerPlanBtnSub: 'Get more premium features',
    goldCalcTitle: 'Gold Rate Calculator',
    goldCalcMithqal: 'Mithqal',
    goldCalcGram: 'Gram',
    goldCalcInputMithqal: 'Number of Mithqals',
    goldCalcInputGram: 'Number of Grams',
    closeBtn: 'Close',
    gold18: '18K Gold',
    gold21: '21K Gold',
    gold22: '22K Gold',
    gold24: '24K Gold',
  },
};

export const CURRENCY_NAMES: Record<Language, Record<string, string>> = {
  kurdish: {
    USD: 'دۆلاری ئەمریکی',
    IQD: 'دیناری عێراقی',
    EUR: 'یۆرۆی ئەوروپی',
    GBP: 'پاوەندی بەریتانی',
    TRY: 'لیرەی تورکی',
    AED: 'درهمی ئیماراتی',
    SAR: 'ڕیاڵی سعودی',
    JOD: 'دیناری ئوردنی',
    CHF: 'فرانکی سویسری',
    SEK: 'کرۆنی سویدی',
    NOK: 'کرۆنی نەرویجی',
    DKK: 'کرۆنی دانیمارکی',
    CAD: 'دۆلاری کەنەدی',
    AUD: 'دۆلاری ئوسترالی',
    G21: 'زێڕی عەیار ۲۱',
    G24: 'زێڕی عەیار ۲٤',
  },
  arabic: {
    USD: 'الدولار الأمريكي',
    IQD: 'الدينار العراقي',
    EUR: 'اليورو الأوروبي',
    GBP: 'الجنيه الإسترليني',
    TRY: 'الليرة التركية',
    AED: 'الدرهم الإماراتي',
    SAR: 'الريال السعودي',
    JOD: 'الدينار الأردني',
    CHF: 'الفرنك السويسري',
    SEK: 'الكرونة السويدية',
    NOK: 'الكرونة النرويجية',
    DKK: 'الكرونة الدنماركية',
    CAD: 'الدولار الكندي',
    AUD: 'الدولار الأسترالي',
    G21: 'ذهب عيار 21',
    G24: 'ذهب عيار 24',
  },
  english: {
    USD: 'US Dollar',
    IQD: 'Iraqi Dinar',
    EUR: 'Euro',
    GBP: 'British Pound',
    TRY: 'Turkish Lira',
    AED: 'UAE Dirham',
    SAR: 'Saudi Riyal',
    JOD: 'Jordanian Dinar',
    CHF: 'Swiss Franc',
    SEK: 'Swedish Krona',
    NOK: 'Norwegian Krone',
    DKK: 'Danish Krone',
    CAD: 'Canadian Dollar',
    AUD: 'Australian Dollar',
    G21: '21K Gold',
    G24: '24K Gold',
  },
};

export function getCurrencyName(code: string, fallbackKurdish: string, language: Language): string {
  const dict = CURRENCY_NAMES[language];
  if (dict && dict[code]) {
    return dict[code];
  }
  return fallbackKurdish;
}

