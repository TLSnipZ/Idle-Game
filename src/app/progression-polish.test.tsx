// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { getLevelProgress, getXpThresholdForLevel, MAX_PLAYER_LEVEL } from '../features/progression';
import { selectRebirth } from '../game/rebirth';
import { createInitialGameState } from '../game/game-state';
import { autoUpgraderState } from '../game/test-fixtures/auto-upgrader-state';
import { HudPlayerProgress } from './HudPlayerProgress';
import { RebirthNotice } from './RebirthNotice';
import { GlobalStatus } from './GlobalStatus';
import { dashboardPresentation } from './dashboard-presentation';
import { formatInteger } from './number-format';

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  container = document.createElement('div'); document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => { await act(() => root.unmount()); container.remove(); vi.unstubAllGlobals(); });

describe('global XP uses authoritative local-level progress', () => {
  const floor = getXpThresholdForLevel(18), next = getXpThresholdForLevel(19);
  it.each([floor, floor + Math.floor((next - floor) / 2), next - 1, next])('renders boundary XP %s', async xp => {
    const progress = getLevelProgress(xp);
    await act(() => root.render(<HudPlayerProgress progress={progress} />));
    const bar = container.querySelector('progress');
    expect(bar?.value).toBe(progress.xpIntoLevel); expect(bar?.max).toBe(progress.xpNeededForLevel);
    expect(bar?.getAttribute('aria-label')).toBe(`Player XP progress to Level ${progress.currentLevel + 1}`);
    expect(container.textContent).toBe(`${formatInteger(progress.xpIntoLevel)} / ${formatInteger(progress.xpNeededForLevel)} XP`);
    expect(container.querySelector('[aria-live], [role="status"]')).toBeNull();
  });
  it('uses the configured cap with no nonexistent next-level target', async () => {
    const state = { ...createInitialGameState(), progression: { xp: getXpThresholdForLevel(MAX_PLAYER_LEVEL) } };
    await act(() => root.render(<GlobalStatus view={dashboardPresentation(state)} active="city" paused={false} onNavigate={() => {}} />));
    expect(container.querySelector('.hud-level')?.textContent).toContain(`${MAX_PLAYER_LEVEL}MAX LEVEL`);
    expect(container.querySelector('.hud-level progress')).toBeNull();
    expect(container.textContent).not.toContain(`Level ${MAX_PLAYER_LEVEL + 1}`);
    expect(container.querySelectorAll('.global-status > div')).toHaveLength(4);
  });
  it('clamps out-of-range display values and safely rejects invalid progress without mutation', () => {
    const progress = getLevelProgress(floor);
    const high = { ...progress, xpIntoLevel: progress.xpNeededForLevel + 100 };
    const low = { ...progress, xpIntoLevel: -100 };
    const invalid = { ...progress, xpNeededForLevel: NaN };
    expect(renderToStaticMarkup(<HudPlayerProgress progress={high} />)).toContain(`value="${progress.xpNeededForLevel}"`);
    expect(renderToStaticMarkup(<HudPlayerProgress progress={low} />)).toContain('value="0"');
    expect(renderToStaticMarkup(<HudPlayerProgress progress={invalid} />)).toContain('XP unavailable');
    expect(low.xpIntoLevel).toBe(-100); expect(high.xpIntoLevel).toBe(progress.xpNeededForLevel + 100);
  });
});

describe('derived Rebirth opportunity', () => {
  it('announces entry once, updates reward quietly, clears on reset and announces a later run', async () => {
    const onReview = vi.fn();
    const show = async (state = createInitialGameState()) => {
      await act(() => root.render(<RebirthNotice preview={selectRebirth(state)} onReview={onReview} />));
    };
    await show();
    const slot = container.querySelector('.rebirth-notice-slot');
    const live = container.querySelector('[role="status"]');
    expect(container.querySelector('button')).toBeNull(); expect(live?.textContent).toBe('');
    const eligible = autoUpgraderState(); await show(eligible);
    const notice = container.querySelector('.rebirth-notice');
    const entryMessage = live?.textContent;
    expect(notice?.textContent).toContain(`REBIRTH READY · +${selectRebirth(eligible).reward} EP`);
    expect(entryMessage).toContain('Rebirth ready.');
    const richer = autoUpgraderState(40); await show(richer); await show(richer);
    expect(container.querySelector('.rebirth-notice')).toBe(notice);
    expect(container.querySelector('[role="status"]')).toBe(live);
    expect(live?.textContent).toBe(entryMessage);
    expect(notice?.textContent).toContain(`+${selectRebirth(richer).reward} EP`);
    await act(() => container.querySelector('button')?.click()); expect(onReview).toHaveBeenCalledTimes(1);
    await show(); expect(container.querySelector('.rebirth-notice')).toBeNull(); expect(live?.textContent).toBe('');
    expect(container.querySelector('.rebirth-notice-slot')).toBe(slot);
    await show(richer); expect(live?.textContent).toContain(`${selectRebirth(richer).reward} Empire Points`);
  });
});

it('reserves readable feedback and compact responsive artwork without crop, fixed card height or animation', () => {
  const css = readFileSync('src/app/sections.css', 'utf8');
  const card = css.match(/\.vehicle-card \{([^}]+)\}/)?.[1] ?? '';
  expect(card).toContain('max-width:'); expect(card).toContain('minmax(0,'); expect(card).not.toMatch(/height:/);
  expect(css).toMatch(/@media \(max-width: 1000px\)[\s\S]*\.vehicle-card[^}]*grid-template-columns: minmax\(0, 1fr\)/);
  expect(css).toMatch(/\.global-feedback \{[^}]*block-size:[^}]*overflow: auto/);
  expect(css).toMatch(/\.rebirth-notice-slot \{[^}]*min-block-size:/);
  expect(css).toContain('object-fit: contain'); expect(css).toContain('height: auto');
  expect(css).not.toMatch(/scroll-behavior: smooth|overflow-anchor: none|animation:/);
});
