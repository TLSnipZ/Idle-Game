/** Exact, reduced nonnegative fractions. BigInt never enters persisted data. */
export interface Rational { readonly numerator: string; readonly denominator: string }
export const ZERO_RATIONAL: Rational = Object.freeze({ numerator: '0', denominator: '1' });
export const MAX_RATIONAL_DIGITS = 256;
export class RationalOverflow extends RangeError {}
function gcd(a: bigint, b: bigint): bigint {
  while (b !== 0n) { const next = a % b; a = b; b = next; }
  return a;
}
export function rational(numerator: bigint, denominator = 1n): Rational {
  if (numerator < 0n || denominator <= 0n) throw new RangeError('Invalid rational');
  const divisor = gcd(numerator, denominator);
  const n = (numerator / divisor).toString(); const d = (denominator / divisor).toString();
  if (n.length > MAX_RATIONAL_DIGITS || d.length > MAX_RATIONAL_DIGITS) throw new RationalOverflow('Rational precision bound exceeded');
  return { numerator: n, denominator: d };
}
export function isRational(value: unknown): value is Rational {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  if (Reflect.ownKeys(value).length !== 2) return false;
  const n: unknown = Object.getOwnPropertyDescriptor(value, 'numerator')?.value;
  const d: unknown = Object.getOwnPropertyDescriptor(value, 'denominator')?.value;
  const integer = (s: unknown): s is string => typeof s === 'string' && s.length <= MAX_RATIONAL_DIGITS && /^(0|[1-9][0-9]*)$/.test(s);
  return integer(n) && integer(d) && d !== '0' && gcd(BigInt(n), BigInt(d)) === 1n;
}
export function requireRational(value: Rational): Rational {
  if (!isRational(value)) throw new RangeError('Invalid authoritative rational');
  return value;
}
export function addRational(a: Rational, b: Rational): Rational {
  requireRational(a); requireRational(b);
  return rational(BigInt(a.numerator) * BigInt(b.denominator) + BigInt(b.numerator) * BigInt(a.denominator), BigInt(a.denominator) * BigInt(b.denominator));
}
export function multiplyRational(a: Rational, b: Rational): Rational {
  requireRational(a); requireRational(b);
  return rational(BigInt(a.numerator) * BigInt(b.numerator), BigInt(a.denominator) * BigInt(b.denominator));
}
