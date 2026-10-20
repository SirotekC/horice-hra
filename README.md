# Hořice hravě

Městská hra s GPS pro děti 5–10 let. Statický web (vanilla JS, GitHub Pages), bez build kroku a bez backendu. Poloha ani fotky neopouštějí telefon.

## Spuštění

```
npm install
npm run dev        # http://localhost:8080
```

## Úprava trasy

Celá trasa je v `site/data/trasa.json`: čára trasy (`cara`), zastavení (`zastaveni`) s polohou, textem a úkolem a poloměry odemčení. Struktura je popsána v `schema/trasa.schema.json`. Typ úkolu je `cislo`, `foto` nebo `text`. Obrázek zastavení patří do `site/img/` (`obrazek: null` = zástupný obrázek).

Po úpravě spusť kontrolu:

```
npm run validate && npm test
```
