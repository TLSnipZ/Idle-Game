/** POST 2A counterfactual analysis only; never imported by production.
 * Reuses the Phase 9C purchase policies and real domain arithmetic. The Vortex scenario explicitly mocks historical balance; current KX-R config
 * remains authoritative outside this isolated counterfactual.
 */
import { afterEach, expect, it, vi } from 'vitest';
import type { GameState } from './game-state';
import type { PlayerModel } from './test-fixtures/balance-model';

afterEach(() => {
  vi.doUnmock('../features/vehicles');
  vi.doUnmock('./purchase-vehicle');
  vi.resetModules();
});

it.each<PlayerModel>(['active', 'optimized', 'idle-leaning'])('%s: compares first-car investment without changing live config', async model => {
  const rows = [];
  for (const scenario of ['none', 'vortex', 'kx-r'] as const) {
    vi.doUnmock('../features/vehicles');
    vi.doUnmock('./purchase-vehicle');
    vi.resetModules();
    if (scenario === 'none') {
      // This policy declines the optional vehicle purchase; no cash is fabricated.
      vi.doMock('./purchase-vehicle', () => ({ purchaseVehicle: (state: GameState) =>
        ({ ok: false, state, error: 'already-owned' }) }));
    }
    if (scenario === 'vortex') {
      vi.doMock('../features/vehicles', async () => {
        const actual = await vi.importActual<typeof import('../features/vehicles')>('../features/vehicles');
        const { moneyFromMinorUnits } = await import('../features/economy');
        const { STARTER_BUSINESS } = await import('../features/businesses');
        if (actual.STARTER_VEHICLE.modifier.operation !== 'multiply-basis-points')
          throw new Error('Analysis expects the live percentage vehicle modifier');
        const vehicle: typeof actual.STARTER_VEHICLE = {
          ...actual.STARTER_VEHICLE, name: 'Vortex S9', purchaseCost: moneyFromMinorUnits('5000000'),
          requirements: [{ type: 'player-level', minimumLevel: 7 },
            { type: 'business-level', businessId: STARTER_BUSINESS.id, minimumLevel: 10 }],
          modifier: { ...actual.STARTER_VEHICLE.modifier, bonusBasisPoints: 1500 },
        };
        return { ...actual, STARTER_VEHICLE: vehicle, VEHICLE_CATALOG: [vehicle],
          findVehicle: (id: unknown) => id === vehicle.id ? vehicle : undefined };
      });
    }
    const { runBalanceModel } = await import('./test-fixtures/balance-model');
    const { STARTER_VEHICLE } = await import('../features/vehicles');
    const { selectRebirth, performRebirth } = await import('./rebirth');
    const result = runBalanceModel(model);
    expect(selectRebirth(result.firstRebirth).reward).toBe(4);
    const reset = performRebirth(result.firstRebirth);
    expect(reset.ok).toBe(true);
    expect(reset.state.garage).toEqual(result.firstRebirth.garage);
    expect(result.firstRebirth.garage.ownedVehicleIds.length).toBe(scenario === 'none' ? 0 : 1);
    const purchase = result.checkpoints[STARTER_VEHICLE.name];
    const dispatcher = result.checkpoints['Delivery Dispatcher'];
    expect(dispatcher).toBeDefined();
    if (purchase) expect(purchase.seconds).toBeGreaterThanOrEqual(dispatcher?.seconds ?? Infinity);
    rows.push({ scenario, dispatcher: dispatcher?.seconds,
      eligible: result.checkpoints[`${STARTER_VEHICLE.name} eligible`]?.seconds,
      purchase: purchase?.seconds ?? null, docksideAtPurchase: purchase?.dockside ?? null,
      rebirth: result.checkpoints['Rebirth eligible']?.seconds });
  }
  const live = await vi.importActual<typeof import('../features/vehicles')>('../features/vehicles');
  expect(live.STARTER_VEHICLE.purchaseCost).toBe('2500000');
  expect(live.STARTER_VEHICLE.modifier).toMatchObject({ operation: 'multiply-basis-points', bonusBasisPoints: 1000 });
  console.info('POST 2A modeled seconds', model, JSON.stringify(rows));
}, 60_000);
