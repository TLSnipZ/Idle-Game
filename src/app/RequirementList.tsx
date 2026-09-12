import type { RequirementResult } from '../game/requirement';
import { useLocale, useLocalizedText } from './LocalizationProvider';

function requirementDescription(description: string, locale: 'en' | 'de') {
  if (locale === 'en') return description;
  if (description === 'Own at least one business') return 'Besitze mindestens ein Business';
  if (description.startsWith('Player Level ')) return description.replace('Player Level ', 'Spielerlevel ');
  if (description.startsWith('Own ')) return description.replace('Own ', 'Besitze ');
  if (description.startsWith('Control ')) return description.replace('Control ', 'Kontrolliere ');
  if (description.startsWith('Purchase ')) return description.replace('Purchase ', 'Kaufe ');
  if (description.startsWith('Unlock ')) return description.replace('Unlock ', 'Schalte frei: ');
  if (description.includes(' Rank ')) return description.replace(' Rank ', ' Rang ');
  return description;
}

/** Text states are explicit so color is never the only eligibility signal. */
export function RequirementList({ result, id }: { readonly result: RequirementResult; readonly id: string }) {
  const locale = useLocale();
  const text = useLocalizedText();
  return <div id={id} className="requirements">
    {result.requirements.length === 0 ? <p>{text('No requirements. Miracles do happen.', 'Keine Voraussetzungen. Solara kann also doch großzügig sein.')}</p> : <>
      <p>{text('Requirements', 'Voraussetzungen')}</p>
      <ul>{result.requirements.map((detail, index) => <li key={index} className={detail.met ? 'requirement-met' : 'requirement-unmet'}>
        {detail.met ? text('Met', 'Erfüllt') : text('Required', 'Benötigt')} — {requirementDescription(detail.description, locale)}
      </li>)}</ul>
    </>}
  </div>;
}
