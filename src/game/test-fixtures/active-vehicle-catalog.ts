import { vi } from 'vitest';

/** A second car exists only in these tests, never in the shipped catalog. */
vi.mock('../../features/vehicles/config/vehicle-config', async importOriginal => {
  const actual = await importOriginal<typeof import('../../features/vehicles/config/vehicle-config')>();
  const second = { ...actual.STARTER_VEHICLE, id: 'vehicle:test-coupe' as const,
    name: 'Test Coupe', model: 'Test Coupe', requirements: [],
    modifier: { ...actual.STARTER_VEHICLE.modifier, id: 'modifier:test-coupe',
      sourceId: 'vehicle:test-coupe', bonusBasisPoints: 2500 } };
  const catalog = [...actual.VEHICLE_CATALOG, second];
  return { ...actual, VEHICLE_CATALOG: catalog,
    findVehicle: (id: unknown) => catalog.find(vehicle => vehicle.id === id) };
});
