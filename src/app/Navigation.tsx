import { PRIMARY_SECTIONS } from './navigation';
import type { Navigate, SectionId } from './navigation';
export function Navigation({ active, onNavigate }: { readonly active: SectionId; readonly onNavigate: Navigate }) {
  return <nav className="primary-navigation" aria-label="Primary sections">{PRIMARY_SECTIONS.map(section =>
    <button type="button" key={section.id} aria-current={active === section.id ? 'page' : undefined}
      aria-controls="section-content" onClick={() => onNavigate(section.id)}>{section.label}</button>
  )}</nav>;
}
