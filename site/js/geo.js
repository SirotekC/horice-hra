// Geo výpočty: čisté funkce bez DOM (používá prohlížeč i testy v Node).

const POLOMER_ZEME_M = 6371000;

/** Nejhorší přesnost GPS (v metrech), při které ještě smíme automaticky odemknout. */
export const MAX_PRESNOST_M = 50;

const naRadiany = (stupne) => (stupne * Math.PI) / 180;

/**
 * Vzdušná vzdálenost dvou bodů (haversine).
 * @param {[number, number]} a [lat, lng]
 * @param {[number, number]} b [lat, lng]
 * @returns {number} vzdálenost v metrech
 */
export function vzdalenost(a, b) {
  const dLat = naRadiany(b[0] - a[0]);
  const dLng = naRadiany(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(naRadiany(a[0])) * Math.cos(naRadiany(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * POLOMER_ZEME_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Stav přiblížení k cíli.
 * "na-miste" jen když je dítě v poloměru odemčení A GPS je dost přesná.
 * @param {number} vzdalenostM vzdálenost k cíli v metrech
 * @param {number} presnostM přesnost GPS v metrech
 * @param {number} polomerOdemceni poloměr automatického odemčení (m)
 * @param {number} polomerTlacitka poloměr záložního tlačítka „Jsme tady“ (m)
 * @returns {"na-miste" | "blizko" | "daleko"}
 */
export function stavPriblizeni(vzdalenostM, presnostM, polomerOdemceni, polomerTlacitka) {
  if (vzdalenostM <= polomerOdemceni && presnostM <= MAX_PRESNOST_M) return 'na-miste';
  if (vzdalenostM <= polomerTlacitka) return 'blizko';
  return 'daleko';
}

/**
 * Bod o krokM blíž k cíli (lineární interpolace; nepřestřelí cíl).
 * @param {[number, number]} z výchozí bod [lat, lng]
 * @param {[number, number]} cil cílový bod [lat, lng]
 * @param {number} krokM délka kroku v metrech
 * @returns {[number, number]}
 */
export function posunKCili(z, cil, krokM) {
  const d = vzdalenost(z, cil);
  if (d <= krokM) return [cil[0], cil[1]];
  const t = krokM / d;
  return [z[0] + (cil[0] - z[0]) * t, z[1] + (cil[1] - z[1]) * t];
}

/**
 * Vzdálenost čitelná pro děti: "180 m", od 1000 m "1,2 km".
 * @param {number} m vzdálenost v metrech
 * @returns {string}
 */
export function formatVzdalenost(m) {
  if (Math.round(m) < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1).replace('.', ',')} km`;
}
