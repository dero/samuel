# AGENTS.md

> Rychlá pravidla pro práci v repozitáři **Samuel**.

## 1. Zdroje & Plánování
- **POKUD** tvoříš nebo upravuješ UI, **POTOM** se řiď [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md)
- **POKUD** měníš chování modulu (ovládání, volby v menu), **POTOM** aktualizuj i jeho referenci (záložka „Návod“, viz DESIGN_SYSTEM §3 *Reference*).
- **POKUD** navrhuješ nový modul nebo šifrovací logiku, **POTOM** vycházej z [`research/PLAN.md`](research/PLAN.md) (heuristiky, paralelní varianty, algoritmy).

## 2. Tooling & Příkazy
- **POKUD** instaluješ balíčky nebo spouštíš skripty, **POTOM** použij výhradně `yarn` (Berry). Nikdy `npm` ani `pnpm`.
- **POKUD** spouštíš lokální vývoj, **POTOM** použij `yarn dev`.
- **POKUD** dokončuješ práci, **POTOM** vždy spusť `yarn check` a `yarn build`.
- **POKUD** build aktualizuje `public/version.json`, **POTOM** změnu nikdy nevracej (`git checkout`). Aplikace je ve vývojovém režimu a průběžný bump verze je žádoucí.
- **POKUD** upravíš data v `data/`, **POTOM** spusť `yarn db:build` (nebo `yarn db:build:force`).
- **POKUD** pushneš do `feat/init-version` (nebo `main`, až vznikne), **POTOM** se přes GitHub Actions automaticky nasadí produkce na `https://samuel.dero.cz`.

## 3. Kód & Architektura
- **POKUD** píšeš komponenty nebo stav, **POTOM** použij výhradně Svelte 5 runes (`$state`, `$derived`, `$props`, `$effect.root`) a sdílený stav dávej do `.svelte.ts`. Nikdy nepoužívej Svelte 3/4 stores ani `export let`.
- **POKUD** implementuješ haptiku, **POTOM** volej synchronně `settings.vibrate()` ze `src/lib/state/settings.svelte.ts` přímo při uživatelském gestu. Nikdy nevolej `navigator.vibrate` přímo, nevolej vibrace po `await` ani v časovačích a nezdvojuj vibrace u tlačítek, která vibrují sama.
- **POKUD** provádíš těžký výpočet (prohledávání 500k+ slovníku, jazykový model, permutace), **POTOM** ho izoluj do Web Workeru (`*.worker.ts?worker`), aby UI vlákno neblokovalo.
