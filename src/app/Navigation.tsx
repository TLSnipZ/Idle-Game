import { PRIMARY_SECTIONS } from './navigation';
import type { Navigate, SectionId } from './navigation';
import { DEFAULT_LOCALE, translate } from './localization';
import type { MessageKey } from './localization';

const SECTION_LABEL_KEY: Record<SectionId, MessageKey> = {
  overview: 'overviewLabel',
  operations: 'operationsLabel',
  city: 'cityLabel',
  collection: 'collectionLabel',
  empire: 'empireLabel',
};

const defaultTranslate = (key: MessageKey) => translate(DEFAULT_LOCALE, key);

export function Navigation({ active, onNavigate, t = defaultTranslate }: {
  readonly active: SectionId;
  readonly onNavigate: Navigate;
  readonly t?: (key: MessageKey) => string;
}) {
  return <nav className="primary-navigation" aria-label={t('primaryNavigation')}>{PRIMARY_SECTIONS.map(section =>
    <button type="button" key={section.id} aria-current={active === section.id ? 'page' : undefined}
      aria-controls="section-content" onClick={() => onNavigate(section.id)}>{t(SECTION_LABEL_KEY[section.id])}</button>
  )}</nav>;
}
