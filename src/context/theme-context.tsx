import React, { createContext, useContext, useState } from 'react';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  bgPrimary: string;
  bgSecondary: string;
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  borderColor: string;
  primaryAccent: string;
}

const lightColors: ThemeColors = {
  bgPrimary: '#F8FAFC',
  bgSecondary: '#F1F5F9',
  cardBg: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  borderColor: '#E2E8F0',
  primaryAccent: '#3B50C8',
};

const darkColors: ThemeColors = {
  bgPrimary: '#0F172A',
  bgSecondary: '#1E293B',
  cardBg: '#1E293B',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  borderColor: '#334155',
  primaryAccent: '#6366F1',
};

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'light',
  setThemeMode: () => {},
  isDark: false,
  colors: lightColors,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
  };

  const isDark = themeMode === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, isDark, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
