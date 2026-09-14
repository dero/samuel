# Generate N-gram Model (`generate_ngram_model.py`)

Tento skript natrénuje a vyexportuje ořezaný znakový jazykový model (4-gramy, trigramy a bigramy) pro posuzování pravděpodobnosti českého textu a dekódování neznámých úseků morseovky bez mezer.

## Vstupní datové zdroje:
1. **`data/kontext-freq_download-2026-09-13.csv`**: Frekvenční korpus slovních tvarů z ČNK.
2. **`data/UI_ULICE.csv`**: Seznam ulic ČR z RÚIAN (pro obohacení modelu o typické koncovky a kmeny ulic).

## Výstup:
- **`src/lib/data/ngramData.json`**: Statický JSON soubor obsahující podmíněné log-pravděpodobnosti:
  - 4-gramy (`lp4`, ořezáno na freq $\ge 100$)
  - 3-gramy (`lp3`, ořezáno na freq $\ge 30$)
  - 2-gramy (`lp2`, ořezáno na freq $\ge 5$)
  - Soubor je v aplikaci načítán **asynchronně (lazy loading)** přes dynamický import, takže nezvyšuje velikost hlavního bundle.

## Použití:
```bash
python3 scripts/generate-ngram-model/generate_ngram_model.py
```
