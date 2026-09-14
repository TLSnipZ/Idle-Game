import type { CollectionDestination } from './CollectionWorkspace';
import { CollectionWorkspace } from './CollectionWorkspace';
import { SectionWorkspace } from './SectionWorkspace';
import type { WorkspaceDestination } from './SectionWorkspace';
import type { useGame } from './use-game';
import type { Navigate, SectionId } from './navigation';
import { SECTION } from './navigation';
import { OverviewSection } from './OverviewSection';
import { OperationsSection } from './OperationsSection';
import { City } from './City';
import { CrewPanel } from './CrewPanel';
import { CityEvents } from './CityEvents';
import { RebirthPanelView } from './RebirthPanel';
import type { useRebirthControls } from './RebirthPanel';
import { selectRebirth } from '../game/rebirth';
import { SkillTree } from './SkillTree';
import { Achievements } from './Achievements';
import { ResetProgress } from './ResetProgress';
import { Statistics } from './Statistics';
import { SaveManagementView } from './SaveManagement';
import type { useSaveManagement } from './SaveManagement';
import { useLocalizedText } from './LocalizationProvider';

export interface SectionContentProps {
  readonly workspaceDestination?: WorkspaceDestination | null;
  readonly operationsDestination?: CollectionDestination | null;
  readonly collectionDestination?: CollectionDestination | null;
  readonly active: SectionId;
  readonly game: ReturnType<typeof useGame>;
  readonly onNavigate: Navigate;
  readonly save: ReturnType<typeof useSaveManagement>;
  readonly rebirth: ReturnType<typeof useRebirthControls>;
}
/** One active presentation tree. Runtime and confirmation controllers live above it. */
export function SectionContent({ active, game, onNavigate, save, rebirth, collectionDestination, operationsDestination, workspaceDestination }: SectionContentProps) {
  const text = useLocalizedText();
  const state = game.snapshot.state;
  const paused = game.runtimeError !== null;
  switch (active) {
    case SECTION.overview.id: return <OverviewSection state={state} paused={paused} onNavigate={onNavigate} />;
    case SECTION.operations.id: return <OperationsSection key={game.replacementSequence} game={game} destination={operationsDestination ?? null} />;
    case SECTION.city.id: return <SectionWorkspace name="city" destination={workspaceDestination ?? null} views={[
      { id: 'city-heading', label: ['Districts & Heat', 'Bezirke & Heat'], content:
        <City state={state} paused={paused || game.persistence.kind === 'blocked'} onAcquire={game.takeTerritory} onLayLow={game.coolDown} onChooseDistrict={game.chooseDistrict} onDecoy={game.runManhuntDecoy} /> },
      { id: 'crew-heading', label: ['Crew', 'Crew'], content:
        <CrewPanel state={state} paused={paused} onRecruit={game.recruitCrew} onAssign={game.assignCrew} onUnassign={game.unassignCrew} /> },
      { id: 'city-events-heading', label: ['Events', 'Events'], pending: state.events.pendingEventId !== null, content:
        <CityEvents state={state} paused={paused} onChoose={game.chooseEvent} /> },
    ]} />;
    case SECTION.collection.id: return <CollectionWorkspace destination={collectionDestination ?? null} key={game.replacementSequence} state={state} paused={paused || game.persistence.kind === 'blocked'} onPurchase={game.buyVehicle} onSelect={game.chooseActiveVehicle} onConfigure={game.configureTuning} onApply={game.configureAppearance} />;
    case SECTION.empire.id: return <SectionWorkspace name="empire" destination={workspaceDestination ?? null} views={[
      { id: 'rebirth-heading', label: ['Rebirth', 'Rebirth'], pending: rebirth.interaction.confirming, content:
        <RebirthPanelView preview={selectRebirth(state)} unavailable={paused || game.persistence.kind === 'blocked'} interaction={rebirth.interaction} controls={rebirth.controls} /> },
      { id: 'skill-tree-heading', label: ['Skills', 'Skills'], content: <SkillTree state={state} paused={paused} onPurchase={game.buySkill} /> },
      { id: 'achievements-heading', label: ['Achievements', 'Achievements'], content: <Achievements state={state} /> },
      { id: 'statistics-heading', label: ['Statistics', 'Statistiken'], content: <Statistics state={state} /> },
      { id: 'save-transfer-heading', label: ['Save & Transfer', 'Speichern & Transfer'], pending: save.state.confirming, content:
        <section aria-labelledby="save-transfer-heading"><h2 id="save-transfer-heading">{text('Save & Transfer', 'Speichern & Schmuggeln')}</h2>
          <SaveManagementView state={save.state} controls={save.controls} />
          <ResetProgress key={game.replacementSequence} unavailable={paused || game.persistence.kind === 'blocked'} onReset={game.resetProgress} />
        </section> },
    ]} />;
  }
}
