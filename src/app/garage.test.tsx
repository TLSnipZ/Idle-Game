import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Garage } from './Garage';
import { ModifierBreakdown } from './ModifierBreakdown';
import { createInitialGameState } from '../game/game-state';
import type { GameState } from '../game/game-state';
import { STARTER_VEHICLE as V } from '../features/vehicles';
import { STARTER_BUSINESS as B } from '../features/businesses';
import { moneyFromMinorUnits } from '../features/economy';
import { describeAction } from './game-presentation';
import { purchaseVehicle } from '../game/purchase-vehicle';
import { evaluateBusinessProduction } from '../game/effective-stats';
import { vehicleArtwork } from './vehicle-artwork';
const render=(state:GameState,paused=false)=>renderToStaticMarkup(<Garage state={state} paused={paused} onPurchase={()=>{}} onSelect={()=>{}} />);
function eligible() {
  const state=createInitialGameState();return {...state,progression:{xp:3600},economy:{cash:moneyFromMinorUnits('5500000')},
    businesses:{...state.businesses,owned:{[B.id]:{level:10}}}};
}
describe('Garage presentation',()=>{
  it('shows 0/7, scoped effect, accessible unmet requirements and disabled purchase',()=>{
    const html=render(createInitialGameState());expect(html).toContain('Owned vehicles: 0 / 7');
    expect(html).toContain('Required — Player Level 5');expect(html).toContain('Required — Own Dockside Detail');
    expect(html).toContain('Required — Dockside Detail Level 5');expect(html).toContain('LOCKED');
    expect(html).toContain('+10% Business Production');expect(html).toContain('$25,000');
    expect(html).toContain('Toseki Raizan');
    expect(html).toContain('aria-label="Buy Kairo KX-R"');expect(html).toContain('aria-describedby');expect(html).toContain('disabled');
  });
  it('distinguishes readiness, insufficient cash and paused session',()=>{
    expect(render(eligible())).toContain('Ready to purchase');const cards = render(eligible()).match(/<article[^>]*>[\s\S]*?<\/article>/g) ?? [];
    expect(cards).toHaveLength(7);
    for (const card of cards.slice(0,3)) expect(card).not.toContain('disabled');
    expect(cards[3]).toContain('disabled');
    expect(render({...eligible(),economy:{cash:moneyFromMinorUnits('0')}})).toContain('INSUFFICIENT CASH');
    expect(render(eligible(),true)).toContain('Session paused');expect(render(eligible(),true)).toContain('disabled');
  });
  it('shows grandfathered ownership active with no locks or repurchase button',()=>{
    const html=render({...createInitialGameState(),garage:{ ownedVehicleIds: [V.id], activeVehicleId: V.id }});
    expect(html).toContain('Owned vehicles: 1 / 7');expect(html).toContain('OWNED');expect(html).toContain('PERMANENT');expect(html).toContain('Active vehicle'); expect(html).toContain('OWNED · ACTIVE');
    const starterCard = html.match(/<article[^>]*>[\s\S]*?<\/article>/)?.[0] ?? '';
    expect(starterCard).not.toContain('LOCKED');expect(starterCard).not.toContain('<button');
    expect(html).toContain('Buy Kairo Senda'); expect(html).toContain('Buy Namera Lilt');
  });
  it('names the vehicle from central modifier metadata and keeps artwork separate',()=>{
    const state=purchaseVehicle(eligible(),V.id).state;const evaluation=evaluateBusinessProduction(state,B.id,10);
    if(!evaluation.ok)throw Error('evaluation');
    expect(renderToStaticMarkup(<ModifierBreakdown modifiers={evaluation.applied} />)).toContain('Kairo KX-R: +10%');
    expect(vehicleArtwork(V.id)?.src).toContain('kairo-kx-r.webp');
    expect(JSON.stringify(state.garage)).not.toMatch(/artwork|Vortex|placeholder/);
    expect(describeAction('vehicle',purchaseVehicle(eligible(),V.id),V.id)).toContain('Kairo KX-R added to your garage');
    expect(describeAction('vehicle',purchaseVehicle(createInitialGameState(),V.id),V.id)).toContain('Player Level 5');
  });
});

it('retains approved reference separately from responsive production delivery', () => {
  expect(existsSync('src/assets/reference/vehicles/kairo-kx-r-reference.png')).toBe(true);
  expect(existsSync('src/assets/vehicles/kairo-kx-r.webp')).toBe(true);
  const registry = readFileSync('src/app/vehicle-artwork.ts', 'utf8');
  expect(registry).not.toContain('reference.png');
  const css = readFileSync('src/app/sections.css', 'utf8');
  const artwork = css.match(/\.vehicle-artwork \{([^}]+)\}/)?.[1];
  expect(artwork).toContain('max-width: 100%'); expect(artwork).toContain('height: auto');
  expect(artwork).toContain('object-fit: contain'); expect(artwork).toContain('aspect-ratio:');
  expect(css).toMatch(/@media \(max-width: 740px\)[\s\S]*\.vehicle-card[^}]*grid-template-columns: minmax\(0, 1fr\)/);
});
