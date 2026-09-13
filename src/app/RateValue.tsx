import { useLocalizedText } from './LocalizationProvider';
/** Keep the unit beside its value; exceptionally long digits may wrap within it. */
export function RateValue({ text }: { readonly text: string }) {
  const label = useLocalizedText();
  if (!text.endsWith('/sec')) return <>{label(text)}</>;
  return <span className="value-unit"><span>{label(text.slice(0, -4))}</span><span>{label('/sec')}</span></span>;
}
