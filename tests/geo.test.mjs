import test from 'node:test';
import assert from 'node:assert/strict';
import { vzdalenost, stavPriblizeni, posunKCili, formatVzdalenost } from '../site/js/geo.js';

const NAMESTI = [50.3688, 15.6327];
const PORTAL = [50.364934, 15.644933];

test('vzdalenost náměstí → portál je 900–1100 m', () => {
  const d = vzdalenost(NAMESTI, PORTAL);
  assert.ok(d >= 900 && d <= 1100, `vzdálenost ${d}`);
});

test('vzdalenost stejného bodu je 0', () => {
  assert.equal(vzdalenost(NAMESTI, NAMESTI), 0);
});

test('na-miste při 20 m a přesnosti 10 m', () => {
  assert.equal(stavPriblizeni(20, 10, 30, 80), 'na-miste');
});

test('blizko při 60 m', () => {
  assert.equal(stavPriblizeni(60, 10, 30, 80), 'blizko');
});

test('daleko při 200 m', () => {
  assert.equal(stavPriblizeni(200, 10, 30, 80), 'daleko');
});

test('nepřesná GPS neodemkne: 20 m s přesností 60 m → "blizko"', () => {
  assert.equal(stavPriblizeni(20, 60, 30, 80), 'blizko');
});

test('posunKCili se přiblíží o krok a nepřestřelí cíl', () => {
  const dPred = vzdalenost(NAMESTI, PORTAL);
  const dalsi = posunKCili(NAMESTI, PORTAL, 100);
  assert.ok(Math.abs(vzdalenost(dalsi, PORTAL) - (dPred - 100)) < 1);
  assert.deepEqual(posunKCili(NAMESTI, PORTAL, 100000), PORTAL);
});

test('formatVzdalenost', () => {
  assert.equal(formatVzdalenost(180), '180 m');
  assert.equal(formatVzdalenost(1234), '1,2 km');
});
