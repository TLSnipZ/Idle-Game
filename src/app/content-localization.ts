import type { Locale } from './localization';

interface LocalizedFields { readonly [field: string]: string | undefined }
const DE: Record<string, LocalizedFields> = {
  'business:dockside-detail': { subtitle: 'Auto-Aufbereitung', description: 'Eine kompakte Garage am Wasser. Eine Waschbox, ein Neuanfang und erstaunlich wenig Fragen vom Vermieter.' },
  'business:neon-laundry': { subtitle: 'Cash-Front', description: 'Unauffälliges Bargeldgeschäft für stabiles Einkommen. Die Waschmaschinen sind hauptsächlich fürs Ambiente da.' },
  'business:afterdark-customs': { subtitle: 'Performance-Werkstatt', description: 'Performance-Werkstatt für Solaras Street-Szene. Offiziell werden hier nur Autos schneller.' },
  'business:solara-nights': { subtitle: 'Nachtclub', description: 'Premium-Club auf der Neon Mile mit ernsthafter Ertragskraft und einer Buchhaltung, die besser nicht nach 2 Uhr nachts arbeitet.' },

  'vehicle:kairo-kx-r': { category: 'Business-Starter', description: 'Leichter Street-Performance-Hatch. Dein erster Tuner für ein wachsendes Imperium und fragwürdige Parkhausentscheidungen.' },

  'crew:rico-vale': { description: 'Waterfront-Verhandler, der aus jeder Lieferung mehr Cash herausredet. Charmant genug, dass selbst Rechnungen nervös werden.' },
  'crew:mara-knox': { description: 'Diskrete lokale Problemlöserin, die Aufmerksamkeit schneller verschwinden lässt. Wie genau, bleibt Teil des Service.' },
  'crew:jax-mercer': { description: 'Operations-Mechaniker, der deine Businesses effizient am Laufen hält. Schraubt an Maschinen, Abläufen und gelegentlich der Definition von legal.' },

  'territory:waterfront': { description: 'Docks, Garagen und Service-Straßen. Dein erster Fuß in Solara City — Salzluft, Motoröl und niedrige Erwartungen.' },
  'territory:neon-mile': { description: 'Clubs, Leuchtreklame und Verkehr bis spät in die Nacht. Mach den Strip zu deinem Revier, bevor es irgendein Immobilienfonds tut.' },

  'upgrade:commercial-pressure-washer': { name: 'Gewerbe-Hochdruckreiniger', description: 'Profi-Waschtechnik hält die Dockside-Bays am Laufen. Dreck raus, Umsatz rein — komplizierter wird BWL heute nicht.' },
  'upgrade:industrial-detailing-line': { name: 'Industrielle Detailing-Linie', description: 'Eine eigene Finish-Linie erhöht den Durchsatz. Fließbandromantik, aber mit mehr Felgenreiniger.' },
  'upgrade:fleet-logistics': { name: 'Flottenlogistik', description: 'Koordinierte Lieferketten halten alle Businesses effizient. Niemand weiß, wo die Klemmbretter herkamen.' },
  'upgrade:street-connections': { name: 'Street Connections', description: 'Vertrauenswürdige Kontakte handeln bessere Bezahlung für jede Lieferung aus. Networking, nur ohne LinkedIn.' },
  'upgrade:express-tips': { name: 'Express-Trinkgeld', description: 'Zuverlässiger Service bringt bei jeder Lieferung extra Trinkgeld. Kundenbindung durch überraschend pünktliches Auftauchen.' },

  'automation:delivery-dispatcher': { name: 'Delivery Dispatcher', description: 'Setz einen Dispatcher auf die Waterfront-Route. Lieferungen laufen weiter, während du wichtig aussiehst.' },
  'automation:business-auto-upgrader': { name: 'Business Auto-Upgrader', description: 'Versucht alle 30 Sekunden ein Upgrade fürs gewählte Business zu kaufen, wenn genug Cash da ist. Dein Konto trifft jetzt eigene Karriereentscheidungen.' },

  'skill:streetwise-investment': { name: 'Streetwise Investment', description: 'Baue dauerhafte Instinkte für profitable Operationen auf. Ein MBA, nur ohne Schulden und Ethikseminar.' },
  'skill:fast-talker': { name: 'Schnelle Zunge', description: 'Handle bessere Bezahlung für Lieferungen aus — selbst gefahren oder vom Dispatcher erledigt.' },
  'skill:learn-the-streets': { name: 'Lern die Straßen', description: 'Mehr XP aus Lieferungen und Business-Level-Ups. Solara ist die einzige Uni, bei der Heat zum Stundenplan gehört.' },
  'skill:silent-partner': { name: 'Stiller Teilhaber', description: 'Dauerhafte Rückendeckung stärkt jedes Business. Wer der Teilhaber ist? Genau deswegen heißt er still.' },
  'skill:never-sleeps': { name: 'Schläft nie', description: 'Mehr Offline-Zeit wird bei zukünftigen Rückkehrern angerechnet. Weggeworfene Zeit bleibt weg — sogar im Imperium gibt’s keine Zeitmaschine.' },
  'tree:empire-foundations': { name: 'Fundament des Imperiums' },

  'achievement:first-steps': { name: 'Erste Schritte', description: 'Mach deinen ersten echten Schritt in Solaras Untergrund. Schuhe optional, Konsequenzen inklusive.' },
  'achievement:dockside-operator': { name: 'Dockside-Betreiber', description: 'Bring Dockside Detail auf Level 10. Aus kleiner Garage wird mittelgroßes Steuerproblem.' },
  'achievement:neon-takeover': { name: 'Neon-Übernahme', description: 'Übernimm die Neon Mile. Leuchtreklame gehört jetzt quasi zur Bilanz.' },
  'achievement:running-hot': { name: 'Läuft heiß', description: 'Erreiche HEISS oder GROSSFAHNDUNG mit mindestens 60 Heat. Diskretion wurde erfolgreich deinstalliert.' },
  'achievement:crew-chief': { name: 'Crew-Chef', description: 'Rekrutiere Rico Vale, Mara Knox und Jax Mercer in einem Run. Drei Spezialisten, null Personalabteilung.' },
  'achievement:first-rebirth': { name: 'Erster Rebirth', description: 'Fang mit deinem ersten Rebirth nochmal an. Fortschritt weg, Ego jetzt permanent.' },

  'event:hot-tip': { name: 'Heißer Tipp', description: 'Jemand hat einen schnellen Weg zu Cash. Das Wort „risikofrei“ fiel auffällig oft.' },
  'choice:take-tip': { label: 'TIPP ANNEHMEN', outcome: 'Tipp angenommen' },
  'choice:play-safe': { label: 'AUF SICHER SPIELEN', outcome: 'Auf sicher gespielt' },
  'event:shakedown': { name: 'Schutzgeldrunde', description: 'Jemand möchte einen Anteil deiner Operation. Kundenservice klingt anders.' },
  'choice:pay-off': { label: 'AUSZAHLEN', outcome: 'Ausgezahlt' },
  'choice:refuse': { label: 'ABLEHNEN', outcome: 'Abgelehnt' },
  'event:warehouse-opportunity': { name: 'Lagerhallen-Chance', description: 'Eine kurzlebige Logistikchance ist offen. Seriöse Angebote haben bekanntlich immer Countdown.' },
  'choice:invest': { label: 'INVESTIEREN', outcome: 'Investment zurückgezahlt' },
  'choice:pass': { label: 'PASSEN', outcome: 'Chance ausgelassen' },
};

export function localizedContent(locale: Locale, id: string, field: string, fallback: string): string {
  if (locale !== 'de') return fallback;
  return DE[id]?.[field] ?? fallback;
}

export function localizedSlotName(locale: Locale, name: string): string {
  if (locale !== 'de') return name;
  if (name === 'Operations') return 'Operationen';
  if (name === 'Logistics') return 'Logistik';
  return name;
}
