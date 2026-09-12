import { formatInteger } from './number-format';
import { EMPIRE_FOUNDATIONS, SKILL_CATALOG } from '../features/skills';
import type { GameState } from '../game/game-state';
import { selectSkill } from '../game/skill-selectors';
import { describeSkillEffect } from './skill-presentation';
import { RequirementList } from './RequirementList';
import { useLocale, useLocalizedText } from './LocalizationProvider';
import { localizedContent } from './content-localization';

export function SkillTree({ state, paused, onPurchase }: {
  readonly state: GameState; readonly paused: boolean; readonly onPurchase: (id: string) => void;
}) {
  const locale = useLocale();
  const text = useLocalizedText();
  return <section className="skill-tree" aria-labelledby="skill-tree-heading">
    <div className="panel-heading"><h2 id="skill-tree-heading">{localizedContent(locale, EMPIRE_FOUNDATIONS.id, 'name', EMPIRE_FOUNDATIONS.name)}</h2>
      <span>{text('Empire Points available:', 'Verfügbare Empire Points:')} {formatInteger(state.permanentProgression.empirePoints)} EP</span></div>
    <p>{text('Invest in permanent ranks. Skills survive every Rebirth. Purchases cannot be refunded because personal growth has terrible customer service.', 'Investiere in permanente Ränge. Skills überleben jeden Rebirth. Rückerstattung ausgeschlossen — persönliche Entwicklung hat miserablen Kundenservice.')}</p>
    <div className="skill-nodes">{SKILL_CATALOG.map(skill => {
      const view = selectSkill(state, skill.id);
      if (!view) return null;
      const heading = `${skill.id}-heading`, requirements = `${skill.id}-requirements`;
      const name = localizedContent(locale, skill.id, 'name', skill.name);
      const description = localizedContent(locale, skill.id, 'description', skill.description);
      return <article key={skill.id} className={`panel skill-node ${skill.requirements.length === 0 ? 'skill-foundation' : 'skill-branch'}`} aria-labelledby={heading}>
        <div className="panel-heading"><h3 id={heading}>{name}</h3>
          <span className="ownership-badge">{view.maxed ? text('MAXED · MAX RANK', 'MAX · MAX-RANG') : !view.requirements.met ? text('LOCKED', 'GESPERRT') : view.insufficientEp ? text('AVAILABLE · INSUFFICIENT EP', 'VERFÜGBAR · ZU WENIG EP') : text('READY TO PURCHASE', 'KAUFBEREIT')}</span></div>
        <p className="skill-rank">{text('Rank', 'Rang')} {view.rank} / {view.maxRank}{view.rank > 0 ? text(' · Permanent effect active', ' · Permanenter Effekt aktiv') : ''}</p>
        <p>{description}</p>
        <p>{text('Current:', 'Aktuell:')} {describeSkillEffect(view.currentEffect, locale)}</p>
        {view.nextEffect && <p>{text('Next rank:', 'Nächster Rang:')} {describeSkillEffect(view.nextEffect, locale)}</p>}
        <RequirementList result={view.requirements} id={requirements} />
        {!view.maxed && <>
          <p>{text('Next rank:', 'Nächster Rang:')} <strong>{view.nextCost === null ? '—' : formatInteger(view.nextCost)} EP</strong></p>
          <button className="action-button purchase-button" disabled={paused || !view.canPurchase} aria-describedby={requirements}
            aria-label={text(`Purchase next rank of ${name}`, `Nächsten Rang von ${name} kaufen`)} onClick={() => onPurchase(skill.id)}>
            {paused ? text('Session paused', 'Session pausiert') : text('Purchase rank', 'Rang kaufen')}</button>
        </>}
      </article>;
    })}</div>
  </section>;
}
