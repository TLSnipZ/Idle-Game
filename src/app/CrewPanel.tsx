import { CREW_CATALOG } from '../features/crew';
import type { CrewMemberId, CrewSlotId } from '../features/crew';
import type { GameState } from '../game/game-state';
import { selectCrew } from '../game/crew-selectors';
import { crewPresentation, describeCrewEffect } from './crew-presentation';
import { formatPrice } from './number-format';
import { RequirementList } from './RequirementList';
import { useLocale, useLocalizedText } from './LocalizationProvider';
import { localizedContent, localizedSlotName } from './content-localization';

export function CrewPanel({ state, paused, onRecruit, onAssign, onUnassign }: {
  readonly state: GameState; readonly paused: boolean;
  readonly onRecruit: (id: CrewMemberId) => void;
  readonly onAssign: (slot: CrewSlotId, id: CrewMemberId) => void;
  readonly onUnassign: (slot: CrewSlotId) => void;
}) {
  const locale = useLocale();
  const text = useLocalizedText();
  const crew = selectCrew(state);
  return <section className="crew" aria-labelledby="crew-heading">
    <div className="panel-heading"><h2 id="crew-heading">CREW</h2>
      <span>{text('Recruited:', 'Rekrutiert:')} {crew.recruitedCrewCount} / {crew.totalConfiguredCrew} · {text('Active:', 'Aktiv:')} {crew.activeAssignmentCount} / {crew.totalSlots}</span></div>
    <p>{text('Recruit specialists and put them where they matter. Better margins, less Heat, fewer reasons to answer the phone yourself.', 'Rekrutier Spezialisten und setz sie da ein, wo sie wehtun — bessere Margen, weniger Heat und weniger Gründe, selbst ans Telefon zu gehen.')}</p>
    <h3 className="subsection-label">{text('Active assignments', 'Aktive Einsätze')}</h3>
    <div className="crew-slots">{crew.slots.map(slot => {
      const slotName = localizedSlotName(locale, slot.name);
      return <article className="panel crew-slot" key={slot.id} aria-labelledby={`crew-slot-${slot.id}`}>
      <h4 id={`crew-slot-${slot.id}`}>{slotName.toUpperCase()}</h4>
      <p className="slot-occupant">{slot.occupant ? text(`Current: ${slot.occupant.name}`, `Aktuell: ${slot.occupant.name}`) : text('No specialist assigned.', 'Kein Spezialist zugewiesen. Der Stuhl verdient aktuell mehr als er.')}</p>
      <p>{slot.occupant ? describeCrewEffect(slot.occupant.effect, locale) : text(`Recruit or assign a specialist for ${slotName} below.`, `Rekrutier oder weise unten einen Spezialisten für ${slotName} zu.`)}</p>
      {slot.occupant && <button className="action-button" disabled={paused} aria-label={text(`Unassign ${slotName}`, `${slotName} räumen`)} onClick={() => onUnassign(slot.id)}>{text('Unassign', 'Abziehen')}</button>}
    </article>;})}</div>
    <h3 className="subsection-label">{text('Roster', 'Kader')}</h3>
    <div className="crew-catalog">{CREW_CATALOG.map(member => {
      const view = crewPresentation(state, member.id, locale);
      if (!view) return null;
      const requirementsId = `${member.id}-requirements`;
      const description = localizedContent(locale, member.id, 'description', member.description);
      return <article className="panel crew-card" key={member.id} aria-labelledby={`${member.id}-heading`}>
        <div className="crew-identity"><div className="panel-heading"><h4 id={`${member.id}-heading`}>{member.name}</h4><span className="ownership-badge">{view.status}</span></div>
        <p className="eyebrow">{view.compatibleSlots.map(slot => localizedSlotName(locale, slot.name)).join(' / ')}</p><p>{description}</p></div><p className="specialist-effect">{view.effect} · {text('Only while assigned', 'Nur solange zugewiesen')}</p>{view.recruited && view.availability && <p>{view.availability}</p>}
        {!view.recruited ? <>
          <p>{text('Recruitment:', 'Rekrutierung:')} <strong>{formatPrice(member.recruitmentCost)}</strong></p>
          <RequirementList result={view.requirements} id={requirementsId} />
          <div className="card-action-area">
          <button className="action-button purchase-button" disabled={paused || !view.canRecruit} aria-label={text(`Recruit ${member.name}`, `${member.name} rekrutieren`)}
            aria-describedby={requirementsId} onClick={() => onRecruit(member.id)}>{text('Recruit', 'Rekrutieren')}</button>
          {view.availability && <p className="purchase-note">{view.availability}</p>}
          </div>
        </> : view.compatibleSlots.filter(slot => slot.canAssign).map(slot => {
          const slotName = localizedSlotName(locale, slot.name);
          return <button className="action-button" key={slot.id} disabled={paused}
            aria-label={text(`Assign ${member.name} to ${slotName}${slot.occupant ? `, replacing ${slot.occupant.name}` : ''}`, `${member.name} ${slotName} zuweisen${slot.occupant ? `, ersetzt ${slot.occupant.name}` : ''}`)}
            onClick={() => onAssign(slot.id, member.id)}>
            {text(`Assign to ${slotName}${slot.occupant ? ` · Replace ${slot.occupant.name}` : ''}`, `Zu ${slotName}${slot.occupant ? ` · ${slot.occupant.name} ersetzen` : ''}`)}
          </button>;})}
      </article>;
    })}</div>
  </section>;
}
