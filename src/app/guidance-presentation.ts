import { BUSINESS_AUTO_UPGRADER, DELIVERY_DISPATCHER } from '../features/automation';
import { STARTER_BUSINESS } from '../features/businesses';
import type { Guidance, GuidanceDestination } from '../game/guidance';
import { formatInteger, formatPrice } from './number-format';
import type { SectionId } from './navigation';

/** Reuse existing card/section IDs. Colon-containing IDs are resolved with getElementById. */
export function guidanceDestination(destination: GuidanceDestination): { readonly section: SectionId; readonly headingId: string } {
  switch (destination.kind) {
    case 'jobs': return { section: 'operations', headingId: 'starter-heading' };
    case 'business': return { section: 'operations', headingId: destination.id === STARTER_BUSINESS.id ? 'business-name' : `${destination.id}-name` };
    case 'automation': return { section: 'operations', headingId: destination.id === BUSINESS_AUTO_UPGRADER.id ? 'auto-upgrader-heading' : destination.id === DELIVERY_DISPATCHER.id ? 'delegation-heading' : 'automation-heading' };
    case 'upgrade': return { section: 'operations', headingId: `${destination.id}-heading` };
    case 'vehicle': return { section: 'collection', headingId: `${destination.id}-heading` };
    case 'territory': case 'crew': return { section: 'city', headingId: `${destination.id}-heading` };
    case 'skill': return { section: 'empire', headingId: `${destination.id}-heading` };
    case 'rebirth': return { section: 'empire', headingId: 'rebirth-heading' };
  }
}

/** A bounded visual ratio only. Never convert arbitrary-precision Money to Number. */
export function guidancePercent(current: string | number, required: string | number): number {
  const have = BigInt(current), need = BigInt(required);
  if (need <= 0n) return 100;
  return Number((have >= need ? need : have < 0n ? 0n : have) * 100n / need);
}
export function guidancePresentation(guidance: Guidance) {
  const { step } = guidance;
  const number = step.count ? formatInteger(step.count.required) : '';
  const acquisitionTitle = step.destination.kind === 'crew' ? `Recruit ${step.name}`
    : step.destination.kind === 'territory' ? `Take control of ${step.name}`
      : `Acquire ${step.name}`;
  const titles = {
    'acquire': acquisitionTitle,
    'business-level': `Grow ${step.name} to Level ${number}`,
    'player-level': `Reach Player Level ${number}`,
    'skill-rank': `Develop ${step.name} to Rank ${number}`,
    'empire-points': `Earn Empire Points for ${step.name}`,
    'rebirth': 'Rebirth is available',
  };
  let note = 'A suggested milestone, not a required playstyle.';
  if (step.kind === 'acquire' && step.cash.missing !== '0') note = 'Earn Cash from Jobs and any owned Businesses, then return here to acquire it.';
  if (step.kind === 'player-level') note = 'Deliveries and paid Business upgrades grant XP.';
  if (step.kind === 'business-level') note = 'The Cash amount below is for the next Level only, not the entire target.';
  if (step.kind === 'empire-points') note = 'Earn EP through Rebirth. Review its requirements and keep/lose summary before deciding.';
  if (step.kind === 'rebirth') note = `Current reward: +${formatInteger(step.rebirthReward)} EP. Rebirth is optional; continuing the run is valid.`;
  if (step.destination.kind === 'crew') note = 'Recruitment alone gives no bonus. Choose an assignment afterward in Crew.';
  if (step.destination.kind === 'automation' && step.destination.id === BUSINESS_AUTO_UPGRADER.id)
    note = 'Starts disabled. Enabling automatic Cash spending remains your choice.';
  if (step.kind === 'skill-rank') note = `Next rank costs ${formatInteger(step.epCost)} EP. Permanent skill purchases cannot be refunded.`;
  const button = step.destination.kind === 'jobs' ? 'View Jobs'
    : step.destination.kind === 'rebirth' ? 'View Rebirth'
      : `View ${step.name}`;
  return { title: titles[step.kind], note, button,
    cashLabel: step.cash?.purpose === 'next-upgrade' ? 'Cash for next upgrade' : 'Cash for acquisition',
    cashText: step.cash ? `${formatPrice(step.cash.current)} / ${formatPrice(step.cash.required)}` : '',
    cashHint: step.cash ? step.cash.missing === '0' ? 'Affordable' : `Missing ${formatPrice(step.cash.missing)}` : '',
  };
}
