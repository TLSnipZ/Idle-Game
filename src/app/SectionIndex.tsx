import type { SectionId } from './navigation';
import { useLocalizedText } from './LocalizationProvider';

const LINKS = {
  city: [['city-heading', 'Districts & Heat', 'Bezirke & Heat'], ['crew-heading', 'Crew', 'Crew'], ['city-events-heading', 'Events', 'Events']],
  collection: [['garage-heading', 'Garage', 'Garage'], ['tuning-heading', 'Tuning workshop', 'Tuning-Werkstatt']],
  empire: [['rebirth-heading', 'Rebirth', 'Rebirth'], ['skill-tree-heading', 'Skills', 'Skills'], ['achievements-heading', 'Achievements', 'Achievements'], ['statistics-heading', 'Statistics', 'Statistiken'], ['save-transfer-heading', 'Save & Transfer', 'Speichern & Transfer']],
} as const;

export function SectionIndex({ section }: { readonly section: Exclude<SectionId, 'overview' | 'operations'> }) {
  const text = useLocalizedText();
  return <nav className="section-index" aria-label={text('In this section', 'In diesem Bereich')}>
    <span className="section-index-label">{text('QUICK ACCESS', 'DIREKTZUGRIFF')}</span>
    {LINKS[section].map(([id, en, de]) => <button key={id} type="button" onClick={() => {
      const target = document.getElementById(id);
      if (target) { target.tabIndex = -1; target.focus({ preventScroll: true }); target.scrollIntoView({ block: 'start', behavior: 'instant' }); }
    }}>{text(en, de)}</button>)}
  </nav>;
}
