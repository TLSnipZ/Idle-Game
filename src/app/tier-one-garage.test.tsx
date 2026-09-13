// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { Garage } from './Garage';
import { LocalizationProvider } from './LocalizationProvider';
import { localize } from './LocalizationProvider';
import type { GameState } from '../game/game-state';
import { createInitialGameState } from '../game/game-state';
import { VEHICLE_CATALOG, KAIRO_SENDA as S, NAMERA_LILT as L } from '../features/vehicles';
import { setActiveVehicle } from '../game/set-active-vehicle';
it.each(['en', 'de', 'villager'] as const)('%s renders real role differences and switches by native button', async locale => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const container = document.createElement('div'), root = createRoot(container);
  let state: GameState = { ...createInitialGameState(), garage: { ownedVehicleIds: VEHICLE_CATALOG.map(v => v.id), activeVehicleId: S.id } };
  const onSelect = vi.fn((id: string) => { state = setActiveVehicle(state, id).state; });
  const render = () => act(() => root.render(<LocalizationProvider locale={locale}><Garage state={state} paused={false}
    onPurchase={() => { throw Error('Owned vehicles cannot be purchased'); }} onSelect={onSelect} /></LocalizationProvider>));
  try {
    await render();
    expect(container.querySelectorAll('.vehicle-card')).toHaveLength(3);
    expect(container.textContent).toContain('+12%');
    expect(container.textContent).toContain('−3');
    expect(container.textContent).toContain(localize(locale, 'Manual Job Cash · while active', 'Manueller Job-Cash · wenn aktiv'));
    const button = container.querySelector<HTMLButtonElement>('article[aria-labelledby="vehicle:namera-lilt-heading"] button');
    expect(button?.disabled).toBe(false); await act(() => button?.click()); await render();
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(L.id);
    expect(container.querySelector('.garage-active-summary strong')?.textContent).toBe(localize(locale, L.name, L.name));
    expect(container.querySelectorAll('button')).toHaveLength(2);
    if (locale === 'villager') expect(container.textContent?.match(/\p{L}+/gu)?.every(word => /^[hmr]+$/i.test(word))).toBe(true);
  } finally { await act(() => root.unmount()); vi.unstubAllGlobals(); }
});
