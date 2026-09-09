/** Presentation identities only. Never part of GameState or save data. */
export const SECTION = {
  overview: { id: 'overview', label: 'OVERVIEW', description: 'Your operation at a glance. Choose your next move.' },
  operations: { id: 'operations', label: 'OPERATIONS', description: 'Run deliveries, grow businesses and manage automation.' },
  city: { id: 'city', label: 'CITY', description: 'Control districts, manage Heat and coordinate your Crew.' },
  collection: { id: 'collection', label: 'COLLECTION', description: 'Build your collection and unlock permanent vehicle bonuses.' },
  empire: { id: 'empire', label: 'EMPIRE', description: 'Build permanent progression across Rebirths and protect your save.' },
} as const;
export const PRIMARY_SECTIONS = [SECTION.overview, SECTION.operations, SECTION.city, SECTION.collection, SECTION.empire] as const;
export type SectionId = typeof PRIMARY_SECTIONS[number]['id'];
export const DEFAULT_SECTION: SectionId = SECTION.overview.id;
export type Navigate = (section: SectionId) => void;
