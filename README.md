# Samuel – Šifrovací pomůcky

Moderní, rychlá a **100% offline-first** PWA (Progressive Web Application) pro luštění šifrovaček v terénu i v týmovém štábu (TMOU, Bedna, Sendvič, Matrix, Svíčky apod.).

Aplikace přináší multiplatformní podporu (iOS, Android, desktop), okamžitou odezvu bez závislosti na internetu a specializované nástroje navržené přímo pro šifrovací hry.

---

## Klíčové vlastnosti

- **100% Offline-first architektura:** Plná funkčnost bez signálu v lese či horách díky Service Workeru a klientské SQLite databázi běžící přímo v prohlížeči přes WebAssembly (`sql.js`) s perzistencí v IndexedDB.
- **Morseovka s inteligentním solverem:**
  - Dedikovaná rychlá klávesnice (`.`, `-`, `/`) a paralelní zobrazení variant (inverze, reverz, prohození oddělovačů).
  - **Auto-bruteforce solver bez mezer:** Kombinuje vyhledávání v DAG grafu slovníku, frekvenční vážení z Českého národního korpusu, bodování šifrových klíčových slov a místopisných názvů z RÚIAN a 4-gramový jazykový model češtiny s backoffem pro neznámá slova.
- **Rozsáhlá offline databáze slov (přes 500 000 záznamů):**
  - Česká podstatná jména s předpočítanými anagramovými klíči.
  - Všechny tvary slov z ČNK s frekvencemi.
  - RÚIAN (databáze ulic, obcí a katastrálních území ČR).
  - Speciální šifrový slovník (`puzzle_words`).
- **Ergonomie do terénu:** Tmavé schéma šetřící baterii v noci, rychlý launcher modulů (klávesa `/` nebo tlačítko v hlavičce) a optimalizované zobrazení pro mobily i tablety.

---

## Požadavky (Prerequisites)

- **Node.js**: v20+ (doporučeno v22+ nebo v26)
- **Yarn**: v4+ (aktivováno přes Corepack: `corepack enable`)
- **Python 3**: pro automatické sestavování SQLite slovníkové databáze (`public/words.db`) ze zdrojových dat v `data/`

---

## Instalace a spuštění

```bash
# Instalace závislostí
yarn install

# Spuštění vývojového serveru (automaticky zkontroluje/sestaví words.db)
yarn dev

# Typová kontrola Svelte 5 a TypeScriptu
yarn check

# Produkční build do složky dist/
yarn build

# Lokální náhled produkčního buildu
yarn preview
```

---

## Práce se slovníkovou databází

Slovníková databáze `public/words.db` se generuje ze zdrojových souborů ve složce `data/` (`puzzle_words.json`, `cs_substantives.csv`, `cs_all.csv`, `data/RUIAN/*.csv`).

Příkazy `yarn dev` a `yarn build` automaticky spouštějí skript pro sestavení databáze:
- **Inteligentní no-op detekce:** Pokud se zdrojová data v `data/` nezměnila, skript operaci přeskočí během několika milisekund.
- **Deterministické sestavení a porovnání:** Pokud dojde k přegenerování, ale binární obsah databáze je identický, skript nezvyšuje verzi (`dbVersion`) a ponechá stávající soubor beze změny, aby nedocházelo ke zbytečnému stahování a invalidaci mezipaměti v prohlížeči.

Manuální příkazy pro práci s DB:
```bash
# Běžná kontrola a případné sestavení databáze
yarn db:build

# Vynucené sestavení databáze i při nezměněných zdrojích
yarn db:build:force
```

---

## Benchmark Morse solveru

Projekt obsahuje Node.js benchmarkovací nástroj pro optimalizaci a diagnostiku luštění Morseovky bez mezer na reálných tajenkách českých šifrovaček (`data/solutions.json`):

```bash
# Rychlý benchmark na kanonické sadě tajenek
yarn benchmark:morse

# Kompletní benchmark na všech 960+ tajenkách
yarn benchmark:morse --all

# Zobrazení tajenek mimo TOP 10 s návrhy nových slov do šifrového slovníku
yarn benchmark:morse --all --misses

# Diagnostika konkrétní tajenky
yarn benchmark:morse --target "NAM PRED BATERIEMI ZELENA BUDKA"
```
