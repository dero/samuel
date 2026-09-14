# Build Database (`build_database.py`)

Tento idempotentní skript slouží k sestavení SQLite databáze `public/words.db` pro offline PWA aplikaci Samuel.

## Vstupní datové zdroje (ze složky `data/`):
1. **`data/puzzle_words.json`**: Abecedně řazený JSON se základními šifrovacími klíčovými slovy (směry, terén, objekty, příkazy).
2. **`data/cs_substantives.csv`**: 118 357 českých podstatných jmen s frekvencemi a anagramovými klíči (`letters`, `letters_nodiac`).
3. **`data/cs_all.csv`**: Všechny slovní tvary češtiny napříč všemi slovními druhy z Českého národního korpusu (s vyfiltrovanou interpunkcí, podporou přehlásek a odstraněnými spojovníky mezi slovy).
4. **`data/RUIAN/*.csv`**: 8 CSV souborů z RÚIAN s místními názvy ČR (`UI_ULICE`, `UI_OBEC`, `UI_CAST_OBCE`, `UI_MOMC`, `UI_MOP`, `UI_KATASTRALNI_UZEMI`, `UI_ZSJ`, `UI_SPRAVNI_OBVOD`).

## Výstupy:
- **`public/words.db`**: SQLite databáze se 4 samostatnými tabulkami:
  - `puzzle_words`: 195 klíčových šifrovacích slov (`id`, `word`, `word_nodiac`, `len`)
  - `cs_substantives`: 118 357 podstatných jmen s anagramovými indexy (`letters_nodiac`, `letters`, `word_nodiac`, `(len, freq)`)
  - `cs_all`: 320 407 obecných slovních tvarů s frekvencemi (`word_nodiac`, `(len, freq)`)
  - `ruian`: 76 771 deduplikovaných místních názvů s kategorií `type` (`word_nodiac`, `type`, `(type, word_nodiac)`)
- **`public/sql-wasm.wasm`** a **`public/sql-wasm-browser.wasm`**: WebAssembly binárky `sql.js` pro běh v prohlížeči.

## Použití:
```bash
python3 scripts/build-database/build_database.py
```
