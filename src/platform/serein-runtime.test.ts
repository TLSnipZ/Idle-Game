import { expect, it } from 'vitest';
import { NAMERA_SEREIN as N, STARTER_VEHICLE as K } from '../features/vehicles';
import { rebirthRuntime } from './test-fixtures/rebirth-runtime';
import { rebirthState } from '../game/test-fixtures/rebirth-state';
import { purchaseVehicle } from '../game/purchase-vehicle';
import { parseSave } from '../game/save-schema';
import { onlineElapsed } from './test-fixtures/online-elapsed';
function state() {
  const s=rebirthState();
  return {...s,businesses:{...s.businesses,owned:{...s.businesses.owned,'business:afterdark-customs':{level:1}}}};
}
it('Serein purchase is durable before publication and preserves previous active vehicle',()=>{
  const f=rebirthRuntime(state());
  const before=f.game.getSnapshot().result.state;
  expect(f.game.execute(s=>purchaseVehicle(s,N.id))?.ok).toBe(true);
  expect(f.events.filter(e=>e.state.garage.ownedVehicleIds.includes(N.id)).map(e=>e.type)).toEqual(['write','publish']);
  const after=f.game.getSnapshot().result.state;
  expect(after.garage.activeVehicleId).toBe(K.id);
  expect(BigInt(before.economy.cash)-BigInt(after.economy.cash)).toBe(8000000n);
  expect(parseSave(f.raw())).toMatchObject({ok:true,envelope:{version:24,state:after}});
  f.game.stop();
});
it.each(['quota','conflict'] as const)('%s rolls back Serein purchase and activation after old effects reconcile', failure=>{
  for(const action of ['purchase','activate'] as const) {
    const initial=action==='purchase'?state():purchaseVehicle(state(),N.id).state;
    const f=rebirthRuntime(initial),before=f.game.getSnapshot().result.state;
    if(failure==='quota')f.fail();else f.replaceRaw(f.raw()+' ');
    const raw=f.raw();f.at(1000);
    const result=action==='purchase'?f.game.execute(s=>purchaseVehicle(s,N.id)):f.game.selectActiveVehicle(N.id);
    expect(result).toBeUndefined();
    expect(f.game.getSnapshot().result.state).toEqual(onlineElapsed(before,1000).state);
    expect(f.raw()).toBe(raw);
    expect(f.events.some(e=>e.state.garage.activeVehicleId===N.id)).toBe(false);
    f.game.stop();
  }
});
