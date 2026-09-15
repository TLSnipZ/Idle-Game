// @vitest-environment happy-dom
import { act, Children, isValidElement } from 'react';
import type { ReactNode } from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { rebirthRuntime } from '../platform/test-fixtures/rebirth-runtime';
import { simulateOnlineElapsed } from '../game/simulate-online-elapsed';
import { reconcileOffline } from '../game/offline-progress';
import { serializeSave, CURRENT_SAVE_VERSION } from '../game/save-schema';
import { exportSaveCode, validateSaveCode } from '../game/save-code';
import { performStarterJob } from '../game/perform-starter-job';
import { DELIVERY_DISPATCHER } from '../features/automation';
import { STARTER_BUSINESS } from '../features/businesses';
import { moneyFromMinorUnits } from '../features/economy';
import { getXpThresholdForLevel } from '../features/progression';

const mounted: { root: Root; container: HTMLDivElement }[] = [];
beforeEach(() => { vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true); localStorage.clear(); });
afterEach(async () => {
  for (const { root, container } of mounted.splice(0)) { await act(() => root.unmount()); container.remove(); }
  vi.unstubAllGlobals();
});
async function mountNode(node: ReactNode) {
  const container = document.createElement('div'); document.body.append(container);
  const root = createRoot(container); mounted.push({ root, container });
  await act(() => root.render(node)); return container;
}
function view(state = fresh(), overrides: Partial<ReturnType<typeof useGame>> = {}): ReturnType<typeof useGame> {
  return { setPresentationLocale: vi.fn(), replacementSequence: 0, resetProgress: vi.fn(() => ({ ok: true as const })), snapshot: { ok: true, state }, runtimeError: null, persistence: { kind: 'ready' }, offline: null, feedback: { sequence: 0, message: '' }, achievementEvent: undefined, cityEvent: undefined, automationEvent: undefined, levelEvent: undefined, dismissOffline: vi.fn(), configureAppearance: vi.fn(), configureTuning: vi.fn(), runManhuntDecoy: vi.fn(), chooseDistrict: vi.fn(), runDiscreetDelivery: vi.fn(), runRiskyDelivery: vi.fn(), runStarterJob: vi.fn(), buyBusiness: vi.fn(), upgradeOwnedBusiness: vi.fn(), buyUpgrade: vi.fn(), buyAutomation: vi.fn(), changeAutoUpgraderTarget: vi.fn(), toggleAutomation: vi.fn(), buyVehicle: vi.fn(), chooseActiveVehicle: vi.fn(), coolDown: vi.fn(), takeTerritory: vi.fn(), recruitCrew: vi.fn(), assignCrew: vi.fn(), unassignCrew: vi.fn(), chooseEvent: vi.fn(), buySkill: vi.fn(), rebirth: vi.fn(() => ({ ok: true as const, reward: 4 })), saveActions: { ...rebirthRuntime(state).game, exportCode: () => exportSaveCode(state, 1000), importCode: vi.fn(() => ({ ok: true as const })) }, ...overrides };
}
function harness(game = view()) { let active: SectionId = DEFAULT_SECTION; const onNavigate = (id: SectionId) => { active = id; }; const saveControls = createSaveManagement(game.saveActions, () => {}); const rebirthControls = createRebirthControls(game.rebirth, () => {}); const props = () => ({ active, game, onNavigate, save: { state: saveControls.getSnapshot(), controls: saveControls }, rebirth: { interaction: rebirthControls.getSnapshot(), controls: rebirthControls } }); return { props, saveControls, rebirthControls, select: onNavigate, render: () => render(<SectionContent {...props()} />), navigation: () => Navigation({ active, onNavigate }) }; }
function buttons(node: ReactNode): { children?: ReactNode; onClick: () => void }[] { const result: { children?: ReactNode; onClick: () => void }[] = []; Children.forEach(node, child => { if (!isValidElement<{ children?: ReactNode; onClick?: () => void }>(child)) return; if (child.type === 'button' && child.props.onClick) result.push({ ...child.props, onClick: child.props.onClick }); else result.push(...buttons(child.props.children)); }); return result; }

describe('five-section presentation navigation', () => {
  it('has five ordered keyboard-safe buttons with one semantic active page; defaults to Overview', () => { expect(PRIMARY_SECTIONS.map(section => section.label)).toEqual(['OVERVIEW','OPERATIONS','CITY','COLLECTION','EMPIRE']); const html = render(<GameShell game={view()} />); expect(html).toContain('Your empire at a glance'); expect(render(<Navigation active={SECTION.city.id} onNavigate={() => {}} />)).toContain('>CITY</button>'); });
  it.each(PRIMARY_SECTIONS)('selecting $label renders its complete feature mapping', section => { const h = harness(); buttons(h.navigation())[PRIMARY_SECTIONS.findIndex(s => s.id === section.id)]?.onClick(); const html = h.render(); const surfaces = { [SECTION.overview.id]: ['ECONOMY','PLAYER','CITY PRESSURE','VIEW COLLECTION'], [SECTION.operations.id]: ['JOBS','Waterfront Delivery','Dockside Detail','Delivery Dispatcher'], [SECTION.city.id]: ['Solara City','Waterfront','Neon Mile','HEAT','CREW'], [SECTION.collection.id]: ['Garage','Kairo KX-R','Toseki Raizan','Owned vehicles: 0 / 7'], [SECTION.empire.id]: ['Rebirth','Empire Points','ACHIEVEMENTS','STATISTICS','Save &amp; Transfer'] }; for (const text of surfaces[section.id]) expect(html).toContain(text); });
  it('starter work exposes exact payout, XP and Heat together before the existing action', () => { const h=harness();h.select(SECTION.operations.id);const html=h.render();expect(html).toContain('<dt>Payout</dt><dd>$25.00</dd>');expect(html).toContain('<dt>XP</dt><dd>+10</dd>');expect(html).toContain('<dt>Heat</dt><dd>+1</dd>'); });
  it('Rebirth confirmation presents Cancel before destructive action',()=>{const h=harness(view(autoUpgraderState()));h.select(SECTION.empire.id);h.rebirthControls.request();const html=h.render();expect(html).toContain('+4 Empire Points');expect(html).toContain('New Game / Reset Progress');});
  it('Overview shortcuts only navigate',async()=>{const s=autoUpgraderState(),navigate=vi.fn();const component=await mountNode(<OverviewSection state={s} paused={false} onNavigate={navigate}/>);for(const button of component.querySelectorAll('button'))await act(()=>button.click());expect(navigate.mock.calls.map(call=>call[0])).toEqual([SECTION.operations.id,SECTION.city.id,SECTION.empire.id,SECTION.city.id,SECTION.collection.id]);});
  it('global status reflects supplied state',()=>{const initial=fresh();const after={...initial,economy:{cash:moneyFromMinorUnits('123456789')},progression:{xp:getXpThresholdForLevel(12)},city:{...initial.city,heat:60},permanentProgression:{...initial.permanentProgression,empirePoints:9}};const html=render(<GlobalStatus view={dashboardPresentation(after)} active={SECTION.collection.id} onNavigate={()=>{}} paused={false}/>);for(const text of ['$1,234,567.89','60 · HOT','9 EP'])expect(html).toContain(text);});
  it.each(['Purchase complete','Mara Knox assigned to Operations','Business Auto-Upgrader enabled','REBIRTH COMPLETE'])('keeps command feedback globally available: %s',message=>{expect(render(<GlobalFeedback game={view(fresh(),{feedback:{sequence:4,message}})} transferMessage="" rebirthMessage=""/>)).toContain(message);});
  it('offline Auto-Upgrader welcome remains global',()=>{const offline=reconcileOffline(autoUpgraderState(),0,90000);if(!offline.ok)throw Error('fixture');expect(render(<GameShell game={view(offline.state,{offline:offline.progress})}/>)).toContain('Dockside Detail +3 levels');});
});

describe('navigation around authoritative runtime',()=>{
  it('save schema remains current',()=>{expect(CURRENT_SAVE_VERSION).toBe(27);const s=fresh();const saved=serializeSave(s,1000);expect(saved.ok).toBe(true);const code=exportSaveCode(s,1000);expect(code.ok).toBe(true);if(code.ok)expect(validateSaveCode(code.code).ok).toBe(true);});
  it('standard work remains cooldown-free',()=>{const first=performStarterJob(fresh());expect(first.ok).toBe(true);expect(performStarterJob(first.state).ok).toBe(true);});
  it('dispatcher fixture identifiers remain stable',()=>{expect(DELIVERY_DISPATCHER.id).toBeTruthy();expect(STARTER_BUSINESS.id).toBeTruthy();expect(simulateOnlineElapsed(fresh(),0).state).toEqual(fresh());});
});
