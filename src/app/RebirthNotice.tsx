import { useEffect, useRef, useState } from 'react';
import type { selectRebirth } from '../game/rebirth';
import { formatInteger } from './number-format';

/** Derived guidance only. Reward updates do not repeat the eligibility announcement. */
export function RebirthNotice({ preview, onReview }: {
  readonly preview: ReturnType<typeof selectRebirth>;
  readonly onReview: () => void;
}) {
  const wasEligible = useRef(false);
  const [announcement, setAnnouncement] = useState('');
  useEffect(() => {
    if (preview.eligible && !wasEligible.current && preview.reward !== null)
      setAnnouncement(`Rebirth ready. Current reward ${formatInteger(preview.reward)} Empire Points.`);
    else if (!preview.eligible) setAnnouncement('');
    wasEligible.current = preview.eligible;
  }, [preview.eligible, preview.reward]);
  return <div className="rebirth-notice-slot">
    <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</span>
    {preview.eligible && preview.reward !== null && <div className="rebirth-notice">
      <span><strong>REBIRTH READY</strong> · +{formatInteger(preview.reward)} EP</span>
      <button type="button" onClick={onReview} aria-label="Review Rebirth in Empire"><span className="rebirth-review-desktop">Review Rebirth</span><span className="rebirth-review-mobile" aria-hidden="true">Review →</span></button>
    </div>}
  </div>;
}
