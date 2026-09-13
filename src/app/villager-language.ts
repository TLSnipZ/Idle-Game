/** Written Villager sounds only: no translation gloss or recoverable word prefix.
 * Token-wise replacement is deterministic and idempotent, including composed copy.
 * This function is presentation-only; never pass IDs, saves or user input to it.
 */
const SOUNDS = ['Hrrm', 'Hrmm', 'Hmm', 'Hrr', 'Hrm', 'Hrrrmm', 'Mhm', 'Hmmrr'] as const;
export function villagerText(english: string): string {
  return english.replace(/\p{L}+/gu, word => {
    if (/^[hmr]+$/i.test(word)) return word;
    let signature = 0;
    for (const character of word.toLowerCase()) signature = (signature * 31 + character.charCodeAt(0)) >>> 0;
    return SOUNDS[signature % SOUNDS.length] ?? 'Hrrm';
  });
}
