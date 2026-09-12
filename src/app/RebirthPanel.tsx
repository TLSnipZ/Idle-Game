import { formatInteger } from './number-format';
import { useEffect, useRef, useState } from 'react';
import { REBIRTH_POLICY, selectRebirth } from '../game/rebirth';
import type { GameState } from '../game/game-state';
import type { RebirthTransactionResult } from '../platform/persistent-game';
import { RequirementList } from './RequirementList';
import { createRebirthControls, INITIAL_REBIRTH_CONTROLS } from './rebirth-controls';
import type { RebirthControlsState } from './rebirth-controls';
import type { Locale } from './localization';
import { DEFAULT_LOCALE } from './localization';
import { useLocale, useLocalizedText } from './LocalizationProvider';

export function RebirthPanel({ state, unavailable, onRebirth }: {
  readonly state: GameState; readonly unavailable: boolean; readonly onRebirth: () => RebirthTransactionResult;
}) {
  const { interaction, controls } = useRebirthControls(onRebirth);
  return <RebirthPanelView preview={selectRebirth(state)} unavailable={unavailable} interaction={interaction} controls={controls} />;
}
export function useRebirthControls(onRebirth: () => RebirthTransactionResult, locale: Locale = DEFAULT_LOCALE) {
  const [interaction, setInteraction] = useState(INITIAL_REBIRTH_CONTROLS);
  const [controls] = useState(() => createRebirthControls(onRebirth, setInteraction, locale));
  return { interaction, controls };
}
function policyLabel(label: string, locale: Locale) {
  if (locale === 'en') return label.replace(' (both fractional remainders)', '');
  const translated: Record<string, string> = {
    'Active city event and opportunity progress': 'Aktives Stadtevent und Opportunity-Fortschritt',
    'Recruited Crew and active assignments': 'Rekrutierte Crew und aktive Einsätze',
    'Territories beyond the starting Waterfront foothold': 'Bezirke außer dem Startgebiet Waterfront',
    'Heat / current police attention': 'Heat / aktuelle Aufmerksamkeit der Polizei',
    'Cash': 'Cash',
    'Businesses and business levels': 'Businesses und Business-Level',
    'Temporary production progress (both fractional remainders)': 'Temporärer Produktionsfortschritt',
    'Normal upgrades': 'Normale Upgrades',
    'Delivery Dispatcher and unfinished delivery progress': 'Delivery Dispatcher und unfertiger Lieferfortschritt',
    'Business Auto-Upgrader ownership, enabled state and progress': 'Business Auto-Upgrader: Besitz, Aktivstatus und Fortschritt',
    'Player XP / Level (returns to Level 1)': 'Spieler-XP / Level (zurück auf Level 1)',
    'Vehicles': 'Fahrzeuge',
    'Empire Points': 'Empire Points',
    'Rebirth count': 'Anzahl Rebirths',
    'Permanent skills': 'Permanente Skills',
    'Achievements': 'Achievements',
    'Lifetime Statistics': 'Lifetime-Statistiken',
  };
  return translated[label] ?? label.replace(' (both fractional remainders)', '');
}
export function RebirthPanelView({ preview, unavailable, interaction, controls }: {
  readonly preview: ReturnType<typeof selectRebirth>; readonly unavailable: boolean;
  readonly interaction: RebirthControlsState; readonly controls: ReturnType<typeof createRebirthControls>;
}) {
  const locale = useLocale();
  const text = useLocalizedText();
  const heading = useRef<HTMLHeadingElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (interaction.confirming) cancel.current?.focus(); }, [interaction.confirming]);
  const policy = Object.values(REBIRTH_POLICY);
  return <section className="panel rebirth-panel" aria-labelledby="rebirth-heading">
    <div className="panel-heading"><h2 id="rebirth-heading" ref={heading} tabIndex={-1}>Rebirth</h2>
      <span className="ownership-badge">{preview.eligible ? text('REBIRTH AVAILABLE', 'REBIRTH VERFÜGBAR') : text('BUILD YOUR LEGACY', 'BAU DEIN VERMÄCHTNIS')}</span></div>
    <div className="rebirth-brief"><p>{text('Restart your temporary operation in exchange for permanent Empire Points. Corporate restructuring, but with more neon.', 'Starte deine temporäre Operation neu und kassier dafür permanente Empire Points. Konzernumbau, nur mit mehr Neon.')}</p>
    <dl className="permanent-totals"><div><dt>Empire Points</dt><dd>{formatInteger(preview.empirePoints)} EP</dd></div>
      <div><dt>Rebirths</dt><dd>{formatInteger(preview.rebirthCount)}</dd></div></dl>
    <p>{text('Invest unspent Empire Points in permanent skills that survive Rebirth.', 'Investiere übrige Empire Points in permanente Skills, die Rebirth überleben. Vermögen vergeht, Skill-Boni bleiben. Irgendwie poetisch.')}</p>
    <RequirementList result={preview.requirements} id="rebirth-requirements" />
    <p className="production rebirth-reward">{text('Reward:', 'Belohnung:')} {preview.reward === null ? text('Not eligible', 'Nicht berechtigt') : `+${formatInteger(preview.reward)} Empire Points`}</p>
    </div><div id="rebirth-policy" className="rebirth-policy">
      <div className="rebirth-keep"><h3>{text('You keep', 'Du behältst')}</h3><ul>{policy.filter(item => item.action !== 'reset').flatMap(item => item.labels).map(label => <li key={label}>{policyLabel(label, locale)}</li>)}</ul></div>
      <div className="rebirth-lose"><h3>{text('You lose', 'Du verlierst')}</h3><ul>{policy.filter(item => item.action === 'reset').flatMap(item => item.labels).map(label => <li key={label}>{policyLabel(label, locale)}</li>)}</ul></div>
    </div>
    {interaction.confirming ? <div className="save-confirm" role="group" aria-labelledby="rebirth-warning" aria-describedby="rebirth-policy">
      <h3 id="rebirth-warning">{text('Confirm your Rebirth', 'Rebirth bestätigen')}</h3>
      <p>{preview.reward === null ? text('Requirements are no longer met.', 'Voraussetzungen sind nicht mehr erfüllt.') : text(`Reset the listed temporary progress for +${formatInteger(preview.reward)} Empire Points?`, `Den aufgelisteten temporären Fortschritt für +${formatInteger(preview.reward)} Empire Points zurücksetzen?`)}</p>
      <p>{text('The reward is recalculated from current progress when confirmed. This replaces your local save.', 'Die Belohnung wird beim Bestätigen aus dem aktuellen Fortschritt neu berechnet. Dein lokaler Save wird ersetzt. Kein Rückgaberecht, kein Kassenbon.')}</p>
      <div className="confirmation-actions"><button ref={cancel} aria-label={text('Cancel Rebirth', 'Rebirth abbrechen')} className="action-button" onClick={() => { controls.cancel(); heading.current?.focus(); }}>{text('Cancel', 'Abbrechen')}</button>
      <button className="action-button rebirth-button" disabled={unavailable || !preview.eligible}
        onClick={() => { controls.confirm(); heading.current?.focus(); }}>{text('Confirm Rebirth', 'Rebirth bestätigen')}</button>
      </div>
    </div> : <button className="action-button rebirth-button" disabled={unavailable || !preview.eligible}
      aria-describedby="rebirth-requirements rebirth-policy" onClick={controls.request}>{text('Review Rebirth', 'Rebirth prüfen')}</button>}
    {unavailable && <p>{text('Rebirth requires a running session with available local saving.', 'Rebirth braucht eine laufende Session mit funktionierendem lokalem Save. Selbst Wiedergeburt benötigt Verwaltung.')}</p>}
    <p role="status" aria-live="polite" aria-atomic="true">{interaction.message}</p>
  </section>;
}
