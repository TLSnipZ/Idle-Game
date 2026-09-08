import { createPersistentGame } from '../persistent-game';
import { createLocalSave } from '../local-save';
import { parseSave, serializeSave } from '../../game/save-schema';
import type { GameState } from '../../game/game-state';
import { rebirthState } from '../../game/test-fixtures/rebirth-state';

export function rebirthRuntime(state = rebirthState()) {
  const encoded = serializeSave(state, 1000);
  if (!encoded.ok) throw Error('fixture');
  let raw = encoded.serialized, now = 0, wall = 1000, failed = false, clockReads = 0, timers = 0;
  let tick = () => {}; let autosave = () => {};
  const events: { type: 'write' | 'publish'; state: GameState }[] = [];
  const make = () => createPersistentGame(view => { events.push({ type: 'publish', state: view.result.state }); },
    createLocalSave(() => ({ getItem: () => raw, setItem: (_key: string, value: string) => {
      if (failed) throw Error('quota');
      const decoded = parseSave(value); if (!decoded.ok) throw Error('invalid write');
      raw = value; events.push({ type: 'write', state: decoded.envelope.state });
    } }), () => wall), { now: () => { clockReads++; return now; }, schedule: callback => {
      tick = callback; timers++; return () => { timers--; };
    } }, callback => { autosave = callback; timers++; return () => { timers--; }; });
  const game = make(); game.start(); game.dismissOffline(); events.length = 0;
  return { game, make, events, raw: () => raw, clockReads: () => clockReads, timers: () => timers,
    at: (value: number) => { now = value; }, wall: (value: number) => { wall = value; },
    fail: () => { failed = true; }, replaceRaw: (value: string) => { raw = value; },
    tick: () => tick(), autosave: () => autosave() };
}
