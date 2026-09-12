import type { Locale, MessageKey } from './localization';
import type { PresentationSettings } from './use-settings';

interface Props {
  readonly open: boolean;
  readonly settings: PresentationSettings;
  readonly t: (key: MessageKey) => string;
  readonly onClose: () => void;
  readonly onLocale: (locale: Locale) => void;
  readonly onReducedMotion: (enabled: boolean) => void;
}

export function SettingsPanel({ open, settings, t, onClose, onLocale, onReducedMotion }: Props) {
  if (!open) return null;
  return <div className="settings-backdrop" role="presentation" onMouseDown={event => { if (event.currentTarget === event.target) onClose(); }}>
    <section className="settings-panel" role="dialog" aria-modal="true" aria-labelledby="settings-heading">
      <div className="settings-heading-row"><div><p className="eyebrow">SOLARA CITY</p><h2 id="settings-heading">{t('settingsTitle')}</h2></div><button className="settings-close" type="button" onClick={onClose} aria-label={t('close')}>×</button></div>
      <p className="settings-intro">{t('settingsIntro')}</p>
      <div className="settings-group"><span className="settings-label">{t('language')}</span><div className="settings-segment" role="group" aria-label={t('language')}>
        <button type="button" aria-pressed={settings.locale === 'en'} onClick={() => onLocale('en')}>{t('english')}</button>
        <button type="button" aria-pressed={settings.locale === 'de'} onClick={() => onLocale('de')}>{t('german')}</button>
      </div></div>
      <label className="settings-toggle"><span><strong>{t('reducedMotion')}</strong><small>{t('reducedMotionHelp')}</small></span><input type="checkbox" checked={settings.reducedMotion} onChange={event => onReducedMotion(event.target.checked)} /></label>
    </section>
  </div>;
}
