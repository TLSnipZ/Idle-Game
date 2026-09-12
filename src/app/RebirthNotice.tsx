import { useEffect, useRef, useState } from 'react';
import type { selectRebirth } from '../game/rebirth';
import { formatInteger } from './number-format';
import { useLocale, useLocalizedText } from './LocalizationProvider';

/** Derived guidance only. Reward updates do not repeat the eligibility announcement. */
export function RebirthNotice({ preview, onReview }: {
  readonly preview: ReturnType<typeof selectRebirth>;
  readonly onReview: () => void;
}) {
  const locale = useLocale();
  const text = useLocalizedText();
  const wasEligible = useRef(false);
  const [announcement, setAnnouncement] = useState('');
  useEffect(() => {
    if (preview.eligible && !wasEligible.current && preview.reward !== null)
      setAnnouncement(locale === 'de'
        ? `Rebirth bereit. Aktuelle Belohnung ${formatInteger(preview.reward)} Empire Points. Dein Imperium hat die Reset-Taste offiziell zur Strategie erklärt.`
        : `Rebirth ready. Current reward ${formatInteger(preview.reward)} Empire Points.`);
    else if (!preview.eligible) setAnnouncement('');
    wasEligible.current = preview.eligible;
  }, [preview.eligible, preview.reward, locale]);
  return <div className="rebirth-notice-slot">
    <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</span>
    {preview.eligible && preview.reward !== null && <div className="rebirth-notice">
      <span><strong>{text('REBIRTH READY', 'REBIRTH BEREIT')}</strong> · +{formatInteger(preview.reward)} EP</span>
      <button type="button" onClick={onReview} aria-label={text('Review Rebirth in Empire', 'Rebirth im Imperium prüfen')}><span className="rebirth-review-desktop">{text('Review Rebirth', 'Rebirth prüfen')}</span><span className="rebirth-review-mobile" aria-hidden="true">{text('Review →', 'Prüfen →')}</span></button>
    </div>}
  </div>;
}
