/** Keep the unit beside its value; exceptionally long digits may wrap within it. */
export function RateValue({ text }: { readonly text: string }) {
  if (!text.endsWith('/sec')) return <>{text}</>;
  return <span className="value-unit"><span>{text.slice(0, -4)}</span><span>/sec</span></span>;
}
