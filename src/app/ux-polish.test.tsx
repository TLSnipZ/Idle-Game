// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RateValue } from './RateValue';
import { SkillTree } from './SkillTree';
import { skillState } from '../game/test-fixtures/skill-state';
import { createInitialGameState } from '../game/game-state';
import { CrewPanel } from './CrewPanel';
import { Garage } from './Garage';
const noop = () => {};
describe('POST 1C readable state and responsive intent', () => {
  it('preserves whole navigation labels while wrapping whole controls with existing touch targets', () => {
    const css = readFileSync('src/app/App.css','utf8');
    expect(css).toMatch(/\.primary-navigation button \{ white-space: nowrap; overflow-wrap: normal;/);
    expect(css).toMatch(/\.primary-navigation \{ display: flex; flex-wrap: wrap;/);
    expect(css).toContain('min-height: 44px');
    expect(css).toContain('.value-unit > :last-child { flex-shrink: 0; white-space: nowrap; }');
  });
  it('keeps a large rate and its unit readable without requiring an image or a fixed width', () => {
    const panel = document.createElement('div');
    const rate = `$${'9'.repeat(90)}.00/sec`;
    panel.innerHTML = renderToStaticMarkup(<RateValue text={rate} />);
    expect(panel.textContent).toBe(rate);
    expect(panel.querySelector('.value-unit')?.lastElementChild?.textContent).toBe('/sec');
    expect(panel.querySelector('img')).toBeNull();
  });
  it('distinguishes Streetwise unlock eligibility from funding and allows purchase only with EP', () => {
    for (const ep of [0,1]) {
      const panel = document.createElement('div');
      panel.innerHTML = renderToStaticMarkup(<SkillTree state={skillState({},ep)} paused={false} onPurchase={noop} />);
      const card = panel.querySelector('article');
      expect(card?.textContent).toContain(ep ? 'READY TO PURCHASE' : 'AVAILABLE · INSUFFICIENT EP');
      expect(card?.querySelector('button')?.disabled).toBe(!ep);
    }
  });
  it('uses concrete requirements and a single useful empty-slot message', () => {
    const state = createInitialGameState();
    const html = renderToStaticMarkup(<><Garage state={state} paused={false} onPurchase={noop} />
      <CrewPanel state={state} paused={false} onRecruit={noop} onAssign={noop} onUnassign={noop} /></>);
    expect(html).toContain('LOCKED'); expect(html).toContain('Required — Player Level');
    expect(html).not.toMatch(/Not met|Requirements not met|Current: Empty|No active specialist/);
    expect(html.match(/No specialist assigned\./g)).toHaveLength(2);
    expect(html).toContain('Recruit or assign a specialist for Operations below.');
  });
});
