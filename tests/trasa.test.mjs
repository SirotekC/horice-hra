// Testy dat trasy: schéma, unikátní id, vzdálenost zastavení od čáry.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';

const nacti = (cesta) => JSON.parse(readFileSync(new URL(`../${cesta}`, import.meta.url), 'utf8'));
const schema = nacti('schema/trasa.schema.json');
const trasa = nacti('site/data/trasa.json');
const validator = new Ajv2020({ allErrors: true, strict: true }).compile(schema);

/** Vzdálenost dvou bodů [šířka, délka] v metrech (haversine). */
function vzdalenostM([lat1, lon1], [lat2, lon2]) {
  const R = 6371000;
  const rad = (s) => (s * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

test('trasa.json projde schématem', () => {
  assert.equal(validator(trasa), true, JSON.stringify(validator.errors));
});

test('každé zastavení má unikátní id a typ úkolu cislo|foto|text', () => {
  const ids = trasa.zastaveni.map((z) => z.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const z of trasa.zastaveni) assert.ok(['cislo', 'foto', 'text'].includes(z.ukol.typ), z.id);
});

test('zastavení jsou do 150 m od čáry trasy', () => {
  for (const z of trasa.zastaveni) {
    const nejblize = Math.min(...trasa.cara.map((b) => vzdalenostM(z.poloha, b)));
    assert.ok(nejblize < 150, `${z.id} je ${Math.round(nejblize)} m od čáry`);
  }
});

test('schéma odmítne neznámý typ úkolu', () => {
  const kopie = structuredClone(trasa);
  kopie.zastaveni[0].ukol.typ = 'kviz';
  assert.equal(validator(kopie), false);
});
