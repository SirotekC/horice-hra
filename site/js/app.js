// Herní obrazovky: úvod → mapa → na místě → úkol → … → konec.
// Logiku hry, geo výpočty a zdroj polohy dodávají moduly hra.js, geo.js a poloha.js.

import { MAPY_API_KEY } from './config.js';
import { vytvorMapu } from './mapa.js';
import { vzdalenost, stavPriblizeni, formatVzdalenost, MAX_PRESNOST_M } from './geo.js';
import { spustGps, spustSimulaci } from './poloha.js';
import { novaHra, odpovez, aktualniZastaveni, klicUloziste, uloz, nacti } from './hra.js';

/** Jak daleko před prvním zastavením začíná simulovaná chůze (m). */
const START_SIMULACE_M = 150;

const $ = (id) => document.getElementById(id);

// Úložiště může být v soukromém režimu nedostupné – pak hra jede jen v paměti.
const uloziste = (() => {
  try {
    return window.localStorage;
  } catch {
    const data = new Map();
    return {
      getItem: (k) => (data.has(k) ? data.get(k) : null),
      setItem: (k, v) => data.set(k, String(v)),
      removeItem: (k) => data.delete(k),
    };
  }
})();

const hra = {
  trasa: null,
  demo: new URLSearchParams(location.search).get('demo') === '1',
  stav: null,
  zdroj: null, // spustGps / spustSimulaci
  mapa: null,
  poloha: null, // poslední známá poloha
  obrazovka: 'uvod',
  mistoUkazanoPro: -1, // index zastavení, pro které už byla obrazovka „Na místě“
  fotky: [], // object URL fotek z tohoto sezení
  rozpracovanaFotka: null,
};

const klic = () => klicUloziste(hra.trasa.id, hra.demo);
const celkem = () => hra.trasa.zastaveni.length;
const splneno = () => Object.keys(hra.stav?.odpovedi ?? {}).length;

// ---------- Přepínání obrazovek ----------

function ukaz(obrazovka) {
  for (const id of ['uvod', 'mapa', 'misto', 'ukol', 'konec']) $(id).hidden = id !== obrazovka;
  hra.obrazovka = obrazovka;
  window.scrollTo(0, 0);
}

function aktualizujListy() {
  const poradi = Math.min(hra.stav.index + 1, celkem());
  $('mapa-zastaveni').textContent = `Zastavení ${poradi}/${celkem()}`;
  $('ukol-poradi').textContent = `Úkol ${poradi}/${celkem()}`;
  for (const el of document.querySelectorAll('.lista-zastaveni')) {
    el.textContent = `Zastavení ${poradi}/${celkem()}`;
  }
  for (const el of [$('mapa-hvezdy'), ...document.querySelectorAll('.lista-hvezdy')]) {
    el.textContent = `⭐ ${splneno()}`;
  }
}

function nastavUrlDema(demo) {
  const url = new URL(location.href);
  if (demo) url.searchParams.set('demo', '1');
  else url.searchParams.delete('demo');
  history.replaceState(null, '', url);
}

// ---------- 1 · Úvod ----------

function formatCas(minuty) {
  if (minuty % 60 === 0) return `~${minuty / 60} h`;
  return `~${minuty} min`;
}

function vykresliUvod() {
  const t = hra.trasa;
  $('uvod-nazev').textContent = t.nazev;
  $('uvod-pro-koho').textContent = t.pro_koho;
  $('uvod-poznamka').textContent = t.poznamka_pro_rodice;
  const souhrn = [
    `${t.zastaveni.length} zastavení`,
    `~${String(t.delka_km).replace('.', ',')} km`,
    formatCas(t.cas_min),
  ];
  $('uvod-souhrn').replaceChildren(
    ...souhrn.map((text) => Object.assign(document.createElement('span'), { textContent: text })),
  );

  const ulozeny = nacti(uloziste, klic(), t);
  $('btn-pokracovat').hidden = !ulozeny;
  $('btn-znovu').hidden = !ulozeny;
  $('btn-vyrazit').hidden = Boolean(ulozeny);
  $('btn-vyrazit').disabled = false;
  $('btn-ukazka').hidden = hra.demo;
  $('btn-ukazka').disabled = false;
  $('btn-naostro').hidden = !hra.demo;
  $('uvod-demo-stitek').hidden = !hra.demo;
  ukaz('uvod');
}

// ---------- Zdroj polohy ----------

/** Bod START_SIMULACE_M před prvním zastavením, proti směru prvního úseku čáry. */
function startPrvniSimulace() {
  const cil = hra.trasa.zastaveni[0].poloha;
  const [a, b] = hra.trasa.cara;
  const delkaUseku = a && b ? vzdalenost(a, b) : 0;
  if (!delkaUseku) return [cil[0] + START_SIMULACE_M / 111320, cil[1]];
  const t = START_SIMULACE_M / delkaUseku;
  return [cil[0] + (a[0] - b[0]) * t, cil[1] + (a[1] - b[1]) * t];
}

function startSimulace() {
  const i = hra.stav.index;
  return i === 0 ? startPrvniSimulace() : hra.trasa.zastaveni[i - 1].poloha;
}

function zastavZdroj() {
  if (hra.zdroj) hra.zdroj.zastav();
  hra.zdroj = null;
  hra.poloha = null;
}

/** Spustí zdroj polohy. GPS se musí spustit přímo v obsluze klepnutí (iOS). */
function spustZdroj() {
  zastavZdroj();
  if (hra.demo) {
    hra.zdroj = spustSimulaci({ start: startSimulace(), onPoloha: priPoloze });
  } else {
    hra.zdroj = spustGps({
      geolocation: navigator.geolocation,
      onPoloha: priPoloze,
      onChyba: priChybePolohy,
    });
  }
}

function priPoloze(poloha) {
  hra.poloha = poloha;
  $('mapa-chyba').hidden = true;
  if (hra.mapa) hra.mapa.ukazHrace(poloha);
  if (hra.obrazovka !== 'mapa') return;
  if (aktualizujKartuCile() === 'na-miste' && hra.mistoUkazanoPro !== hra.stav.index) {
    ukazMisto();
  }
}

function priChybePolohy({ kod }) {
  const dalsi =
    kod === 'zamitnuto'
      ? 'Povolte polohu pro tuto stránku v nastavení prohlížeče.'
      : 'Zkuste to za chvilku, nejlépe venku pod širým nebem.';
  $('mapa-chyba-text').textContent = `Polohu se nepodařilo zjistit. ${dalsi}`;
  $('mapa-chyba').hidden = false;
}

// ---------- 2 · Mapa ----------

function zajistiMapu() {
  if (hra.mapa) return;
  const platno = $('mapa-platno');
  try {
    hra.mapa = vytvorMapu(platno, { trasa: hra.trasa, apiKey: MAPY_API_KEY });
    hra.mapa.onKlik((latlng) => {
      if (hra.demo && hra.zdroj) hra.zdroj.nastav(latlng);
    });
  } catch (e) {
    console.error('Mapa se nenačetla', e);
    platno.innerHTML =
      '<p class="mapa-nedostupna">Mapu se nepodařilo načíst. Hrát jde dál, vzdálenost ukazuje karta dole.</p>';
  }
}

/**
 * Překreslí kartu s cílem podle poslední polohy.
 * @returns {"na-miste" | "blizko" | "daleko" | null} null = poloha zatím není
 */
function aktualizujKartuCile() {
  const cil = aktualniZastaveni(hra.stav, hra.trasa);
  if (!cil) return null;
  $('mapa-cil').textContent = cil.nazev;
  const p = hra.poloha;
  if (!p) {
    $('mapa-vzdalenost').textContent = 'Hledám vaši polohu…';
    $('mapa-presnost').hidden = true;
    $('btn-jsme-tady').hidden = true;
    return null;
  }
  const metru = vzdalenost(p.latlng, cil.poloha);
  const priblizeni = stavPriblizeni(
    metru,
    p.presnost,
    hra.trasa.polomer_odemceni_m,
    hra.trasa.polomer_tlacitka_m,
  );
  const vzd = $('mapa-vzdalenost');
  vzd.textContent = 'Ještě ';
  vzd.append(Object.assign(document.createElement('b'), { textContent: formatVzdalenost(metru) }));
  $('mapa-presnost').hidden = p.presnost <= MAX_PRESNOST_M;
  $('btn-jsme-tady').hidden = priblizeni === 'daleko';
  return priblizeni;
}

function ukazMapu() {
  aktualizujListy();
  $('mapa-demo-stitek').hidden = !hra.demo;
  $('btn-dojit').hidden = !hra.demo;
  $('mapa-demo-napoveda').hidden = !hra.demo;
  ukaz('mapa');
  zajistiMapu();
  if (hra.mapa) {
    hra.mapa.ukazCil(aktualniZastaveni(hra.stav, hra.trasa));
    if (hra.poloha) hra.mapa.ukazHrace(hra.poloha);
  }
  if (aktualizujKartuCile() === 'na-miste' && hra.mistoUkazanoPro !== hra.stav.index) {
    ukazMisto();
  }
}

/** Začne (nebo obnoví) hru v aktuálním režimu. Volat z obsluhy klepnutí. */
function hraj(stav) {
  hra.stav = stav;
  hra.mistoUkazanoPro = -1;
  uloz(uloziste, klic(), stav);
  if (stav.dokonceno) {
    zastavZdroj();
    ukazKonec();
    return;
  }
  spustZdroj();
  ukazMapu();
}

// ---------- 3 · Na místě ----------

function ukazMisto() {
  const z = aktualniZastaveni(hra.stav, hra.trasa);
  hra.mistoUkazanoPro = hra.stav.index;
  aktualizujListy();
  const obr = $('misto-obrazek');
  obr.src = z.obrazek || 'img/zastupny.svg';
  obr.alt = z.obrazek ? z.nazev : '';
  $('misto-nazev').textContent = z.nazev;
  $('misto-text').textContent = z.text;
  ukaz('misto');
}

// ---------- 4 · Úkol ----------

function zahodRozpracovanouFotku() {
  if (hra.rozpracovanaFotka) URL.revokeObjectURL(hra.rozpracovanaFotka);
  hra.rozpracovanaFotka = null;
}

function maOdpoved() {
  const typ = aktualniZastaveni(hra.stav, hra.trasa).ukol.typ;
  if (typ === 'foto') return Boolean(hra.rozpracovanaFotka);
  if (typ === 'cislo') return $('odpoved-cislo').value.trim() !== '';
  return $('odpoved-text').value.trim() !== '';
}

function aktualizujHotovo() {
  $('btn-hotovo').disabled = !maOdpoved();
}

function ukazUkol() {
  const { ukol } = aktualniZastaveni(hra.stav, hra.trasa);
  aktualizujListy();
  $('ukol-zadani').textContent = ukol.zadani;
  $('ukol-napoveda').textContent = ukol.napoveda;
  $('ukol-napoveda').hidden = true;
  $('btn-napoveda').hidden = !ukol.napoveda;

  $('odpoved-cislo').value = '';
  $('odpoved-text').value = '';
  $('odpoved-foto-vstup').value = '';
  zahodRozpracovanouFotku();
  $('foto-nahled').hidden = true;
  $('foto-nahled').removeAttribute('src');
  $('foto-popisek').textContent = 'Vyfotit';

  $('odpoved-cislo').hidden = ukol.typ !== 'cislo';
  $('odpoved-text').hidden = ukol.typ !== 'text';
  $('odpoved-foto').hidden = ukol.typ !== 'foto';
  aktualizujHotovo();
  ukaz('ukol');
}

function priVyberuFotky() {
  const soubor = $('odpoved-foto-vstup').files[0];
  if (!soubor) return; // výběr zrušen – necháme předchozí fotku
  zahodRozpracovanouFotku();
  hra.rozpracovanaFotka = URL.createObjectURL(soubor);
  $('foto-nahled').src = hra.rozpracovanaFotka;
  $('foto-nahled').hidden = false;
  $('foto-popisek').textContent = 'Vyfotit znovu';
  aktualizujHotovo();
}

function priHotovo() {
  if (!maOdpoved()) return;
  const typ = aktualniZastaveni(hra.stav, hra.trasa).ukol.typ;
  let odpoved;
  if (typ === 'foto') {
    hra.fotky.push(hra.rozpracovanaFotka);
    hra.rozpracovanaFotka = null; // URL teď patří do fotek na konec
    odpoved = 'foto';
  } else {
    odpoved = $(typ === 'cislo' ? 'odpoved-cislo' : 'odpoved-text').value;
  }
  hra.stav = odpovez(hra.stav, hra.trasa, odpoved);
  uloz(uloziste, klic(), hra.stav);
  if (hra.stav.dokonceno) {
    zastavZdroj();
    ukazKonec();
  } else {
    ukazMapu();
  }
}

// ---------- 5 · Konec ----------

function ukazKonec() {
  const n = splneno();
  $('konec-hvezdy').textContent = `${'⭐'.repeat(n)} ${n}/${celkem()} úkolů`.trim();
  const mrizka = $('konec-fotky-mrizka');
  mrizka.replaceChildren(
    ...hra.fotky.map((url) => Object.assign(document.createElement('img'), { src: url, alt: 'Fotka z cesty' })),
  );
  $('konec-fotky').hidden = hra.fotky.length === 0;
  ukaz('konec');
}

function hratZnovu() {
  zastavZdroj();
  for (const url of hra.fotky) URL.revokeObjectURL(url);
  hra.fotky = [];
  try {
    uloziste.removeItem(klic());
  } catch {
    // nevadí – nový postup se přepíše při startu
  }
  hra.stav = null;
  vykresliUvod();
}

// ---------- Obsluha tlačítek ----------

function propojTlacitka() {
  $('btn-vyrazit').addEventListener('click', () => hraj(novaHra(hra.trasa)));
  $('btn-pokracovat').addEventListener('click', () => {
    hraj(nacti(uloziste, klic(), hra.trasa) ?? novaHra(hra.trasa));
  });
  $('btn-znovu').addEventListener('click', () => hraj(novaHra(hra.trasa)));
  $('btn-ukazka').addEventListener('click', () => {
    hra.demo = true;
    nastavUrlDema(true);
    hraj(novaHra(hra.trasa));
  });
  $('btn-naostro').addEventListener('click', () => {
    hra.demo = false;
    nastavUrlDema(false);
    vykresliUvod();
  });

  $('btn-na-ukazku').addEventListener('click', () => {
    // Pokračuje se ze stejného zastavení; ostrý postup zůstane uložený beze změny.
    const stav = hra.stav;
    hra.demo = true;
    nastavUrlDema(true);
    $('mapa-chyba').hidden = true;
    hraj(stav);
  });
  $('btn-jsme-tady').addEventListener('click', ukazMisto);
  $('btn-dojit').addEventListener('click', () => {
    const cil = aktualniZastaveni(hra.stav, hra.trasa);
    if (hra.demo && hra.zdroj && cil) hra.zdroj.jdiK(cil.poloha);
  });

  $('btn-otevrit-ukol').addEventListener('click', ukazUkol);

  $('odpoved-cislo').addEventListener('input', aktualizujHotovo);
  $('odpoved-text').addEventListener('input', aktualizujHotovo);
  $('odpoved-foto-vstup').addEventListener('change', priVyberuFotky);
  $('btn-napoveda').addEventListener('click', () => {
    $('ukol-napoveda').hidden = false;
    $('ukol-napoveda').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
  $('btn-hotovo').addEventListener('click', priHotovo);

  $('btn-hrat-znovu').addEventListener('click', hratZnovu);
}

// ---------- Start ----------

async function start() {
  propojTlacitka();
  try {
    const odpoved = await fetch('data/trasa.json');
    if (!odpoved.ok) throw new Error(`HTTP ${odpoved.status}`);
    hra.trasa = await odpoved.json();
  } catch (e) {
    console.error('Trasa se nenačetla', e);
    $('uvod-chyba').textContent = 'Hru se nepodařilo načíst. Zkontrolujte připojení a obnovte stránku.';
    $('uvod-chyba').hidden = false;
    return;
  }
  vykresliUvod();
}

start();
