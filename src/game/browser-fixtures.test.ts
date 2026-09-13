import { writeFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { createInitialGameState } from './game-state';
import { moneyFromMinorUnits } from '../features/economy';
import { STARTER_VEHICLE } from '../features/vehicles';
import { STARTER_BUSINESS } from '../features/businesses';
import { getXpThresholdForLevel } from '../features/progression';
import { migrateToCurrentSave } from './save-schema';

it('production-browser v17 fixtures migrate with unchanged ownership, cash and acquisition readiness', () => {
  const fresh = createInitialGameState();
  const state = { ...fresh, economy: { cash: moneyFromMinorUnits('3000000') },
    progression: { xp: getXpThresholdForLevel(5) },
    businesses: { ...fresh.businesses, owned: { [STARTER_BUSINESS.id]: { level: 5 } } } };
  const fixtures = [false, true].map(owner => ({
    format: 'crime-empire-save', version: 17, savedAt: 1000,
    state: { ...state, garage: { ownedVehicleIds: owner ? [STARTER_VEHICLE.id] : [] } },
  }));
  for (const fixture of fixtures) {
    const result = migrateToCurrentSave(fixture);
    expect(result).toMatchObject({ ok: true, envelope: { version: 20, state: {
      economy: state.economy, garage: { ...fixture.state.garage,
        activeVehicleId: fixture.state.garage.ownedVehicleIds[0] ?? null },
    } } });
  }
  const tierOne = { format: 'crime-empire-save', version: 20, savedAt: 1000, state: {
    ...fresh, economy: { cash: moneyFromMinorUnits('20000000') }, progression: { xp: getXpThresholdForLevel(7) },
    businesses: { ...fresh.businesses, owned: { [STARTER_BUSINESS.id]: { level: 8 } } },
  } };
  expect(migrateToCurrentSave(tierOne)).toMatchObject({ ok: true, envelope: tierOne });
  if (process.env.SOLARA_BROWSER_FIXTURES) writeFileSync(process.env.SOLARA_BROWSER_FIXTURES, JSON.stringify([...fixtures, tierOne]));
});
