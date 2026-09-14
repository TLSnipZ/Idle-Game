import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { VehicleTuning } from './VehicleTuning';
import { VehicleAppearance } from './VehicleAppearance';
import { LocalizationProvider } from './LocalizationProvider';
import { createInitialGameState } from '../game/game-state';
import { NAMERA_SEREIN as N } from '../features/vehicles';
it.each(['en','de','villager'] as const)('%s explains factory-only Serein without unusable customization actions',locale=>{
  const state={...createInitialGameState(),garage:{ownedVehicleIds:[N.id],activeVehicleId:N.id}};
  const html=renderToStaticMarkup(<LocalizationProvider locale={locale}>
    <VehicleTuning state={state} paused={false} onConfigure={()=>{throw Error('no parts');}} />
    <VehicleAppearance state={state} paused={false} onApply={()=>{throw Error('no finishes');}} />
  </LocalizationProvider>);
  expect(html.match(/class="stock-only-notice"/g)).toHaveLength(2);
  expect(html).not.toContain('<button');
  expect(html).toContain('value="vehicle:namera-serein" selected');
});
