# Samuel Design System (AI & Developer Reference)

> Rychlá reference designových pravidel a komponent pro aplikaci **Samuel**. Žádný boilerplate, pouze závazné standardy.

---

## 1. Závazná pravidla (Core Rules)

1. **Plátno a barvy:** Pozadí vždy čistě černé `--color-bg-canvas` (`#000000`). Zákaz vlastních hex/rgb barev v komponentách – použij CSS tokeny.
2. **Žádný scroll celé stránky:** `ModuleShell` má `overflow: hidden`. Scrollovat smí pouze vnitřek `TranslationCard` nebo `.table-scroll`.
3. **Haptika:** VŽDY volat `settings.vibrate(ms)` z `state/settings.svelte`. **NIKDY nevolat `navigator.vibrate` přímo.** Nezdvojovat volání (komponenta tlačítka již haptiku zajišťuje).
4. **Touch targets:** Všechny interaktivní prvky min. 48 × 48 px (`--tap-min-size`).
5. **Multi-touch & okamžitá odezva kláves:** Klávesnice pro zadávání znaků (`DominantButton`, matice, kruh) musí reagovat na `onpointerdown` s `e.preventDefault()`, nikoli čekat na `click` / `touchend`. Kontejnery klávesnic musí mít `touch-action: none`.
6. **Ničivé akce:** Vymazání vstupu VŽDY přes `SlideToAction` (tažením). Nikdy pouhým kliknutím.
7. **Toasty & hlášky:** Všechny toasty v aplikaci musí být **max. 30 znaků textu + až 2 emoji**. Delší texty se na mobilu nevzhledně lámou.

---

## 2. CSS Design Tokens (`src/app.css`)

### Barvy
- **Plátno a povrchy:** `--color-bg-canvas` (#000), `--color-surface-1` (#121214), `--color-surface-2` (#1c1c22), `--color-surface-3` (#262630), `--color-surface-active` (#323240), `--color-surface-elevated` (#161820).
- **Rámečky:** `--color-border-subtle` (#2a2a34), `--color-border-medium` (#3a3a48), `--color-border-focus` (#00d2ff).
- **Text:** `--color-text-primary` (#fff), `--color-text-secondary` (#9da0af), `--color-text-muted` (#626474).
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
│ 1. [Volitelný Toolbar]                                 │
│ 2. [Vstupní prvek: Textarea / 2x3 Matice / Kruh dial]  │
│ 3. .keypad-utility-row (42px, poměr 1.15fr 0.85fr)     │
│    <SlideToAction> + <BackspaceButton>                 │
│ 4. .keypad-dominant-2col nebo .keypad-dominant-3col    │
│    <DominantButton> (clamp 62–82px, touch-action: none)│
│    - 2 klávesy: poměr 0.85fr 1.15fr (Mezera, Vložit)   │
│    - 3 klávesy: repeat(3, 1fr) (Tečka, Čárka, /)       │
│ 5. [Volitelná dekorace / Easter egg, např. Telegraf]   │
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

### `DominantButton` (spodní velké klávesy)
- **Implementace:** Využívá `onpointerdown` a `touch-action: none` pro okamžitou odezvu (0ms) a bleskurychlé psaní oběma palci.
```svelte
<DominantButton
  symbol="␣"
  name="Mezera"
  variant="secondary"
  onClick={handleSpace}
/>
<DominantButton
  symbol={currentChar || '↵'}
  name={currentChar ? `Vložit „${currentChar}“` : 'Vložit znak'}
  ready={!!currentChar}
  disabled={!currentChar}
  onClick={commitChar}
/>
```

### `SlideToAction` + `BackspaceButton` (řádek utilit)
```svelte
<div class="keypad-utility-row">
  <SlideToAction disabled={!text} onAction={handleClear} label="Vymazat" />
  <BackspaceButton disabled={!text} hasActiveSelection={hasSelection} onAction={handleBackspace} />
</div>
```

### `OptionRow` (položka v menu nebo nastavení)
```svelte
<OptionRow
  label="Zobrazovat telegrafní vedení"
  hint="Dekorace s animovanými světelnými pulzy"
  type="switch"
  checked={showWire}
  onChange={(v) => (showWire = v)}
/>
```

### `BottomSheet` (vysouvací panely a modály)
```svelte
<BottomSheet
  open={isOpen}
  title="Reference"
  icon={BookOpen}
  maxWidth="680px"
  height="85vh"        <!-- Pro full-height reference panely -->
  scrollable={false}   <!-- Ponechá vnitřnímu table-scroll vlastní scrollování -->
  padding={false}
  onClose={() => (isOpen = false)}
>
  ...
</BottomSheet>
```

### `TranslationCard` (výstupní karta překladu)
- Čistě minimalistický vzhled: OLED black `#000000`, bez rámečků a zbytečného textu „Překlad“.
- 1-tap kliknutím zkopíruje celý text do schránky s haptickou odezvou.

---

## 6. Easter Eggy & Dekorace

1. **Vzhled:** Monochromatické SVG (`stroke: currentColor`, `opacity: 0.6`).
2. **Volitelnost:** VŽDY přepínač v `ModuleMenu` (default: zapnuto).
3. **Neruší vstup:** Klávesy nesmí spouštět easter egg hlášky ani zpožďovat psaní.
4. **Dvoustupňová interakce:**
   - *Level 1 (Objev):* ~5 kliků na dekoraci → jemná animace + hláška.
   - *Level 2 (Finále):* ~60 kliků / 20–30 s → dramatický efekt (potopení lodičky, elektrické přepětí).
5. **Žádné spoilery:** Pokud prvek vysílá skrytou šifru/zprávu, NIKDY nezobrazovat rozluštěný text v toastu.
6. **Toast limit:** Max. 30 znaků textu + max. 2 emoji.

---

## 7. Evergreen Verzování & Nastavení

1. **Žádný semver pro uživatele:** Aplikace je evergreen.
2. **Formát verze:** Vždy čitelné datum a čas (např. `15. 9. 2026, 14:05`) pro aplikaci i DB.
3. **Pozice & layout:** Karta *Aktualizace* je VŽDY na samém vrcholu `/settings`, jednosloupcová s tlačítkem na celou šířku (100%).

---

## 8. Dotykový výkon & Animace

1. **Multi-touch:** Klávesy řešit přes `onpointerdown` + `e.preventDefault()`. Kontejner i klávesy: `touch-action: none`.
2. **Žádné 60 FPS smyčky v JS:** Zákaz `requestAnimationFrame` s reaktivním `$state`. Pro křivky výhradně CSS `offset-path: path(...)` na GPU.
3. **Nezdvojovat haptiku:** Pokud vibruje komponenta (`DominantButton`), nevolat `settings.vibrate()` v obslužné funkci.

---

## 9. Šablona modulu (Blueprint)

```svelte
<script lang="ts">
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import TranslationCard from '../../components/ui/TranslationCard.svelte';
  import SlideToAction from '../../components/ui/SlideToAction.svelte';
  import BackspaceButton from '../../components/ui/BackspaceButton.svelte';
  import DominantButton from '../../components/ui/DominantButton.svelte';
  import OptionRow from '../../components/ui/OptionRow.svelte';
  import { localSettingsService } from '../../services/localSettingsService';

  const modSettings = localSettingsService.forModule('new_mod');
  let text = $state(modSettings.getString('input', ''));
  $effect(() => { modSettings.setString('input', text); });
</script>

<ModuleShell onReset={() => (text = '')} onPaste={(t) => (text += t)}>
  {#snippet output()}
    <TranslationCard {text} />
  {/snippet}

  {#snippet input()}
    <div class="keypad-zone">
      <div class="keypad-utility-row">
        <SlideToAction disabled={!text} onAction={() => (text = '')} />
        <BackspaceButton disabled={!text} onAction={() => (text = text.slice(0, -1))} />
      </div>
      <div class="keypad-dominant-2col">
        <DominantButton symbol="␣" name="Mezera" onClick={() => (text += ' ')} />
        <DominantButton symbol="↵" name="Vložit" onClick={() => {}} />
      </div>
    </div>
  {/snippet}

  {#snippet menuOptions()}
    <OptionRow label="Možnost" checked={false} onChange={() => {}} />
  {/snippet}
</ModuleShell>
```
