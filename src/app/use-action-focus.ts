import { useEffect, useRef } from 'react';
import type { MouseEvent } from 'react';

/** Recover keyboard focus only after the user's focused action disappears or disables. */
export function useActionFocus() {
  const pending = useRef<{ button: HTMLButtonElement; heading: HTMLElement } | null>(null);
  useEffect(() => {
    const action = pending.current;
    pending.current = null;
    if (!action || !action.heading.isConnected) return;
    if ((document.activeElement === document.body || document.activeElement === action.button)
      && (!action.button.isConnected || action.button.disabled)) {
      action.heading.tabIndex = -1;
      action.heading.focus({ preventScroll: true });
    }
  });
  return (event: MouseEvent<HTMLDivElement>) => {
    const button = event.target instanceof Element ? event.target.closest('button') : null;
    if (!(button instanceof HTMLButtonElement) || document.activeElement !== button) return;
    const heading = button.closest('article, section')?.querySelector<HTMLElement>('h2, h3, h4');
    if (heading) pending.current = { button, heading };
  };
}
