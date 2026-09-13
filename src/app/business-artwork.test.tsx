// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { BUSINESS_CATALOG, STARTER_BUSINESS } from '../features/businesses';
import { moneyFromMinorUnits } from '../features/economy';
import { getXpThresholdForLevel } from '../features/progression';
import { createInitialGameState } from '../game/game-state';
import type { GameState } from '../game/game-state';
import { evaluateRequirements } from '../game/requirements';
import { selectBusinessProgress, selectCanPurchaseBusiness, selectOwnsBusiness } from '../game/selectors';
import { BusinessArtwork } from './BusinessArtwork';
import { BusinessCard } from './BusinessCard';
import { LocalizationProvider } from './LocalizationProvider';
import type { Locale } from './localization';
import { findBusinessArtwork } from './business-artwork';

const artworkIds = [STARTER_BUSINESS.id, 'business:neon-laundry'];
const locales: readonly Locale[] = ['en', 'de'];
let container: HTMLDivElement;
let root: Root | undefined;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  container = document.createElement('div');
  document.body.append(container);
});

afterEach(async () => {
  await act(() => root?.unmount());
  root = undefined;
  container.remove();
  vi.unstubAllGlobals();
});

async function mount(businessId: string) {
  const artwork = findBusinessArtwork(businessId);
  if (!artwork) throw new Error('Business reference missing');
  root = createRoot(container);
  await act(() => root?.render(<BusinessArtwork artwork={artwork} />));
  const image = container.querySelector('img');
  if (!(image instanceof HTMLImageElement)) throw new Error('Artwork image missing');
  return image;
}

test('Dockside and Laundry use distinct references; later Businesses have no placeholders', () => {
  for (const business of BUSINESS_CATALOG) {
    expect(findBusinessArtwork(business.id) !== null).toBe(artworkIds.includes(business.id));
  }
  expect(findBusinessArtwork('unknown')).toBeNull();
  expect(findBusinessArtwork(STARTER_BUSINESS.id)).toMatchObject({ width: 564, height: 270 });
  expect(findBusinessArtwork('business:neon-laundry')).toMatchObject({ width: 732, height: 188 });
  expect(findBusinessArtwork('business:neon-laundry')?.src).not.toBe(findBusinessArtwork(STARTER_BUSINESS.id)?.src);
});

test.each(artworkIds)('%s stays hidden and decorative while its eager image loads', async id => {
  const image = await mount(id);
  expect(image.parentElement?.hidden).toBe(true);
  expect(image.parentElement?.getAttribute('aria-hidden')).toBe('true');
  expect(image.alt).toBe('');
  expect(image.getAttribute('loading')).toBe('eager');
});

test.each(artworkIds)('%s reveals a successfully loaded image', async id => {
  const image = await mount(id);
  Object.defineProperty(image, 'naturalWidth', { value: findBusinessArtwork(id)?.width, configurable: true });
  await act(() => { image.dispatchEvent(new Event('load')); });
  expect(image.parentElement?.hidden).toBe(false);
});

test.each(artworkIds)('%s removes the complete artwork slot on request failure', async id => {
  const image = await mount(id);
  await act(() => { image.dispatchEvent(new Event('error')); });
  expect(container.querySelector('.business-artwork')).toBeNull();
});

test.each(artworkIds)('%s never reveals an empty image placeholder', async id => {
  const image = await mount(id);
  Object.defineProperty(image, 'naturalWidth', { value: 0, configurable: true });
  await act(() => { image.dispatchEvent(new Event('load')); });
  expect(container.querySelector('.business-artwork')).toBeNull();
});

test.each(locales)('Laundry keeps localized copy and purchase/upgrade actions after artwork failure in %s', async locale => {
  const definition = BUSINESS_CATALOG.find(business => business.id === 'business:neon-laundry');
  if (!definition) throw new Error('Canonical Laundry definition missing');
  const initial = createInitialGameState();
  const state: GameState = { ...initial,
    economy: { cash: moneyFromMinorUnits('100000000') },
    progression: { xp: getXpThresholdForLevel(5) },
    businesses: { ...initial.businesses, owned: { [STARTER_BUSINESS.id]: { level: 7 } } },
  };
  const original = JSON.stringify(state);
  const purchase = vi.fn(), upgrade = vi.fn();
  function card(game: GameState) {
    return <LocalizationProvider locale={locale}><BusinessCard definition={definition}
      requirements={evaluateRequirements(game, definition.requirements)}
      progress={selectBusinessProgress(game, definition.id)} owned={selectOwnsBusiness(game, definition.id)}
      canPurchase={selectCanPurchaseBusiness(game, definition.id)} paused={false}
      onPurchase={purchase} onUpgrade={upgrade} /></LocalizationProvider>;
  }
  root = createRoot(container);
  await act(() => root?.render(card(state)));
  expect(container.querySelector('.business-tagline')?.textContent).toBe(locale === 'de'
    ? 'Saubere Wäsche. Fragwürdige Belege.' : 'Fresh sheets. Questionable receipts.');
  await act(() => { container.querySelector('img')?.dispatchEvent(new Event('error')); });
  expect(container.querySelector('.business-artwork')).toBeNull();
  expect(container.querySelector('button')?.disabled).toBe(false);
  await act(() => { container.querySelector('button')?.click(); });
  expect(purchase).toHaveBeenCalledTimes(1);
  expect(upgrade).not.toHaveBeenCalled();
  const owned: GameState = { ...state, businesses: { ...state.businesses,
    owned: { ...state.businesses.owned, [definition.id]: { level: 1 } } } };
  await act(() => root?.render(card(owned)));
  await act(() => { container.querySelector('button')?.click(); });
  expect(upgrade).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(state)).toBe(original);
});
