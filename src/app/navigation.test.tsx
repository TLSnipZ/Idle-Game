import { Children, isValidElement } from 'react';
import type { ReactNode } from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { GameShell } from './App';
import type { useGame } from './use-game';
import { Navigation } from './Navigation';
import { PRIMARY_SECTIONS, DEFAULT_SECTION, SECTION } from './navigation';
import type { SectionId } from './navigation';
import { SectionContent } from './SectionContent';
import { OverviewSection } from './OverviewSection';
import { GlobalStatus } from './GlobalStatus';
import { GlobalFeedback } from './GlobalFeedback';
import { dashboardPresentation } from './dashboard-presentation';
import { createSaveManagement } from './save-management';
import { createRebirthControls } from './rebirth-controls';
import { createInitialGameState as fresh } from '../game/game-state';
import type { GameState } from '../game/game-state';
import { autoUpgraderState } from '../game/test-fixtures/auto-upgrader-state';
import { createPersistentGame } from '../platform/persistent-game';
import { rebirthRuntime } from '../platform/test-fixtures/rebirth-runtime';
import { simulateOnlineElapsed } from '../game/simulate-online-elapsed';
import { reconcileOffline } from '../game/offline-progress';
import { serializeSave, CURRENT_SAVE_VERSION } from '../game/save-schema';
import { exportSaveCode, validateSaveCode } from '../game/save-code';
import { performStarterJob } from '../game/perform-starter-job';
import { DELIVERY_DISPATCHER } from '../features/automation';
import { STARTER_BUSINESS } from '../features/businesses';
import { moneyFromMinorUnits, STARTER_JOB } from '../features/economy';
import { getXpThresholdForLevel } from '../features/progression';

function view(state = fresh(), overrides: Partial<ReturnType<typeof useGame>> = {}): ReturnType<typeof useGame> {
  return { snapshot: { ok: true, state }, runtimeError: null, persistence: { kind: 'ready' },
    offline: null, feedback: { sequence: 0, message: '' }, achievementEvent: undefined, cityEvent: undefined,
    automationEvent: undefined, levelEvent: undefined, dismissOffline: vi.fn(),
    runStarterJob: vi.fn(), buyBusiness: vi.fn(), upgradeOwnedBusiness: vi.fn(), buyUpgrade: vi.fn(),
    buyAutomation: vi.fn(), toggleAutomation: vi.fn(), buyVehicle: vi.fn(), coolDown: vi.fn(), takeTerritory: vi.fn(),
    recruitCrew: vi.fn(), assignCrew: vi.fn(), unassignCrew: vi.fn(), chooseEvent: vi.fn(), buySkill: vi.fn(),
    rebirth: vi.fn(() => ({ ok: true as const, reward: 4 })), saveActions: { ...createPersistentGame(() => {}),
      exportCode: () => exportSaveCode(state, 1000), importCode: vi.fn(() => ({ ok: true as const })),
    }, ...overrides };
}
function harness(game = view()) {
  let active: SectionId = DEFAULT_SECTION;
  const onNavigate = (id: SectionId) => { active = id; };
  const saveControls = createSaveManagement(game.saveActions, () => {});
  const rebirthControls = createRebirthControls(game.rebirth, () => {});
  const props = () => ({ active, game, onNavigate, save: { state: saveControls.getSnapshot(), controls: saveControls },
    rebirth: { interaction: rebirthControls.getSnapshot(), controls: rebirthControls } });
  return { props, saveControls, rebirthControls, select: onNavigate,
    render: () => render(<SectionContent {...props()} />), navigation: () => Navigation({ active, onNavigate }) };
}
/** Dispatch the actual navigation button callbacks, without a DOM or timer shim. */
function buttons(node: ReactNode): { children?: ReactNode; onClick: () => void }[] {
  const result: { children?: ReactNode; onClick: () => void }[] = [];
  Children.forEach(node, child => {
    if (!isValidElement<{ children?: ReactNode; onClick?: () => void }>(child)) return;
    if (child.type === 'button' && child.props.onClick) result.push({ ...child.props, onClick: child.props.onClick });
    else result.push(...buttons(child.props.children));
  });
  return result;
}

describe('five-section presentation navigation', () => {
  it('has five ordered keyboard-safe buttons with one semantic active page; defaults to Overview', () => {
    expect(PRIMARY_SECTIONS.map(section => section.label)).toEqual(['OVERVIEW','OPERATIONS','CITY','COLLECTION','EMPIRE']);
    expect(new Set(PRIMARY_SECTIONS.map(s => s.id)).size).toBe(5);
    const html = render(<GameShell game={view()} />);
    expect(html).toContain('aria-label="Primary sections"');
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    expect(html).toContain('aria-controls="section-content">OVERVIEW');
    expect(html).toContain('Your operation at a glance');
    expect(html).not.toContain('id="import-code"');
    expect(html).not.toContain('id="business-name"');
    expect(html).not.toContain('id="crew-slot-operations"');
    expect(render(<Navigation active={SECTION.city.id} onNavigate={() => {}} />)).toContain('aria-current="page" aria-controls="section-content">CITY');
  });
  it.each(PRIMARY_SECTIONS)('selecting $label renders its complete feature mapping', section => {
    const h = harness();
    const index = PRIMARY_SECTIONS.findIndex(s => s.id === section.id);
    buttons(h.navigation())[index]?.onClick();
    expect(h.props().active).toBe(section.id);
    const html = h.render();
    const surfaces = {
      [SECTION.overview.id]: ['ECONOMY','PLAYER','CITY PRESSURE','CREW','EMPIRE','CITY EVENT','VIEW COLLECTION'],
      [SECTION.operations.id]: ['Starter job',STARTER_JOB.label,'Businesses','Dockside Detail','Upgrades','Commercial Pressure Washer','Automation','Delivery Dispatcher','BUSINESS AUTO-UPGRADER'],
      [SECTION.city.id]: ['Solara City','Waterfront','Neon Mile','HEAT','LAY LOW','CREW','CITY EVENTS','No active event'],
      [SECTION.collection.id]: ['Garage','Vortex S9','Owned vehicles: 0 / 1'],
      [SECTION.empire.id]: ['Rebirth','Empire Points','Empire Foundations','ACHIEVEMENTS','STATISTICS','Save &amp; Transfer','Export save','Validate import'],
    };
    for (const text of surfaces[section.id]) expect(html).toContain(text);
  });
  it('Overview summarizes current state without management controls and shortcuts only navigate', () => {
    const s = autoUpgraderState(), before = JSON.stringify(s), navigate = vi.fn();
    const component = OverviewSection({ state: s, paused: false, onNavigate: navigate });
    const html = render(component);
    for (const text of ['$1,000,000.00','18.75','Heat 0','Territories controlled: 2 / 2','Recruited: 0 / 3','Active assignments: 0 / 2','Rebirth requirements met']) expect(html).toContain(text);
    expect(html).not.toMatch(/Buy Business|Lay low to|Recruit Rico|Confirm Rebirth|achievement-card|statistics-entry|skill-node|territory-card/);
    for (const button of buttons(component)) button.onClick();
    expect(navigate.mock.calls.map(call => call[0])).toEqual([SECTION.operations.id, SECTION.city.id, SECTION.empire.id, SECTION.collection.id]);
    expect(JSON.stringify(s)).toBe(before);
  });
  it('global Cash/Level/Heat/EP and Overview refresh from one supplied live state', () => {
    const initial = fresh();
    const after = { ...initial, economy: { cash: moneyFromMinorUnits('123456789') }, progression: { xp: getXpThresholdForLevel(12) },
      city: { ...initial.city, heat: 60 }, permanentProgression: { ...initial.permanentProgression, empirePoints: 9 } };
    const html = render(<GlobalStatus view={dashboardPresentation(after)} active={SECTION.collection.id} onNavigate={() => {}} paused={false} />);
    for (const text of ['$1,234,567.89','Player Level','<dd>12</dd>','60 · HOT','9 EP']) expect(html).toContain(text);
    expect(dashboardPresentation(initial).cash).toBe('$0.00');
    expect(render(<OverviewSection state={after} paused={false} onNavigate={() => {}} />)).toContain('$1,234,567.89');
  });
  it('pending Event indicator navigates only and remains accurate in every section', () => {
    const s = fresh(), state: GameState = { ...s, events: { pendingEventId: 'event:shakedown', opportunityElapsedMs: 123456 } };
    const navigate = vi.fn(), before = JSON.stringify(state);
    for (const section of PRIMARY_SECTIONS) {
      const status = GlobalStatus({ view: dashboardPresentation(state), active: section.id, onNavigate: navigate, paused: false });
      expect(render(status)).toContain('CITY EVENT ACTIVE · Shakedown');
      buttons(status).find(b => render(<>{b.children}</>).includes('CITY EVENT ACTIVE'))?.onClick();
    }
    expect(navigate).toHaveBeenCalledTimes(5); expect(navigate).toHaveBeenLastCalledWith(SECTION.city.id);
    expect(JSON.stringify(state)).toBe(before);
    expect(render(<GlobalStatus view={dashboardPresentation(fresh())} active={DEFAULT_SECTION} onNavigate={navigate} paused={false} />)).not.toContain('CITY EVENT ACTIVE');
  });
  it.each(['unowned','disabled','enabled'] as const)('Auto-Upgrader %s status is informational and never a duplicate toggle', mode => {
    const s = autoUpgraderState();
    const state = mode === 'unowned' ? fresh() : mode === 'disabled' ? { ...s, automation: { ...s.automation, enabledIds: [] } } : s;
    const navigate = vi.fn(), before = JSON.stringify(state);
    const status = GlobalStatus({ view: dashboardPresentation(state), active: DEFAULT_SECTION, onNavigate: navigate, paused: false });
    expect(render(status).includes('AUTO-UPGRADER ACTIVE')).toBe(mode === 'enabled');
    if (mode === 'enabled') {
      buttons(status).find(b => render(<>{b.children}</>).includes('AUTO-UPGRADER ACTIVE'))?.onClick();
      expect(navigate).toHaveBeenCalledWith(SECTION.operations.id);
    }
    expect(JSON.stringify(state)).toBe(before);
  });
  it('preserves distinct locked, insufficient-cash and owned states in the moved cards', () => {
    const locked = harness(); locked.select(SECTION.city.id);
    for (const text of ['Not met — Player Level 12','Recruit Rico Vale','Not met — Player Level 8']) expect(locked.render()).toContain(text);
    const s = autoUpgraderState(25,'0'), eligible = harness(view({ ...s, automation: fresh().automation,
      city: { ...s.city, ownedTerritoryIds: fresh().city.ownedTerritoryIds } }));
    eligible.select(SECTION.city.id); expect(eligible.render()).toContain('Insufficient cash'); expect(eligible.render()).toContain('Met — Player Level 12');
    const auto = harness(view({ ...s, automation: fresh().automation })); auto.select(SECTION.operations.id);
    expect(auto.render()).toContain('More cash needed'); expect(auto.render()).toContain('Met — Player Level 12');
    const owned = harness(view(autoUpgraderState(100))); owned.select(SECTION.operations.id);
    expect(owned.render()).toContain('MAX LEVEL'); expect(owned.render()).toContain('DISABLE');
  });
  it.each(['Purchase complete','Mara Knox assigned to Operations','Business Auto-Upgrader enabled','REBIRTH COMPLETE'])('keeps command feedback globally available: %s', message => {
    const game = view(fresh(), { feedback: { sequence: 4, message } });
    expect(render(<GlobalFeedback game={game} transferMessage="" rebirthMessage="" />)).toContain(message);
  });
  it('announces all achievements, level unlocks, event and dispatch outside their management section', () => {
    const s = fresh(), game = view({ ...s, events: { opportunityElapsedMs: 0, pendingEventId: 'event:hot-tip' } }, {
      achievementEvent: { sequence: 1, ids: ['achievement:first-steps','achievement:running-hot'] },
      levelEvent: { sequence: 1, fromLevel: 1, toLevel: 2, unlocks: ['Street Connections'] },
      cityEvent: { sequence: 1, id: 'event:hot-tip' }, automationEvent: { sequence: 1, completedJobs: 1, income: moneyFromMinorUnits('2500'), xpEarned: 5 },
    });
    const html = render(<GlobalFeedback game={game} transferMessage="Save code ready" rebirthMessage="Rebirth cancelled" />);
    for (const text of ['First Steps','Running Hot','LEVEL UP','Street Connections','Hot Tip','Last dispatch','Save code ready','Rebirth cancelled']) expect(html).toContain(text);
    expect(html).toContain('aria-live="polite"');
  });
  it('offline Auto-Upgrader welcome stays global before Overview, without duplicating full panels', () => {
    const offline = reconcileOffline(autoUpgraderState(),0,90000); if (!offline.ok) throw Error('fixture');
    const html = render(<GameShell game={view(offline.state, { offline: offline.progress })} />);
    expect(html).toContain('Dockside +3 levels'); expect(html.indexOf('Dockside +3 levels')).toBeLessThan(html.indexOf('id="section-heading"'));
    expect(html).not.toContain('id="auto-upgrader-heading"');
  });
});

describe('navigation around the unchanged authoritative runtime', () => {
  it.each([false,true])('navigation and rendering cause no reconciliation, RNG or writes, pending=%s', pending => {
    const s = autoUpgraderState(), random = { next: vi.fn(() => .99) };
    const f = rebirthRuntime({ ...s, events: { opportunityElapsedMs: 23456, pendingEventId: pending ? 'event:shakedown' : null } }, random);
    const state = f.game.getSnapshot().result.state, before = JSON.stringify(state), raw = f.raw(), reads = f.clockReads();
    const game = view(state, { rebirth: f.game.rebirth, saveActions: f.game }); const h = harness(game);
    for (let repeat = 0; repeat < 3; repeat++) for (let i = 0; i < PRIMARY_SECTIONS.length; i++) {
      buttons(h.navigation())[i]?.onClick(); h.render();
      render(<GlobalStatus view={dashboardPresentation(state)} active={h.props().active} onNavigate={h.select} paused={false} />);
    }
    expect(JSON.stringify(f.game.getSnapshot().result.state)).toBe(before); expect(f.raw()).toBe(raw);
    expect(f.clockReads()).toBe(reads); expect(f.events).toEqual([]); expect(random.next).not.toHaveBeenCalled();
    expect(game.toggleAutomation).not.toHaveBeenCalled(); expect(game.runStarterJob).not.toHaveBeenCalled(); f.game.stop();
  });
  it('elapsed economy, Dispatcher, Mara/Heat, Auto-Upgrader and one event roll continue while sections change', () => {
    const s = autoUpgraderState(), initial: GameState = { ...s, automation: { ...s.automation, unlockedIds: [...s.automation.unlockedIds, DELIVERY_DISPATCHER.id] },
      city: { ...s.city, heat: 80 }, crew: { recruitedIds: ['crew:mara-knox'], assignments: { operations: 'crew:mara-knox', logistics: null } } };
    const random = { next: vi.fn(() => .99) }, f = rebirthRuntime(initial,random); let expected = f.game.getSnapshot().result.state;
    for (let i = 0; i < PRIMARY_SECTIONS.length; i++) {
      const game = view(f.game.getSnapshot().result.state), h = harness(game); buttons(h.navigation())[i]?.onClick(); h.render();
      f.at((i+1)*125000); f.tick();
      expected = simulateOnlineElapsed(expected,125000,{next:()=>.99}).state;
      expect(f.game.getSnapshot().result.state).toEqual(expected);
    }
    expect(random.next).toHaveBeenCalledTimes(1);
    expect(expected.permanentProgression.statistics.automatedJobsCompleted).toBe(62);
    expect(expected.permanentProgression.statistics.businessLevelsPurchased).toBeGreaterThan(0);
    expect(expected.businesses.owned[STARTER_BUSINESS.id]?.level).toBeGreaterThan(25);
    expect(expected.automation.enabledIds).toEqual(initial.automation.enabledIds);
    expect(expected.city.heat).toBeLessThan(100); f.game.stop();
  });
  it('pending event remains available with both alternatives after visiting every section', () => {
    const s = autoUpgraderState(), state: GameState = { ...s, events: { pendingEventId: 'event:shakedown', opportunityElapsedMs: 123456 } };
    const random = { next: vi.fn(() => .1) }, f = rebirthRuntime(state,random), h = harness(view(f.game.getSnapshot().result.state));
    for (const section of PRIMARY_SECTIONS) { h.select(section.id); h.render(); }
    f.at(60000); f.tick(); const after = f.game.getSnapshot().result.state;
    expect(after.events).toEqual(state.events); expect(random.next).not.toHaveBeenCalled();
    const city = harness(view(after)); city.select(SECTION.city.id);
    expect(city.render()).toContain('PAY THEM OFF'); expect(city.render()).toContain('REFUSE'); f.game.stop();
  });
  it('Rebirth confirmation survives section changes, cancel is safe and only confirm performs the reset', () => {
    const f = rebirthRuntime(), h = harness(view(f.game.getSnapshot().result.state, { rebirth: f.game.rebirth }));
    const before = f.game.getSnapshot().result.state; h.select(SECTION.empire.id); h.rebirthControls.request();
    expect(h.render()).toContain('Confirm your Rebirth'); h.select(SECTION.collection.id); h.render();
    expect(f.game.getSnapshot().result.state).toBe(before); h.select(SECTION.empire.id);
    expect(h.render()).toContain('Confirm your Rebirth'); h.rebirthControls.cancel(); expect(f.game.getSnapshot().result.state).toBe(before);
    h.rebirthControls.request(); h.rebirthControls.confirm(); expect(f.game.getSnapshot().result.state.permanentProgression.rebirthCount).toBe(before.permanentProgression.rebirthCount+1);
    expect(h.render()).toContain('REBIRTH COMPLETE'); f.game.stop();
  });
  it('Empire export/import keeps draft and validation across navigation and replaces only on confirm', () => {
    const f = rebirthRuntime(), h = harness(view(f.game.getSnapshot().result.state, { saveActions: f.game }));
    h.select(SECTION.empire.id); h.saveControls.exportCode(); expect(h.saveControls.getSnapshot().exported.startsWith('CE1-')).toBe(true);
    const incoming = performStarterJob(fresh()).state, code = exportSaveCode(incoming,0); if (!code.ok) throw Error('fixture');
    const before = f.game.getSnapshot().result.state; h.saveControls.edit(code.code); h.saveControls.validate();
    h.select(SECTION.city.id); h.render(); expect(f.game.getSnapshot().result.state).toBe(before);
    h.select(SECTION.empire.id); expect(h.render()).toContain('Confirm import'); expect(h.saveControls.getSnapshot().input).toBe(code.code);
    h.saveControls.confirm(); expect(f.game.getSnapshot().result.state).toEqual(incoming); expect(h.render()).toContain('Save imported');
    expect(h.props().active).toBe(SECTION.empire.id); f.game.stop();
  });
  it('v15 and CE1 contain only the original authoritative state, never section/confirmation state', () => {
    const state = autoUpgraderState(), h = harness(view(state)); h.select(SECTION.empire.id); h.rebirthControls.request();
    const saved = serializeSave(state,1234), code = exportSaveCode(state,1234); if (!saved.ok || !code.ok) throw Error('fixture');
    expect(CURRENT_SAVE_VERSION).toBe(15); expect(code.code.startsWith('CE1-')).toBe(true);
    expect(validateSaveCode(code.code)).toMatchObject({ok:true,envelope:{version:15,state}});
    expect(saved.serialized).not.toMatch(/activeSection|navigation|confirming|overview|sectionId/);
  });
});
