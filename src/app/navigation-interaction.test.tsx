// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { App } from './App';
import { createPersistentGame } from '../platform/persistent-game';
import { createLocalSave } from '../platform/local-save';
import { createInitialGameState } from '../game/game-state';
import { serializeSave } from '../game/save-schema';
import { getLevelProgress, getXpThresholdForLevel } from '../features/progression';
import { PRIMARY_SECTIONS } from './navigation';

vi.mock('../platform/persistent-game', async importOriginal => { const original=await importOriginal<typeof import('../platform/persistent-game')>();return{...original,createPersistentGame:vi.fn(original.createPersistentGame)}; });
const original=await vi.importActual<typeof import('../platform/persistent-game')>('../platform/persistent-game');
let root:Root|undefined;let container:HTMLDivElement;
beforeEach(()=>{vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);container=document.createElement('div');document.body.append(container);});
afterEach(async()=>{if(root)await act(()=>root?.unmount());root=undefined;container.remove();vi.restoreAllMocks();vi.unstubAllGlobals();});
async function mount(state=createInitialGameState()){const encoded=serializeSave(state,1000);if(!encoded.ok)throw Error('fixture');let raw=encoded.serialized;let session:ReturnType<typeof createPersistentGame>|undefined;vi.mocked(createPersistentGame).mockImplementation(publish=>{session=original.createPersistentGame(publish,createLocalSave(()=>({getItem:()=>raw,setItem:(_key,value)=>{raw=value;}}),()=>1000),{random:{next:()=>.99},now:()=>0,schedule:()=>()=>{}},()=>()=>{});return session;});root=createRoot(container);await act(()=>root?.render(<App/>));return()=>{if(!session)throw Error('runtime');return session;};}
async function navigate(label:string){const found=[...container.querySelectorAll('.primary-navigation button')].find(b=>b.textContent===label);if(!(found instanceof HTMLButtonElement))throw Error(`Missing nav ${label}`);await act(()=>found.click());}

it('global XP survives all sections and standard delivery keeps usable focus after level-up',async()=>{const state=createInitialGameState();const game=await mount({...state,progression:{xp:getXpThresholdForLevel(2)-10}});const progress=container.querySelector<HTMLProgressElement>('.hud-xp-progress');for(const section of PRIMARY_SECTIONS){await navigate(section.label);expect(container.querySelector('.hud-xp-progress')).toBe(progress);}await navigate('OPERATIONS');const delivery=container.querySelector<HTMLButtonElement>('.delivery-button');delivery?.focus();await act(()=>delivery?.click());const authority=getLevelProgress(game().getSnapshot().result.state.progression.xp);expect(authority.currentLevel).toBe(2);expect(progress?.value).toBe(authority.xpIntoLevel);expect(progress?.max).toBe(authority.xpNeededForLevel);expect(document.activeElement).toBe(delivery);expect(delivery?.isConnected).toBe(true);});
