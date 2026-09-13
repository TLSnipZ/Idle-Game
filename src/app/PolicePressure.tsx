import { getPolicePressure, POLICE_SURVEILLANCE_HEAT, RISKY_DELIVERY_HEAT_LIMIT } from '../features/heat';
import { useLocalizedText } from './LocalizationProvider';
import { heatTierLabel } from './heat-presentation';
import { useLocale } from './LocalizationProvider';

export function PolicePressure({ heat }: { readonly heat: number }) {
  const text = useLocalizedText(), locale = useLocale(), view = getPolicePressure(heat);
  return <section className="police-pressure" aria-labelledby="police-pressure-heading">
    <h4 id="police-pressure-heading">{text('POLICE PRESSURE', 'POLIZEIDRUCK')} · {heatTierLabel(view.tier.label, locale)}</h4>
    <p>{view.riskyAvailable
      ? text(`Risk premium: +${view.riskyBonusBasisPoints / 100}%. The client deducts the cost of sweating.`,
        `Risiko-Bonus: +${view.riskyBonusBasisPoints / 100}%. Der Auftraggeber zieht seine Schweißzulage ab.`)
      : text('Risky clients are not answering. Normal and discreet deliveries remain available.',
        'Riskante Auftraggeber gehen nicht mehr ran. Normale und diskrete Lieferungen bleiben verfügbar.')}</p>
    <p>{text(`From ${POLICE_SURVEILLANCE_HEAT} Heat: reduced risk premium. From ${RISKY_DELIVERY_HEAT_LIMIT}: risky deliveries blocked.`,
      `Ab ${POLICE_SURVEILLANCE_HEAT} Heat: geringerer Risiko-Bonus. Ab ${RISKY_DELIVERY_HEAT_LIMIT}: Risiko-Lieferungen gesperrt.`)}</p>
    <p>{text('Counterplay: discreet deliveries in Operations, Lay Low, or passive cooling. Mara and the active Lilt speed up passive cooling.',
      'Gegenmaßnahmen: diskrete Lieferungen unter Operationen, Untertauchen oder passiv abkühlen. Mara und der aktive Lilt beschleunigen die passive Abkühlung.')}</p>
  </section>;
}
