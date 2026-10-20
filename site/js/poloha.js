// Zdroj polohy: skutečné GPS (na místě) a simulace (předvádění u stolu).
// Obojí posílá stejný tvar polohy, takže zbytek aplikace je na zdroji nezávislý.

import { posunKCili } from './geo.js';

/**
 * @typedef {Object} Poloha
 * @property {[number, number]} latlng [lat, lng]
 * @property {number} presnost přesnost v metrech
 */

const KODY_CHYB = { 1: 'zamitnuto', 2: 'nedostupna', 3: 'timeout' };

/**
 * Obal nad geolocation.watchPosition.
 * @param {Object} o
 * @param {Geolocation | undefined} o.geolocation v prohlížeči navigator.geolocation
 * @param {(poloha: Poloha) => void} o.onPoloha
 * @param {(chyba: {kod: "zamitnuto" | "nedostupna" | "timeout"}) => void} o.onChyba
 * @returns {{ zastav(): void }}
 */
export function spustGps({ geolocation, onPoloha, onChyba }) {
  if (!geolocation) {
    onChyba({ kod: 'nedostupna' });
    return { zastav() {} };
  }
  const id = geolocation.watchPosition(
    (pozice) =>
      onPoloha({
        latlng: [pozice.coords.latitude, pozice.coords.longitude],
        presnost: pozice.coords.accuracy,
      }),
    (err) => onChyba({ kod: KODY_CHYB[err.code] ?? 'nedostupna' }),
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
  );
  return {
    zastav() {
      geolocation.clearWatch(id);
    },
  };
}

/**
 * Simulovaná poloha pro předvádění: skok na místo nebo animovaná „chůze“.
 * @param {Object} o
 * @param {[number, number]} o.start výchozí poloha [lat, lng]
 * @param {(poloha: Poloha) => void} o.onPoloha
 * @returns {{
 *   nastav(latlng: [number, number]): void,
 *   jdiK(cil: [number, number], volby?: {krokM?: number, intervalMs?: number}): Promise<void>,
 *   zastav(): void
 * }}
 */
export function spustSimulaci({ start, onPoloha }) {
  let aktualni = [start[0], start[1]];
  let bezi = true;
  let zrusChuzi = null;

  const posli = () => onPoloha({ latlng: [aktualni[0], aktualni[1]], presnost: 5 });
  const zrus = () => {
    if (zrusChuzi) zrusChuzi();
  };

  posli();

  return {
    nastav(latlng) {
      if (!bezi) return;
      zrus();
      aktualni = [latlng[0], latlng[1]];
      posli();
    },

    /** Vrací Promise splněný, když chůze dojde do cíle nebo je zrušena. */
    jdiK(cil, { krokM = 15, intervalMs = 400 } = {}) {
      if (!bezi) return Promise.resolve();
      zrus();
      return new Promise((hotovo) => {
        let casovac = null;
        let zruseno = false;
        const skonci = () => {
          zruseno = true;
          clearTimeout(casovac);
          if (zrusChuzi === skonci) zrusChuzi = null;
          hotovo();
        };
        zrusChuzi = skonci;
        const krok = () => {
          if (zruseno) return;
          aktualni = posunKCili(aktualni, cil, krokM);
          posli();
          // onPoloha mohl chůzi zrušit (zastav, nastav, jdiK) – pak nic nenaplánujeme
          if (zruseno) return;
          if (aktualni[0] === cil[0] && aktualni[1] === cil[1]) skonci();
          else casovac = setTimeout(krok, intervalMs);
        };
        casovac = setTimeout(krok, intervalMs);
      });
    },

    zastav() {
      bezi = false;
      zrus();
    },
  };
}
