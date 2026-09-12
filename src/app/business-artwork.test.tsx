// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { BUSINESS_CATALOG, STARTER_BUSINESS } from '../features/businesses';
import { BusinessArtwork } from './BusinessArtwork';
import { findBusinessArtwork } from './business-artwork';

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

async function mount() {
  const artwork = findBusinessArtwork(STARTER_BUSINESS.id);
  if (!artwork) throw new Error('Dockside reference missing');
  root = createRoot(container);
  await act(() => root?.render(<BusinessArtwork artwork={artwork} />));
  const image = container.querySelector('img');
  if (!(image instanceof HTMLImageElement)) throw new Error('Artwork image missing');
  return image;
}

test('only Dockside has a reference; other Businesses never receive placeholders', () => {
  for (const business of BUSINESS_CATALOG) {
    expect(findBusinessArtwork(business.id) !== null).toBe(business.id === STARTER_BUSINESS.id);
  }
  expect(findBusinessArtwork('unknown')).toBeNull();
  expect(findBusinessArtwork(STARTER_BUSINESS.id)).toMatchObject({ width: 564, height: 270 });
});

test('pending artwork is hidden, decorative and eager so it can load while hidden', async () => {
  const image = await mount();
  expect(image.parentElement?.hidden).toBe(true);
  expect(image.parentElement?.getAttribute('aria-hidden')).toBe('true');
  expect(image.alt).toBe('');
  expect(image.getAttribute('loading')).toBe('eager');
});

test('a decoded image reveals the card artwork', async () => {
  const image = await mount();
  Object.defineProperty(image, 'naturalWidth', { value: 564, configurable: true });
  await act(() => image.dispatchEvent(new Event('load')));
  expect(image.parentElement?.hidden).toBe(false);
});

test('a failed request removes the whole artwork slot, not the business controls', async () => {
  const image = await mount();
  await act(() => image.dispatchEvent(new Event('error')));
  expect(container.querySelector('.business-artwork')).toBeNull();
});

test('an empty decoded image cannot reveal a black placeholder', async () => {
  const image = await mount();
  Object.defineProperty(image, 'naturalWidth', { value: 0, configurable: true });
  await act(() => image.dispatchEvent(new Event('load')));
  expect(container.querySelector('.business-artwork')).toBeNull();
});
