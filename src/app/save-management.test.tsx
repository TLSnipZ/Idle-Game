import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createInitialGameState } from '../game/game-state';
import { exportSaveCode } from '../game/save-code';
import { copySaveCode } from '../platform/clipboard';
import { createSaveManagement } from './save-management';
import { SaveManagementView } from './SaveManagement';

function fixture(copied = true) {
  const exported = exportSaveCode(createInitialGameState(), 42);
  if (!exported.ok) throw Error('fixture');
  const actions = { exportCode: vi.fn(() => exported), importCode: vi.fn(() => ({ ok: true as const })) };
  const copy = vi.fn(async () => copied);
  const controls = createSaveManagement(actions, vi.fn(), copy);
  return { actions, controls, copy, code: exported.code };
}
describe('save management interaction', () => {
  it('exposes the exported code with selectable, labelled output', () => {
    const f = fixture(); f.controls.exportCode();
    expect(f.controls.getSnapshot().exported).toBe(f.code);
    const html = renderToStaticMarkup(<SaveManagementView state={f.controls.getSnapshot()} controls={f.controls} />);
    expect(html).toContain('Your exported save code');
    expect(html).toMatch(/readonly/i);
    expect(html).toContain(f.code);
    expect(html).toContain('role="status"');
    expect(html).toContain('for="import-code"');
  });
  it.each([true, false])('clipboard result %s retains the exported code', async copied => {
    const f = fixture(copied); f.controls.exportCode(); await f.controls.copyCode();
    expect(f.copy).toHaveBeenCalledWith(f.code);
    expect(f.controls.getSnapshot().exported).toBe(f.code);
    expect(f.controls.getSnapshot().message).toContain(copied ? 'copied' : 'manually');
  });
  it('invalid input cannot reach confirmation or apply', () => {
    const f = fixture(); f.controls.edit('bad'); f.controls.validate(); f.controls.confirm();
    expect(f.controls.getSnapshot().confirming).toBe(false);
    expect(f.actions.importCode).not.toHaveBeenCalled();
  });
  it('valid input requires explicit confirmation and cancel preserves progress', () => {
    const f = fixture(); f.controls.edit(f.code); f.controls.validate();
    expect(f.actions.importCode).not.toHaveBeenCalled();
    expect(f.controls.getSnapshot().confirming).toBe(true);
    const html = renderToStaticMarkup(<SaveManagementView state={f.controls.getSnapshot()} controls={f.controls} />);
    expect(html).toContain('Confirm import'); expect(html).toContain('Cancel');
    expect(html).toContain('aria-labelledby="import-warning"');
    f.controls.cancel(); f.controls.confirm();
    expect(f.actions.importCode).not.toHaveBeenCalled();
  });
  it('confirms the validated code once and reports the updated save', () => {
    const f = fixture(); f.controls.edit(f.code); f.controls.validate(); f.controls.confirm(); f.controls.confirm();
    expect(f.actions.importCode).toHaveBeenCalledExactlyOnceWith(f.code);
    expect(f.controls.getSnapshot().message).toContain('imported and stored');
    expect(f.controls.getSnapshot().confirming).toBe(false);
  });
  it('editing invalidates a pending candidate', () => {
    const f = fixture(); f.controls.edit(f.code); f.controls.validate(); f.controls.edit('bad'); f.controls.confirm();
    expect(f.actions.importCode).not.toHaveBeenCalled();
  });
  it('reports persistence failure without claiming success', () => {
    const f = fixture();
    const controls = createSaveManagement({ ...f.actions, importCode: () => ({ ok: false, error: 'persistence-failure' }) }, vi.fn());
    controls.edit(f.code); controls.validate(); controls.confirm();
    expect(controls.getSnapshot().message).toContain('not replaced');
  });
  it('platform clipboard wrapper handles success and rejection', async () => {
    expect(await copySaveCode('code', async text => { expect(text).toBe('code'); })).toBe(true);
    expect(await copySaveCode('code', async () => { throw Error('denied'); })).toBe(false);
  });
});
