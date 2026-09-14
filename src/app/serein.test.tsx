import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { VehicleTuning } from './VehicleTuning';
import { VehicleAppearance } from './VehicleAppearance';
import { LocalizationProvider } from './LocalizationProvider';
import { createInitialGameState } from '../game/game-state';
import { NAMERA_SEREIN as N, TOSEKI_RENDAN as R, SEVRIN_CANTO_CLUB as C } from '../features/vehicles';
it.each([N,R,C].flatMap(car => (['en','de','villager'] as const).map(locale => ({car,locale}))))('$locale offers model-compatible customization for $car.name',({car,locale})=>{
  const state={...createInitialGameState(),garage:{ownedVehicleIds:[car.id],activeVehicleId:car.id}};
  const html=renderToStaticMarkup(<LocalizationProvider locale={locale}>
    <VehicleTuning state={state} paused={false} onConfigure={()=>{throw Error('render must not configure');}} />
    <VehicleAppearance state={state} paused={false} onApply={()=>{throw Error('render must not apply');}} />
  </LocalizationProvider>);
  expect(html).not.toContain('class="stock-only-notice"');
  expect(html.match(/data-tuning-id=/g)).toHaveLength(2);
  expect(html).toContain('<button');
  expect(html).toContain(`value="${car.id}" selected`);
});
