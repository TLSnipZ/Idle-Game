import { useLocalizedText } from './LocalizationProvider';
export function BrandLockup() {
  const text = useLocalizedText();
  return <div className="solara-brand" aria-label={text('Solara City')}>
    <span className="solara-symbol" aria-hidden="true"><span className="solara-sun" /><span className="solara-horizon" /></span>
    <span className="solara-wordmark"><strong>{text('SOLARA')}</strong><span>{text('CITY')}</span></span>
  </div>;
}
