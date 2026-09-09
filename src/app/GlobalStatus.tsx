import type { dashboardPresentation } from './dashboard-presentation';
import { Navigation } from './Navigation';
import { SECTION } from './navigation';
import type { Navigate, SectionId } from './navigation';
export function GlobalStatus({ view, active, onNavigate, paused }: {
  readonly view: ReturnType<typeof dashboardPresentation>;
  readonly active: SectionId; readonly onNavigate: Navigate; readonly paused: boolean;
}) {
  return <div className="global-chrome">
    <div className="global-chrome-inner">
      <dl className="global-status" aria-label="Current player status">
        <div><dt>Cash</dt><dd>{view.cash}</dd></div>
        <div><dt>Player Level</dt><dd>{view.player.currentLevel}</dd></div>
        <div><dt>Heat</dt><dd>{view.heat.heat} · {view.heat.tier.label}</dd></div>
        <div><dt>Empire Points</dt><dd>{view.empire.empirePoints} EP</dd></div>
      </dl>
      <Navigation active={active} onNavigate={onNavigate} />
      {(view.event.pending || view.autoActive || paused) && <div className="global-indicators">
        {view.event.pending && <button type="button" onClick={() => onNavigate(SECTION.city.id)}>CITY EVENT ACTIVE · {view.event.pending.name}</button>}
        {view.autoActive && <button type="button" onClick={() => onNavigate(SECTION.operations.id)}>{paused ? 'AUTO-UPGRADER ENABLED · SESSION PAUSED' : 'AUTO-UPGRADER ACTIVE · SPENDING ENABLED'}</button>}
        {paused && <span>SESSION PAUSED</span>}
      </div>}
    </div>
  </div>;
}
