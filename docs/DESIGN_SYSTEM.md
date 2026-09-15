# Samuel Design System (AI & Developer Reference)

> Rychlá reference designových pravidel a komponent pro aplikaci **Samuel**. Žádný boilerplate, pouze závazné standardy.

---

## 1. Závazná pravidla (Core Rules)

1. **Plátno a barvy:** Pozadí vždy čistě černé `--color-bg-canvas` (`#000000`). Zákaz vlastních hex/rgb barev v komponentách – použij CSS tokeny.
2. **Žádný scroll celé stránky:** `ModuleShell` má `overflow: hidden`. Scrollovat smí pouze vnitřek `TranslationCard` nebo `.table-scroll`.
3. **Haptika:** VŽDY volat `settings.vibrate(ms)` z `state/settings.svelte`. **NIKDY nevolat `navigator.vibrate` přímo.**
4. **Touch targets:** Všechny interaktivní prvky min. 48 × 48 px (`--tap-min-size`).
5. **Ničivé akce:** Vymazání vstupu VŽDY přes `SlideToAction` (tažením). Nikdy pouhým kliknutím.

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
│ - automatický scroll dolů, 1-tap copy do schránky      │
├────────────────────────────────────────────────────────┤
│ ZONE-INPUT: Klávesnice modulu (flex-shrink: 0)         │
│ 1. [Volitelný Toolbar]                                 │
│ 2. [Vstupní prvek: Textarea / 2x3 Matice / Kruh dial]  │
│ 3. .keypad-utility-row (42px, poměr 1.15fr 0.85fr)     │
│    <SlideToAction> + <BackspaceButton>                 │
│ 4. .keypad-dominant-2col nebo .keypad-dominant-3col    │
│    <DominantButton> (clamp 62–82px)                    │
│    - 2 klávesy: poměr 0.85fr 1.15fr (Mezera, Vložit)   │
│    - 3 klávesy: repeat(3, 1fr) (Tečka, Čárka, /)       │
└────────────────────────────────────────────────────────┘
```

---

## 4. Pravidlo rozdělení funkcí (Separation of Concerns)

| Kde | Co tam patří | Příklady |
| :--- | :--- | :--- |
| **By Default** | Běžná pravidla šifry (95 % případů v terénu) | Morse s CH, Braille s českou diakritikou, okamžité vložení (auto-insert) |
| **Module Menu** (ikona List vpravo) | Odchylky konkrétní šifry na stanovišti + akce se stavem | Bez CH, přímá čísla (A=1), zrcadlení, Vložit ze schránky, Vyčistit modul |
| **Reference Modal** (ikona Knížka) | Statické taháky výhradně pro čtení | Pomocná slova, tabulka Braillových bodů, kruh semaforu |
| **App Settings** (`/settings`) | Globální předvolby zařízení a dat | Haptika, Wake Lock, správa vlastních abeced, offline SQLite databáze |

---

## 5. Rychlý katalog komponent

### `DominantButton` (spodní velké klávesy)
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
  label="Přímý režim čísel"
  hint="Čísla 1–0 bez prefixu"
  type="checkbox"
  checked={directNums}
  onChange={(v) => (directNums = v)}
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

### `Badge` (metadata a štítky)
```svelte
<Badge variant="accent">98%</Badge>
<Badge variant="neutral">24 znaků</Badge>
```

---

## 6. Šablona nového modulu (Blueprint)

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

  $effect(() => {
    modSettings.setString('input', text);
  });
</script>

<ModuleShell onReset={() => (text = '')} onPaste={(t) => (text += t)}>
  {#snippet output()}
    <TranslationCard {text} />
  {/snippet}

  {#snippet input()}
    <div class="keypad-zone">
      <!-- Vstupní widget modulu -->
      <div class="widget-container">...</div>

      <!-- Řádek utilit -->
      <div class="keypad-utility-row">
        <SlideToAction disabled={!text} onAction={() => (text = '')} />
        <BackspaceButton disabled={!text} onAction={() => (text = text.slice(0, -1))} />
      </div>

      <!-- Dominantní klávesy -->
      <div class="keypad-dominant-2col">
        <DominantButton symbol="␣" name="Mezera" onClick={() => (text += ' ')} />
        <DominantButton symbol="↵" name="Vložit" onClick={() => {}} />
      </div>
    </div>
  {/snippet}

  {#snippet menuOptions()}
    <OptionRow label="Možnost modulu" checked={false} onChange={() => {}} />
  {/snippet}
</ModuleShell>
```
