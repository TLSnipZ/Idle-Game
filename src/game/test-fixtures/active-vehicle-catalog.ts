import { vi } from 'vitest';

/** Isolated two-production-car catalog for equal/different-rate boundary tests. */
vi.mock('../../features/vehicles/config/vehicle-config', async importOriginal => {
  const actual = await importOriginal<typeof import('../../features/vehicles/config/vehicle-config')>();
  const base = actual.STARTER_VEHICLE.modifiers[0];
  if (base?.operation !== 'multiply-basis-points') throw Error('Expected production modifier');
  const second = { ...actual.STARTER_VEHICLE, id: 'vehicle:test-coupe' as const,
    name: 'Test Coupe', model: 'Test Coupe', requirements: [],
    modifiers: [{ ...base, id: 'modifier:test-coupe',
      sourceId: 'vehicle:test-coupe', bonusBasisPoints: 2500 }] };
  const catalog = [actual.STARTER_VEHICLE, second];
  return { ...actual, VEHICLE_CATALOG: catalog,
    findVehicle: (id: unknown) => catalog.find(vehicle => vehicle.id === id) };
});
