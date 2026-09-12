export type Locale = 'en' | 'de';

export const DEFAULT_LOCALE: Locale = 'en';

const messages = {
  en: {
    skip: 'Skip to main content',
    tagline: 'Own the night',
    autosave: 'Autosave on',
    returnEmpire: 'Return to Empire · Confirmation awaiting your choice',
    localProgress: 'Local progress',
    awayPrefix: 'Earn while away for up to',
    footerGenre: 'Crime empire',
    footerTagline: 'Start small. Own the night.',
    settings: 'Settings',
    settingsTitle: 'Settings & language',
    settingsIntro: 'Tune Solara City to your setup. These preferences stay on this device and never alter game progression.',
    language: 'Language',
    english: 'English',
    german: 'Deutsch',
    reducedMotion: 'Reduce motion',
    reducedMotionHelp: 'Cuts non-essential animation and smooth movement while keeping gameplay feedback intact.',
    close: 'Close settings',
    overviewLabel: 'OVERVIEW', overviewDescription: 'Your operation at a glance. Choose your next move.',
    operationsLabel: 'OPERATIONS', operationsDescription: 'Run deliveries, grow businesses and manage automation.',
    cityLabel: 'CITY', cityDescription: 'Control districts, manage Heat and coordinate your Crew.',
    collectionLabel: 'COLLECTION', collectionDescription: 'Build your collection and unlock permanent vehicle bonuses.',
    empireLabel: 'EMPIRE', empireDescription: 'Build permanent progression across Rebirths and protect your save.',
  },
  de: {
    skip: 'Zum Hauptinhalt springen',
    tagline: 'Die Nacht gehört dir',
    autosave: 'Autosave aktiv',
    returnEmpire: 'Zurück zu Empire · Bestätigung wartet auf deine Entscheidung',
    localProgress: 'Lokaler Fortschritt',
    awayPrefix: 'Verdiene offline für bis zu',
    footerGenre: 'Crime Empire',
    footerTagline: 'Fang klein an. Hol dir die Nacht.',
    settings: 'Einstellungen',
    settingsTitle: 'Einstellungen & Sprache',
    settingsIntro: 'Passe Solara City an dein Setup an. Diese Einstellungen bleiben auf diesem Gerät und verändern niemals deinen Spielfortschritt.',
    language: 'Sprache',
    english: 'English',
    german: 'Deutsch',
    reducedMotion: 'Bewegungen reduzieren',
    reducedMotionHelp: 'Reduziert unnötige Animationen und weiche Bewegungen, ohne Gameplay-Feedback zu entfernen.',
    close: 'Einstellungen schließen',
    overviewLabel: 'ÜBERSICHT', overviewDescription: 'Dein Imperium auf einen Blick. Plane deinen nächsten Move.',
    operationsLabel: 'OPERATIONEN', operationsDescription: 'Fahre Lieferungen, baue Businesses aus und verwalte die Automation.',
    cityLabel: 'STADT', cityDescription: 'Kontrolliere Bezirke, manage Heat und koordiniere deine Crew.',
    collectionLabel: 'SAMMLUNG', collectionDescription: 'Erweitere deine Sammlung und schalte permanente Fahrzeugboni frei.',
    empireLabel: 'IMPERIUM', empireDescription: 'Baue permanenten Fortschritt über Rebirths hinweg auf und sichere deinen Spielstand.',
  },
} as const;

export type MessageKey = keyof typeof messages.en;
export function translate(locale: Locale, key: MessageKey): string { return messages[locale][key]; }
export function localeTag(locale: Locale): string { return locale === 'de' ? 'de-DE' : 'en-US'; }
