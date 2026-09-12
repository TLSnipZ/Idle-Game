import { describe, expect, it, vi } from 'vitest';
import { createResetProgressControls, INITIAL_RESET_PROGRESS } from './reset-progress-controls';
import { createSaveManagement, INITIAL_SAVE_MANAGEMENT } from './save-management';
import { createRebirthControls, INITIAL_REBIRTH_CONTROLS } from './rebirth-controls';
import { createInitialGameState } from '../game/game-state';
import { exportSaveCode } from '../game/save-code';

function fixture() {
  const reset = vi.fn(() => ({ ok: true as const }));
  return { reset, controls: createResetProgressControls(reset, vi.fn()) };
}
describe('explicit one-shot New Game consent', () => {
  it('request, edit and cancel never call the reset transaction', () => {
    const f = fixture(); f.controls.confirm(); f.controls.request(); f.controls.edit('RESET'); f.controls.cancel(); f.controls.confirm();
    expect(f.reset).not.toHaveBeenCalled(); expect(f.controls.getSnapshot()).toMatchObject({ confirming: false, confirmation: '' });
  });
  it.each(['', 'reset', 'RESET ', 'RESET\n'])('cannot confirm %j', value => {
    const f = fixture(); f.controls.request(); f.controls.edit(value); f.controls.confirm();
    expect(f.reset).not.toHaveBeenCalled();
  });
  it('consumes exact consent before reset and rejects rapid duplicate activation', () => {
    const f = fixture(); f.controls.request(); f.controls.edit('RESET'); f.controls.confirm(); f.controls.confirm();
    expect(f.reset).toHaveBeenCalledExactlyOnceWith('RESET');
    expect(f.controls.getSnapshot()).toMatchObject({ confirming: false, confirmation: '' });
  });
  it('reopening starts blank, never reusing a cancelled or previous confirmation', () => {
    const f = fixture(); f.controls.request(); f.controls.edit('RESET'); f.controls.cancel(); f.controls.request();
    expect(f.controls.getSnapshot()).toEqual({ ...INITIAL_RESET_PROGRESS, confirming: true });
    f.controls.confirm(); expect(f.reset).not.toHaveBeenCalled();
  });
  it('reports failure, clears consent and requires a new review before retry', () => {
    const reset = vi.fn(() => ({ ok: false as const, error: 'persistence-failure' as const }));
    const controls = createResetProgressControls(reset, vi.fn());
    controls.request(); controls.edit('RESET'); controls.confirm(); controls.confirm();
    expect(reset).toHaveBeenCalledTimes(1); expect(controls.getSnapshot().message).toContain('Nothing was reset');
    expect(controls.getSnapshot().confirmation).toBe('');
  });
  it('clears old import approval and exported/input text after a full reset', () => {
    const code = exportSaveCode(createInitialGameState(), 42); if (!code.ok) throw Error('fixture');
    const importCode = vi.fn(() => ({ ok: true as const }));
    const controls = createSaveManagement({ exportCode: () => code, importCode }, vi.fn());
    controls.exportCode(); controls.edit(code.code); controls.validate(); controls.clear(); controls.confirm();
    expect(importCode).not.toHaveBeenCalled(); expect(controls.getSnapshot()).toEqual(INITIAL_SAVE_MANAGEMENT);
  });
  it('ignores an old async clipboard completion after save UI was cleared', async () => {
    const code = exportSaveCode(createInitialGameState(), 42); if (!code.ok) throw Error('fixture');
    let complete: (value: boolean) => void = () => {};
    const controls = createSaveManagement({ exportCode: () => code, importCode: () => ({ ok: true }) }, vi.fn(),
      () => new Promise<boolean>(resolve => { complete = resolve; }));
    controls.exportCode(); const pending = controls.copyCode(); controls.clear(); complete(true); await pending;
    expect(controls.getSnapshot()).toEqual(INITIAL_SAVE_MANAGEMENT);
  });
  it('clears an old Rebirth approval so it cannot act on the new run', () => {
    const rebirth = vi.fn(() => ({ ok: true as const, reward: 4 }));
    const controls = createRebirthControls(rebirth, vi.fn());
    controls.request(); controls.clear(); controls.confirm();
    expect(rebirth).not.toHaveBeenCalled(); expect(controls.getSnapshot()).toEqual(INITIAL_REBIRTH_CONTROLS);
  });
});
