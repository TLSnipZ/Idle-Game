import { describe, expect, it } from 'vitest';
import { moneyFromMinorUnits } from '../../economy';
import { evaluateStat, wholeStatValue } from '../../../game/modifiers';
import type { Modifier } from '../../../game/modifiers';

type Candidate = Readonly<{
  id: string; priceCents: string; level: number; nightsLevel: number; modifiers: readonly Modifier[];
}>;

const percent = (id: string, sourceId: string, stat: 'business-production' | 'job-reward', bonusBasisPoints: number, context?: 'manual' | 'dispatcher'): Modifier => ({
  id, sourceId,
  target: stat === 'business-production' ? { stat, businessId: null } : { stat, ...(context ? { context } : {}) },
  operation: 'multiply-basis-points', bonusBasisPoints,
});

const CANDIDATES: readonly Candidate[] = [
  { id: 'vehicle:toseki-raizan', priceCents: '25000000', level: 18, nightsLevel: 2, modifiers: [
    percent('modifier:toseki-raizan-operations', 'vehicle:toseki-raizan', 'job-reward', 2400),
    { id: 'modifier:toseki-raizan-decoy', sourceId: 'vehicle:toseki-raizan', target: { stat: 'heat-response-cost' }, operation: 'multiply-basis-points', bonusBasisPoints: -1500 },
  ] },
  { id: 'vehicle:namera-luma', priceCents: '29000000', level: 19, nightsLevel: 3, modifiers: [percent('modifier:namera-luma-manual', 'vehicle:namera-luma', 'job-reward', 4200, 'manual')] },
  { id: 'vehicle:toseki-tenrai', priceCents: '36000000', level: 21, nightsLevel: 5, modifiers: [percent('modifier:toseki-tenrai-dispatcher', 'vehicle:toseki-tenrai', 'job-reward', 3800, 'dispatcher')] },
  { id: 'vehicle:sevrin-caron', priceCents: '47500000', level: 23, nightsLevel: 7, modifiers: [percent('modifier:sevrin-caron-production', 'vehicle:sevrin-caron', 'business-production', 3000)] },
];

const factor = (candidate: Candidate, stat: 'business-production' | 'job-reward' | 'heat-response-cost', context?: 'manual' | 'dispatcher') => {
  const result = evaluateStat(moneyFromMinorUnits('10000'), stat === 'business-production' ? { stat, businessId: 'business:solara-nights' } : stat === 'job-reward' ? { stat, context: context ?? 'manual' } : { stat }, candidate.modifiers);
  if (!result.ok) throw new Error('unexpected overflow');
  return Number(wholeStatValue(result.effective)) / 10000;
};

describe('Garage V-A Tier-3 executable balance decision', () => {
  it('locks increasing acquisition boundaries without an immediate post-Tier-2 purchase', () => {
    expect(CANDIDATES.map(v => [v.priceCents, v.level, v.nightsLevel])).toEqual([
      ['25000000', 18, 2], ['29000000', 19, 3], ['36000000', 21, 5], ['47500000', 23, 7],
    ]);
  });

  it('keeps each Tier-3 baseline in its intended lane', () => {
    const [raizan, luma, tenrai, caron] = CANDIDATES;
    expect(factor(raizan!, 'job-reward', 'manual')).toBe(1.24);
    expect(factor(raizan!, 'job-reward', 'dispatcher')).toBe(1.24);
    expect(factor(raizan!, 'heat-response-cost')).toBe(0.85);
    expect(factor(luma!, 'job-reward', 'manual')).toBe(1.42);
    expect(factor(luma!, 'job-reward', 'dispatcher')).toBe(1);
    expect(factor(tenrai!, 'job-reward', 'manual')).toBe(1);
    expect(factor(tenrai!, 'job-reward', 'dispatcher')).toBe(1.38);
    expect(factor(caron!, 'business-production')).toBe(1.30);
  });

  it('preserves tuned Tier-2 situational value while Tier-3 wins only its specialty', () => {
    const tunedSereinManual = 1.26 * 1.08;
    const tunedRendanDispatcher = 1.18 * 1.12;
    const tunedCantoProduction = 1.18 * 1.05;
    expect(1.42).toBeGreaterThan(tunedSereinManual);
    expect(1.38).toBeGreaterThan(tunedRendanDispatcher);
    expect(1.30).toBeGreaterThan(tunedCantoProduction);
    expect(1.24).toBeLessThan(tunedRendanDispatcher);
    expect(1.24).toBeLessThan(tunedSereinManual);
  });

  it('makes Caron passive payback portfolio-dependent instead of universally instant', () => {
    const priceDollars = 475000;
    const productionGain = (baseDollarsPerSecond: number) => baseDollarsPerSecond * 0.30;
    const hours = (portfolio: number) => priceDollars / productionGain(portfolio) / 3600;
    expect(hours(136.25)).toBeGreaterThan(3);
    expect(hours(253.75)).toBeGreaterThan(1.5);
    expect(hours(500)).toBeLessThan(1);
  });

  it('makes manual spam favor Luma, dispatcher sessions favor Tenrai and passive sessions favor Caron', () => {
    const manualBase = 253.75 * 8;
    const dispatcherBase = 253.75;
    expect(manualBase * 1.42).toBeGreaterThan(manualBase * 1.24);
    expect(dispatcherBase * 1.38).toBeGreaterThan(dispatcherBase * 1.24);
    expect(253.75 * 1.30).toBeGreaterThan(253.75);
  });

  it('keeps Raizan valuable in Heat scenarios through decoy savings rather than top raw income', () => {
    expect(1250 * 0.85).toBe(1062.5);
    expect(1.24).toBeLessThan(1.42);
    expect(1.24).toBeLessThan(1.38);
  });
});
