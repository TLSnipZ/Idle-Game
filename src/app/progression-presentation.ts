import type { LevelIncrease } from '../features/progression';
import { DEFAULT_LOCALE } from './localization';
import type { Locale } from './localization';
import { localize } from './LocalizationProvider';

export { formatInteger as formatXp } from './number-format';
export function describeLevelIncrease(increase: LevelIncrease, locale: Locale = DEFAULT_LOCALE): string {
  return increase.toLevel === increase.fromLevel + 1
    ? localize(locale, `LEVEL UP — Level ${increase.toLevel}`, `LEVEL UP — Level ${increase.toLevel} · Lebenslauf weiterhin unbrauchbar`)
    : localize(locale, `LEVEL UP — Level ${increase.fromLevel} → ${increase.toLevel}`, `LEVEL UP — Level ${increase.fromLevel} → ${increase.toLevel} · Karriereleiter mit fragwürdiger Statik`);
}
