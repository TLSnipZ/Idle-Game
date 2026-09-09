import { unlockEligibleAchievements } from '../game/achievements';
import { simulateGameElapsed } from '../game/simulate-game-elapsed';
import { describe, expect, it } from 'vitest';
import { rebirthRuntime } from './test-fixtures/rebirth-runtime';
import { skillState, ROOT, FAST, LEARN, NEVER } from '../game/test-fixtures/skill-state';
import { purchaseSkillRank } from '../game/purchase-skill-rank';
import { onlineElapsed } from './test-fixtures/online-elapsed';
import { performStarterJob } from '../game/perform-starter-job';
import { parseSave } from '../game/save-schema';
import { exportSaveCode, validateSaveCode } from '../game/save-code';
import { getOfflineCapMs } from '../game/offline-cap';
import { createLocalSave } from './local-save';
import { serializeSave } from '../game/save-schema';

describe('skill command boundaries and persistence', () => {
  it.each([ROOT, FAST, LEARN])('%s reconciles old ranks and applies new ranks only afterwards', id => {
    const initial = skillState(id === ROOT ? {} : { [ROOT]: 1 });
    const f = rebirthRuntime(initial); f.at(10000); f.wall(11000);
    f.game.execute(state => purchaseSkillRank(state, id));
    const before = onlineElapsed(initial, 10000).state;
    const purchased = purchaseSkillRank(before, id).state;
    expect(f.game.getSnapshot().result.state).toEqual(purchased);
    expect(purchased.progression.xp).toBe(5);
    expect(parseSave(f.raw())).toMatchObject({ ok: true, envelope: { savedAt: 11000, state: purchased } });
    f.at(40000); f.wall(41000); f.tick();
    const expected = onlineElapsed(purchased, 30000).state;
    expect(f.game.getSnapshot().result.state).toEqual(expected);
    expect(expected.progression.xp).toBe(id === LEARN ? 21 : 20);
    f.game.execute(performStarterJob);
    expect(f.game.getSnapshot().result.state).toEqual(performStarterJob(expected).state);
    f.game.stop();
  });
  it('skill rate boundary drops only fractional runtime milliseconds, preserving earned fractions', () => {
    const initial = skillState(); const f = rebirthRuntime(initial);
    f.at(.4); f.game.execute(s => purchaseSkillRank(s, ROOT));
    const bought = f.game.getSnapshot().result.state;
    f.at(1); f.tick(); expect(f.game.getSnapshot().result.state).toEqual(bought);
    f.at(1.5); f.tick(); expect(f.game.getSnapshot().result.state).toEqual(onlineElapsed(bought, 1).state);
    f.game.stop();
  });
  it('failed purchase saves nothing; reconciliation remains current and runtime usable', () => {
    const initial = skillState({}, 0); const f = rebirthRuntime(initial); const raw = f.raw();
    f.at(10000); f.game.execute(s => purchaseSkillRank(s, ROOT));
    expect(f.game.getSnapshot().result).toMatchObject({ ok: false, error: 'insufficient-empire-points' });
    expect(f.game.getSnapshot().result.state).toEqual(onlineElapsed(initial, 10000).state);
    expect(f.raw()).toBe(raw); f.at(20000); f.tick();
    expect(f.game.getSnapshot().result.state).toEqual(onlineElapsed(initial, 20000).state); f.game.stop();
  });
  it('new rank and unspent EP survive command save, autosave, export, reload and remount', () => {
    const f = rebirthRuntime(skillState({ [ROOT]: 1 }));
    f.game.execute(s => purchaseSkillRank(s, FAST)); const state = f.game.getSnapshot().result.state;
    expect(state.permanentProgression.empirePoints).toBe(29);
    expect(parseSave(f.raw())).toMatchObject({ ok: true, envelope: { version: 13, state } });
    const exported = f.game.exportCode(); if (!exported.ok) throw Error('fixture');
    expect(validateSaveCode(exported.code)).toMatchObject({ ok: true, envelope: { version: 13, state } });
    f.autosave(); f.game.stop(); const reload = f.make(); reload.start(); reload.start();
    expect(reload.getSnapshot().result.state).toEqual(state); expect(f.timers()).toBe(2); reload.stop(); expect(f.timers()).toBe(0);
  });
  it('ordinary command storage failure is visible and retains the purchased rank live, without changing durable save', () => {
    const f = rebirthRuntime(skillState()); const raw = f.raw(); f.fail();
    f.game.execute(s => purchaseSkillRank(s, ROOT));
    expect(f.game.getSnapshot().result.state.permanentProgression).toMatchObject({ empirePoints: 29, skills: { [ROOT]: 1 } });
    expect(f.game.getSnapshot().persistence.kind).toBe('error'); expect(f.raw()).toBe(raw);
    f.at(10000); f.tick(); expect(f.game.getSnapshot().result.state.permanentProgression.skills[ROOT]).toBe(1); f.game.stop();
  });
  it('Never Sleeps does not recover the two hours already discarded at bootstrap', () => {
    const f = rebirthRuntime(skillState({ [ROOT]: 2 })); f.game.stop(); f.wall(1000 + 10 * 3600000);
    const game = f.make(); game.start(); const credited = game.getSnapshot().result.state;
    expect(game.getSnapshot().offline).toMatchObject({ rewardedElapsedMs: 8 * 3600000, capped: true });
    game.execute(s => purchaseSkillRank(s, NEVER)); const bought = game.getSnapshot().result.state;
    expect(bought.economy).toEqual(credited.economy); expect(bought.automation).toEqual(credited.automation);
    expect(bought.progression).toEqual(credited.progression); expect(getOfflineCapMs(bought)).toBe(10 * 3600000);
    game.stop(); f.wall(1000 + 20 * 3600000); const later = f.make(); later.start();
    expect(later.getSnapshot().offline).toMatchObject({ rewardedElapsedMs: 10 * 3600000, capMs: 10 * 3600000 });
    expect(later.getSnapshot().result.state).toEqual(simulateGameElapsed(bought, 10 * 3600000).state); later.stop();
  });
  it('v8 import rebases historical time, keeps skills/EP and immediately activates their effects', () => {
    const f = rebirthRuntime(); const state = skillState({ [FAST]: 1, [LEARN]: 1, [NEVER]: 2 }, 7);
    const code = exportSaveCode(state, 1); if (!code.ok) throw Error('fixture');
    f.at(50000); f.wall(1000000); expect(f.game.importCode(code.code).ok).toBe(true);
    expect(f.game.getSnapshot().result.state).toEqual(state);
    expect(parseSave(f.raw())).toMatchObject({ ok: true, envelope: { savedAt: 1000000, state } });
    f.game.execute(performStarterJob); expect(f.game.getSnapshot().result.state).toEqual(unlockEligibleAchievements(performStarterJob(state).state).state);
    f.game.stop();
  });
});
describe('derived-cap durable offline bootstrap', () => {
  it.each([1, 2])('rank %i consumes one interval once and never changes permanent progression', rank => {
    const state = skillState({ [ROOT]: 3, [FAST]: 1, [LEARN]: 1, [NEVER]: rank });
    const initial = serializeSave(state, 1000); if (!initial.ok) throw Error('fixture'); let raw = initial.serialized;
    const now = 1000 + 14 * 3600000;
    const save = createLocalSave(() => ({ getItem: () => raw, setItem: (_key: string, value: string) => { raw = value; } }), () => now);
    const result = save.bootstrap(); const expected = simulateGameElapsed(state, getOfflineCapMs(state)).state;
    expect(result).toMatchObject({ kind: 'loaded', state: expected });
    expect(parseSave(raw)).toMatchObject({ ok: true, envelope: { savedAt: now, state: expected } });
    expect(save.bootstrap()).toMatchObject({ kind: 'loaded', state: expected, offline: { xpEarned: 0, incomeEarned: '0' } });
    expect(expected.permanentProgression).toEqual({...state.permanentProgression, unlockedAchievementIds: ['achievement:first-steps','achievement:first-rebirth']});
  });
  it('failed offline write or XP simulation never publishes candidate or overwrites original', () => {
    for (const overflow of [false, true]) {
      const base = skillState({ [ROOT]: 1, [LEARN]: 1, [NEVER]: 2 });
      const state = { ...base, progression: { xp: overflow ? Number.MAX_SAFE_INTEGER : 0 } };
      const encoded = serializeSave(state, 1000); if (!encoded.ok) throw Error('fixture'); let raw = encoded.serialized;
      const save = createLocalSave(() => ({ getItem: () => raw, setItem: (_key: string, value: string) => {
        if (!overflow) throw Error('quota'); raw = value;
      } }), () => 31000);
      const result = save.bootstrap(); expect(result).toMatchObject({ kind: 'offline-error', state }); expect(raw).toBe(encoded.serialized);
    }
  });
  it('future clock consumes zero while retaining cap, skills and permanent balances', () => {
    const state = skillState({ [NEVER]: 2, [LEARN]: 1 }); const encoded = serializeSave(state, 10000);
    if (!encoded.ok) throw Error('fixture'); let raw = encoded.serialized;
    const save = createLocalSave(() => ({ getItem: () => raw, setItem: (_key: string, value: string) => { raw = value; } }), () => 500);
    expect(save.bootstrap()).toMatchObject({ kind: 'loaded', state: unlockEligibleAchievements(state).state, offline: { clockAnomaly: true, rewardedElapsedMs: 0, capMs: 43200000 } });
  });
});
