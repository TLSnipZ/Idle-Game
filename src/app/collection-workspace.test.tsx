// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { CollectionWorkspace } from './CollectionWorkspace';
import { createInitialGameState } from '../game/game-state';
import type { GameState } from '../game/game-state';
const K = 'vehicle:kairo-kx-r', S = 'vehicle:kairo-senda';
let root: Root, container: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(() => {});
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(() => root.unmount()); container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function element<T extends HTMLElement>(selector: string): T {
  const found = container.querySelector<T>(selector); if (!found) throw Error(selector); return found;
}
async function click(selector: string) { await act(() => element<HTMLButtonElement>(selector).click()); }
async function choose(selector: string, value: string) {
  await act(() => { const select=element<HTMLSelectElement>(selector); select.value=value;select.dispatchEvent(new Event('change',{bubbles:true})); });
}
function state(): GameState { return { ...createInitialGameState(), garage: { ownedVehicleIds: [K,S], activeVehicleId: K } }; }
it('inspection, shared workshop selection and draft tab changes do not dispatch game commands', async () => {
  const command=vi.fn();
  await act(() => root.render(<CollectionWorkspace state={state()} paused={false} onPurchase={command} onSelect={command} onConfigure={command} onApply={command} />));
  await click(`[data-vehicle-id="${S}"]`);
  expect(document.activeElement?.id).toBe(`${S}-heading`);
  await click(`article[aria-labelledby="${S}-heading"] .garage-workshop-link`);
  expect(element<HTMLSelectElement>('#tuning-vehicle').value).toBe(S);
  expect(element('.garage').closest('[hidden]')).not.toBeNull();
  expect(element('.vehicle-tuning').closest('[hidden]')).toBeNull();
  await click('[data-workshop-view="appearance"]');
  await click('.vehicle-appearance [data-look-id]');
  const draft=element('.paint-preview .vehicle-image').getAttribute('data-appearance');
  expect(draft).not.toBe('factory');
  await click('[data-workshop-view="tuning"]');await choose('#tuning-vehicle',K);
  await click('[data-workshop-view="appearance"]');expect(element<HTMLSelectElement>('#appearance-vehicle').value).toBe(K);
  await choose('#appearance-vehicle',S);
  expect(element('.paint-preview .vehicle-image').getAttribute('data-appearance')).toBe(draft);
  expect(command).not.toHaveBeenCalled();
  await click('.apply-appearance');expect(command).toHaveBeenCalledExactlyOnceWith(S,draft);
});
it('filters preserve ownership and activation; returning from detail restores the tile focus', async () => {
  const initial=state(), command=vi.fn();
  await act(() => root.render(<CollectionWorkspace state={initial} paused={false} onPurchase={command} onSelect={command} onConfigure={command} onApply={command} />));
  await choose('.garage-filters select','owned');
  expect([...container.querySelectorAll('.garage-tile')].map(x=>x.getAttribute('data-vehicle-id')).sort()).toEqual([K,S].sort());
  await click(`[data-vehicle-id="${S}"]`);await click('.garage-back');
  expect(document.activeElement?.getAttribute('data-vehicle-id')).toBe(S);
  await choose('.garage-filters select','missing');
  expect(container.querySelector(`[data-vehicle-id="${K}"]`)).toBeNull();
  expect(container.querySelector(`[data-vehicle-id="${S}"]`)).toBeNull();
  expect(command).not.toHaveBeenCalled();expect(initial.garage.activeVehicleId).toBe(K);
});
it('state replacement discards paint drafts and initializes the new workshop vehicle', async () => {
  const command=vi.fn();
  const render=(key:number, current:GameState)=>act(()=>root.render(<CollectionWorkspace key={key} state={current} paused={false} onPurchase={command} onSelect={command} onConfigure={command} onApply={command} />));
  await render(0,state());await click('[data-collection-view="workshop"]');await click('[data-workshop-view="appearance"]');await click('.vehicle-appearance [data-look-id]');
  expect(element('.paint-preview .vehicle-image').getAttribute('data-appearance')).not.toBe('factory');
  await render(1,{...state(),garage:{ownedVehicleIds:[S],activeVehicleId:S}});
  expect(element('.garage').closest('[hidden]')).toBeNull();
  await click('[data-collection-view="workshop"]');await click('[data-workshop-view="appearance"]');
  expect(element<HTMLSelectElement>('#appearance-vehicle').value).toBe(S);
  await choose('#appearance-vehicle',K);expect(element('.paint-preview .vehicle-image').getAttribute('data-appearance')).toBe('factory');
  expect(command).not.toHaveBeenCalled();
});
it('a repeated guidance request reveals the requested car and clears an incompatible filter', async () => {
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { callback(0); return 1; });
  vi.stubGlobal('cancelAnimationFrame', () => {});
  const command=vi.fn();
  const render=(sequence:number)=>act(()=>root.render(<CollectionWorkspace state={state()} paused={false} onPurchase={command} onSelect={command} onConfigure={command} onApply={command} destination={{sequence,headingId:'vehicle:namera-serein-heading'}} />));
  await render(1);
  expect(element('.vehicle-card:not([hidden])').getAttribute('aria-labelledby')).toBe('vehicle:namera-serein-heading');
  await click('.garage-back');await choose('.garage-filters select','owned');
  await render(2);
  expect(element<HTMLSelectElement>('.garage-filters select').value).toBe('all');
  expect(element('.vehicle-card:not([hidden])').getAttribute('aria-labelledby')).toBe('vehicle:namera-serein-heading');
  expect(document.activeElement?.id).toBe('vehicle:namera-serein-heading');
  expect(command).not.toHaveBeenCalled();
});
