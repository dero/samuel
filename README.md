# Samuel – Šifrovací pomůcky

Kapesní sada nástrojů pro luštění šifrovaček. Běží v prohlížeči, dá se nainstalovat do telefonu jako aplikace a po prvním stažení funguje i bez signálu.

**Aplikace: [samuel.dero.cz](https://samuel.dero.cz)**

---

## Klíčové vlastnosti

- **Funguje offline.** Celá aplikace i slovník se uloží do telefonu, takže v lese, v horách i v metru funguje stejně jako doma.
- **Přes dvacet nástrojů na jednom místě.** Kódování (Morse, Braille, Semafor, Vlajky, Polybius, Kříže, Mobil, Čísla), práce s textem (Posuny, Substituce, Frekvence, Mřížka, Slovník), rébusy (Sudoku, Nonogram, Šachy), kreslení (Želva, Plotr) a reálie (Státy, Kalendář, Barvy, Chemie, Fakta). Nástroj najdeš hledáním v launcheru, stačí napsat třeba „tečky“ nebo „praporky“.
- **Zadávání prstem.** Každý nástroj má vlastní klávesnici přímo pro svou šifru: tečky a čárky, body Braillu, ramena semaforu. Pod výstupem rovnou vidíš i varianty (pozpátku, s prohozenými značkami apod.), takže je nemusíš zkoušet jednu po druhé.
- **Chytré luštění.** Morseovka bez mezer se sama rozdělí na nejpravděpodobnější česká slova. Slovník hledá podle masky, délky i přesmyček v téměř dvou milionech českých slov, jmen a místních názvů.
- **Podklad.** Když už šifru máš v textu nebo na fotce, nemusíš ji vyťukávat. Vložíš ji do záložky Podklad (napíšeš, vložíš ze schránky nebo vyfotíš) a nástroj, který to umí, s ní rovnou pracuje.
- **Tahák a návod u každého nástroje.** Ikona knížky na liště otevře přehledovou tabulku (abecedu, kódy) a krátký návod, jak nástroj ovládat.
- **Do terénu.** Černé tmavé schéma šetří baterii a nesvítí v noci, haptická odezva potvrzuje stisky. Aplikace funguje na mobilu, tabletu i počítači.

---

## Instalace do telefonu

Otevři [samuel.dero.cz](https://samuel.dero.cz) a přidej si aplikaci na plochu:

- **iPhone (Safari):** tlačítko Sdílet → **Přidat na plochu**.
- **Android (Chrome):** nabídka ⋮ → **Instalovat aplikaci** (případně **Přidat na plochu**).

Při prvním spuštění si aplikace stáhne data. Potom už internet nepotřebuje a o nových verzích dá vědět sama.

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
