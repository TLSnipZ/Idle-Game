import type { useGame } from './use-game';
import type { Navigate, SectionId } from './navigation';
import { SECTION } from './navigation';
import { OverviewSection } from './OverviewSection';
import { OperationsSection } from './OperationsSection';
import { City } from './City';
import { CrewPanel } from './CrewPanel';
import { CityEvents } from './CityEvents';
import { Garage } from './Garage';
import { RebirthPanelView } from './RebirthPanel';
import type { useRebirthControls } from './RebirthPanel';
import { selectRebirth } from '../game/rebirth';
import { SkillTree } from './SkillTree';
import { Achievements } from './Achievements';
import { Statistics } from './Statistics';
import { SaveManagementView } from './SaveManagement';
import type { useSaveManagement } from './SaveManagement';

export interface SectionContentProps {
  readonly active: SectionId;
  readonly game: ReturnType<typeof useGame>;
  readonly onNavigate: Navigate;
  readonly save: ReturnType<typeof useSaveManagement>;
  readonly rebirth: ReturnType<typeof useRebirthControls>;
}
/** One active presentation tree. Runtime and confirmation controllers live above it. */
export function SectionContent({ active, game, onNavigate, save, rebirth }: SectionContentProps) {
  const state = game.snapshot.state;
  const paused = game.runtimeError !== null;
  switch (active) {
    case SECTION.overview.id: return <OverviewSection state={state} paused={paused} onNavigate={onNavigate} />;
    case SECTION.operations.id: return <OperationsSection game={game} />;
    case SECTION.city.id: return <div className="section-stack">
      <City state={state} paused={paused} onAcquire={game.takeTerritory} onLayLow={game.coolDown} />
      <CrewPanel state={state} paused={paused} onRecruit={game.recruitCrew} onAssign={game.assignCrew} onUnassign={game.unassignCrew} />
      <CityEvents state={state} paused={paused} onChoose={game.chooseEvent} />
    </div>;
    case SECTION.collection.id: return <Garage state={state} paused={paused} onPurchase={game.buyVehicle} />;
    case SECTION.empire.id: return <div className="section-stack">
      <RebirthPanelView preview={selectRebirth(state)} unavailable={paused || game.persistence.kind === 'blocked'} interaction={rebirth.interaction} controls={rebirth.controls} />
      <SkillTree state={state} paused={paused} onPurchase={game.buySkill} />
      <Achievements state={state} />
      <Statistics state={state} />
      <section aria-labelledby="save-transfer-heading"><h2 id="save-transfer-heading">Save &amp; Transfer</h2>
        <SaveManagementView state={save.state} controls={save.controls} /></section>
    </div>;
  }
}
