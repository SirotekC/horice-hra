// Validace dat trasy: schéma + logické kontroly.
// Použití: node scripts/validate.mjs   (exit kód 1 při chybě)

import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';

const KOREN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function nactiJson(relativniCesta) {
  const text = await readFile(path.join(KOREN, relativniCesta), 'utf8');
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`${relativniCesta}: neplatný JSON – ${e.message}`);
  }
}

/** Převede cestu z ajv (`/zastaveni/0/ukol`) na čitelnou (`trasa.zastaveni[0].ukol`). */
export function citelnaCesta(soubor, instancePath) {
  let vysledek = soubor;
  for (const cast of instancePath.split('/').filter(Boolean)) {
    vysledek += /^\d+$/.test(cast) ? `[${cast}]` : `.${cast}`;
  }
  return vysledek;
}

function popisChybyAjv(soubor, chyba) {
  let cesta = citelnaCesta(soubor, chyba.instancePath);
  let zprava = chyba.message;
  if (chyba.keyword === 'additionalProperties') {
    cesta += `.${chyba.params.additionalProperty}`;
    zprava = 'neznámé pole (překlep v názvu?)';
  } else if (chyba.keyword === 'required') {
    zprava = `chybí povinné pole „${chyba.params.missingProperty}“`;
  } else if (chyba.keyword === 'enum') {
    zprava = `musí být jedna z hodnot: ${chyba.params.allowedValues.join(', ')}`;
  }
  return `${cesta}: ${zprava}`;
}

/** Logické kontroly nad daty, která prošla schématem. */
export function zkontrolujTrasu(trasa) {
  const chyby = [];
  const videne = new Set();
  trasa.zastaveni.forEach((z, i) => {
    if (videne.has(z.id)) chyby.push(`trasa.zastaveni[${i}].id: duplicitní id „${z.id}“`);
    videne.add(z.id);
  });
  if (trasa.polomer_odemceni_m > trasa.polomer_tlacitka_m) {
    chyby.push('trasa.polomer_odemceni_m: nesmí být větší než polomer_tlacitka_m');
  }
  return chyby;
}

/** Spustí celou validaci nad soubory v repozitáři. */
export async function validuj() {
  const ajv = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: true });
  const validator = ajv.compile(await nactiJson('schema/trasa.schema.json'));
  const trasa = await nactiJson('site/data/trasa.json');
  if (!validator(trasa)) return { chyby: validator.errors.map((e) => popisChybyAjv('trasa', e)) };
  return { chyby: zkontrolujTrasu(trasa) };
}

async function main() {
  let vysledek;
  try {
    vysledek = await validuj();
  } catch (e) {
    console.error(`✖ ${e.message}`);
    process.exit(1);
  }
  for (const c of vysledek.chyby) console.error(`✖ ${c}`);
  if (vysledek.chyby.length) {
    const n = vysledek.chyby.length;
    console.error(`\nValidace selhala: ${n} ${n === 1 ? 'chyba' : n <= 4 ? 'chyby' : 'chyb'}.`);
    process.exit(1);
  }
  console.log('✔ Data trasy jsou v pořádku.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
