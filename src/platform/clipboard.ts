export async function copySaveCode(
  code: string,
  write: (text: string) => Promise<void> = text => navigator.clipboard.writeText(text),
): Promise<boolean> {
  try { await write(code); return true; }
  catch { return false; }
}
