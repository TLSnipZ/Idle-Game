// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { STARTER_VEHICLE as V } from '../features/vehicles';
import { createInitialGameState } from '../game/game-state';
import type { GameState } from '../game/game-state';
import { rebirthState } from '../game/test-fixtures/rebirth-state';
import { setActiveVehicle } from '../game/set-active-vehicle';
import { Garage } from './Garage';
import { LocalizationProvider } from './LocalizationProvider';
import type { Locale } from './localization';

vi.mock('../features/vehicles', async importOriginal => {
  const actual = await importOriginal<typeof import('../features/vehicles')>();
  const extra = { ...actual.STARTER_VEHICLE, id: 'vehicle:test-active' as const, name: 'Test active', model: 'Test',
    modifier: { ...actual.STARTER_VEHICLE.modifier, id: 'modifier:test-active', sourceId: 'vehicle:test-active', bonusBasisPoints: 2000 } };
  const catalog = [...actual.VEHICLE_CATALOG, extra];
  return { ...actual, VEHICLE_CATALOG: catalog, findVehicle: (id: unknown) => catalog.find(v => v.id === id) };
});
const SECOND = 'vehicle:test-active' as const;
const locales: readonly Locale[] = ['en', 'de'];
let root: Root | undefined;
let container: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(() => root?.unmount()); root = undefined; container.remove(); vi.unstubAllGlobals(); });
function render(state: GameState, locale: Locale, onActivate = vi.fn(), paused = false, onPurchase = vi.fn()) {
  return act(() => root?.render(<LocalizationProvider locale={locale}><Garage state={state} paused={paused}
    onPurchase={onPurchase} onActivate={onActivate} /></LocalizationProvider>));
}
function car(id: string) { return container.querySelector(`[aria-labelledby="${id}-heading"]`); }

test.each(locales)('active/inactive %s Garage selects only on an explicit button, never by rendering', async locale => {
  const s = { ...rebirthState(), garage: { ownedVehicleIds: [V.id, SECOND], activeVehicleId: V.id } }, before = JSON.stringify(s);
  const onActivate = vi.fn(); await render(s, locale, onActivate);
  expect(onActivate).not.toHaveBeenCalled(); expect(JSON.stringify(s)).toBe(before);
  expect(car(V.id)?.querySelector('button')).toBeNull();
  const button = car(SECOND)?.querySelector('button'); expect(button?.disabled).toBe(false);
  expect(button?.getAttribute('aria-label')).toContain('Test active');
  button?.focus(); expect(document.activeElement).toBe(button);
  await act(() => { button?.click(); }); expect(onActivate).toHaveBeenCalledExactlyOnceWith(SECOND);
  expect(JSON.stringify(s)).toBe(before);
  await render(setActiveVehicle(s, SECOND).state, locale, onActivate);
  expect(car(SECOND)?.classList.contains('is-active-vehicle')).toBe(true);
  expect(car(SECOND)?.querySelector('button')).toBeNull();
  expect(container.querySelector('.garage-active-summary strong')?.textContent).toBe('Test active');
});
test.each(locales)('%s Garage explains the empty state and keeps the real purchase action', async locale => {
  const empty = createInitialGameState(); await render(empty, locale);
  expect(container.querySelector('.garage-active-summary strong')?.textContent).toBe(locale === 'de' ? 'Noch kein Fahrzeug' : 'No vehicle yet');
  expect(car(V.id)?.querySelector('button')?.disabled).toBe(true);
  const purchase = vi.fn(); const state = { ...rebirthState(), garage: empty.garage }; await render(state, locale, vi.fn(), false, purchase);
  await act(() => { car(V.id)?.querySelector('button')?.click(); }); expect(purchase).toHaveBeenCalledExactlyOnceWith(V.id);
});
test.each(locales)('%s paused selection is disabled without hiding ownership or the active car', async locale => {
  const s = { ...rebirthState(), garage: { ownedVehicleIds: [V.id, SECOND], activeVehicleId: V.id } }, select = vi.fn();
  await render(s, locale, select, true);
  const button = car(SECOND)?.querySelector('button'); expect(button?.disabled).toBe(true);
  await act(() => { button?.click(); }); expect(select).not.toHaveBeenCalled();
  expect(car(V.id)?.classList.contains('is-active-vehicle')).toBe(true);
  expect(container.querySelector('.garage-selection-note')?.textContent).toContain('Rebirth');
});
