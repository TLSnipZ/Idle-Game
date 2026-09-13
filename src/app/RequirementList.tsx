import { localizedRequirementDescription as requirementDescription } from './requirement-localization';
import type { RequirementResult } from '../game/requirement';
import { useLocale, useLocalizedText } from './LocalizationProvider';



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
