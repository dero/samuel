# Morse Solver Benchmarking & Tuning Tool

Nástroj pro automatizované testování a optimalizaci vah a parametrů řešitele Morseovy abecedy bez mezer (`solveMorseWithoutSpaces`) proti reálným tajenkám ze soutěží (Tmou, Sendvič, Bedna, Matrix atd.).

## Vlastnosti
- **Přímé napojení na engine aplikace**: Používá přímo produkční kód z [src/lib/modules/01-morse/morseSolver.ts](../../src/lib/modules/01-morse/morseSolver.ts). Žádná paralelní či odlišná reimplementace.
- **Rychlé načítání databáze**: Přes nativní `node:sqlite` načte 96 000 slov z `public/words.db` za ~250 ms.
- **Metriky úspěšnosti**: Top-1 (Exact i bez mezer), Top-3, Top-10, MRR (Mean Reciprocal Rank) a průměrnou latenci.
- **Laděné parametry**:
  - `lengthExponent`: mocnina délky slova v morseovce (zvýhodňuje delší souvislá slova proti drobení).
  - `cipherBoost`: multiplikátor pro šifrová klíčová slova a směry.
  - `ruianBoost`: multiplikátor pro názvy ulic a obcí z RÚIAN.
  - `singleGrammarBoost`: multiplikátor pro jednopísmenné předložky/spojky (A, I, O, U, K).
  - `freqWeight`: váha logaritmické frekvence slov z Českého národního korpusu (`freq` ze sloupce ve SQLite).
  - `wordCountPenalty`: Occamova břitva penalizující zbytečné dělení na více slov.
  - `beamWidth`: šířka paprsku v DAG vyhledávání.

## Spuštění

Běží v prostředí Node.js (doporučeno Node 24 nebo Node 26):

```bash
# Vyhodnocení výchozích vah na kurátorované sadě (180 tajenek)
npm run benchmark:morse

# Diagnostika konkrétní tajenky
npx tsx scripts/benchmark-morse/benchmark.ts --target "VYSTAVISTE J VSTUP"
npx tsx scripts/benchmark-morse/benchmark.ts --target "KASTAN BENDLOVA"

# Automatická optimalizace vah (Coordinate Search)
npx tsx scripts/benchmark-morse/benchmark.ts --optimize

# Optimalizace a přímý zápis nejlepších vah do morseSolver.ts
npx tsx scripts/benchmark-morse/benchmark.ts --optimize --apply

# Vyhodnocení na všech validních tajenkách z data/solutions.json (~960 tajenek)
npm run benchmark:morse -- --all

# Výpis všech tajenek mimo TOP 10 (seřazeno od nejhorších k 11. místu)
# Včetně agregovaného seznamu kandidátních slov pro přidání do puzzle_words
npm run benchmark:morse -- --misses
npm run benchmark:morse -- --all --misses
```
