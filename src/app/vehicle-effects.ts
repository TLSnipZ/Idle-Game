import type { VehicleDefinition } from '../features/vehicles';
import type { Locale } from './localization';
import { localize } from './LocalizationProvider';
import { formatModifier } from './stat-format';

/** Labels reflect each effect's actual scope, including Dispatcher-only effects. */
export function vehicleEffects(vehicle: VehicleDefinition, locale: Locale, compact = false): string {
  const text = (en: string, de: string) => localize(locale, en, de);
  return vehicle.modifiers.map(modifier => {
    const target = modifier.target;
    const scope = target.stat === 'business-production'
      ? compact ? text('Production', 'Produktion') : text('Business Production', 'Business-Produktion')
      : target.stat === 'job-reward'
        ? target.context === 'manual' ? text('Manual Job Cash', 'Manueller Job-Cash')
          : target.context === 'dispatcher' ? text('Dispatcher Cash', 'Dispatcher-Cash')
            : text('Manual Job & Dispatcher Cash', 'Manueller Job- & Dispatcher-Cash')
        : text('seconds per Heat cooling interval', 'Sekunden pro Heat-Abkühlintervall');
    return `${formatModifier(modifier)} ${scope}`;
  }).join(' · ');
}
