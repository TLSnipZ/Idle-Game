import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { DEFAULT_LOCALE } from './localization';
import type { Locale } from './localization';

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function LocalizationProvider({ locale, children }: { readonly locale: Locale; readonly children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale { return useContext(LocaleContext); }

/** Presentation helper for copy that has not yet earned a stable message key. */
export function useLocalizedText() {
  const locale = useLocale();
  return (english: string, german: string) => locale === 'de' ? german : english;
}

export function localize(locale: Locale, english: string, german: string): string {
  return locale === 'de' ? german : english;
}
