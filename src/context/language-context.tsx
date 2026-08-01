import React, { createContext, useContext, useState } from 'react';
import type { Language, TranslationKeys } from '@/constants/translations';
import { TRANSLATIONS } from '@/constants/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof TranslationKeys) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'kurdish',
  setLanguage: () => {},
  t: (key) => TRANSLATIONS.kurdish[key] || key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('kurdish');

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
  };

  const t = (key: keyof TranslationKeys): string => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.kurdish;
    return dict[key] || TRANSLATIONS.kurdish[key] || String(key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
