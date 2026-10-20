// Stav hry a ukládání postupu: čisté funkce bez DOM (úložiště se předává zvenku).

/**
 * @typedef {{ trasaId: string, index: number, odpovedi: Object<string, string>, dokonceno: boolean }} Stav
 */

/**
 * Nová hra na začátku trasy.
 * @param {{ id: string }} trasa
 * @returns {Stav}
 */
export function novaHra(trasa) {
  return { trasaId: trasa.id, index: 0, odpovedi: {}, dokonceno: false };
}

/**
 * Uloží odpověď k aktuálnímu zastavení a posune hru dál (vstup nemění).
 * U foto úkolu se předává jen značka "foto".
 * @param {Stav} stav
 * @param {{ zastaveni: Array<{ id: string }> }} trasa
 * @param {string} odpoved
 * @returns {Stav}
 */
export function odpovez(stav, trasa, odpoved) {
  if (stav.dokonceno) throw new Error('Hra je dokončená');
  const text = String(odpoved ?? '').trim();
  if (!text) throw new Error('Prázdná odpověď');
  const zastaveni = trasa.zastaveni[stav.index];
  const index = stav.index + 1;
  return {
    trasaId: stav.trasaId,
    index,
    odpovedi: { ...stav.odpovedi, [zastaveni.id]: text },
    dokonceno: index >= trasa.zastaveni.length,
  };
}

/**
 * Aktuální zastavení, nebo null, když je hra dokončená.
 * @param {Stav} stav
 * @param {{ zastaveni: object[] }} trasa
 * @returns {object | null}
 */
export function aktualniZastaveni(stav, trasa) {
  if (stav.dokonceno) return null;
  return trasa.zastaveni[stav.index] ?? null;
}

/**
 * Klíč v úložišti; demo režim má vlastní, aby nepřepsal ostrý postup.
 * @param {string} trasaId
 * @param {boolean} demo
 * @returns {string}
 */
export function klicUloziste(trasaId, demo) {
  return 'horice-hra:' + trasaId + (demo ? ':demo' : '');
}

/**
 * Uloží stav. Selhání úložiště (např. soukromý režim Safari) tiše ignoruje.
 * @param {{ setItem(k: string, v: string): void }} uloziste
 * @param {string} klic
 * @param {Stav} stav
 */
export function uloz(uloziste, klic, stav) {
  try {
    uloziste.setItem(klic, JSON.stringify(stav));
  } catch {
    // postup se prostě neuloží
  }
}

/**
 * Načte stav; null, když nic není, JSON je rozbitý, nebo stav nesedí k trase.
 * @param {{ getItem(k: string): string | null }} uloziste
 * @param {string} klic
 * @param {{ id: string, zastaveni: object[] }} trasa
 * @returns {Stav | null}
 */
export function nacti(uloziste, klic, trasa) {
  try {
    const stav = JSON.parse(uloziste.getItem(klic));
    if (!stav || stav.trasaId !== trasa.id) return null;
    if (!Number.isInteger(stav.index) || stav.index < 0 || stav.index > trasa.zastaveni.length) return null;
    if (!stav.odpovedi || typeof stav.odpovedi !== 'object' || Array.isArray(stav.odpovedi)) return null;
    return {
      trasaId: stav.trasaId,
      index: stav.index,
      odpovedi: stav.odpovedi,
      dokonceno: stav.dokonceno === true,
    };
  } catch {
    return null;
  }
}
