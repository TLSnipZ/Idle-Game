import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { STARTER_BUSINESS } from '../features/businesses';
import { STARTER_JOB } from '../features/economy';
import { formatCash } from '../features/economy/ui';
import { createInitialGameState } from '../game/game-state';
import type { RuntimeSnapshot } from '../platform/game-runtime';
import { businessPresentation, describeAction } from './game-presentation';
import { BusinessCard } from './BusinessCard';

const state = createInitialGameState();

describe('business presentation', () => {
  it('unowned businesses show potential production with an explicit funding requirement', () => {
    const view = businessPresentation(false, false, false);
    expect(view.live).toBe(false);
    expect(view.productionLabel).toBe('Potential production');
    expect(view.status).toBe('Not owned');
    expect(view.disabled).toBe(true);
    expect(view.buttonLabel).toBe('More cash needed');
  });
  it('affordability enables acquisition without implying production has started', () => {
    const view = businessPresentation(false, true, false);
    expect(view.live).toBe(false);
    expect(view.disabled).toBe(false);
    expect(view.status).toBe('Ready to acquire');
  });
  it('owned businesses show live production and cannot be purchased again', () => {
    const view = businessPresentation(true, true, false);
    expect(view.live).toBe(true);
    expect(view.status).toBe('Owned');
    expect(view.disabled).toBe(true);
    expect(view.buttonLabel).toBe('Acquired');
  });
  it.each([false, true])('paused session never advertises live income (owned=%s)', owned => {
    const view = businessPresentation(owned, true, true);
    expect(view.live).toBe(false);
    expect(view.disabled).toBe(true);
    expect(view.productionLabel).toBe('Production paused');
    expect(view.note).toContain('Reload');
    expect(view.note).toContain('Unsaved progress');
  });
  it('renders configured prospective price/rate and a described disabled purchase button', () => {
    const html = renderToStaticMarkup(<BusinessCard owned={false} canPurchase={false} paused={false} onPurchase={() => {}} />);
    expect(html).toContain(formatCash(STARTER_BUSINESS.purchaseCost));
    expect(html).toContain(formatCash(STARTER_BUSINESS.baseProductionCentsPerSecond));
    expect(html).toContain('Potential production');
    expect(html).toContain('disabled=""');
    expect(html).toContain('aria-describedby="purchase-note"');
    expect(html).not.toContain('Live production');
  });
  it('renders acquired styling and live status from real ownership', () => {
    const html = renderToStaticMarkup(<BusinessCard owned canPurchase={false} paused={false} onPurchase={() => {}} />);
    expect(html).toContain('business-card is-owned');
    expect(html).toContain('Live production');
    expect(html).toContain(`+${formatCash(STARTER_BUSINESS.baseProductionCentsPerSecond)}`);
    expect(html).toContain('Acquired');
    expect(html).toContain('disabled=""');
  });
  it('renders a paused rate as inactive while preserving ownership', () => {
    const html = renderToStaticMarkup(<BusinessCard owned canPurchase={false} paused onPurchase={() => {}} />);
    expect(html).toContain('Owned');
    expect(html).toContain('Production paused');
    expect(html).toContain('currently inactive');
    expect(html).not.toContain('Live production');
    expect(html).not.toContain('production is-live');
  });
});

describe('action feedback', () => {
  it('describes delivery success using the configured reward', () => {
    expect(describeAction('delivery', { ok: true, state })).toBe(`Delivery completed. +${formatCash(STARTER_JOB.reward)} earned.`);
  });
  it('announces acquisition and the beginning of production', () => {
    const message = describeAction('purchase', { ok: true, state });
    expect(message).toContain(STARTER_BUSINESS.name);
    expect(message).toContain('Live production has started');
  });
  const failures: ReadonlyArray<readonly [Extract<RuntimeSnapshot['result'], { ok: false }>['error'], string]> = [
    ['insufficient-funds', 'Not enough cash'],
    ['already-owned', 'already yours'],
    ['unknown-business', 'unavailable'],
    ['overflow', 'Cash limit reached'],
    ['invalid-amount', 'No transaction was made'],
  ];
  it.each(failures)('explains %s without false success feedback', (error, text) => {
    const message = describeAction('purchase', { ok: false, state, error });
    expect(message).toContain(text);
    expect(message).not.toContain('has started');
  });
});
