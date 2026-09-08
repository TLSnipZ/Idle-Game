import { EMPIRE_FOUNDATIONS, SKILL_CATALOG } from '../features/skills';
import type { GameState } from '../game/game-state';
import { selectSkill } from '../game/skill-selectors';
import { describeSkillEffect } from './skill-presentation';
import { RequirementList } from './RequirementList';

export function SkillTree({ state, paused, onPurchase }: {
  readonly state: GameState; readonly paused: boolean; readonly onPurchase: (id: string) => void;
}) {
  return <section className="skill-tree" aria-labelledby="skill-tree-heading">
    <div className="panel-heading"><h2 id="skill-tree-heading">{EMPIRE_FOUNDATIONS.name}</h2>
      <span>Empire Points available: {state.permanentProgression.empirePoints} EP</span></div>
    <p>Invest in permanent ranks. Skills survive every Rebirth. Purchases cannot be refunded.</p>
    <div className="skill-nodes">{SKILL_CATALOG.map(skill => {
      const view = selectSkill(state, skill.id);
      if (!view) return null;
      const heading = `${skill.id}-heading`, requirements = `${skill.id}-requirements`;
      return <article key={skill.id} className="panel skill-node" aria-labelledby={heading}>
        <div className="panel-heading"><h3 id={heading}>{skill.name}</h3>
          <span className="ownership-badge">{view.maxed ? 'MAXED' : !view.requirements.met ? 'LOCKED' : 'AVAILABLE'}</span></div>
        <p>Rank {view.rank} / {view.maxRank}{view.rank > 0 ? ' · Permanent effect active' : ''}</p>
        <p>{skill.description}</p>
        <p>Current: {describeSkillEffect(view.currentEffect)}</p>
        {view.nextEffect && <p>Next rank: {describeSkillEffect(view.nextEffect)}</p>}
        <RequirementList result={view.requirements} id={requirements} />
        {!view.maxed && <>
          <p>Next rank: <strong>{view.nextCost} EP</strong></p>
          <p>{!view.requirements.met ? 'Prerequisites not met.' : view.insufficientEp ? 'Not enough Empire Points.' : 'Ready to invest.'}</p>
          <button className="action-button" disabled={paused || !view.canPurchase} aria-describedby={requirements}
            aria-label={`Purchase next rank of ${skill.name}`} onClick={() => onPurchase(skill.id)}>
            {paused ? 'Session paused' : 'Purchase rank'}</button>
        </>}
      </article>;
    })}</div>
  </section>;
}
