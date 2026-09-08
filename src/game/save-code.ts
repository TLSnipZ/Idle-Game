import type { GameState } from './game-state';
import { MAX_SAVE_LENGTH, parseSave, serializeSave } from './save-schema';
import type { SaveDataError } from './save-schema';

export const SAVE_CODE_PREFIX = 'CE1-';
// A UTF-16 code unit requires at most three UTF-8 bytes.
export const MAX_CODE_LENGTH = SAVE_CODE_PREFIX.length + 4 * MAX_SAVE_LENGTH;
export type SaveCodeError = SaveDataError | 'empty-code' | 'oversized-code'
  | 'unsupported-prefix' | 'malformed-encoding';
export type ExportResult = { readonly ok: true; readonly code: string }
  | { readonly ok: false; readonly error: SaveCodeError | 'runtime-unavailable' | 'clock-unavailable' };

/** Text transport only. Schema validation remains exclusively in save-schema. */
export function encodeSaveText(text: string): string {
  let binary = '';
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
  return SAVE_CODE_PREFIX + btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

export function decodeSaveText(input: string):
  { readonly ok: true; readonly text: string } | { readonly ok: false; readonly error: SaveCodeError } {
  // Bound raw input before trim/decode allocations, including surrounding whitespace.
  if (input.length > MAX_CODE_LENGTH) return { ok: false, error: 'oversized-code' };
  const code = input.trim();
  if (!code) return { ok: false, error: 'empty-code' };
  if (!code.startsWith(SAVE_CODE_PREFIX)) return { ok: false, error: 'unsupported-prefix' };
  const payload = code.slice(SAVE_CODE_PREFIX.length);
  if (!/^[A-Za-z0-9_-]+$/.test(payload) || payload.length % 4 === 1) {
    return { ok: false, error: 'malformed-encoding' };
  }
  try {
    const binary = atob(payload.replaceAll('-', '+').replaceAll('_', '/'));
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    const text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
    if (text.length > MAX_SAVE_LENGTH) return { ok: false, error: 'oversized' };
    // Reject noncanonical trailing bits and invalid UTF-8 rather than repairing input.
    if (encodeSaveText(text) !== code) return { ok: false, error: 'malformed-encoding' };
    return { ok: true, text };
  } catch { return { ok: false, error: 'malformed-encoding' }; }
}

export function exportSaveCode(state: GameState, savedAt: number): ExportResult {
  const result = serializeSave(state, savedAt);
  return result.ok ? { ok: true, code: encodeSaveText(result.serialized) } : result;
}

export function validateSaveCode(input: string) {
  const decoded = decodeSaveText(input);
  return decoded.ok ? parseSave(decoded.text) : decoded;
}
