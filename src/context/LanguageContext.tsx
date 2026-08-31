import { createContext, useContext, useState, type ReactNode } from 'react';
import { en } from '../i18n/en';
import { ml } from '../i18n/ml';

export type Language = 'en' | 'ml';

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

const dictionaries = {
  en,
  ml,
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language') as Language;
    return saved || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let result: any = dictionaries[language];
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        // Fallback to English if key missing in current language
        if (language !== 'en') {
          let fallbackResult: any = dictionaries['en'];
          for (const fbKey of keys) {
            if (fallbackResult && typeof fallbackResult === 'object' && fbKey in fallbackResult) {
              fallbackResult = fallbackResult[fbKey];
            } else {
              return key; // Key missing in both
            }
          }
          return typeof fallbackResult === 'string' ? fallbackResult : key;
        }
        return key;
      }
    }
    return typeof result === 'string' ? result : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
