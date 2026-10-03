import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
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

const LANGUAGE_STORAGE_KEY = 'preferred-language';
const SUPPORTED_LANGUAGES: Language[] = ['kurdish', 'arabic', 'english'];

const getSavedLanguage = () =>
  Platform.OS === 'web'
    ? Promise.resolve(globalThis.localStorage?.getItem(LANGUAGE_STORAGE_KEY) ?? null)
    : SecureStore.getItemAsync(LANGUAGE_STORAGE_KEY);

const saveLanguage = (language: Language) => {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(LANGUAGE_STORAGE_KEY, language);
    return Promise.resolve();
  }
  return SecureStore.setItemAsync(LANGUAGE_STORAGE_KEY, language);
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('kurdish');
  const userSelectedLanguage = useRef(false);

  useEffect(() => {
    let isMounted = true;

    getSavedLanguage()
      .then((storedLanguage) => {
        if (
          isMounted &&
          !userSelectedLanguage.current &&
          SUPPORTED_LANGUAGES.includes(storedLanguage as Language)
        ) {
          setLanguageState(storedLanguage as Language);
        }
      })
      .catch((error) => console.warn('Could not load the saved language preference:', error));

    return () => {
      isMounted = false;
    };
  }, []);

  const setLanguage = useCallback((newLang: Language) => {
    userSelectedLanguage.current = true;
    setLanguageState(newLang);
    saveLanguage(newLang).catch((error) =>
      console.warn('Could not save the language preference:', error)
    );
  }, []);

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
