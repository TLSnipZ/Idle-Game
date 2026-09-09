import { CREW_CATALOG } from '../features/crew';
import type { CrewMemberId, CrewSlotId } from '../features/crew';
import type { GameState } from '../game/game-state';
import { selectCrew } from '../game/crew-selectors';
import { crewPresentation, describeCrewEffect } from './crew-presentation';
import { formatCash } from '../features/economy/ui';
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
    <div className="crew-slots">{crew.slots.map(slot => <article className="panel crew-slot" key={slot.id} aria-labelledby={`crew-slot-${slot.id}`}>
      <h3 id={`crew-slot-${slot.id}`}>{slot.name.toUpperCase()}</h3>
      <p>Current: {slot.occupant?.name ?? 'Empty'}</p>
      <p>{slot.occupant ? describeCrewEffect(slot.occupant.effect) : 'No active specialist'}</p>
      {slot.occupant && <button className="action-button" disabled={paused} aria-label={`Unassign ${slot.name}`} onClick={() => onUnassign(slot.id)}>Unassign</button>}
    </article>)}</div>
    <div className="crew-catalog">{CREW_CATALOG.map(member => {
      const view = crewPresentation(state, member.id);
      if (!view) return null;
      const requirementsId = `${member.id}-requirements`;
      return <article className="panel crew-card" key={member.id} aria-labelledby={`${member.id}-heading`}>
        <div className="panel-heading"><h3 id={`${member.id}-heading`}>{member.name}</h3><span className="ownership-badge">{view.status}</span></div>
        <p>{member.description}</p><p>{view.effect} · Only while assigned</p><p>{view.availability}</p>
        {!view.recruited ? <>
          <p>Recruitment: <strong>{formatCash(member.recruitmentCost)}</strong></p>
          <RequirementList result={view.requirements} id={requirementsId} />
          <button className="action-button purchase-button" disabled={paused || !view.canRecruit} aria-label={`Recruit ${member.name}`}
            aria-describedby={requirementsId} onClick={() => onRecruit(member.id)}>Recruit</button>
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
