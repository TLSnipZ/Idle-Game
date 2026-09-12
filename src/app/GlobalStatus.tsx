import { formatInteger } from './number-format';
import type { dashboardPresentation } from './dashboard-presentation';
import { Navigation } from './Navigation';
import { HudPlayerProgress } from './HudPlayerProgress';
import { SECTION } from './navigation';
import type { Navigate, SectionId } from './navigation';
import { DEFAULT_LOCALE, translate } from './localization';
import type { MessageKey } from './localization';
import { useLocale, useLocalizedText } from './LocalizationProvider';
import { heatTierLabel } from './heat-presentation';
import { localizedContent } from './content-localization';

const defaultTranslate = (key: MessageKey) => translate(DEFAULT_LOCALE, key);

export function GlobalStatus({ view, active, onNavigate, paused, t = defaultTranslate }: {
  readonly view: ReturnType<typeof dashboardPresentation>;
  readonly active: SectionId;
  readonly onNavigate: Navigate;
  readonly paused: boolean;
  readonly t?: (key: MessageKey) => string;
}) {
  const locale = useLocale();
  const text = useLocalizedText();
  const eventName = view.event.pending ? localizedContent(locale, view.event.pending.id, 'name', view.event.pending.name) : '';
  const activities = Number(Boolean(view.event.pending)) + Number(view.autoActive) + Number(paused) + Number(view.empire.eligible);
  return <div className="global-chrome">
    <div className="global-chrome-inner">
      <div className="hud-command-row">
        <dl className="global-status" aria-label={t('hudStatus')}>
          <div className="hud-cash"><dt>{t('cash')}</dt><dd>{view.cash}</dd></div>
          <div className="hud-level"><dt>{t('playerLevel')}</dt><dd>{view.player.currentLevel}<HudPlayerProgress progress={view.player} /></dd></div>
          <div className={`hud-heat heat-${view.heat.tier.id}`}><dt>{t('heat')}</dt><dd>{view.heat.heat} · {heatTierLabel(view.heat.tier.label, locale)}</dd></div>
          <div className="hud-empire"><dt>{t('empirePoints')}</dt><dd>{formatInteger(view.empire.empirePoints)} EP</dd></div>
        </dl>
        <div className={`global-indicators activity-center ${activities ? 'has-activity' : 'is-quiet'}`} aria-label={text('Activity Center', 'Aktivitätszentrale')}>
          <div className="activity-center-heading"><span>{text('ACTIVITY CENTER', 'AKTIVITÄTSZENTRALE')}</span><strong>{activities ? text(`${activities} live`, `${activities} aktiv`) : text('ALL QUIET', 'ALLES RUHIG')}</strong></div>
          <div className="activity-center-items">
            {view.event.pending && <button type="button" className="activity-item activity-event" onClick={() => onNavigate(SECTION.city.id)}><span>{t('cityEventActive')}</span><strong>{eventName}</strong></button>}
            {view.autoActive && <button type="button" className="activity-item activity-auto" onClick={() => onNavigate(SECTION.operations.id)}><span>{text('AUTOMATION', 'AUTOMATISIERUNG')}</span><strong>{paused ? t('autoPaused') : t('autoActive')}</strong></button>}
            {view.empire.eligible && view.empire.reward !== null && <button type="button" className="activity-item activity-rebirth" onClick={() => onNavigate(SECTION.empire.id)}><span>{text('REBIRTH READY', 'REBIRTH BEREIT')}</span><strong>+{formatInteger(view.empire.reward)} EP · {text('your empire has discovered reincarnation', 'dein Imperium hat Wiedergeburt entdeckt')}</strong></button>}
            {paused && <div className="activity-item activity-paused" role="status"><span>{text('SYSTEM', 'SYSTEM')}</span><strong>{t('sessionPaused')}</strong></div>}
            {!activities && <div className="activity-empty"><span>{text('No fires to put out.', 'Gerade brennt nichts.')}</span> {text('Enjoy it before Solara notices.', 'Genieß es, bevor Solara das mitbekommt.')}</div>}
          </div>
        </div>
      </div>
      <Navigation active={active} onNavigate={onNavigate} t={t} />
    </div>
  </div>;
}
