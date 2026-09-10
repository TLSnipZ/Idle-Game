import { CREW_CATALOG } from '../features/crew';
import type { CrewMemberId, CrewSlotId } from '../features/crew';
import type { GameState } from '../game/game-state';
import { selectCrew } from '../game/crew-selectors';
import { crewPresentation, describeCrewEffect } from './crew-presentation';
import { formatPrice } from './number-format';
import { RequirementList } from './RequirementList';

export function CrewPanel({ state, paused, onRecruit, onAssign, onUnassign }: {
  readonly state: GameState; readonly paused: boolean;
  readonly onRecruit: (id: CrewMemberId) => void;
  readonly onAssign: (slot: CrewSlotId, id: CrewMemberId) => void;
  readonly onUnassign: (slot: CrewSlotId) => void;
}) {
  const crew = selectCrew(state);
  return <section className="crew" aria-labelledby="crew-heading">
    <div className="panel-heading"><h2 id="crew-heading">CREW</h2>
      <span>Recruited: {crew.recruitedCrewCount} / {crew.totalConfiguredCrew} · Active: {crew.activeAssignmentCount} / {crew.totalSlots}</span></div>
    <p>Recruit specialists and put them where they matter. Operations is a choice: better delivery cash or faster cooling.</p>
    <h3 className="subsection-label">Active assignments</h3>
    <div className="crew-slots">{crew.slots.map(slot => <article className="panel crew-slot" key={slot.id} aria-labelledby={`crew-slot-${slot.id}`}>
      <h4 id={`crew-slot-${slot.id}`}>{slot.name.toUpperCase()}</h4>
      <p className="slot-occupant">{slot.occupant ? `Current: ${slot.occupant.name}` : 'No specialist assigned.'}</p>
      <p>{slot.occupant ? describeCrewEffect(slot.occupant.effect) : `Recruit or assign a specialist for ${slot.name} below.`}</p>
      {slot.occupant && <button className="action-button" disabled={paused} aria-label={`Unassign ${slot.name}`} onClick={() => onUnassign(slot.id)}>Unassign</button>}
    </article>)}</div>
    <h3 className="subsection-label">Roster</h3>
    <div className="crew-catalog">{CREW_CATALOG.map(member => {
      const view = crewPresentation(state, member.id);
      if (!view) return null;
      const requirementsId = `${member.id}-requirements`;
      return <article className="panel crew-card" key={member.id} aria-labelledby={`${member.id}-heading`}>
        <div className="crew-identity"><div className="panel-heading"><h4 id={`${member.id}-heading`}>{member.name}</h4><span className="ownership-badge">{view.status}</span></div>
        <p className="eyebrow">{view.compatibleSlots.map(slot => slot.name).join(' / ')}</p><p>{member.description}</p></div><p className="specialist-effect">{view.effect} · Only while assigned</p>{view.recruited && view.availability && <p>{view.availability}</p>}
        {!view.recruited ? <>
          <p>Recruitment: <strong>{formatPrice(member.recruitmentCost)}</strong></p>
          <RequirementList result={view.requirements} id={requirementsId} />
          <div className="card-action-area">
          <button className="action-button purchase-button" disabled={paused || !view.canRecruit} aria-label={`Recruit ${member.name}`}
            aria-describedby={requirementsId} onClick={() => onRecruit(member.id)}>Recruit</button>
          {view.availability && <p className="purchase-note">{view.availability}</p>}
          </div>
        </> : view.compatibleSlots.filter(slot => slot.canAssign).map(slot =>
          <button className="action-button" key={slot.id} disabled={paused}
            aria-label={`Assign ${member.name} to ${slot.name}${slot.occupant ? `, replacing ${slot.occupant.name}` : ''}`}
            onClick={() => onAssign(slot.id, member.id)}>
            Assign to {slot.name}{slot.occupant ? ` · Replace ${slot.occupant.name}` : ''}
          </button>)}
      </article>;
    })}</div>
  </section>;
}
