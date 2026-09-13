/** Original written villager-inspired sounds. English glosses keep every action playable.
 * Idempotent because presentation strings can be composed more than once.
 * Never transform save codes, IDs, numeric values or user input.
 */
const GREETING = /^(?:Hrrm|Hrmm|Hmm|Hrr|Hrm)(?:[!?…]| ·)/;
const SOUNDS = ['Hrrm', 'Hrmm', 'Hmm', 'Hrr', 'Hrm'] as const;
export function villagerText(english: string): string {
  if (!english.trim() || GREETING.test(english)) return english;
  let signature = 0;
  for (const character of english) signature = (signature + character.charCodeAt(0)) % SOUNDS.length;
  const sound = SOUNDS[signature] ?? 'Hrrm';
  const inflection = english.trimEnd().endsWith('?') ? '?' : english.trimEnd().endsWith('!') ? '!' : '…';
  return `${sound}${inflection} · ${english}`;
}
