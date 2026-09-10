// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { createPersistentGame } from '../platform/persistent-game';
import { createLocalSave } from '../platform/local-save';
import { createInitialGameState } from '../game/game-state';
import type { GameState } from '../game/game-state';
import { autoUpgraderState } from '../game/test-fixtures/auto-upgrader-state';
import { serializeSave, parseSave } from '../game/save-schema';
import { exportSaveCode } from '../game/save-code';
import { simulateOnlineElapsed } from '../game/simulate-online-elapsed';
import { DELIVERY_DISPATCHER } from '../features/automation';
import { STARTER_BUSINESS } from '../features/businesses';
import { moneyFromMinorUnits } from '../features/economy';
import { getLevelProgress, getXpThresholdForLevel } from '../features/progression';
import { selectBusinessProgress } from '../game/selectors';
import { selectRebirth } from '../game/rebirth';
import { PRIMARY_SECTIONS } from './navigation';

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
async function mount(state = createInitialGameState(), offlineMs = 0) {
  const encoded = serializeSave(state,1000); if (!encoded.ok) throw Error('fixture');
  let raw = encoded.serialized, reads = 0, writes = 0, now = 0, timers = 0;
  let tick = () => {};
  let session: ReturnType<typeof createPersistentGame> | undefined;
  const random = { next: vi.fn(() => .99) };
  vi.mocked(createPersistentGame).mockImplementation(publish => {
    session = original.createPersistentGame(publish,
      createLocalSave(() => ({ getItem: () => raw, setItem: (_key, value) => { raw = value; writes++; } }), () => 1000 + offlineMs),
      { random, now: () => { reads++; return now; }, schedule: cb => { timers++; tick = cb; return () => { timers--; }; } },
      () => { timers++; return () => { timers--; }; });
    return session;
  });
  root = createRoot(container); await act(() => root?.render(<App />));
  const game = () => { if (!session) throw Error('Not mounted'); return session; };
  return { game, random, reads: () => reads, writes: () => writes, raw: () => raw, timers: () => timers,
    advance: async (elapsed: number) => { now += elapsed; await act(() => tick()); } };
}
function button(label: string) {
  const found = [...container.querySelectorAll('button')].find(b => b.textContent === label || b.getAttribute('aria-label') === label);
  if (!found) throw Error(`Missing button ${label}`);
  return found;
}
async function click(label: string) { await act(() => button(label).click()); }
async function navigate(label: string) {
  const found = [...container.querySelectorAll('.primary-navigation button')].find(b => b.textContent === label);
  if (!(found instanceof HTMLButtonElement)) throw Error(`Missing nav ${label}`);
  await act(() => found.click());
}
function content() { return container.querySelector('#section-content')?.textContent ?? ''; }
async function fillImport(text: string) {
  const input = container.querySelector('#import-code'); if (!(input instanceof HTMLTextAreaElement)) throw Error('Import field');
  // Use the native setter so React's value tracker sees the user input event.
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
  await act(() => { setter?.call(input,text); input.dispatchEvent(new Event('input',{bubbles:true})); });
}

describe('mounted navigation and one live runtime', () => {
  it('defaults to Overview, mounts only selected features, and switching neither reads time nor writes state', async () => {
    const f = await mount(autoUpgraderState());
    const before = f.game().getSnapshot().result.state, raw = f.raw(), reads = f.reads(), writes = f.writes();
    expect(container.querySelector('[aria-current="page"]')?.textContent).toBe('OVERVIEW');
    expect(container.querySelector('#business-name')).toBeNull();
    const mapping = ['ECONOMY','Jobs','LAY LOW','Kairo KX-R','Save & Transfer'];
    for (let i=0; i<PRIMARY_SECTIONS.length; i++) {
      const section = PRIMARY_SECTIONS[i]; if (!section) throw Error('section');
      await navigate(section.label); expect(content()).toContain(mapping[i]);
      expect(container.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
      expect(container.querySelector('.global-status')?.textContent).toContain('Player Level20');
    }
    expect(document.activeElement?.id).toBe('section-heading');
    expect(f.game().getSnapshot().result.state).toBe(before); expect(f.raw()).toBe(raw);
    expect(f.reads()).toBe(reads); expect(f.writes()).toBe(writes); expect(f.random.next).not.toHaveBeenCalled();
    expect(createPersistentGame).toHaveBeenCalledTimes(1); expect(f.timers()).toBe(2);
  });
  it('Overview shortcuts navigate without commands or resetting active spending', async () => {
    const f = await mount(autoUpgraderState()), before = f.game().getSnapshot().result.state, reads = f.reads();
    await click('VIEW OPERATIONS'); expect(content()).toContain('BUSINESS AUTO-UPGRADER');
    await navigate('OVERVIEW'); await click('VIEW COLLECTION'); expect(content()).toContain('Kairo KX-R');
    expect(f.game().getSnapshot().result.state).toBe(before); expect(f.reads()).toBe(reads);
    expect(container.querySelector('.global-indicators')?.textContent).toContain('AUTO-UPGRADER ACTIVE');
    await click('AUTO-UPGRADER ACTIVE · SPENDING ENABLED'); expect(content()).toContain('Automatically spends cash');
  });
  it('VIEW CREW changes only presentation and leaves saving and RNG idle', async () => {
    const f = await mount(), before = f.game().getSnapshot().result.state;
    const writes = f.writes(), reads = f.reads(), raw = f.raw();
    expect(container.querySelector('.save-health')?.textContent).toBe('Autosave on');
    expect(container.querySelector('.save-health')?.closest('[aria-live]')).toBeNull();
    await click('VIEW CREW');
    expect(content()).toContain('Active assignments');
    expect(content()).toContain('No specialist assigned.');
    expect(f.game().getSnapshot().result.state).toBe(before);
    expect(f.writes()).toBe(writes); expect(f.reads()).toBe(reads); expect(f.raw()).toBe(raw);
    expect(f.random.next).not.toHaveBeenCalled();
  });
  it('runtime advances across all sections with unchanged outer batching and one Event RNG attempt', async () => {
    const s = autoUpgraderState(), state: GameState = { ...s, city: { ...s.city, heat: 80 },
      automation: { ...s.automation, unlockedIds: [...s.automation.unlockedIds,DELIVERY_DISPATCHER.id] },
      crew: { recruitedIds: ['crew:mara-knox'], assignments: { operations: 'crew:mara-knox', logistics: null } } };
    const f = await mount(state); let expected = f.game().getSnapshot().result.state;
    for (const section of PRIMARY_SECTIONS) {
      await navigate(section.label); await f.advance(125000);
      expected = simulateOnlineElapsed(expected,125000,{next:()=>.99}).state;
      expect(f.game().getSnapshot().result.state).toEqual(expected);
    }
    expect(f.random.next).toHaveBeenCalledTimes(1); expect(f.timers()).toBe(2);
    expect(createPersistentGame).toHaveBeenCalledTimes(1);
    expect(expected.permanentProgression.statistics.businessLevelsPurchased).toBeGreaterThan(0);
    expect(expected.permanentProgression.statistics.automatedJobsCompleted).toBe(62);
    expect(container.querySelector('.global-feedback')?.textContent).toContain('Last dispatch:');
  });
  it('pending Event survives navigation and normal runtime; global indicator returns to the same choices', async () => {
    const s = autoUpgraderState(), state: GameState = { ...s, events: { pendingEventId: 'event:shakedown', opportunityElapsedMs: 123456 } };
    const f = await mount(state);
    const before = f.game().getSnapshot().result.state, reads = f.reads(), writes = f.writes();
    await click('VIEW EVENT');
    expect(container.querySelector('[aria-current="page"]')?.textContent).toBe('CITY');
    expect(f.game().getSnapshot().result.state).toBe(before);
    expect(f.reads()).toBe(reads); expect(f.writes()).toBe(writes);
    expect(f.random.next).not.toHaveBeenCalled();
    for (const section of PRIMARY_SECTIONS) {
      await navigate(section.label); await f.advance(1000);
      expect(container.querySelector('.global-indicators')?.textContent).toContain('CITY EVENT ACTIVE · Shakedown');
    }
    await click('CITY EVENT ACTIVE · Shakedown');
    expect(button('REFUSE').disabled).toBe(false); expect(button('PAY THEM OFF').disabled).toBe(false);
    expect(f.game().getSnapshot().result.state.events).toEqual(state.events); expect(f.random.next).not.toHaveBeenCalled();
  });
  it('an Event spawning in Collection is announced globally once and its indicator only navigates', async () => {
    const s = autoUpgraderState(), f = await mount({ ...s, events: { pendingEventId: null, opportunityElapsedMs: 599000 } });
    await navigate('COLLECTION'); f.random.next.mockReturnValueOnce(.1).mockReturnValueOnce(0);
    await f.advance(1000);
    expect(container.querySelector('[aria-current="page"]')?.textContent).toBe('COLLECTION');
    expect(container.querySelector('.global-feedback')?.textContent).toContain('Hot Tip');
    expect(f.random.next).toHaveBeenCalledTimes(2);
    const before = f.game().getSnapshot().result.state;
    const announcement = [...container.querySelectorAll('.global-feedback span')].find(span => span.textContent?.includes('Hot Tip'));
    await click('CITY EVENT ACTIVE · Hot Tip');
    expect(f.game().getSnapshot().result.state).toBe(before);
    expect(f.random.next).toHaveBeenCalledTimes(2);
    expect([...container.querySelectorAll('.global-feedback span')].find(span => span.textContent?.includes('Hot Tip'))).toBe(announcement);
    expect(button('PLAY IT SAFE').disabled).toBe(false);
  });
  it('the single Operations toggle governs spending while another section is visible', async () => {
    const s = autoUpgraderState(), f = await mount({ ...s, automation: { ...s.automation, enabledIds: [] } });
    await navigate('OPERATIONS'); await click('Enable Business Auto-Upgrader');
    await navigate('COLLECTION'); await f.advance(30000);
    expect(f.game().getSnapshot().result.state.permanentProgression.statistics.businessLevelsPurchased).toBe(1);
    await navigate('OPERATIONS'); await click('Disable Business Auto-Upgrader');
    await navigate('CITY'); await f.advance(30000);
    expect(f.game().getSnapshot().result.state.permanentProgression.statistics.businessLevelsPurchased).toBe(1);
    expect(container.querySelector('.global-indicators')?.textContent ?? '').not.toContain('AUTO-UPGRADER ACTIVE');
  });
  it('manual command and achievement feedback remain after leaving Operations', async () => {
    const s = createInitialGameState(); const f = await mount({ ...s, progression: { xp: 90 }, city: { ...s.city, heat: 59 } });
    await navigate('OPERATIONS'); const delivery = container.querySelector('.delivery-button');
    if (!(delivery instanceof HTMLButtonElement)) throw Error('delivery');
    await act(() => delivery.click()); await navigate('COLLECTION');
    expect(container.querySelector('.global-feedback')?.textContent).toContain('First Steps');
    expect(container.querySelector('.global-feedback')?.textContent).toContain('Running Hot');
    expect(container.querySelector('.global-status')?.textContent).toContain('60 · HOT');
    expect(container.querySelector('.hud-heat')?.classList.contains('heat-hot')).toBe(true);
    expect(container.querySelector('#section-content')?.getAttribute('data-section')).toBe('collection');
    expect(content()).toContain('Permanent ownership');
    const feedback = container.querySelector('.feedback-success');
    expect(feedback?.getAttribute('aria-live')).toBe('polite');
    expect(container.querySelector('.feedback-achievement')?.textContent).toContain('First Steps');
    await f.advance(250);
    expect(container.querySelector('.feedback-success')).toBe(feedback);
  });
  it('Rebirth confirmation and cancel survive remounting the Empire view; only explicit confirm resets', async () => {
    const f = await mount(autoUpgraderState()); await navigate('EMPIRE');
    const before = f.game().getSnapshot().result.state; await click('Review Rebirth');
    await navigate('CITY'); expect(f.game().getSnapshot().result.state).toBe(before);
    await navigate('EMPIRE'); expect(content()).toContain('Confirm your Rebirth');
    await click('Cancel'); expect(f.game().getSnapshot().result.state).toBe(before);
    await click('Review Rebirth'); await click('Confirm Rebirth');
    expect(f.game().getSnapshot().result.state.permanentProgression.rebirthCount).toBe(1);
    await navigate('OVERVIEW'); expect(container.querySelector('.global-feedback')?.textContent).toContain('REBIRTH COMPLETE');
  });
  it('import draft, validated confirmation and export text survive navigation; import stays v16 without another bootstrap', async () => {
    const f = await mount(autoUpgraderState()); await navigate('EMPIRE'); await click('Export save');
    const exported = container.querySelector<HTMLTextAreaElement>('#export-code')?.value;
    expect(exported?.startsWith('CE1-')).toBe(true);
    const incoming = createInitialGameState(), code = exportSaveCode(incoming,0); if (!code.ok) throw Error('code');
    await fillImport(code.code); await click('Validate import'); expect(content()).toContain('Confirm import');
    const before = f.game().getSnapshot().result.state;
    await navigate('CITY'); await navigate('EMPIRE');
    expect(container.querySelector<HTMLTextAreaElement>('#import-code')?.value).toBe(code.code);
    expect(container.querySelector<HTMLTextAreaElement>('#export-code')?.value).toBe(exported);
    expect(f.game().getSnapshot().result.state).toBe(before); await click('Confirm import');
    expect(f.game().getSnapshot().result.state).toEqual(incoming);
    expect(container.querySelector('[aria-current="page"]')?.textContent).toBe('EMPIRE');
    expect(content()).toContain('Save imported'); expect(createPersistentGame).toHaveBeenCalledTimes(1);
    expect(parseSave(f.raw())).toMatchObject({ok:true,envelope:{version: 17,state:incoming}});
  });
  it('offline spending summary and achievement announcements are visible on initial Overview', async () => {
    const f = await mount(autoUpgraderState(),90000);
    expect(container.querySelector('[aria-current="page"]')?.textContent).toBe('OVERVIEW');
    expect(container.querySelector('.offline-return')?.textContent).toContain('Dockside Detail +3 levels');
    expect(container.querySelector('.global-feedback')?.textContent).toContain('Dockside Operator');
    expect(f.random.next).not.toHaveBeenCalled(); expect(f.writes()).toBe(1);
  });
  it('skip link focuses the single main without reading clocks, writing saves or consuming RNG', async () => {
    const f = await mount(autoUpgraderState()), before = f.game().getSnapshot().result.state;
    const reads = f.reads(), writes = f.writes();
    const skip = container.querySelector<HTMLAnchorElement>('.skip-link');
    expect(skip?.textContent).toBe('Skip to main content'); expect(skip?.getAttribute('href')).toBe('#main');
    await act(() => { skip?.focus(); skip?.click(); });
    expect(document.activeElement?.tagName).toBe('MAIN'); expect(container.querySelectorAll('main')).toHaveLength(1);
    expect(f.game().getSnapshot().result.state).toBe(before); expect(f.reads()).toBe(reads); expect(f.writes()).toBe(writes);
    expect(f.random.next).not.toHaveBeenCalled();
  });
  it('focused controls survive Cash, Heat, Dispatcher, Auto-Upgrader and event-spawn updates', async () => {
    const s = autoUpgraderState();
    const f = await mount({ ...s, city: { ...s.city, heat: 70 },
      automation: { ...s.automation, unlockedIds: [...s.automation.unlockedIds, DELIVERY_DISPATCHER.id] },
      events: { opportunityElapsedMs: 599000, pendingEventId: null } });
    await navigate('EMPIRE'); const input = container.querySelector<HTMLTextAreaElement>('#import-code'); input?.focus();
    f.random.next.mockReturnValueOnce(.1).mockReturnValueOnce(0); await f.advance(60000);
    expect(document.activeElement).toBe(input); expect(f.game().getSnapshot().result.state.events.pendingEventId).not.toBeNull();
    expect(f.game().getSnapshot().result.state.permanentProgression.statistics.businessLevelsPurchased).toBe(2);
    expect(container.querySelector('.global-status')?.closest('[aria-live], [role="status"]')).toBeNull();
    expect(container.querySelector('.global-feedback')?.textContent).toContain('Last dispatch:');
    const dispatch = [...container.querySelectorAll('.global-feedback span')].find(e => e.textContent?.startsWith('Last dispatch:'));
    expect(dispatch?.closest('[aria-live], [role="status"]')).toBeNull();
  });
  it('focused event resolution hands focus to its surviving heading, without extra actions', async () => {
    const s = autoUpgraderState(); const f = await mount({ ...s, events: { pendingEventId: 'event:hot-tip', opportunityElapsedMs: 0 } });
    await navigate('CITY'); button('PLAY IT SAFE').focus();
    const eventHeading = container.querySelector<HTMLElement>('#city-events-heading'); if (!eventHeading) throw Error('heading');
    const recovery = vi.spyOn(eventHeading, 'focus');
    await click('PLAY IT SAFE');
    expect(recovery).toHaveBeenCalledWith({ preventScroll: true });
    expect(document.activeElement?.id).toBe('city-events-heading');
    expect(f.game().getSnapshot().result.state.events.pendingEventId).toBeNull();
    expect(f.game().getSnapshot().result.state.permanentProgression.statistics.eventsResolved).toBe(1);
    expect(f.random.next).not.toHaveBeenCalled();
  });
  it('Crew assignment and unassignment keep a usable focus destination and announce outcomes', async () => {
    const s = autoUpgraderState(); const f = await mount({ ...s, crew: { recruitedIds: ['crew:mara-knox'], assignments: { operations: null, logistics: null } } });
    await navigate('CITY'); button('Assign Mara Knox to Operations').focus();
    const crewHeading = document.getElementById('crew:mara-knox-heading'); if (!crewHeading) throw Error('heading');
    const recovery = vi.spyOn(crewHeading, 'focus');
    await click('Assign Mara Knox to Operations');
    expect(recovery).toHaveBeenCalledWith({ preventScroll: true });
    expect(document.activeElement?.id).toBe('crew:mara-knox-heading');
    expect(container.querySelector('.global-feedback [role="status"]')?.textContent).toContain('Mara Knox');
    button('Unassign Operations').focus(); await click('Unassign Operations');
    expect(document.activeElement?.id).toBe('crew-slot-operations');
    expect(f.game().getSnapshot().result.state.crew.assignments.operations).toBeNull();
  });
  it('import errors are associated with the input, and inline confirmation focuses safe cancellation', async () => {
    const f = await mount(autoUpgraderState()); await navigate('EMPIRE');
    await fillImport('bad code'); await click('Validate import');
    const input = container.querySelector<HTMLTextAreaElement>('#import-code');
    expect(input?.getAttribute('aria-invalid')).toBe('true');
    expect(input?.getAttribute('aria-describedby')).toContain('save-feedback');
    expect(container.querySelector('#save-feedback')?.getAttribute('role')).toBe('status');
    const code = exportSaveCode(createInitialGameState(),0); if (!code.ok) throw Error('code');
    await fillImport(code.code); expect(input?.hasAttribute('aria-invalid')).toBe(false);
    const before = f.game().getSnapshot().result.state; await click('Validate import');
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Cancel import');
    expect(container.querySelector('.save-confirm')?.getAttribute('role')).toBe('group');
    expect(container.querySelector('[aria-modal]')).toBeNull();
    await click('Cancel import'); expect(document.activeElement?.textContent).toBe('Validate import');
    expect(f.game().getSnapshot().result.state).toBe(before);
  });
  it('each section retains one h1 and non-skipping heading levels', async () => {
    await mount(autoUpgraderState());
    for (const section of PRIMARY_SECTIONS) {
      await navigate(section.label); expect(container.querySelectorAll('h1')).toHaveLength(1);
      expect(container.querySelector('h1')?.textContent).toBe(section.label);
      let previous = 1;
      for (const el of container.querySelectorAll('#section-content h1, #section-content h2, #section-content h3, #section-content h4')) {
        const level = Number(el.tagName.slice(1)); expect(level).toBeLessThanOrEqual(previous+1); previous=level;
      }
    }
  });

});


describe('POST 2D local interaction and progression', () => {
  it('repeated Dockside upgrades retain the same section, card and usable focused button', async () => {
    const f = await mount(autoUpgraderState()); await navigate('OPERATIONS');
    const card = container.querySelector('.business-card'), section = container.querySelector('#section-content');
    const upgrade = button('Upgrade Dockside Detail to Level 26'); upgrade.focus();
    vi.mocked(window.scrollTo).mockClear();
    for (let level = 26; level <= 28; level++) {
      await click(`Upgrade Dockside Detail to Level ${level}`);
      expect(f.game().getSnapshot().result.state.businesses.owned[STARTER_BUSINESS.id]?.level).toBe(level);
      expect(button(`Upgrade Dockside Detail to Level ${level + 1}`)).toBe(upgrade);
      expect(document.activeElement).toBe(upgrade); expect(upgrade.disabled).toBe(false);
      expect(container.querySelector('.business-card')).toBe(card); expect(container.querySelector('#section-content')).toBe(section);
    }
    expect(section?.getAttribute('data-section')).toBe('operations'); expect(window.scrollTo).not.toHaveBeenCalled();
    expect(f.random.next).not.toHaveBeenCalled();
  });
  it('exhausting upgrade Cash recovers the local heading without scrolling it into view', async () => {
    const state = autoUpgraderState(), cost = selectBusinessProgress(state, STARTER_BUSINESS.id)?.upgradeCost;
    if (!cost) throw Error('cost');
    const f = await mount({ ...state, economy: { cash: cost } }); await navigate('OPERATIONS');
    const upgrade = button('Upgrade Dockside Detail to Level 26'); upgrade.focus();
    const heading = container.querySelector<HTMLElement>('#business-name'); if (!heading) throw Error('heading');
    const focus = vi.spyOn(heading, 'focus'); vi.mocked(window.scrollTo).mockClear();
    await click('Upgrade Dockside Detail to Level 26');
    expect(upgrade.disabled).toBe(true); expect(document.activeElement).toBe(heading);
    expect(focus).toHaveBeenCalledWith({ preventScroll: true }); expect(window.scrollTo).not.toHaveBeenCalled();
    expect(f.game().getSnapshot().result.state.economy.cash).toBe(moneyFromMinorUnits('0'));
  });
  it('Skill purchase that consumes the available EP recovers locally without top navigation', async () => {
    const state = createInitialGameState(); const f = await mount({ ...state,
      permanentProgression: { ...state.permanentProgression, empirePoints: 1 } });
    await navigate('EMPIRE');
    const purchase = button('Purchase next rank of Streetwise Investment'); purchase.focus();
    const heading = purchase.closest('article')?.querySelector('h3'); if (!heading) throw Error('heading');
    const focus = vi.spyOn(heading, 'focus'); vi.mocked(window.scrollTo).mockClear();
    await click('Purchase next rank of Streetwise Investment');
    expect(f.game().getSnapshot().result.state.permanentProgression.empirePoints).toBe(0);
    expect(document.activeElement).toBe(heading); expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(window.scrollTo).not.toHaveBeenCalled(); expect(container.querySelector('[data-section]')?.getAttribute('data-section')).toBe('empire');
  });
  it('KX-R purchase removes its button but preserves the local heading and artwork', async () => {
    await mount(autoUpgraderState()); await navigate('COLLECTION');
    const buy = button('Buy Kairo KX-R'); buy.focus(); const image = container.querySelector('.vehicle-artwork');
    const heading = buy.closest('article')?.querySelector('h3'); if (!heading) throw Error('heading');
    const focus = vi.spyOn(heading, 'focus'); vi.mocked(window.scrollTo).mockClear();
    await click('Buy Kairo KX-R');
    expect(document.activeElement).toBe(heading); expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(container.querySelector('.vehicle-artwork')).toBe(image); expect(content()).toContain('OWNED');
    expect(buy.isConnected).toBe(false); expect(window.scrollTo).not.toHaveBeenCalled();
  });
  it('global XP survives all sections and resets its range on a Job level-up without focus movement', async () => {
    const state = createInitialGameState(); const f = await mount({ ...state, progression: { xp: getXpThresholdForLevel(2) - 10 } });
    const progress = container.querySelector<HTMLProgressElement>('.hud-xp-progress');
    for (const section of PRIMARY_SECTIONS) {
      await navigate(section.label); expect(container.querySelector('.hud-xp-progress')).toBe(progress);
      expect(container.querySelectorAll('.global-status > div')).toHaveLength(4);
    }
    await navigate('OPERATIONS'); const delivery = container.querySelector<HTMLButtonElement>('.delivery-button'); delivery?.focus();
    vi.mocked(window.scrollTo).mockClear(); await act(() => delivery?.click());
    const authority = getLevelProgress(f.game().getSnapshot().result.state.progression.xp);
    expect(authority.currentLevel).toBe(2); expect(progress?.value).toBe(authority.xpIntoLevel); expect(progress?.max).toBe(authority.xpNeededForLevel);
    expect(document.activeElement).toBe(delivery); expect(window.scrollTo).not.toHaveBeenCalled();
    expect(progress?.closest('[role="status"], [aria-live]')).toBeNull();
  });
  it('passive Rebirth eligibility coexists with feedback and preserves Operations focus', async () => {
    const state = autoUpgraderState(24);
    const f = await mount({ ...state, progression: { xp: getXpThresholdForLevel(20) - 25 } });
    await navigate('OPERATIONS'); const upgrade = button('Upgrade Dockside Detail to Level 25'); upgrade.focus();
    const section = container.querySelector('[data-section]'); const feedback = container.querySelector('.global-feedback');
    expect(container.querySelector('.rebirth-notice')).toBeNull(); vi.mocked(window.scrollTo).mockClear();
    await click('Upgrade Dockside Detail to Level 25');
    expect(container.querySelector('.rebirth-notice')?.textContent).toContain(`+${selectRebirth(f.game().getSnapshot().result.state).reward} EP`);
    expect(container.querySelector('[data-section]')).toBe(section); expect(section?.getAttribute('data-section')).toBe('operations');
    expect(document.activeElement).toBe(upgrade); expect(window.scrollTo).not.toHaveBeenCalled();
    expect(container.querySelector('.global-feedback')).toBe(feedback); expect(feedback?.textContent).toContain('LEVEL UP');
    const announcement = container.querySelector('.rebirth-notice-slot [role="status"]')?.textContent;
    await f.advance(250); expect(container.querySelector('.rebirth-notice-slot [role="status"]')?.textContent).toBe(announcement);
    expect(document.activeElement).toBe(upgrade);
  });
  it('Review Rebirth only navigates/focuses, including from Empire; explicit confirmation clears notice', async () => {
    const f = await mount(autoUpgraderState()); await navigate('COLLECTION');
    const before = f.game().getSnapshot().result.state, reads = f.reads(), writes = f.writes();
    vi.mocked(window.scrollTo).mockClear();
    await click('Review Rebirth in Empire');
    expect(document.activeElement?.id).toBe('rebirth-heading'); expect(content()).not.toContain('Confirm your Rebirth');
    expect(f.game().getSnapshot().result.state).toBe(before); expect(f.reads()).toBe(reads); expect(f.writes()).toBe(writes);
    expect(f.random.next).not.toHaveBeenCalled(); expect(window.scrollTo).not.toHaveBeenCalled();
    const target = container.querySelector<HTMLElement>('#rebirth-heading'); if (!target) throw Error('target');
    const scroll = vi.spyOn(target, 'scrollIntoView');
    await click('Review Rebirth in Empire'); expect(scroll).toHaveBeenCalledWith({ block: 'start', behavior: 'instant' });
    await click('Review Rebirth'); expect(document.activeElement?.getAttribute('aria-label')).toBe('Cancel Rebirth');
    await click('Confirm Rebirth'); expect(container.querySelector('.rebirth-notice')).toBeNull();
    expect(f.game().getSnapshot().result.state.permanentProgression.rebirthCount).toBe(1);
    expect(document.activeElement?.id).toBe('rebirth-heading');
  });
});

it('ordinary automation toggles preserve focus and section without extra navigation', async () => {
  await mount(autoUpgraderState()); await navigate('OPERATIONS');
  const toggle = button('Disable Business Auto-Upgrader'); toggle.focus();
  vi.mocked(window.scrollTo).mockClear();
  await click('Disable Business Auto-Upgrader');
  expect(button('Enable Business Auto-Upgrader')).toBe(toggle); expect(document.activeElement).toBe(toggle);
  await click('Enable Business Auto-Upgrader');
  expect(button('Disable Business Auto-Upgrader')).toBe(toggle); expect(document.activeElement).toBe(toggle);
  expect(window.scrollTo).not.toHaveBeenCalled();
});

describe('POST 3B mounted portfolio continuity', () => {
  it('acquires Laundry in place, then repeats upgrades on the same focused card/control', async () => {
    await mount(autoUpgraderState()); await navigate('OPERATIONS'); vi.mocked(window.scrollTo).mockClear();
    const buy = button('Acquire Neon Laundry'); buy.focus(); const card = buy.closest('section');
    await click('Acquire Neon Laundry'); expect(button('Upgrade Neon Laundry to Level 2')).toBe(buy);
    expect(document.activeElement).toBe(buy); expect(buy.closest('section')).toBe(card);
    for (const level of [2, 3, 4]) { await click(`Upgrade Neon Laundry to Level ${level}`); expect(document.activeElement).toBe(buy); }
    expect(card?.textContent).toContain('Level 4 / 100'); expect(card?.textContent).not.toContain('Requirements');
    expect(window.scrollTo).not.toHaveBeenCalled();
  });
  it('newly owned option stays unselected; free target switching keeps focus and the countdown', async () => {
    const s = autoUpgraderState(), f = await mount({ ...s, automation: { ...s.automation, businessAutoUpgradeElapsedMs: 20000 } });
    await navigate('OPERATIONS'); await click('AUTOMATION'); vi.mocked(window.scrollTo).mockClear(); expect(container.querySelector('#auto-upgrader-target')).toBeNull();
    await click('Acquire Neon Laundry'); const select = container.querySelector<HTMLSelectElement>('#auto-upgrader-target');
    if (!select) throw Error('selector'); expect(select.value).toBe('business:dockside-detail'); select.focus();
    await act(() => { select.value = 'business:neon-laundry'; select.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(container.querySelector('#auto-upgrader-target')).toBe(select); expect(document.activeElement).toBe(select);
    expect(container.querySelector('#auto-upgrader-timing')?.textContent).toContain('10s');
    expect(f.game().getSnapshot().result.state.automation.enabledIds).toContain('automation:business-auto-upgrader');
    await f.advance(10000); const state = f.game().getSnapshot().result.state;
    expect(state.businesses.owned['business:neon-laundry']?.level).toBe(2);
    expect(state.businesses.owned['business:dockside-detail']?.level).toBe(25); expect(window.scrollTo).not.toHaveBeenCalled();
  });
  it('final Laundry upgrade recovers focus locally without scrolling', async () => {
    const s = autoUpgraderState(25, '10000000000');
    await mount({ ...s, businesses: { ...s.businesses, owned: { ...s.businesses.owned, 'business:neon-laundry': { level: 99 } } } });
    await navigate('OPERATIONS'); vi.mocked(window.scrollTo).mockClear(); const upgrade = button('Upgrade Neon Laundry to Level 100'); upgrade.focus();
    const heading = upgrade.closest('section')?.querySelector('h3'); if (!(heading instanceof HTMLElement)) throw Error('heading');
    const focus = vi.spyOn(heading, 'focus'); await click('Upgrade Neon Laundry to Level 100');
    expect(document.activeElement).toBe(heading); expect(focus).toHaveBeenCalledWith({ preventScroll: true }); expect(window.scrollTo).not.toHaveBeenCalled();
  });
});


describe('POST 3C local Operations navigation', () => {
  it('moves focus and viewport to three semantic targets without gameplay or URL changes', async () => {
    const f = await mount(autoUpgraderState()); await navigate('OPERATIONS');
    const state = f.game().getSnapshot().result.state, writes = f.writes(), reads = f.reads(), url = location.href;
    f.random.next.mockClear(); vi.mocked(window.scrollTo).mockClear();
    const nav = container.querySelector('nav[aria-label="Operations sections"]');
    expect([...nav!.querySelectorAll('button')].map(b => b.textContent)).toEqual(['JOBS', 'BUSINESSES', 'AUTOMATION']);
    expect(nav?.querySelector('[aria-current], [aria-live]')).toBeNull();
    for (const [label, id] of [['BUSINESSES', 'businesses-heading'], ['AUTOMATION', 'automation-heading'], ['JOBS', 'starter-heading']]) {
      const target = container.querySelector<HTMLElement>(`#${id}`)!;
      const scroll = vi.spyOn(target, 'scrollIntoView'); const focus = vi.spyOn(target, 'focus');
      await click(label!);
      expect(document.activeElement).toBe(target); expect(target.tabIndex).toBe(-1);
      expect(focus).toHaveBeenCalledWith(); expect(scroll).toHaveBeenCalledWith({ block: 'start', behavior: 'instant' });
    }
    expect(location.href).toBe(url); expect(f.game().getSnapshot().result.state).toBe(state);
    expect(f.writes()).toBe(writes); expect(f.reads()).toBe(reads); expect(f.random.next).not.toHaveBeenCalled();
    expect(window.scrollTo).not.toHaveBeenCalled();
    await navigate('CITY'); await navigate('OPERATIONS');
    expect(document.activeElement?.id).toBe('section-heading');
  });
  it('acquisition and repeated upgrades stay local after an explicit Business jump', async () => {
    await mount(autoUpgraderState()); await navigate('OPERATIONS'); await click('BUSINESSES');
    const target = container.querySelector<HTMLElement>('#businesses-heading')!;
    const scroll = vi.spyOn(target, 'scrollIntoView'); vi.mocked(window.scrollTo).mockClear();
    const acquire = button('Acquire Neon Laundry'); acquire.focus();
    await click('Acquire Neon Laundry'); await click('Upgrade Neon Laundry to Level 2');
    expect(document.activeElement).toBe(acquire); expect(scroll).not.toHaveBeenCalled(); expect(window.scrollTo).not.toHaveBeenCalled();
  });
});
