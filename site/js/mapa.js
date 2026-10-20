// Mapa hry: Leaflet (globální `L` z unpkg), podklad Mapy.com nebo záložně OpenStreetMap.

const ORANZOVA = '#e8892b';
const MODRA = '#2b7de8';

/** Podklad Mapy.com včetně povinného uvedení zdroje a loga (vlevo dole). */
function pridejPodkladMapyCom(mapa, apiKey) {
  L.tileLayer(
    `https://api.mapy.com/v1/maptiles/basic/256/{z}/{x}/{y}?apikey=${encodeURIComponent(apiKey)}`,
    {
      minZoom: 0,
      maxZoom: 19,
      attribution:
        '<a href="https://api.mapy.com/copyright" target="_blank">&copy; Seznam.cz a.s. a další</a>',
    },
  ).addTo(mapa);

  const Logo = L.Control.extend({
    options: { position: 'bottomleft' },
    onAdd() {
      const odkaz = L.DomUtil.create('a', 'mapa-logo');
      odkaz.href = 'https://mapy.com/';
      odkaz.target = '_blank';
      odkaz.rel = 'noopener';
      odkaz.innerHTML = '<img src="https://api.mapy.com/img/api/logo.svg" alt="Mapy.com">';
      L.DomEvent.disableClickPropagation(odkaz);
      return odkaz;
    },
  });
  new Logo().addTo(mapa);
}

function pridejPodkladOsm(mapa) {
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap',
  }).addTo(mapa);
}

/** Značka zastavení: "splnena" (✓), "aktualni" (větší, oranžová) nebo "budouci" (šedá). */
function ikonaZastaveni(poradi, stav) {
  const velikost = stav === 'aktualni' ? 40 : 30;
  return L.divIcon({
    className: `znacka znacka--${stav}`,
    html: `<span>${stav === 'splnena' ? '✓' : poradi}</span>`,
    iconSize: [velikost, velikost],
    iconAnchor: [velikost / 2, velikost / 2],
  });
}

/**
 * Vytvoří mapu hry v daném prvku (prvek musí být viditelný, aby šla trasa přizpůsobit).
 * @param {HTMLElement} element
 * @param {{ trasa: object, apiKey: string }} volby prázdný apiKey = záložní OSM
 * @returns {{
 *   ukazHrace(poloha: import('./poloha.js').Poloha): void,
 *   ukazCil(zastaveni: object | null): void,
 *   onKlik(fn: (latlng: [number, number]) => void): void
 * }}
 */
export function vytvorMapu(element, { trasa, apiKey }) {
  const mapa = L.map(element, { zoomControl: true });
  if (apiKey) pridejPodkladMapyCom(mapa, apiKey);
  else pridejPodkladOsm(mapa);

  L.polyline(trasa.cara, {
    color: ORANZOVA,
    weight: 5,
    opacity: 0.9,
    dashArray: '10 8',
    interactive: false,
  }).addTo(mapa);

  // Neinteraktivní vrstvy: klepnutí projde až do mapy (v ukázce přesouvá hráče).
  const znacky = trasa.zastaveni.map((z, i) =>
    L.marker(z.poloha, {
      icon: ikonaZastaveni(i + 1, 'budouci'),
      interactive: false,
      keyboard: false,
    }).addTo(mapa),
  );

  const body = [...trasa.cara, ...trasa.zastaveni.map((z) => z.poloha)];
  mapa.fitBounds(L.latLngBounds(body), { padding: [30, 30] });

  // Mapa mění velikost při přepínání obrazovek a otáčení telefonu.
  if (typeof ResizeObserver === 'function') {
    new ResizeObserver(() => mapa.invalidateSize()).observe(element);
  }

  // Hráč nad značkami zastavení, aby ho značka v cíli nezakryla.
  mapa.createPane('hrac');
  mapa.getPane('hrac').style.zIndex = 650;
  mapa.getPane('hrac').style.pointerEvents = 'none';

  let tecka = null;
  let kruhPresnosti = null;

  return {
    ukazHrace({ latlng, presnost }) {
      if (!tecka) {
        kruhPresnosti = L.circle(latlng, {
          radius: presnost,
          color: MODRA,
          weight: 1,
          fillColor: MODRA,
          fillOpacity: 0.15,
          interactive: false,
          pane: 'hrac',
        }).addTo(mapa);
        tecka = L.circleMarker(latlng, {
          radius: 9,
          color: '#fff',
          weight: 3,
          fillColor: MODRA,
          fillOpacity: 1,
          interactive: false,
          pane: 'hrac',
        }).addTo(mapa);
        return;
      }
      tecka.setLatLng(latlng);
      kruhPresnosti.setLatLng(latlng).setRadius(presnost);
    },

    ukazCil(zastaveni) {
      const indexCile = zastaveni
        ? trasa.zastaveni.findIndex((z) => z.id === zastaveni.id)
        : trasa.zastaveni.length;
      znacky.forEach((znacka, i) => {
        const stav = i < indexCile ? 'splnena' : i === indexCile ? 'aktualni' : 'budouci';
        znacka.setIcon(ikonaZastaveni(i + 1, stav));
        znacka.setZIndexOffset(stav === 'aktualni' ? 1000 : 0);
      });
    },

    onKlik(fn) {
      mapa.on('click', (e) => fn([e.latlng.lat, e.latlng.lng]));
    },
  };
}
