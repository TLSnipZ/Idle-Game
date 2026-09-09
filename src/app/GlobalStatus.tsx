import { formatInteger } from './number-format';
import type { dashboardPresentation } from './dashboard-presentation';
import { Navigation } from './Navigation';
import { HudPlayerProgress } from './HudPlayerProgress';
import { SECTION } from './navigation';
import type { Navigate, SectionId } from './navigation';
export function GlobalStatus({ view, active, onNavigate, paused }: {
  readonly view: ReturnType<typeof dashboardPresentation>;
  readonly active: SectionId; readonly onNavigate: Navigate; readonly paused: boolean;
}) {
  return <div className="global-chrome">
    <div className="global-chrome-inner">
      <dl className="global-status" aria-label="Current player status">
        <div className="hud-cash"><dt>Cash</dt><dd>{view.cash}</dd></div>
        <div className="hud-level"><dt>Player Level</dt><dd>{view.player.currentLevel}<HudPlayerProgress progress={view.player} /></dd></div>
        <div className={`hud-heat heat-${view.heat.tier.id}`}><dt>Heat</dt><dd>{view.heat.heat} · {view.heat.tier.label}</dd></div>
        <div className="hud-empire"><dt>Empire Points</dt><dd>{formatInteger(view.empire.empirePoints)} EP</dd></div>
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
