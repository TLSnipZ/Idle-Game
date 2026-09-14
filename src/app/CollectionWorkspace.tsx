import { useEffect, useRef, useState } from 'react';
import type { VehicleId } from '../features/vehicles';
import { findVehicle, STARTER_VEHICLE } from '../features/vehicles';
import type { GameState } from '../game/game-state';
import { Garage } from './Garage';
import { VehicleTuning } from './VehicleTuning';
import { VehicleAppearance } from './VehicleAppearance';
import { useLocalizedText } from './LocalizationProvider';
import './CollectionWorkspace.css';

export interface CollectionDestination { readonly sequence: number; readonly headingId: string; }
type View = 'garage' | 'tuning' | 'appearance';
export function CollectionWorkspace({ state, paused, onPurchase, onSelect, onConfigure, onApply, destination }: {
  readonly destination?: CollectionDestination | null;
  readonly state: GameState; readonly paused: boolean;
  readonly onPurchase: (id: string) => void; readonly onSelect: (id: string) => void;
  readonly onConfigure: (vehicleId: string, id: string | null, purchase: boolean) => void;
  readonly onApply: (vehicleId: string, id: string | null) => void;
}) {
  const text = useLocalizedText();
  const [view, setView] = useState<View>('garage');
  const [inspected, setInspected] = useState<VehicleId>(state.garage.activeVehicleId ?? STARTER_VEHICLE.id);
  const [workshopVehicle, setWorkshopVehicle] = useState<VehicleId>(state.garage.activeVehicleId ?? STARTER_VEHICLE.id);
  const [focusRequest, setFocusRequest] = useState(0);
  const handled = useRef(0);
  const focusTarget = useRef<string | null>(null);
  function open(next: View, target?: string) { focusTarget.current = target ?? null; setView(next); setFocusRequest(n => n + 1); }
  useEffect(() => {
    if (handled.current === focusRequest) return;
    handled.current = focusRequest;
    const focus = () => {
    const heading = document.getElementById(focusTarget.current ?? `${view === 'garage' ? 'garage' : view === 'tuning' ? 'tuning' : 'appearance'}-heading`);
    if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); heading.scrollIntoView({ block: 'start', behavior: 'instant' }); }
    };
    if (focusTarget.current?.startsWith('vehicle:')) { const frame = requestAnimationFrame(focus); return () => cancelAnimationFrame(frame); }
    focus();
  }, [view, focusRequest]);
  useEffect(() => {
    if (!destination) return;
    const vehicle = findVehicle(destination.headingId.replace(/-heading$/, ''));
    if (vehicle) { setInspected(vehicle.id); }
    const next = destination.headingId === 'tuning-heading' ? 'tuning' : destination.headingId === 'appearance-heading' ? 'appearance' : 'garage';
    open(next, destination.headingId);
  }, [destination]);
  return <div className="collection-workspace">
    <nav className="collection-navigation" aria-label={text('Collection views', 'Sammlungsansichten')}>
      <button type="button" className="collection-tab" data-collection-view="garage" aria-pressed={view === 'garage'} onClick={() => open('garage')}>{text('Garage', 'Garage')}</button>
      <button type="button" className="collection-tab" data-collection-view="workshop" aria-pressed={view !== 'garage'} onClick={() => open('tuning')}>{text('Workshop', 'Werkstatt')}</button>
    </nav>
    <div hidden={view !== 'garage'}><Garage state={state} paused={paused} onPurchase={onPurchase} onSelect={onSelect} selectedVehicle={inspected} revealRequest={destination?.headingId.startsWith('vehicle:') ? destination.sequence : 0} onInspect={setInspected} onWorkshop={id => { setWorkshopVehicle(id); open('tuning'); }} /></div>
    <div hidden={view === 'garage'} className="workshop-workspace">
      <nav className="workshop-navigation" aria-label={text('Workshop services', 'Werkstattbereiche')}>
        <button type="button" data-workshop-view="tuning" aria-pressed={view === 'tuning'} onClick={() => open('tuning')}>{text('Tuning', 'Tuning')}</button>
        <button type="button" data-workshop-view="appearance" aria-pressed={view === 'appearance'} onClick={() => open('appearance')}>{text('Paint studio', 'Lackierung')}</button>
      </nav>
      <div hidden={view !== 'tuning'}><VehicleTuning state={state} paused={paused} selectedVehicle={workshopVehicle} onChooseVehicle={setWorkshopVehicle} onConfigure={onConfigure} /></div>
      <div hidden={view !== 'appearance'}><VehicleAppearance state={state} paused={paused} selectedVehicle={workshopVehicle} onChooseVehicle={setWorkshopVehicle} onApply={onApply} /></div>
    </div>
  </div>;
}
