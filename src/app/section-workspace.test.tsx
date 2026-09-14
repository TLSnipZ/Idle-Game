// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import { SectionWorkspace } from './SectionWorkspace';
let root: Root, container: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(() => {});
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(() => root.unmount()); container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const views = [
  { id: 'one', label: ['One', 'Eins'] as const, content: <section><h2 id="one">One</h2><input aria-label="draft" defaultValue="" /></section> },
  { id: 'two', label: ['Two', 'Zwei'] as const, content: <section><h2 id="two">Two</h2><h3 id="specific">Target</h3><button>Action</button></section> },
];
async function click(id: string) { await act(() => container.querySelector<HTMLButtonElement>(`[data-workspace-view="${id}"]`)?.click()); }
it('keeps drafts mounted while excluding inactive panels and restoring destination focus', async () => {
  await act(() => root.render(<SectionWorkspace name="empire" views={views} />));
  const input = container.querySelector('input')!; input.value = 'unfinished';
  await click('two'); expect(input.closest('[hidden]')).not.toBeNull(); expect(document.activeElement?.id).toBe('two');
  await click('one'); expect(container.querySelector('input')).toBe(input); expect(input.value).toBe('unfinished');
  expect(input.closest('[hidden]')).toBeNull();
});
it('reveals specific nested destinations repeatedly without resetting on ordinary rerenders', async () => {
  const render = (sequence: number) => act(() => root.render(<SectionWorkspace name="city" views={views} destination={{ sequence, headingId: 'specific' }} />));
  await render(1); expect(document.activeElement?.id).toBe('specific'); expect(document.activeElement?.closest('[hidden]')).toBeNull();
  await click('one'); await render(2); expect(document.activeElement?.id).toBe('specific');
  await act(() => root.render(<SectionWorkspace name="city" views={views} />));
  await click('one'); await act(() => root.render(<SectionWorkspace name="city" views={views} />));
  expect(container.querySelector('[data-workspace-view="one"]')?.getAttribute('aria-pressed')).toBe('true');
});
