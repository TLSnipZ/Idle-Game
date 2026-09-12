// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { createPersistentGame } from '../platform/persistent-game';
import { createLocalSave } from '../platform/local-save';
import { createInitialGameState } from '../game/game-state';
import { resetProgressState } from '../game/test-fixtures/reset-progress-state';
import { serializeSave, parseSave } from '../game/save-schema';
import { exportSaveCode } from '../game/save-code';

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
async function mount(source?: string) {
  const encoded = serializeSave(resetProgressState(), 1000); if (!encoded.ok) throw Error('Fixture');
  let raw = source ?? encoded.serialized, now = 0, writes = 0, failed = false, timers = 0;
  let tick = () => {};
  let session: ReturnType<typeof createPersistentGame> | undefined;
  const random = { next: vi.fn(() => 0.99) };
  vi.mocked(createPersistentGame).mockImplementation(publish => {
    session = original.createPersistentGame(publish,
      createLocalSave(() => ({ getItem: () => raw, setItem: (_key, value) => {
        if (failed) throw Error('quota'); raw = value; writes++;
      } }), () => 1000 + now),
      { random, now: () => now, schedule: cb => { tick = cb; timers++; return () => { timers--; }; } },
      () => { timers++; return () => { timers--; }; });
    return session;
  });
  root = createRoot(container); await act(() => root?.render(<App />));
  const game = () => { if (!session) throw Error('Not mounted'); return session; };
  return { game, random, writes: () => writes, raw: () => raw, timers: () => timers,
    fail: () => { failed = true; },
    advance: async (ms: number) => { now += ms; await act(() => tick()); } };
}
function button(label: string) {
  const found = [...container.querySelectorAll('button')].find(element =>
    element.textContent === label || element.getAttribute('aria-label') === label);
  if (!found) throw Error(`Missing ${label}`); return found;
}
async function click(label: string) { await act(() => button(label).click()); }
async function input(selector: string, value: string) {
  const element = container.querySelector(selector);
  if (!(element instanceof HTMLInputElement) && !(element instanceof HTMLTextAreaElement)) throw Error('Missing input');
  const prototype = element instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
  await act(() => { setter?.call(element, value); element.dispatchEvent(new Event('input', { bubbles: true })); });
}
async function consent() { await click('Review New Game reset'); await input('#reset-confirmation-text', 'RESET'); }

describe('New Game in Empire / Save & Transfer', () => {
  it('warns about permanent loss and backup; only exact typed confirmation enables the destructive button', async () => {
    const f = await mount(); await click('EMPIRE'); const before = f.game().getSnapshot().result.state, writes = f.writes();
    const panel = container.querySelector('.reset-panel');
    expect(panel?.textContent).toContain('This is not Rebirth');
    expect(panel?.textContent).toContain('Export save'); expect(panel?.textContent).toContain('No Empire Points are awarded');
    await click('Review New Game reset');
    expect(document.activeElement).toBe(button('Cancel New Game'));
    expect(button('Reset all progress').disabled).toBe(true);
    await input('#reset-confirmation-text', 'reset'); expect(button('Reset all progress').disabled).toBe(true);
    await input('#reset-confirmation-text', 'RESET'); expect(button('Reset all progress').disabled).toBe(false);
    expect(container.querySelector('label[for="reset-confirmation-text"]')).not.toBeNull();
    expect(f.game().getSnapshot().result.state).toBe(before); expect(f.writes()).toBe(writes);
    expect(f.random.next).not.toHaveBeenCalled();
  });
  it('cancel and Escape discard consent and recover local focus without a page-top jump', async () => {
    const f = await mount(); await click('EMPIRE'); const before = f.game().getSnapshot().result.state;
    await consent(); vi.mocked(window.scrollTo).mockClear(); await click('Cancel New Game');
    expect(document.activeElement).toBe(button('Review New Game reset')); expect(window.scrollTo).not.toHaveBeenCalled();
    await consent(); const field = container.querySelector('#reset-confirmation-text');
    await act(() => field?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    expect(container.querySelector('#reset-confirmation-text')).toBeNull();
    expect(document.activeElement).toBe(button('Review New Game reset'));
    expect(f.game().getSnapshot().result.state).toBe(before);
    await click('Review New Game reset'); expect(button('Reset all progress').disabled).toBe(true);
  });
  it('resets once, returns to Overview with meaningful focus and clears old import/Rebirth approvals and exports', async () => {
    const f = await mount(); await click('EMPIRE'); await click('Export save');
    const backup = container.querySelector<HTMLTextAreaElement>('#export-code')?.value; if (!backup) throw Error('Backup');
    await input('#import-code', backup); await click('Validate import'); await click('Review Rebirth');
    await consent(); const confirm = button('Reset all progress'), writes = f.writes();
    await act(() => { confirm.click(); confirm.click(); });
    expect(f.writes()).toBe(writes + 1); expect(f.game().getSnapshot().result.state).toEqual(createInitialGameState());
    expect(container.querySelector('[aria-current="page"]')?.textContent).toBe('OVERVIEW');
    expect(document.activeElement?.id).toBe('section-heading');
    expect(container.querySelector('.feedback-command')?.textContent).toContain('NEW GAME');
    expect(container.querySelector('.rebirth-notice')).toBeNull(); expect(container.querySelector('.offline-return')).toBeNull();
    expect(f.timers()).toBe(2); expect(createPersistentGame).toHaveBeenCalledTimes(1);
    await click('EMPIRE');
    expect(container.querySelector('#export-code')).toBeNull();
    expect(container.querySelector<HTMLTextAreaElement>('#import-code')?.value).toBe('');
    expect(container.querySelector('#import-warning')).toBeNull(); expect(container.querySelector('#rebirth-warning')).toBeNull();
    expect(container.querySelector('#reset-confirmation')).toBeNull();
    // The user's separately copied backup still works through the unchanged explicit import flow.
    await input('#import-code', backup); await click('Validate import'); await click('Confirm import');
    expect(f.game().getSnapshot().result.state.garage.ownedVehicleIds).toEqual(['vehicle:kairo-kx-r']);
    expect(f.game().getSnapshot().result.state.permanentProgression.rebirthCount).toBe(9);
  });
  it('storage failure does not navigate, clear backup/drafts or claim successful reset', async () => {
    const f = await mount(); await click('EMPIRE'); await click('Export save');
    const before = f.game().getSnapshot().result.state, raw = f.raw();
    await input('#import-code', 'keep this draft'); await consent(); f.fail(); await click('Reset all progress');
    expect(container.querySelector('[aria-current="page"]')?.textContent).toBe('EMPIRE');
    expect(f.game().getSnapshot().result.state).toBe(before); expect(f.raw()).toBe(raw);
    expect(container.querySelector('#export-code')).not.toBeNull();
    expect(container.querySelector<HTMLTextAreaElement>('#import-code')?.value).toBe('keep this draft');
    expect(container.querySelector('.reset-panel [role="status"]')?.textContent).toContain('Nothing was reset');
    expect(container.querySelector('#reset-confirmation')).toBeNull();
    expect(container.querySelector('.feedback-command')?.textContent).not.toContain('NEW GAME');
  });
  it('leaving Empire discards typed reset consent without changing gameplay', async () => {
    const f = await mount(); await click('EMPIRE'); await consent();
    const before = f.game().getSnapshot().result.state, writes = f.writes();
    await click('CITY'); await click('EMPIRE');
    expect(container.querySelector('#reset-confirmation')).toBeNull();
    expect(f.game().getSnapshot().result.state).toBe(before); expect(f.writes()).toBe(writes);
    await click('Review New Game reset'); expect(button('Reset all progress').disabled).toBe(true);
  });
  it('successful import invalidates a reset confirmation for the previous run', async () => {
    const f = await mount(); await click('EMPIRE'); await consent();
    const code = exportSaveCode(createInitialGameState(), 0); if (!code.ok) throw Error('Code');
    await input('#import-code', code.code); await click('Validate import'); await click('Confirm import');
    expect(f.game().getSnapshot().result.state).toEqual(createInitialGameState());
    expect(container.querySelector('#reset-confirmation')).toBeNull();
    await click('Review New Game reset'); expect(button('Reset all progress').disabled).toBe(true);
  });
  it('successful Rebirth invalidates reset consent without resetting permanent progression', async () => {
    const f = await mount(); await click('EMPIRE'); await consent();
    await click('Review Rebirth'); await click('Confirm Rebirth');
    expect(f.game().getSnapshot().result.state.permanentProgression.rebirthCount).toBe(10);
    expect(f.game().getSnapshot().result.state.garage.ownedVehicleIds).toEqual(['vehicle:kairo-kx-r']);
    expect(container.querySelector('#reset-confirmation')).toBeNull();
  });
  it('typing Enter never acts as implicit form submission', async () => {
    const f = await mount(); await click('EMPIRE'); await consent();
    const field = container.querySelector('#reset-confirmation-text'), writes = f.writes();
    expect(field?.closest('form')).toBeNull();
    await act(() => field?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
    expect(f.writes()).toBe(writes); expect(button('Reset all progress').disabled).toBe(false);
  });
  it('runtime updates leave confirmation input and focus stable while the player decides', async () => {
    const f = await mount(); await click('EMPIRE'); await consent();
    const field = container.querySelector<HTMLInputElement>('#reset-confirmation-text'); field?.focus();
    await f.advance(250);
    expect(container.querySelector('#reset-confirmation-text')).toBe(field);
    expect(field?.value).toBe('RESET'); expect(document.activeElement).toBe(field);
  });
  it('blocked/corrupt storage disables New Game instead of silently replacing the protected save', async () => {
    const f = await mount('{broken'); await click('EMPIRE');
    expect(button('Review New Game reset').disabled).toBe(true);
    expect(f.raw()).toBe('{broken'); expect(f.writes()).toBe(0);
  });
  it('the new run starts at zero and earns normally after reset, without old automation', async () => {
    const f = await mount(); await click('EMPIRE'); await consent(); await click('Reset all progress');
    await click('OPERATIONS');
    const delivery = container.querySelector<HTMLButtonElement>('.delivery-button');
    await act(() => delivery?.click());
    expect(f.game().getSnapshot().result.state.progression.xp).toBe(10);
    expect(f.game().getSnapshot().result.state.economy.cash).toBe('2500');
    expect(f.game().getSnapshot().result.state.permanentProgression.statistics.manualJobsCompleted).toBe(1);
    expect(parseSave(f.raw())).toMatchObject({ ok: true, envelope: { version: 17 } });
  });
});
