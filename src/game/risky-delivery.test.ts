import { describe, expect, it } from 'vitest';
import { createInitialGameState } from './game-state';
import type { GameState } from './game-state';
import { performRiskyDelivery, performStarterJob } from './perform-starter-job';
import { selectRiskyDelivery } from './risky-delivery';
import { evaluateJobReward, evaluateRiskyJobReward, evaluateBusinessProduction } from './effective-stats';
import { moneyFromMinorUnits, MAX_MONEY_DIGITS } from '../features/economy';
import { parseSave, serializeSave } from './save-schema';
import { exportSaveCode, validateSaveCode } from './save-code';
import { FAST, ROOT } from './test-fixtures/skill-state';

function heated(heat: number, remainder = 0): GameState {
  const s = createInitialGameState();
  return { ...s, city: { ...s.city, heat, heatDecayElapsedMs: remainder } };
}
describe('Heat I: optional risk and reward', () => {
  it.each([0, 19, 20, 39, 40, 55, 59])('pays the preview exactly before adding five Heat at %i', heat => {
    const s = heated(heat, heat ? 12345 : 0), before = JSON.stringify(s);
    const preview = selectRiskyDelivery(s);
    const result = performRiskyDelivery(s);
    expect(preview.canRun).toBe(true);
    expect(result).toMatchObject({ ok: true, moneyEarned: '3750', xpEarned: 10 });
    expect(result.state.city).toMatchObject({ heat: heat + 5, heatDecayElapsedMs: s.city.heatDecayElapsedMs });
    expect(result.state.permanentProgression.statistics).toMatchObject({ manualJobsCompleted: 1, peakHeat: heat + 5 });
    expect(result.state.progression.xp).toBe(10);
    expect(JSON.stringify(s)).toBe(before);
    expect(preview.reward.ok && preview.reward.reward).toBe(result.ok && result.moneyEarned);
  });
  it.each([60, 79, 80, 99, 100])('rejects risk at %i without preventing ordinary work', heat => {
    const s = heated(heat, 12000);
    expect(performRiskyDelivery(s)).toEqual({ ok: false, state: s, error: 'too-hot' });
    expect(performRiskyDelivery(s).state).toBe(s);
    expect(selectRiskyDelivery(s).canRun).toBe(false);
    expect(performStarterJob(s).ok).toBe(true);
  });
  it('crosses HOT once and cannot farm the Heat cap', () => {
    const first = performRiskyDelivery(heated(59));
    expect(first.state.city.heat).toBe(64);
    expect(performRiskyDelivery(first.state).state).toBe(first.state);
    expect(performStarterJob(first.state)).toMatchObject({ ok: true, moneyEarned: '2250' });
  });
  it('applies all manual modifiers before a single final cent floor', () => {
    const s = heated(20);
    const state: GameState = { ...s,
      upgrades: { purchasedIds: ['upgrade:express-tips', 'upgrade:street-connections'] },
      garage: { ownedVehicleIds: ['vehicle:kairo-senda'], activeVehicleId: 'vehicle:kairo-senda' },
      permanentProgression: { ...s.permanentProgression, skills: { [ROOT]: 1, [FAST]: 1 } } };
    // ($25 + $5) × 1.2 × 1.12 × 1.1 × 1.5 = $66.528, not $66.51.
    expect(performRiskyDelivery(state)).toMatchObject({ ok: true, moneyEarned: '6652' });
    expect(evaluateJobReward(state)).toMatchObject({ ok: true, reward: '4435' });
    expect(evaluateJobReward(state, 'dispatcher')).toMatchObject({ ok: true, reward: '3960' });
    expect(evaluateRiskyJobReward(state).ok).toBe(true);
    const production = evaluateBusinessProduction(state, 'business:dockside-detail', 1);
    expect(evaluateBusinessProduction(performRiskyDelivery(state).state, 'business:dockside-detail', 1)).toEqual(production);
  });
  it.each(['cash', 'xp', 'statistics'] as const)('%s overflow preserves the entire original state', field => {
    const s = heated(59);
    const state: GameState = field === 'cash' ? { ...s, economy: { cash: moneyFromMinorUnits('9'.repeat(MAX_MONEY_DIGITS)) } }
      : field === 'xp' ? { ...s, progression: { xp: Number.MAX_SAFE_INTEGER } }
      : { ...s, permanentProgression: { ...s.permanentProgression, statistics: { ...s.permanentProgression.statistics, manualJobsCompleted: Number.MAX_SAFE_INTEGER } } };
    const result = performRiskyDelivery(state);
    expect(result.ok).toBe(false); expect(result.state).toBe(state);
  });
  it.each([-1, 101, NaN, 1.5])('fails loudly for invalid Heat %s', heat => {
    expect(() => performRiskyDelivery(heated(heat))).toThrow(RangeError);
  });
  it('round-trips the result through the existing v19 save and CE1 boundaries', () => {
    const state = performRiskyDelivery(heated(59, 23456)).state;
    const saved = serializeSave(state, 1000);
    if (!saved.ok) throw Error('save');
    const parsed = parseSave(saved.serialized);
    expect(parsed.ok && parsed.envelope.state).toEqual(state);
    const code = exportSaveCode(state, 1000);
    if (!code.ok) throw Error('code');
    const imported = validateSaveCode(code.code);
    expect(imported.ok && imported.envelope.state).toEqual(state);
  });
});
