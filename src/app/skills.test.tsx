import { describeAutomatedJobs } from './automation-presentation';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SkillTree } from './SkillTree';
import { describeSkillEffect, describeSkillPurchase } from './skill-presentation';
import { describeAction } from './game-presentation';
import { ModifierBreakdown } from './ModifierBreakdown';
import { OfflineReturn } from './OfflineReturn';
import { RebirthPanelView } from './RebirthPanel';
import { createRebirthControls } from './rebirth-controls';
import { selectRebirth, performRebirth } from '../game/rebirth';
import { selectSkill } from '../game/skill-selectors';
import { purchaseSkillRank } from '../game/purchase-skill-rank';
import { skillState, ROOT, FAST, LEARN, SILENT, NEVER } from '../game/test-fixtures/skill-state';
import { rebirthState } from '../game/test-fixtures/rebirth-state';
import { SKILL_CATALOG } from '../features/skills';
import { performStarterJob } from '../game/perform-starter-job';
import { upgradeBusiness } from '../game/upgrade-business';
import { STARTER_BUSINESS as B } from '../features/businesses';
import { evaluateBusinessProduction } from '../game/effective-stats';
import { reconcileOffline } from '../game/offline-progress';
import { rebirthRuntime } from '../platform/test-fixtures/rebirth-runtime';

const render = (state = skillState()) => renderToStaticMarkup(<SkillTree state={state} paused={false} onPurchase={() => {}} />);
describe('Empire Foundations presentation and interactions', () => {
  it('shows precisely five ordered, labelled nodes and unspent EP', () => {
    const html = render();
    expect(html).toContain('Empire Foundations'); expect(html).toContain('30 EP');
    expect(html.match(/<article/g)).toHaveLength(5);
    const positions = SKILL_CATALOG.map(s => html.indexOf(`<h3 id="${s.id}-heading">`));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(html).toContain('aria-label="Purchase next rank of Streetwise Investment"');
    expect(html).toContain('aria-describedby="skill:fast-talker-requirements"');
    expect(html).toContain('Rank 0 / 3'); expect(html).toContain('Current: +0% global business production');
    expect(html).toContain('Next rank: +5% global business production');
  });
  it('distinguishes requirement locks, EP affordability, availability and max rank', () => {
    expect(selectSkill(skillState(), FAST)).toMatchObject({ canPurchase: false, affordable: true, requirements: { met: false } });
    expect(render()).toContain('LOCKED'); expect(render()).toContain('Streetwise Investment Rank 1');
    const broke = skillState({ [ROOT]: 1 }, 0);
    expect(selectSkill(broke, FAST)).toMatchObject({ canPurchase: false, insufficientEp: true, requirements: { met: true } });
    expect(render(broke)).toContain('AVAILABLE · INSUFFICIENT EP');
    expect(selectSkill(skillState({ [ROOT]: 1 }), FAST)).toMatchObject({ canPurchase: true, nextCost: 1 });
    const maxed = skillState({ [ROOT]: 3, [FAST]: 2, [LEARN]: 2, [SILENT]: 2, [NEVER]: 2 });
    expect(render(maxed).match(/MAXED/g)).toHaveLength(5); expect(render(maxed)).not.toContain('Purchase rank');
  });
  it('a purchase immediately updates ranks, available EP and exact effect feedback', () => {
    const f = rebirthRuntime(skillState({}, 4)); let message = '';
    f.game.execute(state => { const result = purchaseSkillRank(state, ROOT); message = describeSkillPurchase(result, ROOT); return result; });
    expect(render(f.game.getSnapshot().result.state)).toContain('3 EP');
    expect(render(f.game.getSnapshot().result.state)).toContain('Rank 1 / 3');
    expect(message).toContain('Rank 1'); expect(message).toContain('−1 EP'); expect(message).toContain('+5%');
    f.game.stop();
  });
  it('describes every structured purchase failure without parsing arbitrary text', () => {
    expect(describeSkillPurchase(purchaseSkillRank(skillState({}, 0), ROOT), ROOT)).toContain('Not enough Empire Points');
    expect(describeSkillPurchase(purchaseSkillRank(skillState(), FAST), FAST)).toContain('Requirements not met');
    expect(describeSkillPurchase(purchaseSkillRank(skillState({ [ROOT]: 3 }), ROOT), ROOT)).toContain('max rank');
    expect(describeSkillPurchase(purchaseSkillRank(skillState(), 'unknown'), 'unknown')).toContain('unavailable');
  });
  it('cap effects show derived current and next totals, then maxed 12h', () => {
    const view = selectSkill(skillState({ [ROOT]: 2 }), NEVER); if (!view?.nextEffect) throw Error('fixture');
    expect(describeSkillEffect(view.currentEffect)).toBe('8h offline cap');
    expect(describeSkillEffect(view.nextEffect)).toBe('10h offline cap');
    const bought = purchaseSkillRank(skillState({ [ROOT]: 2 }), NEVER);
    expect(describeSkillPurchase(bought, NEVER)).toContain('10h offline cap');
    expect(render(skillState({ [NEVER]: 2 }))).toContain('12h offline cap');
  });
  it('manual and business feedback display the actual floored integer XP and evaluated Money', () => {
    const state = skillState({ [FAST]: 1, [LEARN]: 1 });
    expect(describeAction('delivery', performStarterJob(state))).toContain('+$27.50 · +11 XP');
    expect(describeAction('upgrade', upgradeBusiness(state, B.id))).toContain('+27 XP');
    const batch = reconcileOffline(state, 0, 30000); if (!batch.ok || !batch.progress.automation) throw Error('fixture');
    expect(describeAutomatedJobs(batch.progress.automation)).toContain('+16 XP');
  });
  it('permanent sources appear in the same production breakdown', () => {
    const result = evaluateBusinessProduction(skillState({ [ROOT]: 2, [SILENT]: 1 }), B.id, 1);
    if (!result.ok) throw Error('fixture');
    const html = renderToStaticMarkup(<ModifierBreakdown modifiers={result.applied} />);
    expect(html).toContain('Streetwise Investment: +10%'); expect(html).toContain('Silent Partner: +10%');
  });
  it.each([0, 1, 2])('offline rank %i uses the recorded cap and dispatcher batch XP', rank => {
    const state = skillState({ [FAST]: 1, [LEARN]: 1, ...(rank ? { [NEVER]: rank } : {}) });
    const offline = reconcileOffline(state, 0, 20 * 3600000); if (!offline.ok) throw Error('fixture');
    const html = renderToStaticMarkup(<OfflineReturn progress={offline.progress} onDismiss={() => {}} />);
    expect(html).toContain(`Offline earnings capped at ${8 + 2 * rank}h`);
    expect(html).toContain('XP earned: +'); expect(html).toContain('Dispatcher:');
    const brief = reconcileOffline(state, 0, 30000); if (!brief.ok) throw Error('fixture');
    const shortHtml = renderToStaticMarkup(<OfflineReturn progress={brief.progress} onDismiss={() => {}} />);
    expect(shortHtml).toContain('XP earned: +16 XP'); expect(shortHtml).not.toContain('capped at');
  });
  it('Rebirth still requires confirmation, lists permanent skills and keeps ranks/EP without refunds', () => {
    const f = rebirthRuntime({ ...rebirthState(), permanentProgression: skillState({ [ROOT]: 1, [FAST]: 1 }, 2).permanentProgression });
    const controls = createRebirthControls(() => f.game.rebirth(), () => {});
    const panel = () => renderToStaticMarkup(<RebirthPanelView preview={selectRebirth(f.game.getSnapshot().result.state)}
      unavailable={false} interaction={controls.getSnapshot()} controls={controls} />);
    const before = f.raw(); controls.request(); expect(f.raw()).toBe(before);
    expect(panel()).toContain('Permanent skills'); expect(panel()).toContain('You lose');
    controls.cancel(); expect(f.raw()).toBe(before); controls.confirm(); expect(f.raw()).toBe(before);
    controls.request(); controls.confirm(); const state = f.game.getSnapshot().result.state;
    expect(state.permanentProgression.empirePoints).toBe(6); expect(state.permanentProgression.rebirthCount).toBe(2);
    expect(render(state)).toContain('6 EP'); expect(render(state)).toContain('Rank 1 / 2');
    expect(panel()).toContain('REBIRTH COMPLETE'); expect(state.upgrades.purchasedIds).toEqual([]); f.game.stop();
  });
  it('keeps the canonical reward formula and semantic controls', () => {
    expect(performRebirth(rebirthState()).ok).toBe(true); expect(selectRebirth(rebirthState()).reward).toBe(4);
    expect(render()).toContain('<button');
  });
});
