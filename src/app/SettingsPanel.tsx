import { useEffect, useRef } from 'react';
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
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!open) return;
    const element = dialog.current;
    const previous = document.activeElement;
    element?.showModal();
    return () => {
      element?.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, [open]);
  if (!open) return null;
  return <dialog ref={dialog} className="settings-panel" aria-labelledby="settings-heading"
    onCancel={event => { event.preventDefault(); onClose(); }}
    onMouseDown={event => {
      if (event.currentTarget !== event.target) return;
      const box = event.currentTarget.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose();
    }}>
      <div className="settings-heading-row"><div><p className="eyebrow">{settings.locale === 'villager' ? 'Hrrm Hrrrmm' : 'SOLARA CITY'}</p><h2 id="settings-heading">{t('settingsTitle')}</h2></div><button className="settings-close" type="button" onClick={onClose} aria-label={t('close')}>×</button></div>
      <p className="settings-intro">{t('settingsIntro')}</p>
      <div className="settings-group"><span className="settings-label">{t('language')}</span><div className="settings-segment" role="group" aria-label={t('language')}>
        <button type="button" aria-pressed={settings.locale === 'en'} onClick={() => onLocale('en')}><span aria-hidden="true">🇬🇧</span> {t('english')}</button>
        <button type="button" aria-pressed={settings.locale === 'de'} onClick={() => onLocale('de')}><span aria-hidden="true">🇩🇪</span> {t('german')}</button>
        <button type="button" aria-pressed={settings.locale === 'villager'} onClick={() => onLocale('villager')}><span aria-hidden="true">🟩</span> {t('villager')}</button>
      </div></div>
      <label className="settings-toggle"><span><strong>{t('reducedMotion')}</strong><small>{t('reducedMotionHelp')}</small></span><input type="checkbox" checked={settings.reducedMotion} onChange={event => onReducedMotion(event.target.checked)} /></label>
  </dialog>;
}
