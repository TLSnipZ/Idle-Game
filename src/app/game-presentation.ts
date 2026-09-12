import { acquisitionPresentation } from './acquisition-presentation';
export { acquisitionPresentation } from './acquisition-presentation';
import { describeCrewCommand } from './crew-presentation';
import { findVehicle } from '../features/vehicles';
import { evaluateXpReward } from '../game/xp-reward';
import { BUSINESS_AUTO_UPGRADER, DELIVERY_DISPATCHER } from '../features/automation';
import { formatProduction } from './stat-format';
import { evaluateJobReward } from '../game/effective-stats';
import { findUpgrade } from '../features/upgrades';
import { selectBusinessProgress } from '../game/selectors';
import { findBusiness, STARTER_BUSINESS } from '../features/businesses';
import { formatCash } from './number-format';
import type { RuntimeSnapshot } from '../platform/game-runtime';
import type { PersistenceStatus } from '../platform/persistent-game';
import { DEFAULT_LOCALE } from './localization';
import type { Locale } from './localization';
import { localize } from './LocalizationProvider';

function translatedRequirement(description: string, locale: Locale) {
  if (locale === 'en') return description;
  if (description === 'Own at least one business') return 'Besitze mindestens ein Business';
  if (description.startsWith('Player Level ')) return description.replace('Player Level ', 'Spielerlevel ');
  if (description.startsWith('Own ')) return description.replace('Own ', 'Besitze ');
  if (description.startsWith('Control ')) return description.replace('Control ', 'Kontrolliere ');
  if (description.startsWith('Purchase ')) return description.replace('Purchase ', 'Kaufe ');
  if (description.startsWith('Unlock ')) return description.replace('Unlock ', 'Schalte frei: ');
  return description;
}

export function describeAction(action: 'delivery' | 'purchase' | 'upgrade' | 'equipment' | 'automation' | 'vehicle', result: RuntimeSnapshot['result'], contentId?: unknown, locale: Locale = DEFAULT_LOCALE): string {
  const business = findBusiness(contentId ?? STARTER_BUSINESS.id);
  if (result.ok) {
    if (action === 'vehicle') return localize(locale,
      `${findVehicle(contentId)?.name ?? 'Vehicle'} added to your garage permanently. Kept through Rebirth.`,
      `${findVehicle(contentId)?.name ?? 'Fahrzeug'} steht jetzt permanent in deiner Garage. Bleibt sogar nach Rebirth — Leasingberater hassen diesen Trick.`);
    if (action === 'automation' && contentId === BUSINESS_AUTO_UPGRADER.id) return localize(locale,
      'Business Auto-Upgrader purchased. Disabled until you enable automatic spending.',
      'Business Auto-Upgrader gekauft. Noch deaktiviert — automatische Geldverbrennung braucht wenigstens deine Zustimmung.');
    if (action === 'automation') return localize(locale,
      `${DELIVERY_DISPATCHER.name} hired. Automated deliveries are active.`,
      `${DELIVERY_DISPATCHER.name} eingestellt. Lieferungen laufen jetzt automatisch. Gewerkschaft nicht gefunden.`);
    if (action === 'equipment') {
      const upgrade = findUpgrade(contentId);
      return localize(locale,
        `${upgrade?.name ?? 'Upgrade'} purchased. ${upgrade?.modifier.target.stat === 'job-reward' ? 'Delivery' : 'Production'} bonus is active.`,
        `${upgrade?.name ?? 'Upgrade'} gekauft. ${upgrade?.modifier.target.stat === 'job-reward' ? 'Liefer' : 'Produktions'}bonus ist aktiv. Kapitalismus erfolgreich installiert.`);
    }
    if (action === 'upgrade') {
      const progress = selectBusinessProgress(result.state, business?.id);
      return progress ? localize(locale,
        `${business?.name ?? 'Business'} upgraded to Level ${progress.level}. Production increased to ${formatProduction(progress.production)} · +${xpReward(result.state, 'businessLevel')} XP.`,
        `${business?.name ?? 'Business'} auf Level ${progress.level}. Produktion jetzt ${formatProduction(progress.production)} · +${xpReward(result.state, 'businessLevel')} XP. Größerer Laden, größere Fragen.`)
        : localize(locale, 'Business upgraded.', 'Business verbessert. Die Buchhaltung nennt es Wachstum, wir nennen es Eskalation.');
    }
    return action === 'delivery'
      ? localize(locale,
        `Delivery completed. +${formatCash('moneyEarned' in result ? result.moneyEarned : deliveryReward(result.state))} · +${'xpEarned' in result ? result.xpEarned : xpReward(result.state, 'manualJob')} XP.`,
        `Lieferung erledigt. +${formatCash('moneyEarned' in result ? result.moneyEarned : deliveryReward(result.state))} · +${'xpEarned' in result ? result.xpEarned : xpReward(result.state, 'manualJob')} XP. Inhalt des Pakets bleibt juristisch uninteressant.`)
      : localize(locale, `${business?.name ?? 'Business'} acquired. Live production has started.`, `${business?.name ?? 'Business'} übernommen. Produktion läuft. Papierkram angeblich auch.`);
  }
  switch (result.error) {
    case 'statistics-overflow': return localize(locale, 'Lifetime statistics limit reached. The action was not completed.', 'Statistiklimit erreicht. Selbst dein Lebenswerk passt irgendwann nicht mehr in eine Zahl.');
    case 'no-pending-event': return localize(locale, 'No active event.', 'Kein aktives Event. Ausnahmsweise brennt gerade nichts.');
    case 'wrong-event': case 'unknown-choice': return localize(locale, 'That event choice is unavailable.', 'Diese Event-Option gibt’s nicht. Solara ist chaotisch, aber nicht so chaotisch.');
    case 'unknown-crew-member': case 'already-recruited': case 'unknown-slot': case 'not-recruited':
    case 'incompatible-slot': case 'already-assigned': case 'already-empty': return describeCrewCommand(result, 'recruit', undefined, undefined, locale);
    case 'already-cold': return localize(locale, 'Already cold. Nothing was spent.', 'Heat schon bei null. Geld blieb erstaunlicherweise auf dem Konto.');
    case 'unknown-territory': return localize(locale, 'This territory is unavailable.', 'Dieser Bezirk ist nicht verfügbar. Vielleicht wurde er gerade gentrifiziert.');
    case 'unknown-skill': return localize(locale, 'This permanent skill is unavailable.', 'Dieser permanente Skill existiert nicht. Dein Coach hat gelogen.');
    case 'insufficient-empire-points': return localize(locale, 'Not enough Empire Points.', 'Zu wenig Empire Points. Macht ist leider nicht auf Pump erhältlich.');
    case 'max-rank-reached': return localize(locale, 'This skill is already at max rank.', 'Skill ist bereits auf Max-Rang. Noch mehr wäre vermutlich steuerpflichtig.');
    case 'insufficient-funds': return localize(locale, 'Not enough cash yet. Complete a delivery to keep building your balance.', 'Zu wenig Cash. Fahr noch eine Lieferung — finanzielle Würde kommt später.');
    case 'already-owned': return action === 'vehicle' ? localize(locale, 'This vehicle is already yours.', 'Das Auto gehört dir schon. Zweimal kaufen ist eher Versicherungsbetrug.') : localize(locale, 'This business is already yours.', 'Das Business gehört dir schon. Monopole bitte Schritt für Schritt.');
    case 'unknown-vehicle': return localize(locale, 'This vehicle is unavailable. No purchase was made.', 'Fahrzeug nicht verfügbar. Kein Cash weg, keine spontane Midlife-Crisis.');
    case 'unknown-business': return localize(locale, 'This business is unavailable. No purchase was made.', 'Business nicht verfügbar. Transaktion abgebrochen, Anwalt enttäuscht.');
    case 'unknown-automation': return localize(locale, 'This delegation is unavailable.', 'Diese Automatisierung gibt’s nicht. Arbeit muss heute wohl doch jemand machen.');
    case 'already-unlocked': return localize(locale, 'This automation is already owned.', 'Automatisierung bereits gekauft. Mehr automatisch geht gerade nicht.');
    case 'not-toggleable': return localize(locale, 'This automation cannot be toggled.', 'Diese Automatisierung lässt sich nicht umschalten. Sie hat offenbar eigene Rechte.');
    case 'automation-not-owned': return localize(locale, 'Purchase this automation first.', 'Erst kaufen, dann automatisieren. Der Kapitalismus besteht auf Reihenfolge.');
    case 'invalid-enabled': return localize(locale, 'The automation setting is invalid.', 'Automationsstatus ungültig. Selbst die Maschine blickt nicht mehr durch.');
    case 'unknown-upgrade': return localize(locale, 'This upgrade is unavailable.', 'Upgrade nicht verfügbar. Vielleicht im nächsten dubiosen Katalog.');
    case 'already-purchased': return localize(locale, 'This upgrade is already purchased.', 'Upgrade schon gekauft. Doppelt zahlen darf nur die Steuerbehörde verlangen.');
    case 'requirements-not-met':
    case 'prerequisite-not-met': return localize(locale,
      'Requirements not met: ' + result.requirements.requirements.filter(detail => !detail.met).map(detail => detail.description).join('; ') + '.',
      'Voraussetzungen fehlen: ' + result.requirements.requirements.filter(detail => !detail.met).map(detail => translatedRequirement(detail.description, locale)).join('; ') + '.');
    case 'not-owned': return localize(locale, 'Acquire this business before upgrading.', 'Erst das Business übernehmen, dann renovieren. Sonst nennt man das Hausfriedensbruch.');
    case 'max-level-reached': return localize(locale, 'This business is at max level.', 'Business ist auf Max-Level. Mehr Wachstum passt nicht mehr auf die Visitenkarte.');
    case 'invalid-level': return localize(locale, 'Business level is invalid. No transaction was made.', 'Business-Level ungültig. Transaktion verworfen, Buchhaltung atmet kurz durch.');
    case 'xp-overflow': return localize(locale, 'XP limit reached. This action could not be completed.', 'XP-Limit erreicht. Du bist offiziell zu erfahren für diese Zahl.');
    case 'overflow': return localize(locale, 'Cash limit reached. This action could not be completed.', 'Cash-Limit erreicht. Glückwunsch, selbst die Anzeige kapituliert.');
    case 'invalid-amount': return localize(locale, 'This action could not be completed. No transaction was made.', 'Aktion fehlgeschlagen. Kein Geld bewegt, keine Beweise produziert.');
  }
}

export function businessPresentation(owned: boolean, canPurchase: boolean, paused: boolean, requirementsMet = true,
  progress?: ReturnType<typeof selectBusinessProgress>, locale: Locale = DEFAULT_LOCALE) {
  const acquisition = acquisitionPresentation(requirementsMet, canPurchase, 'Business', 'acquire', locale);
  const maxed = owned && progress?.upgradeCost === null;
  const disabled = paused || (owned ? !progress?.canUpgrade : !canPurchase || !requirementsMet);
  return {
    live: owned && !paused,
    status: owned ? localize(locale, 'OWNED', 'IM BESITZ') : acquisition.status,
    productionLabel: paused ? localize(locale, 'Production paused', 'Produktion pausiert') : owned ? localize(locale, 'Live production', 'Live-Produktion') : localize(locale, 'Potential production', 'Mögliche Produktion'),
    buttonLabel: paused ? localize(locale, 'Session paused', 'Session pausiert') : owned ? maxed ? localize(locale, 'MAX LEVEL', 'MAX-LEVEL') : progress ? localize(locale, `Upgrade to Level ${progress.level + 1}`, `Auf Level ${progress.level + 1} upgraden`) : localize(locale, 'Acquired', 'Übernommen') : localize(locale, 'Acquire business', 'Business übernehmen'),
    disabled,
    note: paused ? localize(locale, 'Reload to restore the last available local save. Unsaved progress may be lost.', 'Neu laden, um den letzten lokalen Save wiederherzustellen. Ungespeicherter Fortschritt könnte dabei verschwinden — sehr seriös.')
      : owned ? progress && !maxed && !progress.canUpgrade ? localize(locale, 'Insufficient Cash for the next Level.', 'Zu wenig Cash fürs nächste Level. Wachstum hat leider Eintritt.') : null
      : acquisition.note,
  };
}

export function describePersistence(status: PersistenceStatus, locale: Locale = DEFAULT_LOCALE): string {
  switch (status.kind) {
    case 'ready': return localize(locale, 'Local autosave ready. Progress saves after actions and every few seconds.', 'Lokaler Autosave bereit. Fortschritt wird nach Aktionen und regelmäßig gespeichert. Die Aktenvernichtung ist abgesagt.');
    case 'loaded': return localize(locale, 'Local save restored and offline interval recorded.', 'Lokaler Save geladen und Offline-Zeit verbucht. Dein Imperium hat ohne dich weitergemacht. Unhöflich, aber profitabel.');
    case 'offline-error': return localize(locale, 'Offline progress could not be recorded. Session paused; your previous save is preserved. Reload to try again.', 'Offline-Fortschritt konnte nicht verbucht werden. Session pausiert, alter Save bleibt sicher. Neu laden und nochmal so tun, als wäre Technik zuverlässig.');
    case 'saved': return localize(locale, 'Progress saved on this browser.', 'Fortschritt lokal gespeichert. Deine fragwürdigen Entscheidungen sind dokumentiert.');
    case 'error': return localize(locale, 'Saving failed. You can keep playing, but recent progress may be lost on reload. Autosave will try again.', 'Speichern fehlgeschlagen. Du kannst weitermachen, aber neuer Fortschritt könnte beim Reload verschwinden. Autosave versucht’s weiter — Optimismus ist gratis.');
    case 'blocked':
      if (status.error === 'unsupported-version') return localize(locale, 'This save needs a newer game version. It has been preserved. This fresh session will not be saved.', 'Dieser Save braucht eine neuere Spielversion. Er bleibt erhalten; diese frische Session wird nicht gespeichert. Bürokratie schützt heute ausnahmsweise etwas.');
      if (status.error === 'storage-read') return localize(locale, 'Local storage could not be read. This session will not be saved; existing data has not been changed.', 'Lokaler Speicher konnte nicht gelesen werden. Diese Session wird nicht gespeichert; bestehende Daten bleiben unangetastet.');
      if (status.error === 'storage-conflict') return localize(locale, 'The local save changed in another session. Saving has stopped to protect it. Reload to load the stored save.', 'Der lokale Save wurde in einer anderen Session verändert. Speichern gestoppt, damit wir nicht beide Versionen gleichzeitig ruinieren. Neu laden.');
      return localize(locale, 'The local save could not be validated and has been preserved. You are playing a fresh session with saving disabled.', 'Der lokale Save konnte nicht geprüft werden und bleibt erhalten. Du spielst gerade frisch ohne Speichern — emotional riskanter als empfohlen.');
  }
}

function deliveryReward(state: RuntimeSnapshot['result']['state']) {
  const reward = evaluateJobReward(state);
  if (!reward.ok) throw new RangeError('Configured job reward exceeds range');
  return reward.reward;
}

function xpReward(state: RuntimeSnapshot['result']['state'], source: 'manualJob' | 'businessLevel') {
  const result = evaluateXpReward(state, source);
  if (!result.ok) throw new RangeError('Configured XP reward exceeds range');
  return result.reward;
}
