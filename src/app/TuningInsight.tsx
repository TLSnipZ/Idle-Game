import type { GameState } from '../game/game-state';
import { selectTuningInsight } from '../game/tuning-insight';
import { useLocalizedText } from './LocalizationProvider';
import { formatRate, formatReward } from './number-format';

export function TuningInsight({ state, partId }: { readonly state: GameState; readonly partId: string }) {
  const text = useLocalizedText();
  const insight = selectTuningInsight(state, partId);
  if (!insight) return null;
  const { before, after } = insight;
  const rows = [
    [text('Business Production', 'Business-Produktion'), text(formatRate(before.production)), text(formatRate(after.production))],
    [text('Standard delivery · Cash/job', 'Standardlieferung · Cash/Job'), formatReward(before.manual), formatReward(after.manual)],
    [text('Dispatcher · Cash/job', 'Dispatcher · Cash/Job'), formatReward(before.dispatcher), formatReward(after.dispatcher)],
  ];
  if (before.coolingMs !== after.coolingMs || before.decoy !== after.decoy) rows.push(
    [text('Cooling step · seconds', 'Abkühlschritt · Sekunden'), String(before.coolingMs / 1000), String(after.coolingMs / 1000)],
    [text('Decoy cost', 'Ablenkungskosten'), formatReward(before.decoy), formatReward(after.decoy)],
  );
  return <details className="tuning-insight">
    <summary>{text('Compare effects', 'Wirkung vergleichen')}</summary>
    <p>{text('Same car active: fitted setup → this setup. Current bonuses and Heat stay fixed.',
      'Dasselbe Auto aktiv: eingebautes Setup → dieses Setup. Aktuelle Boni und Heat bleiben gleich.')}</p>
    {insight.requiresActivation && <p className="tuning-insight-notice">{text('This car is inactive. These values apply after activation; fitting alone does not change your income.',
      'Dieses Auto ist inaktiv. Diese Werte gelten nach der Aktivierung; der Einbau allein verändert deine Einnahmen nicht.')}</p>}
    <dl>{rows.map(([label, beforeValue, afterValue]) => <div key={label}>
      <dt>{label}</dt><dd><span>{beforeValue}</span><span aria-hidden="true"> → </span><strong>{afterValue}</strong></dd>
    </div>)}</dl>
    {rows.length > 3 && <p>{text('Lower cooling time and decoy cost are better.', 'Weniger Abkühlzeit und Ablenkungskosten sind besser.')}</p>}
    {!insight.dispatcherOwned && <p>{text('Dispatcher not owned: its payout is a preview only.', 'Dispatcher nicht im Besitz: dessen Auszahlung ist nur eine Vorschau.')}</p>}
    <p>{text('Current snapshot: job payouts require an available delivery; Dispatcher uses Waterfront Heat. Future Heat, purchases and play frequency are not predicted.',
      'Momentaufnahme: Jobwerte gelten bei verfügbarer Lieferung; der Dispatcher nutzt die Waterfront-Heat. Künftige Heat, Käufe und Spielhäufigkeit werden nicht vorhergesagt.')}</p>
  </details>;
}
