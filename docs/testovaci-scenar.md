# Testovací scénář – Hořice hravě

Ruční test na telefonech: **Android (Chrome)** a **iPhone (Safari)**. Do sloupců Android a iPhone zapište `ano` / `ne` / `částečně`, podrobnosti do Poznámky.

Adresa hry: <https://sirotekc.github.io/horice-hra/> (z QR kódu nebo odkazu).

## Příprava

- Zapnutá poloha v telefonu, mobilní data, nabitá baterie.
- Mapy.com klíč vložený v `site/js/config.js` (viz konec dokumentu); bez klíče se použije záložní mapa OpenStreetMap, což je také dobré vyzkoušet.
- Před každým kolem vymazat data stránky (nebo „Začít znovu“), ať se začíná čistě.

## 1. Otevření a ukázkový režim (u stolu)

| Krok | Co čekat | Android | iPhone | Poznámka |
|---|---|---|---|---|
| Otevřít adresu z QR kódu / odkazu | Úvodní obrazovka se načte, tlačítka jsou čitelná a velká | | | |
| Klepnout na „Ukázka u stolu“ | Zobrazí se mapa s trasou a značkami zastavení | | | |
| „Dojít k dalšímu zastavení“ (1. zastavení – náměstí) | Zastavení se označí jako „Na místě“, nabídne se úkol | | | |
| Splnit úkol na náměstí a „Hotovo“ | Hra pokračuje k dalšímu zastavení | | | |
| Klepnutí na mapu | Simulovaná poloha se přesune na klepnuté místo; u zastavení se odemkne úkol | | | |
| Projít celou trasu v ukázce (Smetanovy sady, Gothard) | Všechna 3 zastavení jdou splnit, zobrazí se závěrečná obrazovka | | | |
| Závěrečná obrazovka | Vidět fotky z cesty, tlačítko „Hrát znovu“ funguje | | | |

## 2. Ostrý režim venku

| Krok | Co čekat | Android | iPhone | Poznámka |
|---|---|---|---|---|
| „Vyrazit“ | Telefon se zeptá na povolení polohy | | | |
| Povolit polohu | Na mapě je vidět moje poloha, mapa se vystředí | | | |
| Jít k 1. zastavení | Vzdálenost k zastavení se při chůzi průběžně zmenšuje | | | |
| Náměstí: dojít ke značce (do 30 m) | Automaticky „Na místě“, nabídne se úkol | | | |
| Náměstí: úkol – číslo popisné radnice | Číslo se zadá, správná odpověď projde, špatná dá nápovědu | | | |
| „Jsme tady“ (stát dál než 30 m, ale do 80 m) | Záložní tlačítko se objeví a odemkne úkol | | | |
| Smetanovy sady: dojít k Krakonošovi | Automaticky „Na místě“ | | | |
| Smetanovy sady: úkol – foto Krakonoše | Telefon se zeptá na povolení fotoaparátu, fotka se pořídí a zobrazí | | | |
| Gothard: dojít k portálu | Automaticky „Na místě“ | | | |
| Gothard: úkol – text z portálu | Text se zadá a ověří | | | |
| Varování o přesnosti GPS (např. v Gothardské ulici nebo pod stromy) | Zobrazí se upozornění, že poloha je nepřesná; „Jsme tady“ pomůže | | | |
| Zamknout telefon, po chvíli se vrátit | Hra běží dál, poloha se obnoví, stav hry zůstal | | | |
| Obnovit stránku uprostřed hry | Úvodní obrazovka nabídne „Pokračovat“ na správném zastavení, fotky zůstaly | | | |
| Konec hry | Závěrečná obrazovka s fotkami z cesty | | | |

## 3. Odmítnutá poloha

| Krok | Co čekat | Android | iPhone | Poznámka |
|---|---|---|---|---|
| „Vyrazit“ a poloha **zakázat** | Srozumitelná hláška, ne prázdná mapa | | | |
| „Přepnout na ukázku“ | Hra pokračuje v ukázkovém režimu | | | |
| Povolit polohu v nastavení prohlížeče a zkusit znovu | Ostrý režim už funguje | | | |

## Co zapsat

- Kde byl GPS nepřesný nebo skákal (ulice, místo, odhad v metrech).
- Skutečné souřadnice **cedulky na radnici**, **Krakonoše** a **hřbitovního portálu**, pokud značky na mapě nesedí (stačí zkopírovat z mapy v telefonu).
- Nápady na úkoly nebo úpravy textů (co bylo dětem nejasné, co je bavilo).
- Cokoli nečitelného nebo špatně klepnutelného na malém displeji.

## Klíč Mapy.com

1. Zaregistrovat se na <https://developer.mapy.com/> a vytvořit API klíč.
2. V nastavení klíče ho omezit na domény `sirotekc.github.io` a `localhost`.
3. Klíč vložit do `site/js/config.js` jako `MAPY_API_KEY`. Klíč je ve statickém webu veřejně viditelný, proto je omezení na domény důležité.
