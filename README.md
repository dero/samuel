# Samuel – Šifrovací pomůcky

Moderní, rychlá a **100% offline-first** PWA (Progressive Web Application) pro luštění šifrovaček v terénu i v týmovém štábu (TMOU, Bedna, Sendvič, Matrix, Svíčky apod.).

Aplikace přináší multiplatformní podporu (iOS, Android, desktop), okamžitou odezvu bez závislosti na internetu a specializované nástroje navržené přímo pro šifrovací hry.

---

## Klíčové vlastnosti

- **100% Offline-first architektura:** Plná funkčnost bez signálu v lese či horách díky Service Workeru a klientské SQLite databázi běžící přímo v prohlížeči přes WebAssembly (`sql.js`) s perzistencí v IndexedDB.
- **Morseovka s inteligentním solverem:**
  - Dedikovaná rychlá klávesnice (`.`, `-`, `/`) a paralelní zobrazení variant (inverze, reverz, prohození oddělovačů).
  - **Auto-bruteforce solver bez mezer:** Kombinuje vyhledávání v DAG grafu slovníku, frekvenční vážení z Českého národního korpusu, bodování šifrových klíčových slov a místopisných názvů z RÚIAN a 4-gramový jazykový model češtiny s backoffem pro neznámá slova.
- **Slovník & přesmyčky:** Vyhledávání podle délky a křížovkářské masky (`.`, `*`), anagramový solver s bleskovou odezvou, podpora regulárních výrazů a volitelná filtrace podstatných a vlastních jmen.
- **Rozsáhlá offline databáze slov (1,8 milionu záznamů pod 100 MB):**
  - Sjednocená optimalizovaná tabulka s 26bitovým písmenným indexem a metadaty.
  - Podstatná jména a vlastní jména z ÚFAL MorfFlex 2.0 a ČNK.
  - Všechny tvary slov z ČNK s frekvencemi výskytu.
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

# Volitelné přegenerování podstatných jmen z MorfFlex 2.0 TSV (temp/czech-morfflex2.0.pdt.tsv.xz)
python3 scripts/build-database/build_substantives_morfflex.py
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

---

## Licence

Zdrojový kód aplikace je šířen pod licencí [MIT](LICENSE), © 2026 Jaroslav „Dero“ Polakovič.

Licence MIT se **nevztahuje na data třetích stran** ve složce `data/` ani na z nich sestavenou slovníkovou databázi `public/words.db`. Ta se řídí licencemi svých zdrojů:

| Data | Zdroj | Licence |
| --- | --- | --- |
| `data/cs_substantives.csv` (podstatná a vlastní jména) | [MorfFlex CZ 2.0](http://hdl.handle.net/11234/1-3186), ÚFAL MFF UK | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) – pouze nekomerční užití, odvozená díla pod stejnou licencí |
| `data/cs_all.csv` (tvary slov s frekvencemi) | Frekvenční seznamy [Českého národního korpusu](https://www.korpus.cz/) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| `data/RUIAN/*.csv` (obce, ulice, katastrální území) | [RÚIAN](https://cuzk.gov.cz/ruian/), ČÚZK | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |

Protože `public/words.db` obsahuje data z MorfFlex CZ 2.0, platí pro databázi jako celek podmínky CC BY-NC-SA 4.0 (zejména zákaz komerčního užití).

Ostatní data (`puzzle_words.json`, `solutions.json`, `world_flags.json`) jsou součástí projektu a spadají pod licenci MIT.
