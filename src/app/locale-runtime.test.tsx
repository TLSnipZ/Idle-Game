// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useGame } from './use-game';
import { createPersistentGame } from '../platform/persistent-game';
import { createLocalSave } from '../platform/local-save';
import { villagerText } from './villager-language';

vi.mock('../platform/persistent-game', async importOriginal => {
  const original = await importOriginal<typeof import('../platform/persistent-game')>();
  return { ...original, createPersistentGame: vi.fn(original.createPersistentGame) };
});
const original = await vi.importActual<typeof import('../platform/persistent-game')>('../platform/persistent-game');
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.mocked(createPersistentGame).mockImplementation(publish => {
    let raw: string | null = null;
    return original.createPersistentGame(publish,
      createLocalSave(() => ({ getItem: () => raw, setItem: (_key, value) => { raw = value; } }), () => 1000),
      { now: () => 0, schedule: () => () => {}, random: { next: () => 0.99 } },
      () => () => {});
  });
});
afterEach(() => { vi.clearAllMocks(); vi.unstubAllGlobals(); });

it('keeps each mounted runtime locale across repeated cooldown-free standard deliveries and separates instances', async () => {
  const container = document.createElement('div'); document.body.append(container); const root = createRoot(container);
  const games = new Map<number, ReturnType<typeof useGame>>();
  function Harness({ id }: { readonly id: number }) { const game = useGame(); games.set(id, game); return null; }
  const game = (id: number) => { const value = games.get(id); if (!value) throw Error('Missing runtime'); return value; };
  try {
    await act(() => root.render(<><Harness id={1} /><Harness id={2} /></>));
    game(1).setPresentationLocale('de'); game(2).setPresentationLocale('villager');
    for (let attempt = 0; attempt < 3; attempt++) {
      await act(() => game(1).runStarterJob()); expect(game(1).feedback.message).toContain('Lieferung erledigt.');
      await act(() => game(2).runStarterJob());
      expect(game(2).feedback.message).toContain(villagerText('Delivery completed.'));
      expect(game(2).feedback.message).toBe(villagerText(game(2).feedback.message)); expect(game(2).feedback.message).toMatch(/^[HhMmRr]+/);
    }
  } finally { await act(() => root.unmount()); container.remove(); }
});
