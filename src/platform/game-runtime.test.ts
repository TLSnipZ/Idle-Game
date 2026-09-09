import { describe, expect, it, vi } from 'vitest';
import { STARTER_BUSINESS } from '../features/businesses';
import { moneyFromMinorUnits } from '../features/economy';
import { createInitialGameState } from '../game/game-state';
import type { GameState } from '../game/game-state';
import { performStarterJob } from '../game/perform-starter-job';
import { purchaseBusiness } from '../game/purchase-business';
import { onlineElapsed } from './test-fixtures/online-elapsed';
import { browserTiming, createGameRuntime, RUNTIME_CADENCE_MS } from './game-runtime';

function funded(): GameState {
  let state = createInitialGameState();
  for (let i = 0; i < 6; i++) state = performStarterJob(state).state;
  return state;
}
function owned(): GameState {
  return purchaseBusiness(funded(), STARTER_BUSINESS.id).state;
}
function fixture(state = owned(), initialTime = 0) {
  let now = initialTime;
  const callbacks = new Set<() => void>();
  const publish = vi.fn();
  const runtime = createGameRuntime(state, publish, {
    random: { next: () => 0.99 }, now: () => now,
    schedule: callback => {
      callbacks.add(callback);
      return () => { callbacks.delete(callback); };
    },
  });
  return {
    runtime, callbacks, publish,
    at: (time: number) => { now = time; },
    tick: () => { for (const callback of [...callbacks]) callback(); },
    state: () => runtime.getSnapshot().result.state,
  };
}

describe('mounted game runtime', () => {
  it('construction and initial mount never grant pre-start income', () => {
    const f = fixture(owned(), 100_000);
    expect(f.callbacks.size).toBe(0);
    f.runtime.start();
    f.tick();
    expect(f.state()).toEqual(owned());
    expect(f.publish).not.toHaveBeenCalled();
  });
  it('unowned businesses produce nothing', () => {
    const f = fixture(createInitialGameState());
    f.runtime.start(); f.at(1000); f.tick();
    expect(f.state()).toEqual(onlineElapsed(createInitialGameState(), 1000).state);
  });
  it('owned businesses earn from elapsed runtime', () => {
    const f = fixture();
    f.runtime.start(); f.at(1000); f.tick();
    expect(f.state().economy.cash).toBe('75');
  });
  it('repeated callbacks without time advancement award nothing', () => {
    const f = fixture(); f.runtime.start();
    f.at(1000);
    for (let i = 0; i < 100; i++) f.tick();
    expect(f.state()).toEqual(onlineElapsed(owned(), 1000).state);
  });
  it('a delayed callback catches up across a long same-session delay', () => {
    const f = fixture(); f.runtime.start();
    f.at(8 * 60 * 60 * 1000); f.tick();
    expect(f.state()).toEqual(onlineElapsed(owned(), 28_800_000).state);
    expect(f.publish).toHaveBeenCalledTimes(1);
  });
  it('arbitrary callbacks equal one combined elapsed interval', () => {
    const split = fixture(); const combined = fixture();
    split.runtime.start(); combined.runtime.start();
    for (const t of [1, 19, 333, 501, 891, 1234]) { split.at(t); split.tick(); }
    combined.at(1234); combined.tick();
    expect(split.state()).toEqual(combined.state());
  });
  it('retains 0.4 + 0.4 + 0.4 milliseconds as 1 ms plus 0.2 ms', () => {
    const f = fixture(); f.runtime.start();
    for (const t of [0.4, 0.8, 1.2]) { f.at(t); f.tick(); }
    expect(f.state()).toEqual(onlineElapsed(owned(), 1).state);
    f.at(2); f.tick();
    expect(f.state()).toEqual(onlineElapsed(owned(), 2).state);
  });
  it('fractional split intervals retain all whole milliseconds', () => {
    const f = fixture(); f.runtime.start();
    for (let i = 1; i <= 10000; i++) { f.at(i * 0.4); f.tick(); }
    expect(f.state()).toEqual(onlineElapsed(owned(), 4000).state);
  });
  it('reconciles before purchase, without retroactive business income', () => {
    const f = fixture(funded()); f.runtime.start(); f.at(1000);
    f.runtime.execute(state => purchaseBusiness(state, STARTER_BUSINESS.id));
    expect(f.state().economy.cash).toBe('0');
    f.at(1500); f.tick();
    expect(f.state()).toEqual(onlineElapsed({ ...owned(), events: { ...owned().events, opportunityElapsedMs: 1000 }, city: { ...owned().city, heatDecayElapsedMs: 1000 } }, 500).state);
  });
  it('does not transfer fractional unowned time into a newly purchased business', () => {
    const f = fixture(funded()); f.runtime.start(); f.at(1000.75);
    f.runtime.execute(state => purchaseBusiness(state, STARTER_BUSINESS.id));
    f.at(1014); f.tick(); // 13.25 ms owned: only 13 whole ms are eligible.
    expect(f.state()).toEqual(onlineElapsed({ ...owned(), events: { ...owned().events, opportunityElapsedMs: 1000 }, city: { ...owned().city, heatDecayElapsedMs: 1000 } }, 13).state);
    f.at(1014.75); f.tick();
    expect(f.state()).toEqual(onlineElapsed({ ...owned(), events: { ...owned().events, opportunityElapsedMs: 1000 }, city: { ...owned().city, heatDecayElapsedMs: 1000 } }, 14).state);
  });
  it('starter jobs retain fractional producing time at their boundary', () => {
    const f = fixture(); f.runtime.start(); f.at(0.75);
    f.runtime.execute(performStarterJob);
    f.at(1); f.tick();
    expect(f.state()).toEqual(performStarterJob(onlineElapsed(owned(), 1).state).state);
  });
  it('commands see pre-command production and preserve it through a job', () => {
    const f = fixture(); f.runtime.start(); f.at(1000);
    const command = vi.fn(performStarterJob);
    f.runtime.execute(command);
    expect(command.mock.calls[0]?.[0].economy.cash).toBe('75');
    expect(f.state().economy.cash).toBe('2575');
    f.tick();
    expect(f.state().economy.cash).toBe('2575');
  });
  it('sequential queued intents consume the latest state before React renders', () => {
    const f = fixture(createInitialGameState()); f.runtime.start();
    for (let i = 0; i < 6; i++) f.runtime.execute(performStarterJob);
    f.runtime.execute(state => purchaseBusiness(state, STARTER_BUSINESS.id));
    f.at(1000); f.tick(); f.runtime.execute(performStarterJob);
    expect(f.state().economy.cash).toBe('2575');
  });
  it('failed commands retain reconciled income and feedback across ticks', () => {
    const f = fixture(); f.runtime.start(); f.at(1000);
    f.runtime.execute(state => purchaseBusiness(state, STARTER_BUSINESS.id));
    expect(f.runtime.getSnapshot().result.ok).toBe(false);
    f.at(2000); f.tick();
    expect(f.state().economy.cash).toBe('150');
    expect(f.runtime.getSnapshot().result.ok).toBe(false);
  });
  it('stop cancels the scheduler and prevents stale callbacks or commands', () => {
    const f = fixture(); f.runtime.start();
    const old = [...f.callbacks]; f.runtime.stop();
    expect(f.callbacks.size).toBe(0);
    f.at(1000); old.forEach(callback => callback());
    f.runtime.execute(performStarterJob);
    expect(f.state()).toEqual(owned());
  });
  it('start/cleanup/start has one loop and ignores the cancelled generation', () => {
    const f = fixture(); f.runtime.start(); f.runtime.start();
    const old = [...f.callbacks];
    expect(f.callbacks.size).toBe(1);
    f.runtime.stop(); f.at(1000); f.runtime.start();
    expect(f.callbacks.size).toBe(1);
    f.at(2000); old.forEach(callback => callback()); f.tick();
    expect(f.state().economy.cash).toBe('75');
    f.runtime.stop(); expect(f.callbacks.size).toBe(0);
  });
  it('a fresh mount has independent state and no previous-session time', () => {
    const first = fixture(); first.runtime.start(); first.at(1000); first.tick(); first.runtime.stop();
    const next = fixture(createInitialGameState(), 100_000); next.runtime.start(); next.tick();
    expect(next.state()).toEqual(createInitialGameState());
  });
  it('overflow freezes last valid state, blocks commands and never retries', () => {
    const initial = { ...owned(), economy: { cash: moneyFromMinorUnits('9'.repeat(100)) } };
    const f = fixture(initial); f.runtime.start(); f.at(1); f.tick();
    const valid = f.state(); // Only a fractional cent: still valid at maximum cash.
    f.at(1000); f.tick();
    expect(f.state()).toBe(valid);
    expect(f.runtime.getSnapshot().runtimeError).toBe('overflow');
    expect(f.callbacks.size).toBe(0);
    const command = vi.fn(performStarterJob);
    for (let i = 0; i < 10; i++) {
      f.runtime.start(); f.runtime.reconcile(); f.runtime.execute(command); f.tick();
    }
    expect(command).not.toHaveBeenCalled();
    expect(f.publish).toHaveBeenCalledTimes(2);
    expect(f.state()).toBe(valid);
  });
  it.each([NaN, Infinity, -1, Number.MAX_SAFE_INTEGER + 1])('suspends invalid clock reading %s', time => {
    const f = fixture(); f.runtime.start(); f.at(time); f.tick();
    expect(f.state()).toEqual(owned());
    expect(f.runtime.getSnapshot().runtimeError).toBe('invalid-clock');
    expect(f.callbacks.size).toBe(0);
  });
  it('invalid initial clock creates no loop', () => {
    const f = fixture(owned(), NaN); f.runtime.start();
    expect(f.callbacks.size).toBe(0);
    expect(f.runtime.getSnapshot().runtimeError).toBe('invalid-clock');
  });
  it('corrupt authoritative state suspends and still throws loudly', () => {
    const initial = { ...owned(), businesses: { ...owned().businesses, productionRemainderMilliCents: -1 } };
    const f = fixture(initial); f.runtime.start(); f.at(1000);
    expect(f.tick).toThrow(RangeError);
    expect(f.state()).toBe(initial);
    expect(f.callbacks.size).toBe(0);
    expect(f.runtime.getSnapshot().runtimeError).toBe('invalid-state');
  });
  it('browser scheduler uses the configured cadence and cancels its interval', () => {
    vi.useFakeTimers();
    vi.stubGlobal('window', globalThis);
    try {
      const callback = vi.fn();
      const cancel = browserTiming.schedule(callback);
      vi.advanceTimersByTime(RUNTIME_CADENCE_MS * 4);
      expect(callback).toHaveBeenCalledTimes(4);
      cancel(); vi.advanceTimersByTime(RUNTIME_CADENCE_MS * 4);
      expect(callback).toHaveBeenCalledTimes(4);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.unstubAllGlobals(); vi.useRealTimers();
    }
  });
});
