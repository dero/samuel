# Samuel Design System (AI & Developer Reference)

> Závazná referenční příručka informační architektury, principů a komponent pro aplikaci **Samuel**.  
> Každý AI agent i vývojář se těmito pravidly musí bezvýhradně řídit.

---

## 1. Principy informační architektury & Separation of Concerns

Aplikace striktně rozlišuje mezi **samostatným nástrojem** (vlastní modul v Launcheru) a **variantou / příchutí** (flavour uvnitř modulu).

### 1.1 Rozhodovací pravidlo: Nástroj vs. Flavour
- **Kdy je to samostatný NÁSTROJ (Modul v Launcheru):**
  1. **Zásadně odlišné vstupní médium / klávesnice:** Pokud se liší fyzická povaha zadávání (např. geometrické čáry kříže $\neq$ číselné souřadnice Polybia $\neq$ numerický číselník telefonu s T9), jedná se o samostatný modul.
  2. **Odlišný mentální model a workflow:** Hráč přistupuje k šifře s jiným očekáváním (např. kreslení tvarů vs. mačkání klávesnice telefonu).
  - *Příklady modulů:* Morseovka, Braille, Semafor, Polský kříž, Polybius, Mobil / SMS, Posuny, Čísla.
- **Kdy je to pouhý FLAVOUR (Varianta uvnitř modulu):**
  1. **Shodné nebo velmi příbuzné vstupní médium i cíl:** Sdílí stejnou rodinu vstupů a logiku (např. v Křížích: *Velký kříž* vs. *Malý kříž*; v Posunech: *Caesar* vs. *Vigenère* vs. *Atbaš*; v Braillu: *6bod* vs. *8bod*).
  2. **Společný kontext a snadný přechod:** Hráč zkouší posuny abecedy a plynule přechází mezi variantami stejného textu.

### 1.2 Třívrstvá hierarchie ovládání
1. **Header Bar (52 px fixně):**
   - Vlevo: `[ Ikona modulu ]` – klepnutím otevírá celoobrazovkový **Launcher všech modulů**.
   - Střed: `[ Název modulu ]` – jednoznačný název aktivního nástroje.
   - Vpravo: `[ 📖 Reference ]` (tahák a encyklopedie ke čtení) a `[ ☰ Menu ]` (konfigurace modulu a reset).
2. **Sub-Toolbar (36 px, 100% full-width přímo nad klávesnicí):**
   - **Klidový stav:** Slouží pro bleskové přepínání variant (**Flavours**) daného nástroje (např. `<SegmentedControl size="sm">`: *Caesar | Vigenère | Autokey* nebo *Velký | Malý kříž*).
   - **Aktivní / Rozepsaný stav:** Může se dynamicky proměnit na kontextové akce vstupu (např. živí kandidáti T9 predikce, akce morseovky).
   - **Zero Overflow Contract:** Sub-Toolbar je zapouzdřen v `.subtoolbar-container` (výška přesně 36 px, `overflow: hidden`). Žádný prvek v něm nesmí přetékat a zmenšovat odstup pod ním.
3. **Zadávací zóna (ZONE-INPUT, max. 326 px):**
   - Fyzické zadávání znaků v zapuštěném šasi + fixní utilitní trojblok 42 px (`Clear | Space/Commit | Backspace`).
   - **Jednotný rytmus mezer (`--zone-input-gap: 8px`):** Mezi Sub-Toolbarem a klávesnicí i mezi klávesnicí a utilitním blokem je VŽDY shodná mezera 8 px. Žádné ad hoc odsazování.

### 1.3 Separation of Concerns: Kde co leží
- **By Default:** Výchozí chování pokrývající 95 % případů v terénu bez klikání navíc (Morse s CH, Braille bez nutnosti Enteru, přímý zápis).
- **Sub-Toolbar (36 px nad klávesnicí):** Flavours nástroje a operativní živé akce při psaní.
- **Module Menu (`[ ☰ ]` vpravo):** Statická konfigurace šifry na stanovišti (odchylky abecedy, zrcadlení pohledu, vynechaná písmena, destruktivní reset celého modulu).
- **Reference Modal (`[ 📖 ]` vpravo):** Pasivní taháky a encyklopedie ke čtení (pomocná slova, tabulka Brailla, kruh semaforu). Zákaz zadávání přes referenční modály.
- **Nastavení (`/settings`):** Systémové preference zařízení (offline DB ~102 MB, haptika, správa globálních abeced).

---

## 2. Anatomie a typická kostra modulu (`ModuleShell`)

Každý modul je zapouzdřen v `<ModuleShell>` a skládá se ze 4 deklarativních snippetů:

```
┌────────────────────────────────────────────────────────┐
│ Header (52px fixně)                                    │
│ [Ikona modulu]               [Název modulu]   [📖] [☰] │
├────────────────────────────────────────────────────────┤
│ ZONE-OUTPUT: {#snippet output()}                       │
│ - <TranslationCard>: flex: 1, min-height: 84px         │
│ - OLED black (#000000), 1-tap copy, auto-scroll        │
│ - emptyHint s plynulým rozostřením (0.7s blur)         │
├────────────────────────────────────────────────────────┤
│ ZONE-INPUT: {#snippet input()} (max. 326 px)           │
│ 1. [Sub-Toolbar: Flavours / Akce] (36 px fixně)        │
│    ↕ 8px mezera (--zone-input-gap)                     │
│ 2. Zadávací matice / Keypad Stage (clampovaná výška)   │
│    ↕ 8px mezera (--zone-input-gap)                     │
│ 3. .keypad-utility-row-3col (42 px fixně)              │
│    [ <HoldToAction> | <SpaceCommitButton> | <Backspace> ]
├────────────────────────────────────────────────────────┤
│ KONTEXTOVÁ ROZHRANÍ (Mimo hlavní plochu)               │
│ - {#snippet menuOptions()}: Položky pro ModuleMenu     │
│ - {#snippet reference()}: Obsah pro ReferenceModal     │
└────────────────────────────────────────────────────────┘
```

### Povinnosti snippetů:
- `output()`: Vykresluje výstup modulu (překlad v `<TranslationCard>`, grafy, frekvenční histogram apod.). Výstup je VŽDY nahoře (`flex: 1`, min. 84 px). Zákaz celostránkového scrollu; scrollovat smí pouze vnitřek výstupní zóny (`overflow-y: auto`).
- `input()`: Obsahuje Sub-Toolbar (je-li potřeba), zadávací matici v zapuštěném šasi, utilitní trojblok či textové triggery. Vstup je VŽDY dole na dosah palce (thumb zone). Součet výšek nesmí překročit **326 px**.
- `menuOptions()`: Vykresluje položky `<OptionRow>` a `<AlphabetSelect>`.
- `reference()`: Vykresluje komponentu taháku modulu.

---

## 3. Závazná pravidla pro AI agenty (POKUD ..., POTOM ...)

### Layout & Viewport
- **POKUD** skládáš modul, **POTOM** použij `<ModuleShell>` a dodrž hierarchii: Header (52 px), `<TranslationCard>` či vizualizace (`flex: 1`, min. 84 px), `ZONE-INPUT` (max. 326 px). Žádný celostránkový scroll (`overflow: hidden`).
- **POKUD** navrhuješ jakýkoliv modul (včetně analytických, šifrovacích či textových), **POTOM** výstup / výsledky / luštěný text patří VŽDY do horní zóny (`ZONE-OUTPUT`) a veškeré zadávání / klávesnice / voliče VŽDY do spodní zóny (`ZONE-INPUT`) na dosah palce (thumb zone). V celé aplikaci je striktně zakázáno obracet tok (vstup nahoře a výstup dole je nepřípustný).
- **POKUD** navrhuješ rozhraní, **POTOM** minimální garantovaný viewport je **320 × 540 px** (portrait-only). Při landscape s výškou < 540 px se zobrazí overlay `<LandscapeWarning>`.
- **POKUD** má nástroj odlišné vstupní médium (kříž vs polybius vs mobil), **POTOM** vytvoř samostatný modul v Launcheru. NIKDY neslučuj odlišná zadávací média do jednoho modulu.
- **POKUD** skládáš prvky ve vstupní zóně (`ZONE-INPUT`), **POTOM** použij jednotný kontejner `.zone-input-flow` se striktním odstupem `--zone-input-gap: var(--space-sm)` (8 px) mezi všemi souslednými prvky: `[Sub-Toolbar (36 px)] ➔ 8 px ➔ [Stage / Keypad] ➔ 8 px ➔ [.keypad-utility-row-3col (42 px)]`. NIKDY nepřidávej ad hoc vertikální marginy nebo paddingy, které by tento 8px rytmus narušily.
- **POKUD** renderuješ Sub-Toolbar, **POTOM** použij kontejner `.subtoolbar-container` (výška přesně 36 px, `overflow: hidden`) a komponenty v něm musí držet výšku 36 px (např. `<SegmentedControl size="sm">`, `.t9-candidate-pill` výška 30 px). Žádný prvek nesmí přetékat.
- **POKUD** modul nabízí příbuzné varianty téhož nástroje (flavours), **POTOM** umísti `<SegmentedControl size="sm">` do Sub-Toolbaru (36 px, 100% full-width) přímo nad klávesnici.
- **POKUD** má modul rozepsaný stav vyžadující kontextové akce (např. T9 predikce slov), **POTOM** Sub-Toolbar plynule přepni z nabídky flavours na kontextové akce.
- **POKUD** uživatel zadává text systémovou klávesnicí, **POTOM** řádek v `ZONE-INPUT` realizuj jako pasivní klikatelný trigger (tlačítko `button.cipher-input-trigger`), který otevírá `<TextEntrySheet>`. V `ZONE-INPUT` NIKDY neumisťuj focusovatelný `<input>` ani `<textarea>`, který by inline otevíral softwarovou klávesnici OS a deformoval layout.
- **POKUD** otevíráš kontextové menu (`ModuleMenu`), **POTOM** záhlaví VŽDY nese název `<Název modulu>: nastavení` (např. `Kříže: nastavení`), NIKDY generické `Menu modulu`.

### Klávesnice & Tlačítka
- **POKUD** navrhuješ vstupní matici, **POTOM** její výška má preferovat maximální povolený rozměr (např. 52 px pro mobilní číselník, 46 px pro kříž, 42 px pro abecedu), přičemž `ZONE-INPUT` má přednost a ukousne si z `ZONE-OUTPUT` tolik prostoru, kolik potřebuje, dokud výstup nenarazí na své minimum 84 px (`var(--output-min-height)`). NIKDY nepoužívej `vh`/`dvh` clampy, které zmenšují tlačítka na úkor volného místa.
- **POKUD** vytváříš samostatné tlačítko, **POTOM** minimální rozměr je 48 × 48 px (`--tap-min-size`). U hustých matic (abeceda, numpad, vlajky) platí výjimka na výšku **32–40 px**.
- **POKUD** tvoříš zadávací matice a utilitní blok, **POTOM** tvoří zapuštěná šasi: pozadí `#000000`, vnější rádius `--radius-sm` (6 px), rámeček `1px solid var(--color-border-subtle)`, vnitřní černé spáry `gap: 2px`, obvodový odstup `padding: 2px`.
- **POKUD** renderuješ keycaps uvnitř šasi, **POTOM** mají `border: none`, `border-radius: 2px`, pozadí `var(--color-surface-2)`, horní plastický odlesk `inset 0 1px 0 rgba(255, 255, 255, 0.10)` a spodní stín `inset 0 -1px 0 rgba(0, 0, 0, 0.5)`. Při stisku (`:active`) vnitřní stín `inset 0 1.5px 3px rgba(0, 0, 0, 0.7)` a `var(--color-surface-active)`.
- **POKUD** mřížka nekončí na celém řádku, **POTOM** doplň záslepku `.grid-filler` (`grid-column: span X`, `var(--color-surface-2)`, `opacity: 0.35`, `border-radius: 2px`).
- **POKUD** implementuješ zadávání znaků, **POTOM** použij `onpointerdown` s `e.preventDefault()` a kontejneru nastav `touch-action: none`.
- **POKUD** má tlačítko stav `disabled`, **POTOM** NIKDY nenastavuj `opacity` na kořenový prvek. Povrch drží plnou barvu `var(--color-surface-2)`, tlumí se pouze vnitřní obsah na `opacity: 0.48`.
- **POKUD** implementuješ haptiku, **POTOM** volej synchronně `settings.vibrate(ms)` z `state/settings.svelte.ts`. NIKDY nevolej `navigator.vibrate` přímo ani nezdvojuj vibrace u tlačítek, která vibrují sama.
- **POKUD** umisťuješ easter egg, **POTOM** smí fungovat pouze jako pasivní záslepka mřížky (`.grid-filler`) nebo spodní buffer; nesmí zabírat vlastní ovládací řádek.

### Utilitní trojblok & Akce
- **POKUD** skládáš utilitní řádek pod klávesnicí, **POTOM** použij `.keypad-utility-row-3col` (výška 42 px, poměr `1fr : 1.3fr : 1fr`):  
  `[ <HoldToAction> | <SpaceCommitButton> | <BackspaceButton> ]`
- **POKUD** modul vyžaduje potvrzení rozepsaného znaku (Enter / Commit), **POTOM** použij středové `<SpaceCommitButton>`, které se při rozepsaném znaku přepne z mezery na Enter/Vložit. Při přímém vkládání zůstává trvale mezerou.
- **POKUD** renderuješ mezerník v `<SpaceCommitButton>`, **POTOM** použij SVG ikonu otevřené klávesy `|_|` (tloušťka 2.2 px). Textový znak `␣` nepoužívej.
- **POKUD** `<SpaceCommitButton>` zobrazuje potvrzovaný text, **POTOM** musí mít `max-width: 100%`, `text-overflow: ellipsis`, `overflow: hidden`, `white-space: nowrap` a font clampován, aby nepřeteklo.
- **POKUD** mažeš celý text, **POTOM** VŽDY použij `<HoldToAction>` (bezpečné podržení s horní zářící linkou a varovným toastem při letmém tapnutí). NIKDY nemaž pouhým klikem.

### Microcopy
- **POKUD** píšeš nápovědu prázdného stavu (`emptyHint`), **POTOM** formuluj 1 údernou větu bez vatových úvodů („Zde se zobrazuje...“). Při psaní se plynule rozostří (0.7s blur), při vymazání znovu zaostří.
- **POKUD** zobrazuješ toast, **POTOM** max. **30 znaků + až 2 emoji** v imperativním tvaru (*„Zkopírováno“*, *„Vyčištěno“*).

### Tabulky a encyklopedická data (Fakta & Reference)
- **POKUD** formátuješ data a stupnice s popisy (Fakta, Reference), **POTOM** delší textové popisy NIKDY nedávej do úzkého samostatného sloupce, ale jako spojený řádek `<tr class="desc-row"><td colspan="...">` přímo pod primární řádek záznamu.
- **POKUD** záznam nese číselný index / stupeň / rank, **POTOM** ho umísti do prvního sloupce `<td rowspan="2" class="col-num">`, který vertikálně sváže oba řádky záznamu jako kotevní badge.
- **POKUD** buňka obsahuje číselné hodnoty, intervaly či vzorce, **POTOM** použij třídu `.col-val` (resp. `.col-code`), čísla formátuj bez mezer kolem spojovníku (typografický rozsah: `0–0,2`, `10,8–13,8`), se spojovacími mezerami u relačních operátorů (`&ge;&nbsp;118`, `&lt;&nbsp;1`) a v CSS striktně `white-space: nowrap; font-variant-numeric: tabular-nums;`.
- **POKUD** tabulka obsahuje dvouřádkové záznamy s `tr.desc-row`, **POTOM** zebra striping musí střídat celé dvojice záznamů (`tbody tr:nth-child(4n-1)`, `tbody tr:nth-child(4n)`), uvnitř záznamu nesmí být dělící linka a mezi záznamy musí být zřetelný předěl (`1px solid var(--color-border-medium)`).
- **POKUD** definuješ šířky sloupců tabulky, **POTOM** NIKDY nepoužívej rigidní inline procenta (např. `width: 20%`), která na úzkém viewportu (320–360 px) lámou čísla. Použij sémantické třídy: `.col-num`, `.col-val`, `.col-code` mají `width: 1%; white-space: nowrap;` (shrink-to-fit) a hlavní textový sloupec `.col-name` přirozeně získá veškerý zbývající prostor (`width: auto`).
- **POKUD** navrhuješ sloupce v primárním řádku mobilní tabulky (viewport 320–360 px), **POTOM** počet souběžných textových sloupců nesmí překročit **2** (např. *Pojem A* vs *Pojem B*, nebo 1 textový sloupec + 1–2 úzké číselné hodnoty `.col-val`). Třetí textový sloupec (doména, sféra, latinský název, kategorie apod.) se na 320 px nevejde a VŽDY patří do spodního řádku záznamu jako `<tr class="desc-row">`.



---

## 4. Layoutové & Dimenzionální konstanty

Hodnoty jsou definovány v `src/app.css`:

| Token | Hodnota | Popis / Použití |
| :--- | :--- | :--- |
| `--header-height` | `52px` | Fixní horní lišta modulu |
| `--subtoolbar-height`| `36px` | Přepínače flavours a živé akce modulu |
| `--utility-row-height`| `42px` | Spodní trojblok (Clear, Space/Commit, Backspace) |
| `--output-min-height` | `84px` | Minimální výška `<TranslationCard>` |
| `--keypad-max-budget` | `326px` | Max. výškový rozpočet pro celou vstupní zónu |
| `--tap-min-size` | `48px` | Běžný minimální touch target |
| Výška keycapu | `clamp(32px, 4.5vh, 40px)` | Výška klávesy v hustých maticích |
| `--radius-xs` | `4px` | Vnitřní sub-prvky (aktivní segment) |
| `--radius-sm` | `6px` | Vnější šasi, utilitní blok, sheet, dialogy |
| Keycap radius | `2px` | Jednotlivé klávesy uvnitř zapuštěných šasi |
| `--radius-full` | `9999px` | Kruhové prvky (Braille, ciferníky) |

### Matematika vertikálního rozpočtu (min. viewport 540 px):
$$540\text{ px} - [52\text{ (Header)} + 84\text{ (Output min)} + 42\text{ (Utility)} + 20\text{ (Paddings)} + 16\text{ (Gaps)}] = \mathbf{326\text{ px}}$$

---

## 5. Klíčové UI komponenty (`src/lib/components/`)

| Komponenta | Cesta | Účel & Klíčové props |
| :--- | :--- | :--- |
| `<ModuleShell>` | `layout/ModuleShell.svelte` | Základní kostra: snippets `#output`, `#input`, `#menuOptions`, `#reference`; props `title`, `hasAlphabet`, `onReset`, `onPaste` |
| `<TranslationCard>` | `ui/TranslationCard.svelte` | OLED výstup s auto-scrollem a 1-tap copy: props `text`, `pendingText`, `emptyHint` |
| `<HoldToAction>` | `ui/HoldToAction.svelte` | Bezpečné smazání podržením: props `onAction`, `disabled`, `holdDuration=380` |
| `<SpaceCommitButton>` | `ui/SpaceCommitButton.svelte` | Kontextová mezera / Enter: props `pendingChar`, `onSpace`, `onCommit`, `commitSymbol` |
| `<BackspaceButton>` | `ui/BackspaceButton.svelte` | Mazání / rušení rozepsaného znaku (✕ vs ⌫): props `onAction`, `hasActiveSelection`, `disabled` |
| `<SegmentedControl>` | `ui/SegmentedControl.svelte` | Přepínač flavours v sub-toolbaru: props `options`, `value`, `onChange` |
| `<TextEntrySheet>` | `ui/TextEntrySheet.svelte` | Celoobrazovkový textový editor zabraňující deformaci layoutu klávesnicí OS |
| `<LandscapeWarning>` | `layout/LandscapeWarning.svelte` | Systémový overlay vyzývající k otočení do portrait módu při výšce < 540 px |
