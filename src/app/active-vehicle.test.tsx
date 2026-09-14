// @vitest-environment happy-dom
import '../game/test-fixtures/active-vehicle-catalog';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { Garage } from './Garage';
import { LocalizationProvider } from './LocalizationProvider';
import type { Locale } from './localization';
import { createInitialGameState } from '../game/game-state';
import type { GameState } from '../game/game-state';
import { STARTER_VEHICLE as V } from '../features/vehicles';
import { setActiveVehicle } from '../game/set-active-vehicle';
let root: Root, container: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(() => root.unmount()); container.remove(); vi.unstubAllGlobals(); });
it.each(['en', 'de'] as const)('%s exposes exact active/inactive state and dispatches only the chosen vehicle', async (locale: Locale) => {
  let state: GameState = { ...createInitialGameState(),
    garage: { ownedVehicleIds: [V.id, 'vehicle:test-coupe'], activeVehicleId: V.id } };
  const onPurchase = vi.fn(), onSelect = vi.fn((id: string) => { state = setActiveVehicle(state, id).state; });
  const render = (paused = false) => act(() => root.render(<LocalizationProvider locale={locale}>
    <Garage state={state} paused={paused} onPurchase={onPurchase} onSelect={onSelect} />
  </LocalizationProvider>));
  await render();
  expect(container.textContent).toContain(locale === 'en' ? 'while active' : 'wenn aktiv');
  const button = container.querySelector<HTMLButtonElement>('.vehicle-specification button');
  expect(button?.getAttribute('aria-label')).toBe(locale === 'en' ? 'Activate Test Coupe' : 'Test Coupe aktivieren');
  expect(container.querySelectorAll('.vehicle-specification button')).toHaveLength(1);
  await act(() => button?.click()); await render();
  expect(onSelect).toHaveBeenCalledExactlyOnceWith('vehicle:test-coupe'); expect(onPurchase).not.toHaveBeenCalled();
  expect(container.querySelector('.garage-active-summary strong')?.textContent).toBe('Test Coupe');
  expect(container.querySelector('.vehicle-specification button')?.getAttribute('aria-label')).toBe(locale === 'en' ? 'Activate Kairo KX-R' : 'Kairo KX-R aktivieren');
  await render(true);
  const paused = container.querySelector<HTMLButtonElement>('.vehicle-specification button');
  expect(paused?.disabled).toBe(true); await act(() => paused?.click());
  expect(onSelect).toHaveBeenCalledTimes(1);
});
it.each(['en', 'de'] as const)('%s empty Garage explains automatic activation and retains purchase controls', async locale => {
  await act(() => root.render(<LocalizationProvider locale={locale}>
    <Garage state={createInitialGameState()} paused={false} onPurchase={() => {}} onSelect={() => {}} />
  </LocalizationProvider>));
  expect(container.querySelector('.garage-active-summary strong')?.textContent).toBe(locale === 'en' ? 'No active vehicle' : 'Kein aktives Fahrzeug');
  expect(container.textContent).toContain(locale === 'en' ? 'activates automatically' : 'automatisch aktiv');
  expect(container.querySelectorAll('.purchase-button')).toHaveLength(2);
});
