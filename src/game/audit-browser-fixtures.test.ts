import { writeFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { createInitialGameState } from './game-state';
import { resetProgressState } from './test-fixtures/reset-progress-state';
import { serializeSave, parseSave } from './save-schema';
import { moneyFromMinorUnits } from '../features/economy';
import { getXpThresholdForLevel } from '../features/progression';

it('validates fresh, midgame and late-game production audit fixtures', () => {
  const fresh = createInitialGameState();
  const mid = { ...fresh, economy: { cash: moneyFromMinorUnits('3000000') },
    progression: { xp: getXpThresholdForLevel(5) },
    businesses: { ...fresh.businesses, owned: { 'business:dockside-detail': { level: 5 } } } };
  const fixtures = [fresh, mid, resetProgressState()].map(state => {
    const encoded = serializeSave(state, 1000);
    expect(encoded.ok).toBe(true);
    if (!encoded.ok) throw Error('Invalid audit fixture');
    const decoded = parseSave(encoded.serialized);
    expect(decoded.ok).toBe(true);
    return JSON.parse(encoded.serialized) as unknown;
  });
  if (process.env.SOLARA_AUDIT_FIXTURES) writeFileSync(process.env.SOLARA_AUDIT_FIXTURES, JSON.stringify(fixtures));
});
