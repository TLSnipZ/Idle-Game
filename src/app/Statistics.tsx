import { selectStatistics } from '../game/statistics-selectors';
import type { GameState } from '../game/game-state';

export function Statistics({ state }: { readonly state: GameState }) {
  return <section className="panel statistics" aria-labelledby="statistics-heading">
    <h2 id="statistics-heading">STATISTICS</h2>
    <p>Lifetime history · Kept through Rebirth</p>
    <dl className="statistics-grid">{selectStatistics(state).map(entry =>
      <div className="statistics-entry" key={entry.key}>
        <dt>{entry.label}</dt>
        <dd><strong>{entry.formattedValue}</strong><p>{entry.description}</p></dd>
      </div>)}</dl>
  </section>;
}
