import { useEffect, useState } from 'react';
import { DEFAULT_LOCALE } from './localization';
import type { Locale } from './localization';

const SETTINGS_KEY = 'solara-city:settings';
export interface PresentationSettings { readonly locale: Locale; readonly reducedMotion: boolean; }
const DEFAULT_SETTINGS: PresentationSettings = { locale: DEFAULT_LOCALE, reducedMotion: false };

function readSettings(): PresentationSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_SETTINGS;
    const value = parsed as Record<string, unknown>;
    return {
      locale: value.locale === 'de' || value.locale === 'en' ? value.locale : DEFAULT_LOCALE,
      reducedMotion: typeof value.reducedMotion === 'boolean' ? value.reducedMotion : false,
    };
  } catch { return DEFAULT_SETTINGS; }
}

export function useSettings() {
  const [settings, setSettings] = useState<PresentationSettings>(readSettings);
  useEffect(() => {
    document.documentElement.lang = settings.locale;
    document.documentElement.dataset.reducedMotion = settings.reducedMotion ? 'true' : 'false';
    try { window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* Presentation preferences may fail without pausing gameplay. */ }
  }, [settings]);
  return {
    settings,
    setLocale: (locale: Locale) => setSettings(current => ({ ...current, locale })),
    setReducedMotion: (reducedMotion: boolean) => setSettings(current => ({ ...current, reducedMotion })),
  };
}
