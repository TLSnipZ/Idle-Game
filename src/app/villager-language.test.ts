import { describeTerritoryAcquisition } from './territory-presentation';
import { acquireTerritory } from '../game/acquire-territory';
import { createInitialGameState } from '../game/game-state';
import type { Locale } from './localization';
import { describe, expect, it, vi } from 'vitest';
import { isLocale, localeTag, translate } from './localization';
import { localize } from './LocalizationProvider';
import { villagerText } from './villager-language';
import { localizedContent } from './content-localization';
import { localizedUnlock } from './unlock-localization';
import { UPGRADE_CATALOG } from '../features/upgrades';
import { BUSINESS_CATALOG } from '../features/businesses';
import { createResetProgressControls } from './reset-progress-controls';
import { createRebirthControls } from './rebirth-controls';

describe('Villager presentation and localization audit regressions', () => {
  it.each<Locale>(['en', 'de', 'villager'])('reports the concrete missing territory gate in %s', locale => {
    const result = acquireTerritory(createInitialGameState(), 'territory:neon-mile');
    const message = describeTerritoryAcquisition(result, 'territory:neon-mile', locale);
    expect(message).toContain(locale === 'de' ? 'Spielerlevel 12' : 'Player Level 12');
    if (locale === 'villager') expect(message).toMatch(/^H[rm]+/);
  });
  it.each(['en', 'de', 'villager'])('accepts supported preference %s', value => expect(isLocale(value)).toBe(true));
  it.each(['fr', '', null, {}, 42])('rejects invalid preference %j', value => expect(isLocale(value)).toBe(false));
  it('keeps exact numbers, units and confirmation words with readable English glosses', () => {
    const source = 'Pay $25,000.00 · +10% · 12 XP · Type RESET?';
    const result = villagerText(source);
    expect(result).toMatch(/^H[rm]+\?/);
    expect(result).toContain(source);
    expect(villagerText(result)).toBe(result);
    expect(villagerText('')).toBe('');
  });
  it('translates both keyed and inline copy through the third locale', () => {
    expect(translate('villager', 'operationsLabel')).toBe(villagerText('OPERATIONS'));
    expect(localize('villager', 'Run delivery', 'Lieferung fahren')).toBe(villagerText('Run delivery'));
    expect(localize('de', 'Run delivery', 'Lieferung fahren')).toBe('Lieferung fahren');
  });
  it('keeps the language exit controls and valid numeric formatting', () => {
    expect(translate('villager', 'english')).toBe('English');
    expect(translate('villager', 'german')).toBe('Deutsch');
    expect(translate('villager', 'villager')).toBe('Villager · Hrrm');
    expect(new Intl.NumberFormat(localeTag('villager')).format(1234)).toBe('1,234');
  });
  it('adds Villager flavor without changing canonical car identity', () => {
    expect(localizedContent('villager', 'vehicle:kairo-kx-r', 'name', 'Kairo KX-R')).toBe('Kairo KX-R');
    expect(localizedContent('villager', 'vehicle:kairo-kx-r', 'description', 'Street hatch.')).toBe(villagerText('Street hatch.'));
  });
  it.each([...BUSINESS_CATALOG, ...UPGRADE_CATALOG])('resolves the actual unlock $id before translating', item => {
    expect(localizedUnlock(item.name, 'de')).toBe(localizedContent('de', item.id, 'name', item.name));
  });
  it('leaves unknown unlock identity intact instead of naming the first translated upgrade', () => {
    expect(localizedUnlock('Future content', 'de')).toBe('Future content');
  });
  it('updates New Game feedback locale without losing or submitting pending consent', () => {
    const reset = vi.fn(() => ({ ok: true as const }));
    const controls = createResetProgressControls(reset, () => {});
    controls.request(); controls.edit('RESET'); controls.setLocale('villager');
    expect(controls.getSnapshot()).toMatchObject({ confirming: true, confirmation: 'RESET' });
    expect(reset).not.toHaveBeenCalled();
    controls.cancel();
    expect(controls.getSnapshot().message).toBe(villagerText('New Game cancelled. Nothing was reset.'));
    expect(reset).not.toHaveBeenCalled();
  });
  it('updates Rebirth cancellation feedback without executing a Rebirth', () => {
    const rebirth = vi.fn(() => ({ ok: false as const, error: 'runtime-unavailable' as const }));
    const controls = createRebirthControls(rebirth, () => {});
    controls.request(); controls.setLocale('villager'); controls.cancel();
    expect(controls.getSnapshot().message).toBe(villagerText('Rebirth cancelled. Nothing was reset.'));
    expect(rebirth).not.toHaveBeenCalled();
  });
});
