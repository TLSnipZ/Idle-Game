import { formatInteger } from './number-format';
import type { dashboardPresentation } from './dashboard-presentation';
import { Navigation } from './Navigation';
import { HudPlayerProgress } from './HudPlayerProgress';
import { SECTION } from './navigation';
import type { Navigate, SectionId } from './navigation';
import type { MessageKey } from './localization';

export function GlobalStatus({ view, active, onNavigate, paused, t }: {
  readonly view: ReturnType<typeof dashboardPresentation>;
  readonly active: SectionId;
  readonly onNavigate: Navigate;
  readonly paused: boolean;
  readonly t: (key: MessageKey) => string;
}) {
  return <div className="global-chrome">
    <div className="global-chrome-inner">
      <dl className="global-status" aria-label={t('hudStatus')}>
        <div className="hud-cash"><dt>{t('cash')}</dt><dd>{view.cash}</dd></div>
        <div className="hud-level"><dt>{t('playerLevel')}</dt><dd>{view.player.currentLevel}<HudPlayerProgress progress={view.player} /></dd></div>
        <div className={`hud-heat heat-${view.heat.tier.id}`}><dt>{t('heat')}</dt><dd>{view.heat.heat} · {view.heat.tier.label}</dd></div>
        <div className="hud-empire"><dt>{t('empirePoints')}</dt><dd>{formatInteger(view.empire.empirePoints)} EP</dd></div>
      </dl>
      <Navigation active={active} onNavigate={onNavigate} t={t} />
      {(view.event.pending || view.autoActive || paused) && <div className="global-indicators">
        {view.event.pending && <button type="button" onClick={() => onNavigate(SECTION.city.id)}>{t('cityEventActive')} · {view.event.pending.name}</button>}
        {view.autoActive && <button type="button" onClick={() => onNavigate(SECTION.operations.id)}>{paused ? t('autoPaused') : t('autoActive')}</button>}
        {paused && <span>{t('sessionPaused')}</span>}
      </div>}
    </div>
  </div>;
}
