import { formatModifier } from './stat-format';
import { findBusiness } from '../features/businesses';
import { findCrewMember } from '../features/crew';
import { findVehicle } from '../features/vehicles';
import { findTerritory } from '../features/territories';
import type { evaluateDecoyCost } from '../game/heat-support';
import { formatPrice } from './number-format';
import { useLocalizedText } from './LocalizationProvider';

export function HeatSupport({ pricing }: { readonly pricing: ReturnType<typeof evaluateDecoyCost> }) {
  const text = useLocalizedText();
  return <details className="heat-support">
    <summary>{text('SUPPORT NETWORK', 'UNTERSTÜTZUNGSNETZ')} · {formatPrice(pricing.baseCost)} → {formatPrice(pricing.cost)}</summary>
    <p>{text('Build local cover, assign your fixer and choose a quiet car. Active discounts multiply; ownership alone does not activate Crew or Garage support.',
      'Baue lokale Deckung auf, setze deine Fixerin ein und wähle ein unauffälliges Auto. Aktive Rabatte werden multipliziert; Crew und Autos müssen im Einsatz sein.')}</p>
    <ul>{pricing.support.map(({ rule, active }) => {
      const modifier = rule.modifier, sourceId = modifier.sourceId;
      const name = findBusiness(sourceId)?.name ?? findCrewMember(sourceId)?.name ?? findVehicle(sourceId)?.name ?? '';
      const requirement = rule.kind === 'local-business'
        ? text(`Level ${rule.minimumLevel} · operating in ${findTerritory(rule.districtId)?.name}`,
          `Level ${rule.minimumLevel} · Einsatz in ${findTerritory(rule.districtId)?.name}`)
        : rule.kind === 'assigned-crew' ? text('Assigned to Operations', 'In Operationen eingesetzt')
          : text('Active vehicle', 'Aktives Fahrzeug');
      const discount = modifier.operation === 'multiply-basis-points' ? -modifier.bonusBasisPoints / 100 : 0;
      return <li key={modifier.id} data-support-active={active}>
        <strong>{text(name)} · −{discount}%</strong><span>{requirement}</span>
        <span>{active ? text('Active', 'Aktiv') : text('Not active', 'Nicht aktiv')}</span>
      </li>;
    })}
    {pricing.tuning && <li data-support-active={true}>
      <strong>{text(pricing.tuning.name, pricing.tuning.germanName)} · {formatModifier(pricing.tuning.modifier)}</strong>
      <span>{text('Fitted to the active vehicle', 'Im aktiven Fahrzeug eingebaut')}</span>
      <span>{text('Active', 'Aktiv')}</span>
    </li>}</ul>
    <p>{text('Discounts apply only to the decoy price. The response still removes the same local Heat and grants no reward.',
      'Rabatte gelten nur für den Preis des Ablenkungsmanövers. Es senkt weiterhin gleich viel lokales Heat und gibt keine Belohnung.')}</p>
  </details>;
}
