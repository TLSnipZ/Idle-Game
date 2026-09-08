import { describe, expect, it } from 'vitest';
import { parseSave, serializeSave, CURRENT_SAVE_VERSION, validateSaveState } from './save-schema';
import { encodeSaveText, exportSaveCode, validateSaveCode } from './save-code';
import { rebirthState } from './test-fixtures/rebirth-state';
import { skillState, ROOT, FAST, LEARN, SILENT, NEVER } from './test-fixtures/skill-state';
import { SKILL_CATALOG } from '../features/skills';
function legacy() {
  const state = rebirthState(37, 48);
  return { format: 'crime-empire-save', version: 7, savedAt: 123456789,
    state: { ...state, permanentProgression: { empirePoints: 17, rebirthCount: 4 } } };
}
describe('shared v8 skill schema', () => {
  it('migrates realistic v7 by adding only empty skills; no EP spending, reset or timestamp change', () => {
    const old = legacy(), before = JSON.stringify(old);
    const result = parseSave(before);
    expect(CURRENT_SAVE_VERSION).toBe(8);
    expect(result).toEqual({ ok: true, envelope: { ...old, version: 8, state: { ...old.state,
      permanentProgression: { ...old.state.permanentProgression, skills: {} } } } });
    expect(validateSaveCode(encodeSaveText(before))).toEqual(result); expect(JSON.stringify(old)).toBe(before);
  });
  it('roundtrips all current fields, all max ranks and unspent EP through CE1', () => {
    const state = { ...rebirthState(), permanentProgression: skillState({ [ROOT]: 3, [FAST]: 2, [LEARN]: 2, [SILENT]: 2, [NEVER]: 2 }, 11).permanentProgression };
    const serialized = serializeSave(state, 42), exported = exportSaveCode(state, 42);
    if (!serialized.ok || !exported.ok) throw Error('fixture');
    expect(exported.code.startsWith('CE1-')).toBe(true);
    expect(parseSave(serialized.serialized)).toEqual({ ok: true, envelope: { format: 'crime-empire-save', version: 8, savedAt: 42, state } });
    expect(validateSaveCode(exported.code)).toEqual(parseSave(serialized.serialized));
    expect(serialized.serialized).not.toMatch(/capMs|nextCost|prerequisites|currentEffect|lifetime|skillPoints/);
  });
  it.each(SKILL_CATALOG)('accepts $id without checking acquisition prerequisites, rejects rank above its maximum', skill => {
    expect(validateSaveState(skillState({ [skill.id]: skill.maxRank }))).not.toBeNull();
    expect(validateSaveState(skillState({ [skill.id]: skill.maxRank + 1 }))).toBeNull();
  });
  it.each([null, [], 'skills', { 'skill:unknown': 1 }, { [ROOT]: 0 }, { [ROOT]: -1 }, { [ROOT]: .5 },
    { [ROOT]: Number.MAX_SAFE_INTEGER + 1 }, { [ROOT]: '1' }, { [ROOT]: NaN }, { [ROOT]: Infinity }])('rejects malformed current skills %#', skills => {
    const old = legacy();
    expect(parseSave(JSON.stringify({ ...old, version: 8, state: { ...old.state,
      permanentProgression: { ...old.state.permanentProgression, skills } } }))).toEqual({ ok: false, error: 'invalid-state' });
  });
  it('requires current skills but rejects smuggled skills in a legacy envelope and future versions', () => {
    const old = legacy();
    expect(parseSave(JSON.stringify({ ...old, version: 8 }))).toEqual({ ok: false, error: 'invalid-state' });
    expect(parseSave(JSON.stringify({ ...old, state: { ...old.state, permanentProgression: { ...old.state.permanentProgression, skills: {} } } }))).toEqual({ ok: false, error: 'invalid-state' });
    expect(parseSave(JSON.stringify({ ...old, version: 9 }))).toEqual({ ok: false, error: 'unsupported-version' });
  });
});
