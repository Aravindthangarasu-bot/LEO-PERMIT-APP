/**
 * Generates src/data/pincodeData.ts from official Kerala and Tamil Nadu
 * pincode PDF documents supplied by the business.
 *
 * Usage:
 *   node scripts/generate-pincode-data.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');
const __dirname = dirname(fileURLToPath(import.meta.url));

// -------------------------------------------------------------------
// Priority: lower number = preferred when selecting the primary city
// -------------------------------------------------------------------
const TYPE_PRIORITY = { HO: 1, SO: 2, PO: 2, RS: 3, RO: 3, BO: 4 };

function getPriority(rawType, isDelivery) {
  const type = rawType.toUpperCase().replace(/\./g, '');
  const base = TYPE_PRIORITY[type] ?? 5;
  return base * 2 + (isDelivery ? 0 : 1);
}

/**
 * Strip trailing "SO", "HO", "BO", "PO", "RS", "RO", "H.O", "S.O" etc.
 * from an office name to get the locality/city name.
 */
function cleanName(name) {
  return name
    .replace(/\s+[HSBPRO]\.?[OSB]\.?\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parsePDFText(text, state) {
  const pinMap = {};

  for (const line of text.split(/\r?\n/)) {
    // Anchor on the 6-digit pincode followed by Delivery or Non-Delivery
    const m = line.match(
      /^([\w\s.,'()\-/]+?)\s+(\d{6})\s+(Delivery|Non-Delivery)\s+([A-Za-z.]+)\s/i
    );
    if (!m) continue;

    const rawName = m[1].trim();
    const pincode = m[2];
    const isDelivery = /^delivery$/i.test(m[3]);
    const rawType = m[4];
    const priority = getPriority(rawType, isDelivery);
    const city = cleanName(rawName);
    if (!city || city.length < 2) continue;

    if (!pinMap[pincode]) pinMap[pincode] = { state, offices: [] };
    pinMap[pincode].offices.push({ city, rawName, priority, isDelivery, type: rawType.toUpperCase().replace(/\./g, '') });
  }

  return pinMap;
}

async function parsePDF(filePath, state) {
  console.log(`Reading ${filePath} …`);
  const parser = new PDFParse({ data: readFileSync(filePath) });
  const result = await parser.getText();
  await parser.destroy();
  return parsePDFText(result.text, state);
}

async function main() {
  const sources = [
    { file: 'C:/Users/aravi/Downloads/KERALA pincodes.pdf', state: 'Kerala' },
    { file: 'C:/Users/aravi/Downloads/TN pincodes.pdf',     state: 'Tamil Nadu' },
  ];

  const combined = {};

  for (const { file, state } of sources) {
    const pinMap = await parsePDF(file, state);
    let count = 0;

    for (const [pincode, { offices }] of Object.entries(pinMap)) {
      offices.sort((a, b) => a.priority - b.priority);

      const primary = offices[0].city;
      const seen = new Set();
      const localities = [];
      for (const o of offices) {
        if (!seen.has(o.city)) { seen.add(o.city); localities.push(o.city); }
      }

      combined[pincode] = { primary, state, localities };
      count++;
    }

    console.log(`  → ${count} pincodes extracted from ${state} PDF`);
  }

  const totalPincodes = Object.keys(combined).length;

  // Verify the key pincode
  const sulur = combined['641402'];
  console.log('\nVerification 641402:', sulur ?? 'NOT FOUND');

  // Produce TypeScript file
  const outPath = join(__dirname, '../src/data/pincodeData.ts');
  mkdirSync(dirname(outPath), { recursive: true });

  const ts = `// Auto-generated from official Kerala and Tamil Nadu pincode reference documents.
// Regenerate with: node scripts/generate-pincode-data.mjs
// Total pincodes: ${totalPincodes}
export interface PincodeMeta {
  primary: string;
  state: string;
  localities: string[];
}
export const PINCODE_DATA: Record<string, PincodeMeta> = ${JSON.stringify(combined, null, 2)};
`;

  writeFileSync(outPath, ts, 'utf8');
  console.log(`\nWrote ${outPath} (${totalPincodes} pincodes)`);
}

main().catch(err => { console.error(err); process.exit(1); });
