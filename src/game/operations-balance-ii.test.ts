import { describe, expect, it } from 'vitest';
import { STARTER_JOB } from '../features/economy';
import { createInitialGameState } from './game-state';
import { evaluateDeliveryRewardBase, evaluateJobReward } from './effective-stats';
import { performDiscreetDelivery, performRiskyDelivery, performStarterJob } from './perform-starter-job';
import { isManualJobReady, MANUAL_JOB_INTERVAL_MS, manualJobRemainingMs } from './manual-job-readiness';
import { simulateGameElapsed } from './simulate-game-elapsed';
import { CURRENT_SAVE_VERSION, SAVE_FORMAT, migrateToCurrentSave, parseSave, serializeSave } from './save-schema';
import { exportSaveCode, validateSaveCode } from './save-code';
import { performRebirth } from './rebirth';
import { rebirthState } from './test-fixtures/rebirth-state';

describe('Operations Balance II — portfolio-paced rewards and shared readiness', () => {
  function portfolio() {
    const state = createInitialGameState();
    return { ...state, businesses: { ...state.businesses, owned: {
      'business:dockside-detail': { level: 7 },
      'business:neon-laundry': { level: 10 },
      'business:afterdark-customs': { level: 1 },
    } } };
  }

  it('starts a new game ready and retains the $25 floor before the portfolio can beat it', () => {
    const fresh = createInitialGameState();
    expect(isManualJobReady(fresh.manualJobs)).toBe(true);
    expect(manualJobRemainingMs(fresh.manualJobs)).toBe(0);
    expect(evaluateDeliveryRewardBase(fresh, 'manual')).toEqual({ ok: true, base: STARTER_JOB.reward });
    expect(evaluateDeliveryRewardBase(fresh, 'dispatcher')).toEqual({ ok: true, base: STARTER_JOB.reward });
  });

  it('uses owned unmodified Business production for separate manual and Dispatcher bases', () => {
    const state = portfolio(); // P = 7*$0.75 + 10*$5 + 1*$15 = $70.25/s.
    expect(evaluateDeliveryRewardBase(state, 'manual')).toEqual({ ok: true, base: '56200' });
    expect(evaluateDeliveryRewardBase(state, 'dispatcher')).toEqual({ ok: true, base: '7025' });
    const reward = evaluateJobReward(state);
    expect(reward.ok && reward.base).toBe('56200');
  });

  it('consumes one shared slot only after a successful manual action', () => {
    const fresh = createInitialGameState();
    const coldFailure = performDiscreetDelivery(fresh);
    expect(coldFailure).toMatchObject({ ok: false, error: 'already-cold' });
    expect(coldFailure.state.manualJobs.elapsedMs).toBe(MANUAL_JOB_INTERVAL_MS);

    const first = performStarterJob(fresh);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.state.manualJobs.elapsedMs).toBe(0);
    const second = performRiskyDelivery(first.state);
    expect(second).toMatchObject({ ok: false, error: 'manual-job-not-ready', remainingMs: MANUAL_JOB_INTERVAL_MS });
    expect(second.state).toBe(first.state);
  });

  it('restores readiness from elapsed time without banking multiple manual jobs', () => {
    const first = performStarterJob(createInitialGameState());
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const almost = simulateGameElapsed(first.state, MANUAL_JOB_INTERVAL_MS - 1);
    expect(almost.ok).toBe(true);
    if (!almost.ok) return;
    expect(manualJobRemainingMs(almost.state.manualJobs)).toBe(1);
    const ready = simulateGameElapsed(almost.state, 60_000);
    expect(ready.ok).toBe(true);
    if (!ready.ok) return;
    expect(ready.state.manualJobs.elapsedMs).toBe(MANUAL_JOB_INTERVAL_MS);
    const one = performStarterJob(ready.state);
    expect(one.ok).toBe(true);
    if (!one.ok) return;
    expect(performStarterJob(one.state)).toMatchObject({ ok: false, error: 'manual-job-not-ready' });
  });

  it('migrates v26 saves ready without grants and strictly validates the v27 timer', () => {
    const current = createInitialGameState();
    const { manualJobs: _manualJobs, ...v26 } = current;
    const migrated = migrateToCurrentSave({ format: SAVE_FORMAT, version: 26, savedAt: 1234, state: v26 });
    expect(migrated.ok).toBe(true);
    if (!migrated.ok) return;
    expect(migrated.envelope.version).toBe(CURRENT_SAVE_VERSION);
    expect(migrated.envelope.state.economy).toEqual(current.economy);
    expect(migrated.envelope.state.progression).toEqual(current.progression);
    expect(migrated.envelope.state.manualJobs).toEqual({ elapsedMs: MANUAL_JOB_INTERVAL_MS });

    const invalid = { ...migrated.envelope.state, manualJobs: { elapsedMs: MANUAL_JOB_INTERVAL_MS + 1 } };
    expect(migrateToCurrentSave({ format: SAVE_FORMAT, version: CURRENT_SAVE_VERSION, savedAt: 1234, state: invalid }))
      .toEqual({ ok: false, error: 'invalid-state' });
  });

  it('round-trips a pending delay through JSON and CE1 export/import', () => {
    const first = performStarterJob(createInitialGameState());
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const progressed = simulateGameElapsed(first.state, 4000);
    expect(progressed.ok).toBe(true);
    if (!progressed.ok) return;
    const saved = serializeSave(progressed.state, 5000);
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    const parsed = parseSave(saved.serialized);
    expect(parsed.ok && parsed.envelope.state.manualJobs.elapsedMs).toBe(4000);
    const code = exportSaveCode(progressed.state, 5000);
    expect(code.ok).toBe(true);
    if (!code.ok) return;
    const imported = validateSaveCode(code.code);
    expect(imported.ok && imported.envelope.state.manualJobs.elapsedMs).toBe(4000);
  });

  it('retains a pending manual delay through Rebirth instead of manufacturing readiness', () => {
    const eligible = { ...rebirthState(), manualJobs: { elapsedMs: 2750 } };
    const rebirth = performRebirth(eligible);
    expect(rebirth.ok).toBe(true);
    if (!rebirth.ok) return;
    expect(rebirth.state.manualJobs).toEqual({ elapsedMs: 2750 });
    expect(rebirth.state.businesses.owned).toEqual({});
    expect(evaluateDeliveryRewardBase(rebirth.state, 'manual')).toEqual({ ok: true, base: STARTER_JOB.reward });
  });
});
