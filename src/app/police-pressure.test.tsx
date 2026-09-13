// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DiscreetDelivery } from './DiscreetDelivery';
import { RiskyDelivery } from './RiskyDelivery';
import { PolicePressure } from './PolicePressure';
import { LocalizationProvider } from './LocalizationProvider';
import { createInitialGameState } from '../game/game-state';

describe('Police Pressure presentation', () => {
  it.each(['en','de','villager'] as const)('shows the watched premium and discreet counterplay in %s', locale => {
    const s = createInitialGameState(), state = { ...s, city: { ...s.city, heat: 40 } };
    const root = document.createElement('div');
    root.innerHTML = renderToStaticMarkup(<LocalizationProvider locale={locale}>
      <PolicePressure heat={40} /><RiskyDelivery state={state} paused={false} onRun={() => {}} />
      <DiscreetDelivery state={state} paused={false} onRun={() => {}} />
    </LocalizationProvider>);
    expect(root.textContent).toContain('+25%');
    expect(root.textContent).toContain('31.25');
    expect(root.textContent).toContain('12.50');
    expect(root.querySelector('.discreet-delivery-button')?.getAttribute('aria-describedby')).toBe('discreet-help');
    if (locale === 'villager') expect(root.textContent?.replace(/[hmr]/gi, '')).not.toMatch(/\p{L}/u);
  });
  it.each([[0,false,true],[1,false,false],[100,false,false],[50,true,true]] as const)(
    'Heat %i paused=%s disables discreet action=%s', (heat, paused, disabled) => {
      const s = createInitialGameState(), root = document.createElement('div');
      root.innerHTML = renderToStaticMarkup(<DiscreetDelivery state={{ ...s, city: { ...s.city, heat } }} paused={paused} onRun={() => {}} />);
      expect(root.querySelector('button')?.disabled).toBe(disabled);
    });
});
