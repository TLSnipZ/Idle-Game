import { useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocalizedText } from './LocalizationProvider';

export interface WorkspaceDestination { readonly sequence: number; readonly headingId: string; }
export interface WorkspaceView {
  readonly id: string;
  readonly label: readonly [string, string];
  readonly content: ReactNode;
  readonly pending?: boolean;
}

/** Only presentation lives here. Mounted hidden panels retain unfinished forms. */
export function SectionWorkspace({ name, views, destination }: {
  readonly name: 'city' | 'empire'; readonly views: readonly WorkspaceView[];
  readonly destination?: WorkspaceDestination | null;
}) {
  const text = useLocalizedText();
  const root = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(views[0]?.id ?? '');
  const [request, setRequest] = useState(0);
  const targetId = useRef('');
  const handled = useRef(0);
  function open(id: string, target = id) { setSelected(id); targetId.current = target; setRequest(n => n + 1); }
  useLayoutEffect(() => {
    if (!destination) return;
    const target = document.getElementById(destination.headingId);
    const panel = target && root.current?.contains(target) ? target.closest<HTMLElement>('[data-workspace-panel]') : null;
    const id = panel?.dataset.workspacePanel;
    if (id) open(id, destination.headingId);
  }, [destination]);
  useLayoutEffect(() => {
    if (handled.current === request) return;
    handled.current = request;
    const target = document.getElementById(targetId.current);
    if (target && root.current?.contains(target)) {
      target.tabIndex = -1;
      target.focus({ preventScroll: true }); target.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  }, [selected, request]);
  return <div className={`section-workspace focused-workspace ${name}-workspace`} ref={root}>
    <nav className="section-index workspace-navigation" aria-label={text('In this section', 'In diesem Bereich')}>
      {views.map(view => <button type="button" key={view.id} data-workspace-view={view.id} aria-pressed={selected === view.id}
        aria-controls={`${name}-${view.id}-panel`} onClick={() => open(view.id)}>
        {text(...view.label)}{view.pending && <span className="workspace-pending">{text('Pending', 'Offen')}</span>}
      </button>)}
    </nav>
    <div className="workspace-panels">
      {views.map(view => <div key={view.id} id={`${name}-${view.id}-panel`} data-workspace-panel={view.id} hidden={selected !== view.id}>
        {view.content}
      </div>)}
    </div>
  </div>;
}
