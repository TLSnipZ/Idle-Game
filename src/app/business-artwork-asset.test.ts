import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

// Fixed digests protect the exact inspected preview crops from partial uploads.
const images = [
  { file: 'dockside-detail-storefront.webp', bytes: 21810, hash: '1ce07fc9e361000d660e0e38006149c5b25a86bf40aeb0ff21dc04acd2640c1c' },
  { file: 'neon-laundry-storefront.webp', bytes: 23126, hash: '152fa1bf7ef1329720d7022f067546454610b8f7dff3d405eb695ab35a93dcc5' },
  { file: 'afterdark-customs-storefront.webp', bytes: 14224, hash: 'a2674b40fcd8deab39d937047a347dede07c328954f5c7b5d06b0e8e10489192' },
  { file: 'solara-nights-storefront.webp', bytes: 18228, hash: '07e86859648a2232541b2c7bec87296902b4b407002560533fe486e0e4ed59e4' },
];

test.each(images)('$file is the complete inspected WebP crop', ({ file, bytes, hash }) => {
  const image = readFileSync(`src/assets/businesses/${file}`);
  expect(image.toString('ascii', 0, 4)).toBe('RIFF');
  expect(image.toString('ascii', 8, 12)).toBe('WEBP');
  expect(image.readUInt32LE(4) + 8).toBe(image.length);
  expect(image.length).toBe(bytes);
  expect(createHash('sha256').update(image).digest('hex')).toBe(hash);
});
