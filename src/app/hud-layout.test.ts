import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

const css = readFileSync('src/app/Hud2.css', 'utf8');

function declarations(selector: string): string {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`Missing HUD layout rule: ${selector}`);
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  if (close < 0) throw new Error(`Unclosed HUD layout rule: ${selector}`);
  return css.slice(open + 1, close);
}

// A native progress element otherwise keeps its intrinsic width and overflows
// the narrow Level column. This guards the reproduced regression, not its markup.
test('HUD XP progress scales to the Level column instead of its native width', () => {
  const progress = declarations('.hud-command-row .hud-xp-progress');
  expect(progress).toMatch(/(?:^|;)\s*display:\s*block\s*;/);
  expect(progress).toMatch(/(?:^|;)\s*width:\s*100%\s*;/);
  expect(progress).toMatch(/(?:^|;)\s*max-width:\s*100%\s*;/);
  expect(progress).toMatch(/(?:^|;)\s*min-width:\s*0\s*;/);
  expect(progress).toMatch(/(?:^|;)\s*box-sizing:\s*border-box\s*;/);
});

test('XP caption has its own wrapping line rather than the large stat line box', () => {
  const caption = declarations('.hud-command-row .hud-xp-text');
  expect(caption).toMatch(/(?:^|;)\s*display:\s*block\s*;/);
  expect(caption).toMatch(/(?:^|;)\s*max-width:\s*100%\s*;/);
  expect(caption).toMatch(/(?:^|;)\s*white-space:\s*normal\s*;/);
  expect(caption).toMatch(/(?:^|;)\s*overflow-wrap:\s*anywhere\s*;/);
});

test('HUD stat containers can shrink without forcing the Activity Center outward', () => {
  expect(declarations('.hud-command-row .global-status')).toMatch(/(?:^|;)\s*min-width:\s*0\s*;/);
  expect(declarations('.hud-command-row .hud-level dd')).toMatch(/(?:^|;)\s*min-width:\s*0\s*;/);
});
