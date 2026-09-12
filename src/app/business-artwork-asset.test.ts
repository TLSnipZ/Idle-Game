import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

// A contents-API success alone is not proof that a binary artwork arrived intact.
test('the Dockside runtime crop is the complete inspected WebP, not a truncated upload', () => {
  const image = readFileSync('src/assets/businesses/dockside-detail-storefront.webp');
  expect(image.toString('ascii', 0, 4)).toBe('RIFF');
  expect(image.toString('ascii', 8, 12)).toBe('WEBP');
  expect(image.readUInt32LE(4) + 8).toBe(image.length);
  expect(image.length).toBe(24454);
  expect(createHash('sha256').update(image).digest('hex'))
    .toBe('1a11043748570e62bab09bc877b145780e8f1ee0fea144d33e83b398b66d7441');
});
