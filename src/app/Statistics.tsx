import { selectStatistics } from '../game/statistics-selectors';
import type { GameState } from '../game/game-state';
import { useLocale, useLocalizedText } from './LocalizationProvider';
import { localeTag } from './localization';

const DE: Record<string, readonly [string, string]> = {
  manualJobsCompleted: ['Manuelle Jobs', 'Erfolgreiche manuelle Lieferungen. Kilometerstand deiner Würde nicht enthalten.'],
  automatedJobsCompleted: ['Automatisierte Jobs', 'Lieferungen des Dispatchers. Delegation sieht in Statistiken plötzlich nach Führungskompetenz aus.'],
  businessLevelsPurchased: ['Business-Upgrades', 'Bezahlte Level-Upgrades ohne Erstkäufe. Wachstum kostet, Überraschung.'],
  territoriesAcquired: ['Übernommene Bezirke', 'Bezahlte Übernahmen über alle Runs, Waterfront ausgenommen. Stadtplanung mit Kassenbon.'],
  crewMembersRecruited: ['Crew rekrutiert', 'Rekrutierungen über alle Runs, inklusive Wiederholungstätern auf der Gehaltsliste.'],
  eventsResolved: ['Events gelöst', 'Abgeschlossene Stadtevent-Entscheidungen, inklusive elegantem Wegducken.'],
  rebirthsCompleted: ['Rebirths', 'Erfolgreiche Rebirths. Wie oft du freiwillig alles wieder kompliziert gemacht hast.'],
  peakHeat: ['Höchstes Heat', 'Höchstes registriertes Heat nach einer Aktion oder Simulationsphase. Dein persönlicher Rekord bei schlechter Diskretion.'],
};
export function Statistics({ state }: { readonly state: GameState }) {
  const locale = useLocale();
  const text = useLocalizedText();
  const format = new Intl.NumberFormat(localeTag(locale));
  return <section className="panel statistics empire-record" aria-labelledby="statistics-heading">
    <h2 id="statistics-heading">{text('STATISTICS', 'STATISTIKEN')}</h2>
    <p>{text('Lifetime history · Kept through Rebirth · because somebody has to remember the receipts.', 'Lifetime-Historie · Bleibt durch Rebirth erhalten · irgendwer muss die Belege schließlich behalten.')}</p>
    <dl className="statistics-grid">{selectStatistics(state).map(entry => {
      const localized = locale === 'de' ? DE[entry.key] : undefined;
      const value = `${format.format(entry.value)}${entry.key === 'peakHeat' ? ' / 100' : ''}`;
      return <div className="statistics-entry" key={entry.key}>
        <dt>{localized?.[0] ?? entry.label}</dt>
        <dd><strong>{value}</strong><p>{localized?.[1] ?? entry.description}</p></dd>
      </div>;})}</dl>
  </section>;
}
