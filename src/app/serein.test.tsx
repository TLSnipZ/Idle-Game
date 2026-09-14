import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { VehicleTuning } from './VehicleTuning';
import { VehicleAppearance } from './VehicleAppearance';
import { LocalizationProvider } from './LocalizationProvider';
import { createInitialGameState } from '../game/game-state';
import { NAMERA_SEREIN as N, TOSEKI_RENDAN as R, SEVRIN_CANTO_CLUB as C } from '../features/vehicles';
it.each([N,R,C].flatMap(car => (['en','de','villager'] as const).map(locale => ({car,locale}))))('$locale explains factory-only $car.name without unusable customization actions',({car,locale})=>{
  const state={...createInitialGameState(),garage:{ownedVehicleIds:[car.id],activeVehicleId:car.id}};
  const html=renderToStaticMarkup(<LocalizationProvider locale={locale}>
    <VehicleTuning state={state} paused={false} onConfigure={()=>{throw Error('no parts');}} />
    <VehicleAppearance state={state} paused={false} onApply={()=>{throw Error('no finishes');}} />
  </LocalizationProvider>);
  expect(html.match(/class="stock-only-notice"/g)).toHaveLength(2);
  expect(html).not.toContain('<button');
  expect(html).toContain(`value="${car.id}" selected`);
});
