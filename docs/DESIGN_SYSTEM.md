# Samuel Design System (AI & Developer Reference)

> Rychlá reference designových pravidel a komponent pro aplikaci **Samuel**. Žádný boilerplate, pouze závazné standardy.

---

## 1. Závazná pravidla (Core Rules)

1. **Plátno a barvy:** Pozadí vždy čistě černé `--color-bg-canvas` (`#000000`). Zákaz vlastních hex/rgb barev v komponentách – použij CSS tokeny.
2. **Žádný scroll celé stránky:** `ModuleShell` má `overflow: hidden`. Scrollovat smí pouze vnitřek `TranslationCard` nebo `.table-scroll`.
3. **Haptika:** VŽDY volat `settings.vibrate(ms)` z `state/settings.svelte`. **NIKDY nevolat `navigator.vibrate` přímo.** Nezdvojovat volání (komponenta tlačítka již haptiku zajišťuje).
4. **Touch targets:** Všechny interaktivní prvky min. 48 × 48 px (`--tap-min-size`), v kondenzovaných tabulkách sjednocené s ergonomií bloku.
5. **Multi-touch & okamžitá odezva kláves:** Klávesnice pro zadávání znaků (`DominantButton`, matice, kruh) musí reagovat na `onpointerdown` s `e.preventDefault()`, nikoli čekat na `click` / `touchend`. Kontejnery klávesnic musí mít `touch-action: none`.
6. **Ničivé akce (Vymazání):** Vymazání vstupu VŽDY přes `SlideToAction` (podržením s tekutým vybarvováním zleva doprava). Nikdy pouhým kliknutím.
7. **Toasty & hlášky:** Všechny toasty v aplikaci musí být **max. 30 znaků textu + až 2 emoji**. Delší texty se na mobilu nevzhledně lámou.
8. **Kondenzované ovládací bloky a tabulky (Zapuštěné šasi):** Všechny zadávací matice (abeceda, numpad, římská čísla, námořní vlajky, souřadnice, polybius) i řádky utilit (`.keypad-utility-row`, `.keypad-utility-row-3col`) a dominantní řady (`.keypad-dominant-2col`, `.keypad-dominant-3col`) tvoří fyzicky zapuštěné černé šasi („switchbed tray“):
   - **Vnější šasi:** `border-radius: var(--radius-sm)` (6px), `overflow: hidden`, pozadí plátna `background-color: var(--color-bg-canvas)` (`#000000`), vnitřní černé spáry `gap: 2px`, obvodový odstup `padding: 2px` a subtilní ohraničující lem `border: 1px solid var(--color-border-subtle)` (oddělující šasi od šedého spodního panelu `#121214`).
   - **Obvodová symetrie:** Díky `padding: 2px` má každá klávesa na obvodu i v rozích identickou 2px černou spáru na všech 4 stranách. Rohové klávesy se neořezávají zaoblením kontejneru a drží si čistý `border-radius: 2px`.
   - **Vnitřní tlačítka (keycaps):** `border: none`, `border-radius: 2px`, plné podbarvení `var(--color-surface-2)`.
   - **Záslepka neobsazených míst (`.grid-filler`):** Pokud mřížka nekončí na celém řádku (např. abeceda 26/42 znaků), prázdná místa nesmí tvořit černou díru v šasi. Vkládá se záslepka o šířce zbývajících sloupců (`grid-column: span X`) v barvě `var(--color-surface-2)` s utlumenou průhledností `opacity: 0.35`, zaoblením `border-radius: 2px` a odpovídajícími fazetami, která mřížku vizuálně elegantně uzavírá.
9. **Plasticita a světelné fazety (Tactility):**
   - **Vystouplá tlačítka (keycaps):** 1px fyzická plastická fazeta – horní světelný odraz `inset 0 1px 0 rgba(255, 255, 255, 0.10)` a spodní stín `inset 0 -1px 0 rgba(0, 0, 0, 0.5)`.
   - **Stisknutý stav (`:active`):** Klávesa se fyzicky promáčkne do vnitřního stínu `inset 0 1.5px 3px rgba(0, 0, 0, 0.7)` a `background-color: var(--color-surface-active)`.
   - **Zapuštěné prvky / průstřely (negativní hloubka):** Prvky simulující otvory (Braillovy neaktivní body, poziční indikátory Semaforu) mají horní vnitřní stín `inset 0 1px 2px rgba(0, 0, 0, 0.8)` a spodní 1px odraz dna `inset 0 -1px 0 rgba(255, 255, 255, 0.05)`.
10. **Konzistence podbarvení a zákaz plošného `opacity` u `disabled`:**
    - Tlačítka a klávesy v neaktivním stavu (`disabled`) NIKDY nesmí mít `opacity: 0.35` na celý kořenový element – na OLED `#000` plátně by povrch prosvítal a ztmavl oproti okolním tlačítkům.
    - Klávesa si vždy drží plnou barvu `var(--color-surface-2)`, ztlumuje se VÝHRADNĚ vnitřní ikona/text na `opacity: 0.35`.
11. **Sjednocení rádiusů prvků:**
    - Všechny vnější bloky, kontejnery klávesnic, dominantní tlačítka (`DominantButton`), řádky utilit (`.keypad-utility-row*`), přepínače (`SegmentedControl`), karty voleb (`RadioGroup`) i textareje mají sjednocený poloměr **`--radius-sm` (6px)**.
    - Jednotlivá malá tlačítka uvnitř mřížek a sdružených řad mají **`border-radius: 2px`**.
    - Vnitřní sub-prvky (např. aktivní segment v přepínači) mají **`--radius-xs` (4px)**.
    - Kruhové prvky mají **`--radius-full`** (Braillovy body, kruhové indikátory).

---

## 2. CSS Design Tokens (`src/app.css`)

### Barvy
- **Plátno a povrchy:** `--color-bg-canvas` (#000000), `--color-surface-1` (#121214), `--color-surface-2` (#1c1c22), `--color-surface-3` (#262630), `--color-surface-active` (#323240), `--color-surface-elevated` (#161820).
- **Rámečky:** `--color-border-subtle` (#2a2a34), `--color-border-medium` (#3a3a48), `--color-border-focus` (#00d2ff).
- **Text:** `--color-text-primary` (#ffffff), `--color-text-secondary` (#9da0af), `--color-text-muted` (#626474).
- **Akcenty:**
  - Primary (Cyan): `--color-accent-primary` (#00d2ff) | subtle: `rgba(0, 210, 255, 0.12)`
  - Success (Green): `--color-accent-success` (#10b981) | subtle: `rgba(16, 185, 129, 0.12)`
  - Warning (Amber): `--color-accent-warning` (#f59e0b) | subtle: `rgba(245, 158, 11, 0.12)`
  - Danger (Red): `--color-accent-danger` (#ef4444) | subtle: `rgba(239, 68, 68, 0.15)`

### Dimenze & Škála
- **Spacing:** `--space-2xs` (2px), `--space-xs` (4px), `--space-sm` (8px), `--space-md` (12px), `--space-lg` (16px), `--space-xl` (20px), `--space-2xl` (24px).
- **Radius:** `--radius-xs` (4px), `--radius-sm` (6px), `--radius-md` (10px), `--radius-lg` (14px), `--radius-full` (9999px).
- **Text:** `--text-xs` (11px), `--text-sm` (13px), `--text-base` (15px), `--text-lg` (17px), `--text-xl` (20px), `--text-2xl` (24px).
- **Layout:**
  - `--header-height: 52px;`
  - `--tap-min-size: 48px;`
  - `--utility-row-height: 42px;`
  - `--dominant-key-height: clamp(62px, 9.5vh, 82px);`
  - `--output-min-height: 84px;`

---

## 3. Vertikální rozpočet obrazovky (Screen Layout Budget)

Každý modul má 2 hlavní zóny uvnitř `<ModuleShell>`:

```
┌────────────────────────────────────────────────────────┐
│ Header (52px fixně)                                    │
├────────────────────────────────────────────────────────┤
│ ZONE-OUTPUT: <TranslationCard>                         │
│ - flex: 1, min-height: 84px                            │
│ - OLED black (#000000), bez rušivých popisků           │
│ - automatický scroll dolů, 1-tap copy do schránky      │
├────────────────────────────────────────────────────────┤
│ ZONE-INPUT: Klávesnice modulu (flex-shrink: 0)         │
│ 1. [Volitelný Toolbar / SegmentedControl]              │
│ 2. [Vstupní matice / Kruh dial / Interaktivní kříž]    │
│ 3. .keypad-utility-row-3col (42px, repeat(3, 1fr))     │
│    [ <SlideToAction> | <SpaceButton> | <Backspace> ]   │
│    - Stejně široká tlačítka (1 : 1 : 1)                │
│    - Pouze ikony bez textových popisků                 │
│ 4. [Volitelný .keypad-dominant-1col / 3col]            │
│    <DominantButton> (clamp 62–82px, touch-action: none)│
│    - Jen tam, kde je potřeba potvrdit znak (Morse,     │
│      Braille, Semafor, Čísla). U křížů a vlajek se     │
│      vynechává pro úsporu vertikálního místa.          │
└────────────────────────────────────────────────────────┘
```

---

## 4. Pravidlo rozdělení funkcí (Separation of Concerns)

| Kde | Co tam patří | Příklady |
| :--- | :--- | :--- |
| **By Default** | Běžná pravidla šifry (95 % případů v terénu) | Morse s CH, Braille bez auto-insertu, Semaphore s auto-insertem |
| **Module Menu** (ikona List vpravo) | Odchylky konkrétní šifry na stanovišti + akce se stavem | Bez CH, přímá čísla (A=1), zrcadlení, přepínač easter eggu |
| **Reference Modal** (ikona Knížka) | Statické taháky výhradně pro čtení | Pomocná slova morseovky, tabulka Brailla, kruh semaforu, námořní vlajky |
| **App Settings** (`/settings`) | Globální předvolby zařízení a aktualizace | Evergreen aktualizace aplikace a DB, Haptika, Wake Lock, správa abeced |

---

## 5. Rychlý katalog komponent

### `SlideToAction` (tekuté mazání tažením/podržením)
- Nahrazuje mechanický posuvník/thumb čistým tlačítkem se stejnou šířkou jako Mezera a Backspace.
- **Tekuté vybarvování:** Při stisku a držení se tlačítko plynule zleva doprava vybarvuje červenou (`progress * 100%`).
- **Nulový artefakt v klidu:** V klidovém stavu má proužek `opacity: 0`, takže nevytváří žádnou červenou linku na levém okraji.
- **Disabled stav:** Zachovává plné podbarvení `var(--color-surface-2)`, tlumí pouze ikonu koše.
```svelte
<SlideToAction
  disabled={!text}
  onAction={handleClearAll}
  label="Vymazat"
  ariaLabel="Vymazat text podržením"
/>
```

### `SpaceButton` (Mezera v troj-tlačítku)
- Centrální součást utilitního bloku se symbolem `␣`.
- Vždy na pozici 2 v `keypad-utility-row-3col`.
```svelte
<SpaceButton onAction={handleSpace} />
```

### `BackspaceButton` (mazání a rušení výběru)
- Součást utilitního bloku se symbolem `⌫`.
- **Dvojí role:** Pokud je rozepsaný znak (selekce souřadnice, tečky, segmentu), ikona se automaticky změní na `✕` a stisk zruší rozepsaný stav namísto mazání hotového textu.
```svelte
<BackspaceButton
  disabled={!text && !hasSelection}
  hasActiveSelection={hasSelection}
  cancelTitle="Zrušit rozepsaný znak"
  onAction={handleBackspace}
/>
```

### `DominantButton` (hlavní potvrzovací klávesa / Enter)
- **Mechanická podsvícená klávesa:**
  - **Klidový stav:** Plastický keycap se střídmou fazetou (`inset 0 1px 0 rgba(255, 255, 255, 0.12)`, `inset 0 -1px 0 rgba(0, 0, 0, 0.6)`).
  - **Aktivní / připraveno (`.is-ready`):** Zvýrazněná horní světelná hrana (`inset 0 1px 0 rgba(255, 255, 255, 0.35)`), spodní stín fazety (`inset 0 -1px 0 rgba(0, 0, 0, 0.6)`), decentní aura (`0 0 12px rgba(0, 210, 255, 0.20)`) a tenký rámeček `rgba(0, 210, 255, 0.45)`. Žádný difuzní neonový wash.
  - **Stisknutý stav (`:active` / `.is-pressed`):** Fyzické promáčknutí do vnitřního stínu (`inset 0 2px 4px rgba(0, 0, 0, 0.65)`).
```svelte
<DominantButton
  symbol={currentChar || '↵'}
  name={currentChar ? `Vložit „${currentChar}“` : 'Vložit znak'}
  ready={!!currentChar}
  disabled={!currentChar}
  variant="accent"
  onClick={commitChar}
/>
```

### Kondenzované tabulky a mřížky (`AlphabetGrid`, `AdaptiveNumpad`, `RomanNumpad`, `FlagsModule`, `InteractiveCross`, `CoordinateKeypad`)
- **Pravidlo zapuštěného šasi („switchbed tray“):**
```css
.table-grid {
  display: grid;
  gap: 2px;
  padding: 2px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background-color: var(--color-bg-canvas);
  border: 1px solid var(--color-border-subtle);
  box-sizing: border-box;
}

.table-key {
  background-color: var(--color-surface-2);
  border: none;
  border-radius: 2px;
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.10),
    inset 0 -1px 0 rgba(0, 0, 0, 0.5);
  box-sizing: border-box;
}

.table-key:active:not(:disabled) {
  background-color: var(--color-surface-active);
  box-shadow: inset 0 1.5px 3px rgba(0, 0, 0, 0.7);
  transform: none;
}

/* Záslepka nevyužitých slotů na konci mřížky */
.grid-filler {
  grid-column: span var(--filler-span, 1);
  background-color: var(--color-surface-2);
  opacity: 0.35;
  border-radius: 2px;
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    inset 0 -1px 0 rgba(0, 0, 0, 0.4);
  pointer-events: none;
  user-select: none;
}
```

### `TranslationCard` (výstupní karta překladu)
- Čistě minimalistický vzhled: OLED black `#000000`, bez rámečků a zbytečného textu „Překlad“.
- 1-tap kliknutím zkopíruje celý text do schránky s haptickou odezvou.

---

## 6. Easter Eggy & Dekorace

1. **Vzhled a plasticita:** Monochromatické SVG, sedící na plně plastické dlaždici s fazetou odpovídající okolním prvkům (např. lodička v námořních vlajkách).
2. **Volitelnost:** VŽDY přepínač v `ModuleMenu` (default: zapnuto).
3. **Neruší vstup:** Klávesy nesmí spouštět easter egg hlášky ani zpožďovat psaní.
4. **Dvoustupňová interakce:**
   - *Level 1 (Objev):* ~5 kliků na dekoraci → jemná animace + hláška.
   - *Level 2 (Finále):* ~60 kliků / 20 s → dramatický efekt (potopení lodičky s SOS vibrací, elektrické přepětí).
5. **Žádné spoilery:** Pokud prvek vysílá skrytou šifru/zprávu, NIKDY nezobrazovat rozluštěný text v toastu.
6. **Toast limit:** Max. 30 znaků textu + max. 2 emoji.

---

## 7. Dotykový výkon & Animace

1. **Multi-touch:** Klávesy řešit přes `onpointerdown` + `e.preventDefault()`. Kontejner i klávesy: `touch-action: none`.
2. **Žádné 60 FPS smyčky v JS:** Zákaz `requestAnimationFrame` s reaktivním `$state`. Pro křivky výhradně CSS `offset-path: path(...)` na GPU.
3. **Nezdvojovat haptiku:** Pokud vibruje komponenta (`DominantButton`, `SlideToAction`), nevolat `settings.vibrate()` v obslužné funkci.

---

## 8. Šablona modulu (Blueprint)

```svelte
<script lang="ts">
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import TranslationCard from '../../components/ui/TranslationCard.svelte';
  import SlideToAction from '../../components/ui/SlideToAction.svelte';
  import SpaceButton from '../../components/ui/SpaceButton.svelte';
  import BackspaceButton from '../../components/ui/BackspaceButton.svelte';
  import DominantButton from '../../components/ui/DominantButton.svelte';
  import OptionRow from '../../components/ui/OptionRow.svelte';
  import { localSettingsService } from '../../services/localSettingsService';

  const modSettings = localSettingsService.forModule('new_mod');
  let text = $state(modSettings.getString('input', ''));
  let pending = $state('');

  $effect(() => { modSettings.setString('input', text); });

  function handleClearAll() {
    text = '';
    pending = '';
  }

  function handleSpace() {
    text += ' ';
  }

  function handleBackspace() {
    if (pending) {
      pending = '';
    } else if (text) {
      text = text.slice(0, -1);
    }
  }

  function handleCommit() {
    if (pending) {
      text += pending;
      pending = '';
    }
  }
</script>

<ModuleShell onReset={handleClearAll} onPaste={(t) => (text += t)}>
  {#snippet output()}
    <TranslationCard {text} />
  {/snippet}

  {#snippet input()}
    <div class="keypad-zone">
      <!-- 1. Kondenzovaná matice / zadávací pole modulu -->

      <!-- 2. Troj-tlačítko utilit (Vymazat, Mezera, Backspace) -->
      <div class="keypad-utility-row-3col">
        <SlideToAction
          disabled={!text && !pending}
          onAction={handleClearAll}
          label="Vymazat"
        />
        <SpaceButton
          onAction={handleSpace}
        />
        <BackspaceButton
          disabled={!text && !pending}
          hasActiveSelection={!!pending}
          cancelTitle="Zrušit rozepsaný znak"
          onAction={handleBackspace}
        />
      </div>

      <!-- 3. Volitelný dominantní řádek (Enter) -->
      <div class="keypad-dominant-1col">
        <DominantButton
          symbol={pending || '↵'}
          name={pending ? `Vložit „${pending}“` : 'Vložit znak'}
          ready={!!pending}
          disabled={!pending}
          variant="accent"
          onClick={handleCommit}
        />
      </div>
    </div>
  {/snippet}

  {#snippet menuOptions()}
    <OptionRow label="Možnost" checked={false} onChange={() => {}} />
  {/snippet}
</ModuleShell>
```
