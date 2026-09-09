import { describe, expect, it } from 'vitest';
import { CURRENT_SAVE_VERSION, parseSave, serializeSave, validateSaveState } from './save-schema';
import { encodeSaveText, exportSaveCode, validateSaveCode } from './save-code';
import { rebirthState } from './test-fixtures/rebirth-state';
import { territoryState } from './test-fixtures/territory-state';
import { ROOT, FAST, LEARN, SILENT, NEVER } from './test-fixtures/skill-state';
import { STARTER_BUSINESS } from '../features/businesses';
import { WATERFRONT, NEON_MILE } from '../features/territories';

function rich() {
  const base = rebirthState(37,48);
  return { ...base, city: { ...territoryState(true).city, heat: 70, heatDecayElapsedMs: 45000 },
    permanentProgression: { unlockedAchievementIds: [], empirePoints: 17, rebirthCount: 4,
      skills: { [ROOT]: 3, [FAST]: 2, [LEARN]: 1, [SILENT]: 2, [NEVER]: 2 } } };
}
function envelope(state: unknown, version = CURRENT_SAVE_VERSION) {
  return { format: 'crime-empire-save', version, savedAt: 123456789, state };
}
describe('v10 Heat migration and portable validation', () => {
  it('v9 migration only adds zero Heat/progress and preserves every existing value', () => {
    const { events, crew, ...current } = rich(); const old = { ...current, city: { ownedTerritoryIds: current.city.ownedTerritoryIds } };
    const { unlockedAchievementIds: _ids, ...permanentProgression } = old.permanentProgression;
    const legacyState = { ...old, permanentProgression };
    const raw = JSON.stringify(envelope(legacyState,9)); const parsed = parseSave(raw);
    expect(CURRENT_SAVE_VERSION).toBe(13);
    expect(parsed).toEqual({ ok: true, envelope: envelope({ ...old, events, crew, city: { ...old.city, heat: 0, heatDecayElapsedMs: 0 } }) });
    if (!parsed.ok) throw Error('fixture');
    const { events: _events, crew: _crew, city, ...previous } = parsed.envelope.state; const { city: oldCity, ...before } = old;
    expect(previous).toEqual(before); expect(city.ownedTerritoryIds).toEqual(oldCity.ownedTerritoryIds);
    expect(city.heat).toBe(0); expect(city.heatDecayElapsedMs).toBe(0); expect(parsed.envelope.savedAt).toBe(123456789);
    expect(JSON.stringify(envelope(legacyState,9))).toBe(raw); expect(validateSaveCode(encodeSaveText(raw))).toEqual(parsed);
  });
  it.each([1,2,3,4,5,6,7,8,9])('old CE1 v%i migrates through the sequential boundary with zero Heat', version => {
    const s = rich(); const state = { economy: s.economy,
      businesses: version === 1 ? { ownedIds: [STARTER_BUSINESS.id], productionRemainderMilliCents: 975 }
        : { owned: s.businesses.owned, productionRemainderMilliCents: 975, ...(version >= 3 ? { productionRemainderSubMilliCents: s.businesses.productionRemainderSubMilliCents } : {}) },
      ...(version >= 3 ? { upgrades: s.upgrades } : {}), ...(version >= 4 ? { automation: s.automation } : {}),
      ...(version >= 5 ? { progression: s.progression } : {}), ...(version >= 6 ? { garage: s.garage } : {}),
      ...(version >= 7 ? { permanentProgression: { empirePoints: 17, rebirthCount: 4, ...(version >= 8 ? { skills: s.permanentProgression.skills } : {}) } } : {}),
      ...(version >= 9 ? { city: { ownedTerritoryIds: s.city.ownedTerritoryIds } } : {}) };
    const code = encodeSaveText(JSON.stringify(envelope(state,version))); expect(code.startsWith('CE1-')).toBe(true);
    expect(validateSaveCode(code)).toMatchObject({ ok: true, envelope: { version: 13, savedAt: 123456789,
      state: { economy: s.economy, city: { heat: 0, heatDecayElapsedMs: 0, ownedTerritoryIds: version === 9 ? [WATERFRONT.id,NEON_MILE.id] : [WATERFRONT.id] } } } });
  });
  it.each([[0,0],[1,0],[59,59999],[100,59999],[70,45000]])('v10 roundtrips Heat %i / remainder %i exactly', (heat,heatDecayElapsedMs) => {
    const base=rich(), state={ ...base,city:{...base.city,heat,heatDecayElapsedMs} };
    const raw=serializeSave(state,123456789),code=exportSaveCode(state,123456789);if(!raw.ok||!code.ok)throw Error('fixture');
    expect(parseSave(raw.serialized)).toEqual({ok:true,envelope:envelope(state)});
    expect(validateSaveCode(code.code)).toEqual(parseSave(raw.serialized));
    expect(raw.serialized).not.toMatch(/heatTier|heatModifier|heatPercentage|jobsTowardHeat/);
  });
  it.each([-1,101,.5,Number.MAX_SAFE_INTEGER+1,NaN,Infinity,'70',null,undefined])('rejects malformed Heat %s', heat => {
    const s=rich();const state={...s,city:{...s.city,heat}};
    expect(validateSaveState(state)).toBeNull();expect(parseSave(JSON.stringify(envelope(state)))).toEqual({ok:false,error:'invalid-state'});
  });
  it.each([-1,.5,60000,Number.MAX_SAFE_INTEGER+1,NaN,Infinity,'45000',null,undefined])('rejects malformed decay progress %s', heatDecayElapsedMs => {
    const s=rich();const state={...s,city:{...s.city,heatDecayElapsedMs}};
    expect(validateSaveState(state)).toBeNull();expect(validateSaveCode(encodeSaveText(JSON.stringify(envelope(state))))).toEqual({ok:false,error:'invalid-state'});
  });
  it('rejects banked cooling, accessors, missing fields and malformed city without repair', () => {
    const s=rich();
    for(const city of [null,[],{}, {ownedTerritoryIds:s.city.ownedTerritoryIds}, { ...s.city, heat:0 }, { ...s.city, extra:1 },
      { ...s.city, get heat() { throw Error('must not execute'); } }, { ...s.city, ownedTerritoryIds: [NEON_MILE.id] }]) {
      expect(validateSaveState({...s,city})).toBeNull();
    }
    expect(parseSave(JSON.stringify(envelope(s,14)))).toEqual({ok:false,error:'unsupported-version'});
    expect(parseSave(JSON.stringify(envelope(s,9)))).toEqual({ok:false,error:'invalid-state'});
  });
});
