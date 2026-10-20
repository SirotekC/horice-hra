import test from 'node:test';
import assert from 'node:assert/strict';
import { spustGps, spustSimulaci } from '../site/js/poloha.js';
import { vzdalenost } from '../site/js/geo.js';

const NAMESTI = [50.3688, 15.6327];
const PORTAL = [50.364934, 15.644933];

function falesnaGeolocation() {
  const g = {
    parametry: null,
    vycisteno: [],
    watchPosition(ok, chyba, opts) {
      g.ok = ok;
      g.chyba = chyba;
      g.parametry = opts;
      return 42;
    },
    clearWatch(id) {
      g.vycisteno.push(id);
    },
  };
  return g;
}

test('spustGps předá polohu jako {latlng, presnost}', () => {
  const g = falesnaGeolocation();
  const polohy = [];
  spustGps({ geolocation: g, onPoloha: (p) => polohy.push(p), onChyba: () => {} });
  g.ok({ coords: { latitude: 50.1, longitude: 15.2, accuracy: 12 } });
  assert.deepEqual(polohy, [{ latlng: [50.1, 15.2], presnost: 12 }]);
  assert.deepEqual(g.parametry, { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 });
});

test('spustGps převede chybu code 1 na kod "zamitnuto"', () => {
  const g = falesnaGeolocation();
  const chyby = [];
  spustGps({ geolocation: g, onPoloha: () => {}, onChyba: (c) => chyby.push(c) });
  g.chyba({ code: 1 });
  g.chyba({ code: 2 });
  g.chyba({ code: 3 });
  g.chyba({ code: 99 });
  assert.deepEqual(
    chyby.map((c) => c.kod),
    ['zamitnuto', 'nedostupna', 'timeout', 'nedostupna'],
  );
});

test('spustGps bez geolocation hlásí "nedostupna"', () => {
  const chyby = [];
  const r = spustGps({ geolocation: undefined, onPoloha: () => {}, onChyba: (c) => chyby.push(c) });
  assert.deepEqual(chyby, [{ kod: 'nedostupna' }]);
  assert.doesNotThrow(() => r.zastav());
});

test('zastav zavolá clearWatch', () => {
  const g = falesnaGeolocation();
  const r = spustGps({ geolocation: g, onPoloha: () => {}, onChyba: () => {} });
  r.zastav();
  assert.deepEqual(g.vycisteno, [42]);
});

test('simulace pošle start hned po spuštění', () => {
  const polohy = [];
  const s = spustSimulaci({ start: NAMESTI, onPoloha: (p) => polohy.push(p) });
  assert.deepEqual(polohy, [{ latlng: NAMESTI, presnost: 5 }]);
  s.zastav();
});

test('nastav okamžitě přesune polohu', () => {
  const polohy = [];
  const s = spustSimulaci({ start: NAMESTI, onPoloha: (p) => polohy.push(p) });
  s.nastav(PORTAL);
  assert.deepEqual(polohy.at(-1), { latlng: PORTAL, presnost: 5 });
  s.zastav();
});

test('jdiK skončí přesně v cíli', async () => {
  const polohy = [];
  const s = spustSimulaci({ start: NAMESTI, onPoloha: (p) => polohy.push(p) });
  await s.jdiK(PORTAL, { krokM: 100, intervalMs: 0 });
  assert.deepEqual(polohy.at(-1).latlng, PORTAL);
  assert.ok(polohy.length > 3);
  s.zastav();
});

test('jdiK posílá kroky nejvýš krokM', async () => {
  const polohy = [];
  const s = spustSimulaci({ start: NAMESTI, onPoloha: (p) => polohy.push(p) });
  await s.jdiK(PORTAL, { krokM: 100, intervalMs: 0 });
  for (let i = 1; i < polohy.length; i++) {
    assert.ok(vzdalenost(polohy[i - 1].latlng, polohy[i].latlng) <= 100.5);
  }
});

test('nová jdiK zruší předchozí chůzi', async () => {
  const polohy = [];
  const s = spustSimulaci({ start: NAMESTI, onPoloha: (p) => polohy.push(p) });
  const prvni = s.jdiK(PORTAL, { krokM: 10, intervalMs: 0 });
  const druha = s.jdiK(NAMESTI, { krokM: 10, intervalMs: 0 });
  await Promise.all([prvni, druha]);
  assert.deepEqual(polohy.at(-1).latlng, NAMESTI);
});

test('po zastav už nechodí a nevolá onPoloha', async () => {
  const polohy = [];
  const s = spustSimulaci({ start: NAMESTI, onPoloha: (p) => polohy.push(p) });
  const chuze = s.jdiK(PORTAL, { krokM: 10, intervalMs: 0 });
  s.zastav();
  const n = polohy.length;
  await chuze;
  s.nastav(PORTAL);
  assert.equal(polohy.length, n);
});
