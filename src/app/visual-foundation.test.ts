import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const tokens = readFileSync('src/styles/tokens.css', 'utf8');
const styles = readFileSync('src/app/App.css', 'utf8');
const global = readFileSync('src/styles/global.css', 'utf8');
function color(name: string): number[] {
  const hex = tokens.match(new RegExp(`--color-${name}: #([0-9a-f]{6});`))?.[1];
  if (!hex) throw new Error(`Missing opaque color token: ${name}`);
  return [0, 2, 4].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255);
}
function luminance(name: string): number {
  const channels = color(name).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return channels.reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index]!, 0);
}
function contrast(a: string, b: string): number {
  const values = [luminance(a), luminance(b)].sort((a, b) => b - a);
  return (values[0]! + .05) / (values[1]! + .05);
}

describe('Solara visual foundation', () => {
  it('centralizes all reusable visual categories and applies them', () => {
    for (const token of ['color-background', 'color-surface', 'color-surface-elevated', 'color-border',
      'color-text', 'color-secondary', 'color-muted', 'color-accent', 'color-cool', 'color-warm',
      'color-success', 'color-warning', 'color-danger', 'color-info', 'space-xs', 'space-sm',
      'space-md', 'space-lg', 'space-xl', 'space-2xl', 'radius-control', 'radius-card',
      'radius-feature', 'shadow-standard', 'shadow-elevated', 'shadow-accent', 'shadow-focus',
      'color-focus', 'transition-fast', 'transition-standard']) expect(tokens).toContain(`--${token}:`);
    for (const token of ['color-background', 'color-surface', 'color-accent', 'color-warm',
      'radius-card', 'radius-feature', 'space-md', 'shadow-elevated', 'shadow-focus', 'transition-fast']) {
      expect(styles).toContain(`var(--${token})`);
    }
  });
  it('keeps text and disabled states readable on the darkest and elevated surfaces', () => {
    for (const text of ['text', 'secondary', 'muted', 'accent', 'cool', 'warm', 'success', 'warning', 'danger', 'info', 'hot']) {
      for (const background of ['background', 'surface', 'surface-elevated', 'disabled']) {
        expect(contrast(text, background), `${text} on ${background}`).toBeGreaterThanOrEqual(4.5);
      }
    }
    expect(contrast('danger', 'danger-surface')).toBeGreaterThanOrEqual(4.5);
    for (const background of ['action', 'action-end', 'action-hover']) {
      expect(contrast('on-action', background)).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('preserves strong focus, reduced motion and wrapping without a new animation system', () => {
    expect(styles).toContain('outline: 3px solid var(--color-focus)');
    expect(contrast('focus', 'surface-elevated')).toBeGreaterThanOrEqual(3);
    expect(styles).toContain('min-height: 44px');
    expect(styles).toContain('text-decoration: underline');
    expect(styles).toContain('overflow-wrap: anywhere');
    expect(global).toContain('@media (prefers-reduced-motion: reduce)');
    expect(global).toContain('transition: none !important');
    expect(global).toContain('animation: none !important');
    expect(styles).not.toMatch(/backdrop-filter|@keyframes/);
  });
});
