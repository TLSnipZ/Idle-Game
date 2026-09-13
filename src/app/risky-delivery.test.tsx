// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { RiskyDelivery } from './RiskyDelivery';
import { LocalizationProvider } from './LocalizationProvider';
import { createInitialGameState } from '../game/game-state';

describe('risk delivery presentation', () => {
  it.each(['en', 'de', 'villager'] as const)('discloses exact rewards, risk and cutoff in %s', locale => {
    const s = createInitialGameState();
    const root = document.createElement('div');
    root.innerHTML = renderToStaticMarkup(<LocalizationProvider locale={locale}><RiskyDelivery state={s} paused={false} onRun={() => {}} /></LocalizationProvider>);
    expect(root.querySelector('button')?.disabled).toBe(false);
    expect(root.textContent).toContain('37.50');
    expect(root.textContent).toContain('60');
    expect(root.textContent).toContain('+5');
    expect(root.querySelector('#risky-delivery-help')?.textContent).toBeTruthy();
    if (locale === 'villager') expect(root.textContent?.replace(/[hmr]/gi, '')).not.toMatch(/\p{L}/u);
  });
  it.each([[59, false, false], [60, false, true], [100, false, true], [0, true, true]] as const)(
    'Heat %i paused=%s disables=%s', (heat, paused, disabled) => {
      const s = createInitialGameState();
      const root = document.createElement('div');
      root.innerHTML = renderToStaticMarkup(<RiskyDelivery state={{ ...s, city: { ...s.city, heat } }} paused={paused} onRun={() => {}} />);
      expect(root.querySelector('button')?.disabled).toBe(disabled);
    });
});
