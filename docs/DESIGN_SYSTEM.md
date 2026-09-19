# Samuel Design System (AI & Developer Reference)

> Závazná reference designových pravidel, architektury a komponent pro aplikaci **Samuel**.  
> Každý AI agent i vývojář se těmito pravidly musí bezvýhradně řídit.

---

## 0. Rozhodovací matice pro AI agenty (POKUD ..., POTOM ...)

- **POKUD** skládáš rozhraní jakéhokoliv modulu, **POTOM** použij striktní hierarchii v `<ModuleShell>`:  
  1. Fixní Header (52 px)  
  2. Výstupní zóna `<TranslationCard>` (`flex: 1`, min. 84 px, OLED černá `#000000`, bez celostránkového scrollu)  
  3. Vstupní zóna `ZONE-INPUT` (max. výškový rozpočet 326 px, zapuštěná šasi klávesnic)
- **POKUD** navrhuješ vstupní matici (abeceda, numpad, vlajky, kříž, ciferník), **POTOM** její výšku clampuj (`clamp(...)`), aby celá vstupní zóna nepřekročila 326 px a celé UI se bez scrollu vešlo na minimální viewport **320 × 540 px** v portrait režimu.
- **POKUD** modul vyžaduje potvrzení rozepsaného znaku (Enter / Commit), **POTOM** NIKDY nevytvářej samostatné velké tlačítko pod utilitním řádkem. **POTOM** použij kontextové středové tlačítko `<SpaceCommitButton>` v utilitním trojbloku, které se při rozepsaném znaku promění z Mezery na Enter/Vložit.
- **POKUD** modul zadává znaky okamžitě (auto-insert / přímý dotyk dlaždice), **POTOM** středové tlačítko v utilitní řadě zůstává trvale Mezerou.
- **POKUD** renderuješ ikonu mezerníku v `<SpaceCommitButton>`, **POTOM** použij čistou SVG ikonu otevřené klávesy `|_|` (tloušťka 2.2px, perfektní vertikální centrování). NIKDY nepoužívej textový znak `␣` z fontu, který sedí příliš nízko na účaří a je miniaturní.
- **POKUD** `<SpaceCommitButton>` zobrazuje potvrzovaný text/slovo (např. T9 predikce), **POTOM** musí mít `max-width: 100%`, `text-overflow: ellipsis`, `overflow: hidden`, `white-space: nowrap` a přizpůsobenou velikost písma `clamp(...)`, aby text nikdy nepřetekl tlačítko.
- **POKUD** je `<SpaceCommitButton>` aktivní (v režimu potvrzení/Enter), **POTOM** musí zachovat identický horní plastický odlesk `inset 0 1px 0 rgba(255, 255, 255, 0.10)` jako okolní tlačítka, aby nevznikal dojem odlišného nasvícení zvrchu.
- **POKUD** modul používá sub-toolbar (např. výběr nástroje nebo akce modulu), **POTOM** musí být vždy roztažený na celou šířku obrazovky (`100% full width`), nikdy zúžený ani centrovaný jako volná pilulka.
- **POKUD** modul nabízí sekundární volby nebo režimy klávesnice (např. Klasik vs. T9 na mobilní klávesnici), **POTOM** NIKDY nestav dva sub-toolbary nad sebe – sekundární přepínač patří do kontextového menu modulu.
- **POKUD** otevíráš kontextové menu modulu (`ModuleMenu`), **POTOM** záhlaví VŽDY nese název `<název aktuální obrazovky>: nastavení` (např. `Mobil: nastavení`, `Cézar: nastavení`, `Semafor: nastavení`), NIKDY generické `Menu modulu`.
- **POKUD** je zařízení v landscape režimu s výškou obrazovky nižší než 540 px, **POTOM** aplikace renderuje celoobrazovkový černý overlay `<LandscapeWarning>` s výzvou „Otočte na výšku“.
- **POKUD** uživatel zadává delší text nebo edituje řetězec nativní klávesnicí OS (např. Posuny, kódování), **POTOM** použij `<TextEntrySheet>` (overlay s nadpisem, textareou a tlačítky). NIKDY nenechávej inline textové inputy deformovat a zmenšovat hlavní obrazovku po vysunutí softwarové klávesnice.
- **POKUD** modul nabízí volbu nástrojů nebo podtypů šifry (např. Cézar / Vigenère / Autokey v Posunech nebo Velký / Malý / Polybius / Mobil v Křížích), **POTOM** umísti `<SegmentedControl>` přímo do **Sub-Toolbaru** nad klávesnici na hlavní obrazovce. NIKDY neschovávej přepínání primárních nástrojů do `ModuleMenu`.
- **POKUD** prvek plní roli taháku, tabulky nebo encyklopedie (např. Vlajky světa, morseovský tahák), **POTOM** ho umísti do `ReferenceModal` (ikona Knížky v záhlaví), NIKDY do těla zadávacího modulu přes `fullscreen-input`.
- **POKUD** má tlačítko nebo klávesa stav `disabled`, **POTOM** NIKDY nenastavuj `opacity` na kořenový element tlačítka. VŽDY zachovej plnou barvu povrchu `var(--color-surface-2)` a ztlum pouze vnitřní ikonu/label na `opacity: 0.35`.
- **POKUD** vytváříš kontextové akce nebo živé predikce (např. T9 kandidáti slov, akce morseovky), **POTOM** je umísti do Sub-Toolbaru těsně nad klávesnici. NIKDY nevytvářej plovoucí pilulky (floating bar) přes kartu `<TranslationCard>`.
- **POKUD** píšeš nápovědný text prázdného stavu (`emptyHint`), **POTOM** formuluj úderný vstupní tip pro nováčka v 1 větě. Zásadně bez textové vaty typu „V tomto okně se zobrazuje...“.
- **POKUD** implementuješ mazání celého vstupu, **POTOM** VŽDY použij `<SlideToAction>` (bezpečné podržení tahem zleva doprava). NIKDY nemaž text pouhým kliknutím na křížek.
- **POKUD** zobrazuješ toast hlášku, **POTOM** musí mít **max. 30 znaků textu + až 2 emoji**.
- **POKUD** umisťuješ easter egg, **POTOM** smí fungovat výhradně jako pasivní záslepka mřížky (`.grid-filler`) nebo ergonomický spodní buffer. NIKDY nesmí rozbíjet rozložení kláves ani mít vlastní vyhrazený řádek na úkor ovládání.

---

## 1. Závazná pravidla (Core Rules)

1. **Plátno a barvy:** Pozadí vždy čistě černé `--color-bg-canvas` (`#000000`). Zákaz vlastních hex/rgb barev v komponentách – použij výhradně CSS tokeny.
2. **Žádný celostránkový scroll:** `<ModuleShell>` má `overflow: hidden`. Scrollovat smí pouze vnitřek `TranslationCard` nebo `.table-scroll`.
3. **Viewport 320 × 540 px (Portrait-only):** Všechny obrazovky a nástroje se musí pohodlně a bez deformace vejít do výšky 540 px při šířce 320 px. Při landscape orientaci pod 540 px výšky se zobrazí varovný overlay.
4. **Haptika:** VŽDY volat `settings.vibrate(ms)` z `state/settings.svelte`. **NIKDY nevolat `navigator.vibrate` přímo.** Nezdvojovat volání (komponenta tlačítka již haptiku zajišťuje).
5. **Touch targets a clampování:** Samostatná tlačítka min. 48 × 48 px (`--tap-min-size`). V kondenzovaných maticích (abeceda, numpad, vlajky) platí explicitní výjimka: výška klávesy se dynamicky clampuje na **32–40 px**, aby matice nepřekročila prostorový rozpočet.
6. **Multi-touch & okamžitá odezva kláves:** Klávesnice pro zadávání znaků musí reagovat na `onpointerdown` s `e.preventDefault()`, nikoli čekat na `click` / `touchend`. Kontejnery klávesnic musí mít `touch-action: none`.
7. **Ničivé akce (Vymazání):** Vymazání vstupu VŽDY přes `<SlideToAction>` (podržením s tekutým vybarvováním zleva doprava). Nikdy pouhým kliknutím.
8. **Kondenzované ovládací bloky (Zapuštěné šasi „switchbed tray“):**
   Všechny zadávací matice i utilitní trojblok tvoří fyzicky zapuštěná černá šasi:
   - **Vnější šasi:** `border-radius: var(--radius-sm)` (6px), `overflow: hidden`, pozadí plátna `background-color: var(--color-bg-canvas)` (`#000000`), vnitřní černé spáry `gap: 2px`, obvodový odstup `padding: 2px` a subtilní ohraničující lem `border: 1px solid var(--color-border-subtle)` (oddělující šasi od šedého spodního panelu `#121214`).
   - **Obvodová symetrie:** Každá klávesa na obvodu i v rozích má identickou 2px černou spáru na všech 4 stranách. Rohové klávesy se neořezávají zaoblením kontejneru a drží si čistý `border-radius: 2px`.
   - **Vnitřní tlačítka (keycaps):** `border: none`, `border-radius: 2px`, plné podbarvení `var(--color-surface-2)`.
   - **Záslepka neobsazených míst (`.grid-filler`):** Pokud mřížka nekončí na celém řádku (např. abeceda 26/42 znaků), prázdná místa nesmí tvořit černou díru v šasi. Vkládá se záslepka o šířce zbývajících sloupců (`grid-column: span X`) v barvě `var(--color-surface-2)` s utlumenou průhledností `opacity: 0.35`, zaoblením `border-radius: 2px` a odpovídajícími fazetami.
9. **Plasticita a světelné fazety (Tactility):**
   - **Vystouplá tlačítka (keycaps):** 1px fyzická plastická fazeta – horní světelný odraz `inset 0 1px 0 rgba(255, 255, 255, 0.10)` a spodní stín `inset 0 -1px 0 rgba(0, 0, 0, 0.5)`.
   - **Stisknutý stav (`:active`):** Klávesa se fyzicky promáčkne do vnitřního stínu `inset 0 1.5px 3px rgba(0, 0, 0, 0.7)` a `background-color: var(--color-surface-active)`.
10. **Zákaz plošného `opacity` u `disabled`:**
    Tlačítka a klávesy v neaktivním stavu NIKDY nesmí mít `opacity` na kořenový element. Klávesa si drží plnou barvu `var(--color-surface-2)`, tlumí se výhradně vnitřní ikona/text na `opacity: 0.35`.
11. **Sjednocení rádiusů prvků:**
    - Vnější šasi, kontejnery klávesnic, utilitní blok, přepínače (`SegmentedControl`), dialogy a textareje: **`--radius-sm` (6px)**.
    - Jednotlivá tlačítka uvnitř mřížek a sdružených řad: **`border-radius: 2px`**.
    - Vnitřní sub-prvky (např. aktivní segment přepínače): **`--radius-xs` (4px)**.
    - Kruhové prvky: **`--radius-full`** (Braillovy body, ciferníky).
12. **Kontextové tooltipy prázdného stavu (`emptyHint`):**
    - Slouží pro stručný, jednovětý vstupní tip pro uživatele, který nástroj otevřel poprvé.
    - Zásadně **bez ikon a bez nadpisů** – subtilní text v barvě `var(--color-text-muted)`, usazený u spodního okraje výstupní zóny.
    - **Rozplynutí při aktivitě:** Při prvním zadaném znaku se nápověda během **0.7s** plynule rozostří do oparu (`filter: blur(14px); opacity: 0.2; transform: scale(0.96) translateZ(0)`).
    - **Zpětné vynoření:** Při vymazání vstupu se během 0.7s plynule zaostří zpět na plnou čitelnost.

---

## 2. CSS Design Tokens (`src/app.css`)

### Barvy
- **Plátno a povrchy:** `--color-bg-canvas` (#000000), `--color-surface-1` (#121214), `--color-surface-2` (#1c1c22), `--color-surface-3` (#262630), `--color-surface-active` (#323240), `--color-surface-elevated` (#161820).
- **Rámečky:** `--color-border-subtle` (#2a2a34), `--color-border-medium` (#3a3a48), `--color-border-focus` (#00d2ff).
- **Text:** `--color-text-primary` (#ffffff), `--color-text-secondary` (#9da0af), `--color-text-muted` (#626474), `--color-text-inverse` (#000000).
- **Akcenty:**
  - Primary (Cyan): `--color-accent-primary` (#00d2ff) | subtle: `rgba(0, 210, 255, 0.12)` | glow: `rgba(0, 210, 255, 0.35)`
  - Success (Green): `--color-accent-success` (#10b981) | subtle: `rgba(16, 185, 129, 0.12)`
  - Warning (Amber): `--color-accent-warning` (#f59e0b) | subtle: `rgba(245, 158, 11, 0.12)`
  - Danger (Red): `--color-accent-danger` (#ef4444) | subtle: `rgba(239, 68, 68, 0.15)`

### Dimenze & Layout Budget
- **Spacing:** `--space-2xs` (2px), `--space-xs` (4px), `--space-sm` (8px), `--space-md` (12px), `--space-lg` (16px), `--space-xl` (20px), `--space-2xl` (24px).
- **Radius:** `--radius-xs` (4px), `--radius-sm` (6px), `--radius-md` (10px), `--radius-lg` (14px), `--radius-full` (9999px).
- **Text:** `--text-2xs` (10px), `--text-xs` (11px), `--text-sm` (13px), `--text-base` (15px), `--text-lg` (17px), `--text-xl` (20px), `--text-2xl` (24px).
- **Layoutové konstanty:**
  - `--header-height: 52px;`
  - `--tap-min-size: 48px;`
  - `--subtoolbar-height: 36px;`
  - `--utility-row-height: 42px;`
  - `--output-min-height: 84px;`
  - `--keypad-max-budget: 326px;`

---

## 3. Vertikální rozpočet obrazovky (Screen Layout Budget)

Při minimální portrait výšce **540 px**:

```
┌────────────────────────────────────────────────────────┐
│ Header (52px fixně)                                    │
├────────────────────────────────────────────────────────┤
│ ZONE-OUTPUT: <TranslationCard>                         │
│ - flex: 1, min-height: 84px                            │
│ - OLED black (#000000), bez rušivých plovoucích prvků │
│ - 1-tap copy do schránky, plynulý auto-scroll dolů     │
├────────────────────────────────────────────────────────┤
│ ZONE-INPUT: Zapuštěné šasi klávesnice (max. 326 px)    │
│ 1. [Volitelný Sub-Toolbar / SegmentedControl] (36 px)  │
│ 2. Vstupní matice / Kruh dial / Kříž (clampováno)      │
│ 3. .keypad-utility-row-3col (42px fixně)               │
│    [ <SlideToAction> | <SpaceCommitButton> | <Backspace> ]
│    - Poměr šířek: 1fr : 1.3fr : 1fr                    │
│    - Výhradně symboly a ikony bez textu                │
└────────────────────────────────────────────────────────┘
```

### Matematika rozpočtu:
$$540\text{ px} - [52\text{ (Header)} + 84\text{ (Output)} + 42\text{ (Utility)} + 20\text{ (Paddings)} + 16\text{ (Gaps)}] = \mathbf{326\text{ px}}$$

Žádná klávesnice nesmí v součtu (matice + subtoolbar) překročit **326 px**.

---

## 4. Pravidlo rozdělení funkcí (Separation of Concerns)

| Kde | Co tam patří | Příklady |
| :--- | :--- | :--- |
| **By Default** | Běžná pravidla šifry (95 % případů v terénu) | Morse s CH, Braille bez nutnosti mačkat Enter, Semafor s okamžitým zápisem |
| **Sub-Toolbar** (přímo nad klávesnicí) | Přepínače nástrojů na očích + živé akce modulu | Posuny (Cézar/Vigenère/Autokey), Kříže (Polský/Malý/Polybius/T9), T9 kandidáti slov, Morse permutace |
| **Module Menu** (ikona List vpravo) | Odchylky konkrétní šifry na stanovišti + volba abecedy | Výběr abecedy modulu, vynechaná písmena Polybia, zrcadlení semaforu, reset modulu |
| **Reference Modal** (ikona Knížka) | Statické taháky a encyklopedie výhradně pro čtení | Pomocná slova morseovky, tabulka Brailla, kruh semaforu, námořní vlajky, atlas vlajek světa |
| **App Settings** (`/settings`) | Globální předvolby zařízení a správa databáze | Offline slovníková DB (~102 MB), Evergreen aktualizace, haptika, správa abeced |

---

## 5. Rychlý katalog klíčových komponent

### `SlideToAction` (bezpečné tekuté mazání)
- Tlačítko se stejnou výškou (42 px) v levé pozici utilitního šasi.
- **Vzhled v klidu:** Pouze ikona koše (`Trash`), neutrální tmavý povrch, plné podbarvení i při `disabled`. Žádné plošné `opacity`.
- **Interakce:** Při podržení se plynule zalévá červenou barvou zleva doprava (`holdDuration: 450ms`).
```svelte
<SlideToAction
  disabled={!hasContent}
  onAction={handleClearAll}
  ariaLabel="Vymazat text podržením"
/>
```

### `SpaceCommitButton` (kontextové středové tlačítko)
- Centrální součást utilitního bloku s poměrem šířky `1.3fr`.
- **Klidový stav (žádný rozepsaný znak):** Zobrazuje symbol mezery `␣`. Po stisku vloží mezeru.
- **Aktivní stav (rozepsané body Brailla, 1. rameno Semaforu, číslice):**
  Plynule se promění na potvrzení **Enter / Vložit**. Zobrazuje symbol `↵` nebo náhled vkládaného písmene s akcentním rámečkem.
```svelte
<SpaceCommitButton
  pendingChar={pendingChar}
  onSpace={handleSpace}
  onCommit={handleCommit}
/>
```

### `BackspaceButton` (korekce a rušení rozepsaného stavu)
- Pravá součást utilitního bloku se symbolem `⌫`.
- **Dvojí role:** Pokud je rozepsaný znak (selekce souřadnice, ramena, bodů), ikona se automaticky změní na `✕` a stisk zruší rozepsaný stav bez smazání hotového textu.
```svelte
<BackspaceButton
  disabled={!hasContent && !hasSelection}
  hasActiveSelection={hasSelection}
  onAction={handleBackspace}
/>
```

### `TranslationCard` (výstupní karta překladu)
- Čistě minimalistický vzhled: OLED black `#000000`, bez rámečků a bez plovoucích prvků.
- 1-tap kliknutím zkopíruje celý text do schránky s haptickou odezvou.
- **`emptyHint`:** Jednovětý návod usazený u spodního okraje, který se při psaní plynule rozostří do oparu (0.7s).
```svelte
<TranslationCard
  text={committedText}
  pendingText={pendingDisplay}
  emptyHint="Klepněte na body nebo tahem spojte."
/>
```

### `TextEntrySheet` (overlay pro delší vstupy s nativní klávesnicí)
- Zajišťuje zadávání textu přes systémovou klávesnici OS bez deformace hlavní obrazovky modulu.
- Otevírá se klepnutím na vstupní pole v Posunech a textových šifrách.
- Obsahuje nadpis, pohodlnou `<textarea>`, tlačítko *Vložit ze schránky* a tlačítko *Hotovo*.

### `LandscapeWarning` (systémový overlay při otočení)
- Aktivuje se při `@media (orientation: landscape) and (max-height: 539px)`.
- 100% OLED black plátno, animovaný piktogram rotace telefonu a text **„Otočte na výšku“**.

---

## 6. Pravidla pro texty a Microcopy

1. **Žádná textová vata:** Zakázána slova typu *„Zde se zobrazuje...“*, *„Tento modul slouží k...“*, *„Kliknutím zkopírujete...“*.
2. **Standard pro `emptyHint`:**
   - Morse: *„Lomítko dělí písmena, dvě slova. Text bez mezer řeší tlačítko dole.“*
   - Braille: *„Body lze zadávat klepnutím i plynulým tahem.“*
   - Semafor: *„Zvolte 2 pozice nebo spojte tahem.“*
   - Vlajky: *„Filtrujte vlajky barvami dole.“*
   - Kříže (Polský): *„Klepněte přímo do pole kříže nebo zvolte souřadnice.“*
   - Kříže (T9): *„Každou klávesu stiskněte jen jednou, slova doplňuje slovník.“*
   - Čísla: *„Soustavy a režimy volí lišta nahoře.“*
   - Posuny: *„Všechny posuny abecedy se vyhodnocují živě.“*
3. **Toasty:** Max. 30 znaků textu + až 2 emoji. Úderné, imperativní tvary (*„Zkopírováno“*, *„Vyčištěno“*, *„Stahuji slovník...“*).

---

## 7. Šablona modulu (Blueprint)

```svelte
<script lang="ts">
  import ModuleShell from '../../components/layout/ModuleShell.svelte';
  import TranslationCard from '../../components/ui/TranslationCard.svelte';
  import SlideToAction from '../../components/ui/SlideToAction.svelte';
  import SpaceCommitButton from '../../components/ui/SpaceCommitButton.svelte';
  import BackspaceButton from '../../components/ui/BackspaceButton.svelte';
  import OptionRow from '../../components/ui/OptionRow.svelte';
  import { localSettingsService } from '../../services/localSettingsService';

  const modSettings = localSettingsService.forModule('example_mod');
  let text = $state(modSettings.getString('text', ''));
  let pendingChar = $state('');

  $effect(() => { modSettings.setString('text', text); });

  function handleClearAll() {
    text = '';
    pendingChar = '';
  }

  function handleSpace() {
    text += ' ';
  }

  function handleCommit() {
    if (pendingChar) {
      text += pendingChar;
      pendingChar = '';
    }
  }

  function handleBackspace() {
    if (pendingChar) {
      pendingChar = '';
    } else if (text) {
      text = text.slice(0, -1);
    }
  }
</script>

<ModuleShell onReset={handleClearAll} onPaste={(t) => (text += t)}>
  {#snippet output()}
    <TranslationCard
      {text}
      pendingText={pendingChar}
      emptyHint="Úderný a stručný návod ke vstupu."
    />
  {/snippet}

  {#snippet input()}
    <div class="keypad-zone">
      <!-- 1. Volitelný Sub-Toolbar / SegmentedControl (36px) -->

      <!-- 2. Vstupní šasi s clampovanou výškou kláves -->
      <div class="keypad-matrix">
        <!-- Tlačítka klávesnice s výškou clamp(34px, 4.5vh, 42px) -->
      </div>

      <!-- 3. Utilitní trojblok (42px fixně): Clear | Space+Commit | Backspace -->
      <div class="keypad-utility-row-3col">
        <SlideToAction
          disabled={!text && !pendingChar}
          onAction={handleClearAll}
        />
        <SpaceCommitButton
          {pendingChar}
          onSpace={handleSpace}
          onCommit={handleCommit}
        />
        <BackspaceButton
          disabled={!text && !pendingChar}
          hasActiveSelection={!!pendingChar}
          onAction={handleBackspace}
        />
      </div>
    </div>
  {/snippet}

  {#snippet menuOptions()}
    <OptionRow label="Možnost modulu" checked={false} onChange={() => {}} />
  {/snippet}
</ModuleShell>
```
