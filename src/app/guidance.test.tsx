// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { NextObjective } from './NextObjective';
import { guidancePercent, guidancePresentation } from './guidance-presentation';
import { selectGuidance } from '../game/guidance';
import { createInitialGameState } from '../game/game-state';
import type { GameState } from '../game/game-state';
import { createPersistentGame } from '../platform/persistent-game';
import { createLocalSave } from '../platform/local-save';
import { serializeSave } from '../game/save-schema';
import { exportSaveCode } from '../game/save-code';
import { moneyFromMinorUnits } from '../features/economy';
import { getXpThresholdForLevel } from '../features/progression';
import { NEON_MILE } from '../features/territories';
import { PRIMARY_SECTIONS } from './navigation';
import { readFileSync } from 'node:fs';

vi.mock('../platform/persistent-game', async importOriginal => {
  const original = await importOriginal<typeof import('../platform/persistent-game')>();
  return { ...original, createPersistentGame: vi.fn(original.createPersistentGame) };
});
const original = await vi.importActual<typeof import('../platform/persistent-game')>('../platform/persistent-game');
let root: Root | undefined;
let container: HTMLDivElement;
beforeEach(() => {
  vi.clearAllMocks(); vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  container = document.createElement('div'); document.body.append(container);
});
afterEach(async () => {
  if (root) await act(() => root?.unmount()); root = undefined;
  container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals();
});
function available(): GameState {
  const s = createInitialGameState();
  return { ...s, economy: { cash: moneyFromMinorUnits('999999999') }, progression: { xp: getXpThresholdForLevel(20) },
    businesses: { ...s.businesses, owned: { 'business:dockside-detail': { level: 15 }, 'business:neon-laundry': { level: 7 } } },
    city: { ...s.city, ownedTerritoryIds: [...s.city.ownedTerritoryIds, NEON_MILE.id] },
    permanentProgression: { ...s.permanentProgression, empirePoints: 5 } };
}
async function mount(state: GameState = available(), source?: string) {
  const encoded = serializeSave(state, 1000); if (!encoded.ok) throw Error('Fixture');
  let raw = source ?? encoded.serialized, now = 0, reads = 0, writes = 0, timers = 0, failWrites = false;
  let tick = () => {};
  let session: ReturnType<typeof createPersistentGame> | undefined;
  const random = { next: vi.fn(() => .99) };
  vi.mocked(createPersistentGame).mockImplementation(publish => {
    session = original.createPersistentGame(publish,
      createLocalSave(() => ({ getItem: () => raw, setItem: (_key, value) => { if (failWrites) throw Error('quota'); raw = value; writes++; } }), () => 1000 + now),
      { random, now: () => { reads++; return now; }, schedule: cb => { tick = cb; timers++; return () => { timers--; }; } },
      () => { timers++; return () => { timers--; }; });
    return session;
  });
  root = createRoot(container); await act(() => root?.render(<App />));
  const game = () => { if (!session) throw Error('Runtime'); return session; };
  return { game, random, fail: () => { failWrites = true; }, writes: () => writes, reads: () => reads, raw: () => raw, timers: () => timers,
    advance: async (ms: number) => { now += ms; await act(() => tick()); } };
}
function button(label: string) {
  const found = [...container.querySelectorAll('button')].find(b => b.getAttribute('aria-label') === label || b.textContent === label);
  if (!found) throw Error(`Missing ${label}`); return found;
}
async function click(label: string) { await act(() => button(label).click()); }
async function choose(id: string) {
  const details = container.querySelector<HTMLDetailsElement>('.objective-controls details');
  if (details) details.open = true;
  const select = container.querySelector<HTMLSelectElement>('#guidance-goal'); if (!select) throw Error('Goal picker');
  await act(() => { select.value = id; select.dispatchEvent(new Event('change', { bubbles: true })); });
}
async function follow() {
  const control = container.querySelector<HTMLButtonElement>('.objective-controls button'); if (!control) throw Error('Follow goal');
  await act(() => control.click());
}
async function input(selector: string, value: string) {
  const element = container.querySelector(selector);
  if (!(element instanceof HTMLInputElement) && !(element instanceof HTMLTextAreaElement)) throw Error('Input');
  const proto = element instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  await act(() => { setter?.call(element, value); element.dispatchEvent(new Event('input', { bubbles: true })); });
}
function title() { return container.querySelector('#next-objective-heading')?.textContent; }

describe('global guidance presentation and intentional navigation', () => {
  it('renders one stable guidance surface across all five primary sections, without remounting the runtime', async () => {
    const f = await mount(), card = container.querySelector('.next-objective');
    const before = f.game().getSnapshot().result.state, raw = f.raw(), reads = f.reads(), writes = f.writes();
    for (const section of PRIMARY_SECTIONS) {
      await click(section.label);
      expect(container.querySelectorAll('.next-objective')).toHaveLength(1);
      expect(container.querySelector('.next-objective')).toBe(card);
    }
    expect(f.game().getSnapshot().result.state).toBe(before); expect(f.raw()).toBe(raw);
    expect(f.reads()).toBe(reads); expect(f.writes()).toBe(writes);
    expect(f.timers()).toBe(2); expect(createPersistentGame).toHaveBeenCalledTimes(1); expect(f.random.next).not.toHaveBeenCalled();
  });
  it('shows exact next-Level cost, 7/10 progress, and does not imply it is the total gate investment', async () => {
    await mount(); await choose('business:afterdark-customs');
    const card = container.querySelector('.next-objective');
    expect(title()).toBe('Grow Neon Laundry to Level 10');
    expect(card?.textContent).toContain('7 / 10'); expect(card?.textContent).toContain('$49,000');
    expect(card?.textContent).toContain('next Level only');
    expect(card?.textContent).toContain('Working toward: Afterdark Customs');
    expect(card?.textContent).not.toContain('business:neon-laundry');
  });
  it('has labeled progress/select controls and no broad live region or automatic-action copy', () => {
    const markup = renderToStaticMarkup(<NextObjective state={createInitialGameState()} onNavigate={vi.fn()} />);
    container.innerHTML = markup;
    const card = container.querySelector('.next-objective');
    expect(card?.querySelectorAll('[aria-live], [role="status"], [role="alert"]')).toHaveLength(0);
    expect(card?.querySelector('label[for="guidance-goal"]')).not.toBeNull();
    expect(card?.querySelector('progress')?.getAttribute('aria-labelledby')).toBe('objective-cash-label');
    expect(card?.textContent).toContain('Missing $150');
    expect(card?.textContent).toContain('not saved');
  });
  it.each([
    ['automation:delivery-dispatcher', 'delegation-heading', 'operations'],
    ['automation:business-auto-upgrader', 'auto-upgrader-heading', 'operations'],
    ['business:afterdark-customs', 'business:neon-laundry-name', 'operations'],
    ['vehicle:kairo-kx-r', 'vehicle:kairo-kx-r-heading', 'collection'],
    ['crew:jax-mercer', 'crew:jax-mercer-heading', 'city'],
    ['upgrade:commercial-pressure-washer', 'upgrade:commercial-pressure-washer-heading', 'operations'],
    ['skill:streetwise-investment', 'skill:streetwise-investment-heading', 'empire'],
  ])('routes %s to the exact existing target without touching gameplay', async (id, target, section) => {
    const f = await mount(), before = f.game().getSnapshot().result.state, reads = f.reads(), writes = f.writes(), raw = f.raw();
    await choose(id); await follow();
    expect(container.querySelector('#section-content')?.getAttribute('data-section')).toBe(section);
    expect(document.activeElement?.id).toBe(target); expect(document.activeElement?.getAttribute('tabindex')).toBe('-1');
    expect(f.game().getSnapshot().result.state).toBe(before); expect(f.reads()).toBe(reads); expect(f.writes()).toBe(writes); expect(f.raw()).toBe(raw);
    expect(f.random.next).not.toHaveBeenCalled(); expect(f.timers()).toBe(2);
  });
  it('routes an unowned Neon Mile to its Territory card and Rebirth preparation to Dockside', async () => {
    const base = available(), freshCity = createInitialGameState().city;
    const f = await mount({ ...base, city: freshCity });
    await choose(NEON_MILE.id); await follow(); expect(document.activeElement?.id).toBe(`${NEON_MILE.id}-heading`);
    const reads = f.reads(); await choose('guidance:rebirth'); await follow();
    expect(document.activeElement?.id).toBe('business-name'); expect(f.reads()).toBe(reads);
  });
  it('routes missing XP to Jobs without performing a delivery', async () => {
    const base = createInitialGameState();
    const f = await mount({ ...base, businesses: { ...base.businesses, owned: { 'business:dockside-detail': { level: 1 } } } });
    const before = f.game().getSnapshot().result.state;
    expect(title()).toBe('Reach Player Level 3'); await follow();
    expect(document.activeElement?.id).toBe('starter-heading'); expect(f.game().getSnapshot().result.state).toBe(before);
  });
  it('Rebirth guidance only opens its section, never its confirmation or the reset command', async () => {
    const base = available();
    const f = await mount({ ...base, businesses: { ...base.businesses, owned: { 'business:dockside-detail': { level: 25 } } } });
    const before = f.game().getSnapshot().result.state, writes = f.writes();
    expect(title()).toBe('Rebirth is available'); await follow();
    expect(document.activeElement?.id).toBe('rebirth-heading');
    expect(container.querySelector('#rebirth-warning')).toBeNull(); expect(container.querySelector('#reset-confirmation')).toBeNull();
    expect(f.writes()).toBe(writes); expect(f.game().getSnapshot().result.state).toBe(before);
  });
  it('repeated same-section guidance activation focuses and scrolls only on explicit clicks', async () => {
    await mount(); await choose('business:afterdark-customs'); await follow();
    const target = document.getElementById('business:neon-laundry-name'); if (!target) throw Error('Target');
    const scroll = vi.spyOn(target, 'scrollIntoView');
    await follow(); expect(scroll).toHaveBeenCalledOnce(); expect(document.activeElement).toBe(target);
  });
  it('preserves the picker/button and keyboard focus during ticking Cash and goal selection', async () => {
    const f = await mount(); const select = container.querySelector<HTMLSelectElement>('#guidance-goal'); if (!select) throw Error('Select');
    select.focus(); await choose('business:afterdark-customs');
    const control = container.querySelector('.objective-controls button'); const before = title();
    vi.mocked(window.scrollTo).mockClear();
    await f.advance(1000);
    expect(container.querySelector('#guidance-goal')).toBe(select); expect(document.activeElement).toBe(select);
    expect(container.querySelector('.objective-controls button')).toBe(control); expect(title()).toBe(before);
    expect(window.scrollTo).not.toHaveBeenCalled();
  });
  it('completing a chosen acquisition falls back to the current suggested path in place', async () => {
    await mount(); await choose('vehicle:kairo-kx-r'); await follow();
    const card = container.querySelector('.next-objective');
    await click('Buy Kairo KX-R');
    expect(container.querySelector('.next-objective')).toBe(card);
    expect(container.querySelector<HTMLSelectElement>('#guidance-goal')?.value).toBe('');
    expect(title()).not.toBe('Acquire Kairo KX-R');
  });
  it('does not send repeated Business upgrades back to the top or steal focus', async () => {
    await mount(); await choose('business:afterdark-customs'); await follow();
    const card = container.querySelector('.next-objective');
    const upgrade = button('Upgrade Neon Laundry to Level 8'); upgrade.focus();
    vi.mocked(window.scrollTo).mockClear(); await act(() => upgrade.click());
    expect(document.activeElement).toBe(upgrade); expect(container.querySelector('.next-objective')).toBe(card);
    await act(() => upgrade.click());
    expect(title()).toBe('Grow Neon Laundry to Level 10'); expect(document.activeElement).toBe(upgrade);
    expect(window.scrollTo).not.toHaveBeenCalled();
  });
  it('New Game clears optional tracking and returns to the fresh suggested objective', async () => {
    const f = await mount(); await choose('vehicle:kairo-kx-r'); await click('EMPIRE');
    await click('Review New Game reset'); await input('#reset-confirmation-text', 'RESET'); await click('Reset all progress');
    expect(f.game().getSnapshot().result.state).toEqual(createInitialGameState());
    expect(title()).toBe('Acquire Dockside Detail');
    expect(container.querySelector<HTMLSelectElement>('#guidance-goal')?.value).toBe('');
    expect(document.activeElement?.id).toBe('section-heading');
  });
  it('Import clears stale tracking and derives new guidance from the imported state', async () => {
    await mount(); await choose('vehicle:kairo-kx-r'); await click('EMPIRE');
    const backup = exportSaveCode(createInitialGameState(), 1000); if (!backup.ok) throw Error('backup');
    await input('#import-code', backup.code); await click('Validate import'); await click('Confirm import');
    expect(title()).toBe('Acquire Dockside Detail'); expect(container.querySelector<HTMLSelectElement>('#guidance-goal')?.value).toBe('');
  });
  it('Rebirth clears optional tracking while preserving the existing permanent retention flow', async () => {
    const base = available(); await mount({ ...base, businesses: { ...base.businesses, owned: { 'business:dockside-detail': { level: 25 } } } });
    await choose('vehicle:kairo-kx-r'); await click('EMPIRE'); await click('Review Rebirth'); await click('Confirm Rebirth');
    expect(title()).toBe('Acquire Dockside Detail'); expect(container.querySelector<HTMLSelectElement>('#guidance-goal')?.value).toBe('');
  });

  it('a failed New Game write preserves the chosen goal along with the old save', async () => {
    const f = await mount(); await choose('vehicle:kairo-kx-r'); await click('EMPIRE');
    const before = f.game().getSnapshot().result.state, oldTitle = title();
    await click('Review New Game reset'); await input('#reset-confirmation-text', 'RESET'); f.fail(); await click('Reset all progress');
    expect(f.game().getSnapshot().result.state).toBe(before); expect(title()).toBe(oldTitle);
    expect(container.querySelector<HTMLSelectElement>('#guidance-goal')?.value).toBe('vehicle:kairo-kx-r');
  });
  it('failed Import validation does not clear the selected goal', async () => {
    await mount(); await choose('vehicle:kairo-kx-r'); await click('EMPIRE');
    await input('#import-code', 'not a save'); await click('Validate import');
    expect(container.querySelector<HTMLSelectElement>('#guidance-goal')?.value).toBe('vehicle:kairo-kx-r');
    expect(title()).toBe('Acquire Kairo KX-R');
  });
  it('continues to navigate as read-only guidance even when storage is blocked', async () => {
    const f = await mount(available(), '{broken'); const before = f.game().getSnapshot().result.state, raw = f.raw();
    expect(f.game().getSnapshot().persistence.kind).toBe('blocked');
    await choose('vehicle:kairo-kx-r'); await follow();
    expect(f.game().getSnapshot().result.state).toBe(before); expect(f.raw()).toBe(raw);
    expect(container.querySelector('.objective-controls button')?.getAttribute('type')).toBe('button');
  });
});

describe('safe presentation ratios and terminology', () => {
  it.each([[0,15000,0], [5000,15000,33], [15000,15000,100], [15001,15000,100], ['9'.repeat(100),'15000',100]] as const)(
    'bounds the display ratio for %s / %s', (current, required, result) => { expect(guidancePercent(current, required)).toBe(result); });
  it('keeps the navigation verb distinct from the actual Rebirth confirmation review', () => {
    const base = available(), state = { ...base, businesses: { ...base.businesses, owned: { 'business:dockside-detail': { level: 25 } } } };
    expect(guidancePresentation(selectGuidance(state)).button).toBe('View Rebirth');
  });
  it('keeps mobile controls wrapping and leaves the future sticky HUD untouched', () => {
    const css = readFileSync('src/app/sections.css', 'utf8');
    const guidanceCss = css.slice(css.indexOf('/* Guidance is shared'));
    expect(guidanceCss).toContain('@media (max-width: 740px)');
    expect(guidanceCss).toContain('grid-template-columns: minmax(0, 1fr)');
    expect(guidanceCss).toContain('min-height: 44px');
    expect(guidanceCss).not.toMatch(/position:\s*(sticky|fixed)|animation:|transition:/);
  });
});
