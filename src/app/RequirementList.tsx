import type { RequirementResult } from '../game/requirement';

/** Text states are explicit so color is never the only eligibility signal. */
export function RequirementList({ result, id }: { readonly result: RequirementResult; readonly id: string }) {
  return <div id={id} className="requirements">
    {result.requirements.length === 0 ? <p>No requirements.</p> : <>
      <p>Requirements</p>
      <ul>{result.requirements.map((detail, index) => <li key={index} className={detail.met ? 'requirement-met' : 'requirement-unmet'}>
        {detail.met ? 'Met' : 'Required'} — {detail.description}
      </li>)}</ul>
    </>}
  </div>;
}
