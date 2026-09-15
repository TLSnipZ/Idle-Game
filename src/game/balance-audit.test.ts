import { describe, expect, it } from 'vitest';
import { TERRITORY_CATALOG } from '../features/territories';
import { CREW_CATALOG } from '../features/crew';
import { EVENT_CATALOG } from '../features/events';
import { ACHIEVEMENT_CATALOG } from '../features/achievements';
import { createInitialStatistics } from '../features/statistics';
import { VEHICLE_CATALOG } from '../features/vehicles';
import { UPGRADE_CATALOG } from '../features/upgrades';
import { SKILL_CATALOG } from '../features/skills';
import { AUTOMATIONS } from '../features/automation';
import { CURRENT_SAVE_VERSION } from './save-schema';

describe('current balance/catalog audit', () => {
  it('retains the published catalogs including Garage V-B Raizan', () => {
    expect([TERRITORY_CATALOG.length, CREW_CATALOG.length, EVENT_CATALOG.length, ACHIEVEMENT_CATALOG.length,
      Object.keys(createInitialStatistics()).length, VEHICLE_CATALOG.length, UPGRADE_CATALOG.length, SKILL_CATALOG.length])
      .toEqual([2,3,3,6,8,7,5,5]);
    expect(VEHICLE_CATALOG.map(vehicle => vehicle.id)).toContain('vehicle:toseki-raizan');
    expect(AUTOMATIONS).toHaveLength(2);
  });
  it('keeps the current durable save boundary', () => { expect(CURRENT_SAVE_VERSION).toBe(27); });
});
