# Hořice hravě – technický prototyp (návrh)

Datum: 2026-10-20

## Záměr a proč

Hravý interaktivní průvodce městem Hořice pro rodiny s dětmi. Hráč jde podle mapy a GPS po zajímavostech a na každém místě plní úkol. Běží jako webová stránka bez instalace aplikace.

Tento dokument popisuje **technický prototyp**. Jeho účelem je ukázat spolupracovníkům **princip** (mapa → dojdu na místo → odemkne se úkol → další zastavení), aby si dokázali představit, jak to bude fungovat a vypadat, a mohli se domluvit na konkrétních místech a úkolech. Do budoucna má být projekt nabídnut Infocentru Hořice a mají vzniknout další varianty trasy pro menší i větší děti.

Cílová skupina prototypu: děti 5–10 let. Telefon drží rodič a čte texty nahlas, dítě občas ťukne. Zda bude ovládat i dítě samo, se zatím neví. Proto by měly být texty krátké a čitelné nahlas a tlačítka velká.

## Jak se prototyp předvádí

1. **U stolu** (počítač nebo telefon): ukázkový režim se simulovanou polohou. Musí jít projít celou hru bez chůze.
2. **Přímo na trase v Hořicích**: skutečná GPS v telefonu (Android i iPhone).

## Cíle

- Projít celou trasu se 3 zastaveními v obou režimech (ukázkový i GPS).
- Mapa z Mapy.com s polohou hráče, trasou a cílem. Vzdálenost k dalšímu zastavení.
- Automatické odemčení zastavení po příchodu na místo.
- Tři typy úkolů: opsat číslo, vyfotit, opsat text.
- Postup se pamatuje i po zavření stránky. Hru jde začít znovu.
- Trasa, texty a úkoly v jednom datovém souboru, aby šly snadno měnit podle domluvy se spolupracovníky (bez zásahu do kódu).
- Jedna samostatná **statická ukázková obrazovka** („jak by to mohlo vypadat“), třeba s postavičkou nebo kreslenou mapou. Není napojená na hru, slouží jen k ilustraci atmosféry.

## Mimo rozsah (non-goals)

- Postavička, příběh a výtvarný styl celé hry: budou vymyšleny později.
- Více tras nebo variant podle věku: přijdou později. Datový model by je ale neměl zbytečně blokovat.
- Backend, účty, žebříčky, statistiky, odesílání fotek kamkoli.
- Vlastní nebo animovaná mapa: možná později.
- Offline režim se staženou mapou, instalace na plochu (PWA manifest) a push notifikace nejsou pro prototyp potřeba.
- Kontrola správnosti odpovědí: správné odpovědi zatím nejsou známé.

## Anti-cíle (co by bylo selhání, i kdyby to technicky fungovalo)

- Spolupracovníci z toho nepochopí princip, protože se demo u stolu zasekne na „musíš být na místě“.
- Na iPhonu to nefunguje (povolení polohy, fotoaparát).
- Úprava míst a úkolů vyžaduje programování.
- Dítě je nuceno chodit s očima v telefonu bez upozornění na bezpečnost.

## Trasa prototypu (pevná)

| # | Místo | Úkol |
|---|---|---|
| 1 | Náměstí Jiřího z Poděbrad (u radnice) | Opiš číslo popisné radnice. |
| 2 | Smetanovy sady | Vyfoť sochu Krakonoše. |
| 3 | Hřbitovní portál na vrchu Gothard | Opiš text z portálu. |

Přesné souřadnice zastavení a průběh trasy mezi nimi (body čáry na mapě) doplní stavitel podle mapy. Uživatel je pak ověří na místě.

## Průběh hry (odsouhlaseno podle náčrtu obrazovek)

1. **Úvod**: název, pro koho, počet zastavení, přibližná délka a čas, krátká poznámka pro rodiče („čtěte nahlas, dívejte se kolem sebe“). Tlačítko „Vyrazit“. O povolení polohy se žádá až po klepnutí.
2. **Mapa a cesta**: mapa Mapy.com, tečka hráče, vyznačená trasa a cíl. Karta s názvem dalšího zastavení a vzdáleností. Ukazatel „zastavení X/3“ a počet splněných úkolů. Viditelný štítek, když běží ukázkový režim.
3. **Jsme na místě**: když je hráč do ~30 m od zastavení, zobrazí se fotka (nebo zástupný obrázek), 2–3 věty o místě a tlačítko „Otevřít úkol“. Záložní tlačítko „Jsme tady“ je dostupné do ~80 m, pro případ, že GPS zlobí.
4. **Úkol**: zadání, odpověď a „Hotovo“, případně nápověda.
   - číslo: velké pole nebo číselná klávesnice,
   - foto: otevře fotoaparát telefonu a ukáže pořízenou fotku,
   - text: textové pole.
   Pak se pokračuje na mapu k dalšímu zastavení.
5. **Konec**: gratulace, splněné úkoly a náhledy fotek z cesty. Místo pro budoucí diplom nebo odměnu v infocentru.

## Rozhodnutí uživatele

- Webová stránka, ne aplikace.
- Mapový podklad z **Mapy.com** (API klíč si uživatel zaregistruje zdarma na developer.mapy.com).
- Hosting na **GitHub Pages** z nového samostatného **veřejného** repozitáře, stejně jako projekt `krouzky-horice`.
- Pevná trasa, 3 zastavení a úkoly podle tabulky výše.
- Ukázkový režim pro předvádění u stolu i skutečná GPS na místě.
- Data trasy upravuje **jen uživatel (s Claudem)**, ne spolupracovníci. Stačí datový soubor a validace jako v `krouzky-horice`, editor ani návod pro neprogramátory nejsou potřeba.

## Rozhodnutí Clauda (může změnit)

- Stejný styl jako `krouzky-horice`: statický web bez sestavovacího kroku (HTML, CSS, čistý JavaScript v ES modulech), lokální spuštění přes `http-server`, nasazení GitHub Actions → Pages.
- Mapa přes **Leaflet** s dlaždicemi Mapy.com REST API, včetně povinného loga a uvedení zdroje.
- API klíč Mapy.com je v konfiguračním souboru v repozitáři, tedy veřejně viditelný (u statického webu to jinak nejde, uživatel o tom ví). V konzoli Mapy.com se omezí na doménu `sirotekc.github.io` a `localhost`. Dokud ho uživatel nedodá, má se dát vyvíjet a předvádět se záložním podkladem (OpenStreetMap), aby práce nestála.
- Repozitář na GitHub účtu **SirotekC**, stejně jako `krouzky-horice`.
- Data trasy v JSON (`trasa.json`): zastavení, souřadnice, poloměr odemčení, texty, úkoly a body čáry trasy.
- Postup hry (aktuální zastavení, odpovědi) v `localStorage`. Fotky zůstávají jen v telefonu a v prototypu se nemusí přežít obnovení stránky.
- Ukázkový režim se zapíná přepínačem nebo parametrem v URL. Poloha se v něm simuluje a lze ji posunout na další zastavení, případně klepnutím do mapy.
- Odpovědi se nekontrolují, stačí cokoli vyplnit nebo vyfotit.
- Fotky na úvodu zastavení: zatím zástupné obrázky, skutečné fotky dodá uživatel.
- `.superpowers/` (náčrty z brainstormingu) do `.gitignore`.

## Necháno na staviteli

- Konkrétní struktura souborů a kódu, vzhled (čitelný a vhodný pro děti, velká tlačítka, nemusí být finální).
- Jak přesně simulovat pohyb v ukázkovém režimu.
- Zacházení s chybami: zamítnutá poloha (nabídnout ukázkový režim), slabá přesnost GPS, nedostupná mapa.
- Obsah statické ukázkové obrazovky.
- Ruční testovací scénář pro ověření na Androidu a iPhonu.
