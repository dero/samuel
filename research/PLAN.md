# Specifikace šifrovacích pomůcek (Codename: Samuel)

> **Status:** Inicializace & Architektonický plán (Připraveno ke scaffoldingu)  
> **Codename:** Samuel (pracovní název pro vývoj)  
> **Cíl:** Vytvořit moderní, rychlý, offline-first a ergonomický nástroj pro luštění šifrovaček v terénu (i pro týmový štáb), který překoná dosavadní standard (Android aplikaci od Vaška Potočka) a přinese plnou multiplatformní podporu (včetně iOS a desktopu).

---

## 1. Analýza výchozího stavu: Šifrovací pomůcky pro Android (Vašek Potoček)

Aplikace Vaška Potočka je dlouholetým etalonem české šifrovací scény na Androidu. Na základě rozboru screenshotů v `research/android-tools` a reálných zkušeností z nočních i denních her (TMOU, Bedna, Sendvič, Matrix, Svíčky...):

### 1.1 Silné stránky stávající aplikace
- **Okamžitá odezva a 100% offline provoz:** Vše funguje bez internetu, nulový overhead či latence sítě.
- **Dedikované zadávací prvky na míru šifrám:**
  - Morseovka: 3 velká tlačítka (`.`, `-`, `/`), rychlé zadávání bez klasické softwarové klávesnice.
  - Braillovo písmo: interaktivní 6bodová matice (přepínání aktivních bodů).
  - Semafor: 8směrný kruhový volič (volba 2 směrů).
  - Šifrovací tabulky / polský kříž: vizuální mřížka s rychlou volbou souřadnic (1-3) a variant (+CH, velký kříž).
  - Vlajková abeceda: rozpoznávání náčrtku gestem (kreslení do canvasu) + reference s NATO fonetickou abecedou a námořním významem.
- **Paralelní zobrazení variant:** U Morseovky okamžitě zobrazuje přímo, prohozené tečky/čárky, čtení pozpátku a kombinaci.
- **Komplexní balík nástrojů:** Od jednoduchých posunů (Caesar, Atbaš, Vigenère, afinní) přes transpozice (obdélníky, trojúhelníky), frekvenční analýzu se substitučním režimem až po databázi slov (filtry / regex) a kalendář se svátky / dny v roce.
- **Tmavé schéma šetřící baterii:** Převážně černé pozadí vhodné do noci.

### 1.2 Omezení a prostor pro inovaci
- **Exkluzivita pro Android:** Uživatelé iOS (iPhony/iPady) nemají k aplikaci přístup; v týmech vzniká zbytečná technologická fragmentace.
- **Zastaralé UI/UX:** Styl Android Holo/Material 1, nevhodné layouty při otevřené systémové klávesnici, rozbalovací roletky (spinnery) s drobným písmem.
- **Silo jednotlivých modulů:** Moduly mezi sebou nesdílejí data (výstup z jedné šifry nelze jedním kliknutím poslat do Caesar posunu, transpozice či frekvenční analýzy).
- **Chybějící "Smart Solver / Auto-detect":** Když hráč vidí sekvenci čísel nebo binárních stavů, musí ručně zkoumat různé moduly místo toho, aby mu systém navrhl pravděpodobné interpretace (A=1, Z=1, Braille, ASCII, Morse, periodická tabulka...).
- **Nulová týmová kooperace:** Aplikace je čistě izolovaná pro jedno zařízení.
- **Limity kreslení vlajek:** Rozpoznávání na canvasu je občas nespolehlivé; chybí vyhledávání podle vizuálních atributů (např. "žlutá a modrá", "svislé pruhy", "kříž").

---

## 2. Architektonické a designové pilíře (Odsouhlaseno)

1. **Platforma & Distribuce:**
   - **Čisté PWA** (Progressive Web App) bez nativních wrapperů (žádný Capacitor / Tauri).
   - 100% multiplatformní (iOS Safari / PWA standalone, Android Chrome / WebAPK, desktop v týmovém štábu).
   - Nulové externí závislosti při běhu – plná odolnost proti výpadkům sítě v lesích/horách.

2. **Frontend Tech Stack:**
   - **Svelte 5** (Runes, jemná reaktivita bez overheadu virtual DOM, minimální runtime bundle, maximální efektivita běhu na slabých zařízeních v mrazu a šetření baterie).
   - **TypeScript** pro typovou bezpečnost algoritmů a datových struktur.
   - **Vite** jako build tool a bundler.
   - **Vanilla CSS** (využití scoped stylů ve Svelte komponentách; žádný těžký utility-first framework jako Tailwind, plná kontrola nad velikostí a layoutem).
   - **Web Workers** pro výpočetně náročné úlohy (vyhledávání ve 200k+ slovníku, regex filtry, křížovkářské masky, anagramy, brute-force posuny/transpozice) – UI vlákno zůstává vždy plynulé (60/120 fps).

3. **Offline Data, Storage & Bezpečný update model:**
   - Aplikace je **100% offline-first**.
   - **CacheStorage struktura:**
     - `assets-vX.Y.Z` pro aplikační kód (HTML, JS, CSS, ikony).
     - `data-vX.Y.Z` pro offline datasety (slovníky, tabulky).
   - **Verzovací soubor:** Statický `/version.json` na serveru s metadaty o nejnovější dostupné verzi.
   - **Opt-in aktualizace bez rizika v terénu:**
     - Žádný automatický reload ani stahování megabajtů v pozadí na špatném signálu (např. EDGE v lese).
     - Tlačítko *"Aktualizovat"* v Nastavení: uživatel si aktualizaci spustí vědomě (např. doma na Wi-Fi).
     - Aktualizace provede kompletní refresh assets i dat najednou (jednoduchá a robustní logika, cca jednotky až desítky MB).

4. **Terénní UX, Ergonomie & Navigace:**
    - **OLED Black (`#000000`)** jako výchozí schéma – minimální spotřeba energie na OLED displejích a maximální kontrast v noci.
    - **Výchozí Dashboard:** Úvodní obrazovka s přehlednou mřížkou modulů s velkými ikonami a popiskami pro rychlou orientaci.
    - **Záhlaví modulu (Top Bar):**
      - Vlevo: tlačítko zpět na Dashboard (ikona aktivního modulu).
      - Uprostřed: název aktivního modulu fungující jako dropdown / rychlý přepínač do jiných pomůcek.
      - Vpravo: ikona reference `[ 📖 ]` a **Menu modulu `[ ☰ ]`**:
        - Tlačítko výběru abecedy: `Abeceda: [A-Z + CH]` (u relevantních modulů).
        - Lokální nastavení modulu (custom checkboxy).
        - Tlačítko pro vyčištění modulu `[ 🗑️ Vyčistit modul ]` s dvoufázovým potvrzením.
    - **Žádná riziková spodní gesta / swipy:** Vyhnout se swipování ve spodní hraně displeje kvůli přímé kolizi se systémovými gesty OS (iOS Home Indicator, Android gesta Zpět/Domů).
    - **Thumb-first zadávací ergonomie:** Všechny aktivní zadávací prvky (tlačítka Morseovky, body Brailla, číselníky) jsou umístěny ve spodní polovině displeje pro snadný dosah palcem. Výsledky, dekódovaný text a náhledy jsou v horní části.
    - **Radikální potlačení systémové klávesnice:** Systémová klávesnice je až nejzazší nouzový vstup. Moduly (Morse, Braille, Semafor, Polský kříž, Čísla písmen...) používají výhradně dedikovaná touch tlačítka (`inputmode="none"`), aby klávesnice nezakrývala 50 % displeje.
    - **Haptická odezva:** Volitelná v Nastavení (`navigator.vibrate`), jemná haptika při stisku šifrovacích kláves pro jistotu zadání zkřehlými prsty.

5. **Globální správa abeced (Custom Alphabet Layouts):**
    - **Klíčový princip:** Žádný modul v aplikaci nesmí napevno „hardcodovat“ konkrétní abecedu.
    - **Globální nastavení jako samostatný modul:**
      - Umístěno přímo na úvodním Dashboardu na roveň ostatním modulům (graficky decentně odlišeno např. jemně jiným tónem povrchu).
      - Správa sady písmen: 26 písmen standardní latinky + české CH.
      - Každé písmeno je tlačítko se svítícím indikátorem stavu (kliknutí = aktivace/deaktivace ze sady).
      - Možnost přerovnání pořadí (Drag & Drop / Reorder) – např. pro abecedy začínající heslem.
      - Ukládání vlastních layoutů (uživatel si může vytvořit a pojmenovat layouty a snadno je přepínat).
    - **Všechny relevantní moduly** (Polský kříž, Čísla písmen, Posuny/Caesar, Substituce atd.) nabízejí v kontextovém menu rychlý výběr abecedy.

6. **Perzistence stavu, Vyčištění & Schránka (Developer Tools):**
    - **Trvalá perzistence stavu:** Každý modul si pamatuje svůj stav (vstupy, zvolené parametry, výstupy) v lokálním úložišti (`localStorage`). Při uspání OS, pádu prohlížeče nebo přepnutí modulu se hráč vrátí přesně k tomu, co měl rozepsáno.
    - **Vyčištění modulu:** Jednoznačné tlačítko `[ 🗑️ Vyčistit modul ]` v menu (s dvoufázovým potvrzením), které vrátí aktuální modul do výchozího prázdného stavu pro novou šifru.
    - **One-tap Copy to Clipboard:** Klepnutí na jakýkoliv dekódovaný výsledek automaticky zkopíruje text do systémové schránky (s vizuální zpětnou vazbou).
    - **Poznámka k Developer Tools (Expertní režim):**
      - V Globálním nastavení bude možnost aktivovat experimentální Developer Tools pro power users.
      - Zde mohou být v budoucnu schovány pokročilé funkce: manuální snapshotování stavu, export/import JSON databází, diagnostika Web Workerů a simulace dat. Běžný uživatel tím není zatěžován.

---

## 3. Zápis z interview & Architektonická dohoda

| Oblast | Rozhodnutí | Technická realizace |
|---|---|---|
| **Platforma** | Čisté PWA bez wrapperů | Svelte 5 (Runes), TypeScript, Vite, vanilla CSS |
| **Běh a vlákna** | Oddělení výpočtů od UI | Web Workers pro slovníky, regexy, transpozice |
| **Offline a Verzování** | Opt-in kompletní refresh | `assets-vX.Y.Z` a `data-vX.Y.Z` v CacheStorage + `/version.json` |
| **UX & Vzhled** | OLED Black, Thumb-first | `#000000`, zadávání dole, výstupy nahoře |
| **Navigace** | Dashboard + Top Bar dropdown | Žádné spodní swipování, rychlý přepínač v záhlaví |
| **Modulové menu** | Kontextové menu modulu | Tlačítko `[ ☰ ]`: výběr abecedy, lokální checkboxy, reset |
| **Nastavení** | Samostatný modul aplikace | Globální nastavení na roveň modulů (abecedy, haptika, dev tools) |
| **Klávesnice** | Potlačení systémové klávesnice | Dedikované dotykové panely (`inputmode="none"`) |
| **Abecedy** | Globální konfigurovatelnost | Žádné moduly nehardcodují abecedu; uživatelské custom layouty |
| **Perzistence** | Auto-save stavu + bezpečný reset | `localStorage`, reset s dvoufázovým potvrzením |

## 4. Globální UI/UX Architektura & Design System

Aby celá sada 14 pomůcek nepůsobila jako nesourodý slepenec obrazovek, ale jako kompaktní, předvídatelný a profesionální terénní nástroj, musí se každý modul striktně řídit následujícími designovými pravidly:

### 4.1 Zásada nulového scrollování (Zero-Scroll Policy & Viewport Lock)

Aplikace je navržena jako striktně fullscreenový terénní nástroj:
- **Zámek těla stránky:**
  ```css
  html, body {
    height: 100%;
    overflow: hidden;
    overscroll-behavior: none;
    touch-action: manipulation;
  }
  ```
- **Výška aplikace svázána s `100dvh`** (s fallbackem na `100vh`).
- **Absolutní zákaz nechtěného scrollování:** Rámec aplikace, záhlaví, ovládací prvky a keypad se na obrazovce **nesmí pohnout ani o jediný pixel** v žádné ose (žádné pull-to-refresh skákání, žádné overscroll gumování).
- **Scrollování je povoleno VÝHRADNĚ uvnitř konkrétního vnitřního subpanelu** (`overflow-y: auto; overscroll-behavior: contain;`), kde je to z povahy dat nezbytné (výsledky vyhledávání ve slovníku, seznam 25 posunů Caesara, rejstřík svátků, články v sekci Fakta).
- Zadávací a interaktivní moduly (Morseovka, Braille, Semafor, Vlajky, Kříže, Soustavy, Rotační mřížka) **nescrollují nikdy a nikde** – celé jejich UI se musí vejít na 1 obrazovku.

---

### 4.2 Anatomie obrazovky a prostorový rozpočet (Spatial Budget 100dvh)

Rozhraní každého modulu má striktní vertikální rozdělení do 3 zón s ohledem na ergonomii ovládání jednou rukou v terénu:

```
┌─────────────────────────────────────────────────────────┐
│ 1. HEADER BAR (fixní výška 52px)                        │
│ [ 🚩 Ikona modulu ]  [ Název modulu / submodulu ▾ ] [ 📖 ] [ ☰ ] │
├─────────────────────────────────────────────────────────┤
│ 2. OUTPUT & STATE ZONE (horní polovina, flex-grow)      │
│ - Textarea s dekódovaným textem (monospace, velký font) │
│ - Vizuální stav (náhled kříže, mřížky, vlajky, rotace)  │
│ - Live varianty & Markov indikátory                     │
│ - Klepnutí na výsledek = One-tap Copy do schránky       │
├─────────────────────────────────────────────────────────┤
│ 3. INPUT & KEYPAD ZONE (spodní polovina, dosah palce)   │
│ - Dedikovaný dotykový keypad (Morse, Braille, Numpad...)│
│ - Velké dotykové terče (min 48×48px, typicky 64–80px)   │
│ - Sekundární řádek: [ 🗑️ Reset ] [ ␣ Mezera ] [ ⌫ Smazat ]│
└─────────────────────────────────────────────────────────┘
```

1. **Header Bar (Záhlaví) [Fixní výška 52px, z-index 100]:**
   - **Eliminace tlačítka „Domů“:** Domovská obrazovka je pouze rozcestník do modulů. Tlačítko „Domů“ proto zcela odpadá.
   - **Vlevo: `[ 🚩 Ikona modulu ]` (Tap target 48×48px):**
     - Zobrazuje ikonu právě aktivního modulu (např. vlajka, morseův klíč, mřížka, kalendář).
     - **Klepnutí na ikonu otevře celoobrazovkový launcher grid všech 14 modulů** (stejný jako na úvodní obrazovce) pro bleskový skok do jakéhokoliv nástroje.
   - **Střed: `[ Název modulu / submodulu ▾ ]`:**
     - Zobrazuje aktuální název pomůcky.
     - Klepnutím rozbalí selektor submodulů (např. u Posunů: *Caesar* $\leftrightarrow$ *Vigenère* $\leftrightarrow$ *Atbaš* $\leftrightarrow$ *Autokey*; u Křížů: *Velký polský kříž* $\leftrightarrow$ *Pigpen* $\leftrightarrow$ *Maltézský*).
     - Díky eliminaci tlačítka „Domů“ má středový název k dispozici **plných ~210 px** i na nejužších displejích (360 px), takže nedochází k ořezávání názvů.
   - **Vpravo:**
     - Tlačítko `[ 📖 Reference ]` (48×48px) – přímý přístup k taháku daného modulu (modal s tabulkou / schématem).
     - Tlačítko `[ ☰ Menu ]` (48×48px) – otevírá kontextové menu modulu (výběr abecedy, lokální checkboxy, vyčištění modulu).

2. **Output & State Zone (Horní polovina – flex-grow):**
   - Vyhrazena pro zobrazení výsledků, stavu a dekódovaného textu.
   - Písmo: Monospace, minimálně 18px, vysoce kontrastní OLED bílá.
   - **One-tap Copy:** Jakékoliv klepnutí na výsledné pole zkopíruje obsah do schránky (s haptickým a vizuálním potvrzením).

3. **Input & Keypad Zone (Spodní polovina – v dosahu palce):**
   - Kotvena k dolnímu okraji obrazovky (s respektováním `env(safe-area-inset-bottom)` pro iPhone Home Indicator).
   - Výhradně dedikované dotykové plochy – **systémová softwarová klávesnice je ve výchozím stavu potlačena (`inputmode="none"`)**.
   - **Sjednocený sekundární akční pás tlačítek (společný pro všechny moduly):**
     - `[ ⌫ Backspace ]` – krátký stisk = smazání 1 znaku; dlouhý stisk (>400 ms) = plynulé zrychlující se mazání celého vstupu.
     - `[ ␣ Mezera ]` – vložení mezery mezi slova/znaky.
     - `[ ↵ Enter ]` – potvrzení hodnoty (u modulů, kde se zadává sekvence čísel do Enteru).

---

### 4.3 Design Tokens & Vizuální systém (OLED Dark Mode)

Vizuální styl je navržen pro noční les, déšť a svícení čelovkou s nulovým plýtváním energií:

| Token | Hodnota | Využití |
|---|---|---|
| `--color-bg-canvas` | `#000000` | 100% OLED černá, nulový odběr displeje |
| `--color-surface-1` | `#121214` | Těla keypadů, zadávací panely, karty |
| `--color-surface-2` | `#1e1e24` | Zvýrazněná tlačítka, modaly, flyout panel |
| `--color-surface-active` | `#2e2e38` | Stisknutý stav klávesy (active feedback) |
| `--color-border-subtle` | `#2a2a34` | 1px dělicí linky a rámečky |
| `--color-text-primary` | `#FFFFFF` | Dekódovaný text, hodnoty tlačítek (100% kontrast) |
| `--color-text-secondary` | `#8E8E9A` | Popisky, nápovědy, neaktivní prvky |
| `--color-accent-primary` | `#00D2FF` | Neonová azurová: aktivní body Brailla, vybraná barva, fokus |
| `--color-accent-success` | `#10B981` | Smaragdová zelená: Markov tajenkovitost, potvrzení kopírování |
| `--color-accent-danger` | `#EF4444` | Výstražná červená: reset, smazání, neznámý/chybný znak |
| `--color-accent-warning` | `#F59E0B` | Jantarová: varování, kolizní pole v mřížce |

#### Typografie:
- **Proporcionální písmo:** `system-ui, -apple-system, sans-serif` (nulová síťová závislost na webfontech, bleskový render).
- **Monospace písmo:** `ui-monospace, "SF Mono", "Roboto Mono", monospace` (pro veškeré šifry, kódy, souřadnice).
- **Minimální rozměr dotykového cíle (Tap Target):** **48 × 48 px** (doporučení Apple HIG & Material Design pro venkovní použití / v rukavicích).

---

### 4.4 Standardizované interakční vzory (Interaction Contracts)

1. **Okamžitá reaktivita (Zero-latency reactive computation):**
   - Žádná tlačítka *"Spočítat"*, *"Odeslat"* ani prodlevy.
   - Výstup se přepočítává synchronně při každém tapnutí na klávesu.
   - Náročné operace (slovníkový regex, Tesseract OCR) běží v background Web Workeru a emitují průběžné výsledky.

2. **One-tap Copy mikrointerakce:**
   - Klepnutí na textarea nebo řádek s výsledkem:
     1. Text se okamžitě zkopíruje do `navigator.clipboard`.
     2. Rámeček pole na 350 ms zeleně zapulzuje (`--color-accent-success`).
     3. Dole vyjede decentní jednořádkový toast: *"✓ Zkopírováno do schránky"*.
     4. Vyvolá se krátký haptický puls (40 ms).

3. **Haptický kontrakt (`navigator.vibrate`):**
   - *Stisk klávesy:* 25 ms jemné klepnutí.
   - *Vložení znaku / mezery:* 35 ms.
   - *Zkopírování do schránky:* 50 ms.
   - *Chyba / kolize / neplatný kód:* 2 pulsy (40 ms – pauza 40 ms – 40 ms).
   - Haptiku lze kdykoliv globálně vypnout v Nastavení.

4. **Prevence chyb & Graceful fallback:**
   - Aplikace nikdy nesmí spadnout nebo vypsat bílou obrazovku při neplatném vstupu.
   - Neznámý nebo nevalidní symbol (např. nepřiřazená sekvence v Morseovce) je zobrazen jako červený zástupný znak `?` s možností klepnutí pro zobrazení původního chybného kódu.

---

### 4.5 Kontextové menu modulu (Menu Standard)

Klepnutí na ikonu `[ ☰ ]` v záhlaví otevře kontextové menu modulu (graficky realizované jako čistý celoobrazovkový overlay nebo boční panel dle finálního designu). Menu je dedikováno výhradně nastavením a stavu aktuálního nástroje (globální volby jsou vyčleněny do samostatného modulu *Globální nastavení*):

```
┌───────────────────────────────────────┐
│ MENU MODULU                           │
├───────────────────────────────────────┤
│ [ Abeceda: Česká (27 znaků s CH) ▾ ]  │
├───────────────────────────────────────┤
│ LOKÁLNÍ VOLBY (CUSTOM CHECKBOXY):     │
│ [x] Morseovka bez mezer               │
│ [ ] Zobrazit česká pomocná slova      │
├───────────────────────────────────────┤
│ RYCHLÉ AKCE:                          │
│ [ 📋 Vložit ze schránky ]             │
│ [ 🗑️ Vyčistit modul ]                 │
└───────────────────────────────────────┘
```

1. **Výběr abecedy (u modulů závislých na abecedě):**
   - Dominantní tlačítko s aktuálním názvem: `[ Abeceda: Česká (27) ▾ ]`.
   - Klepnutím otevře rychlou volbu mezi výchozími abecedami (26 Latin, 27 s CH) a uživatelsky vytvořenými custom abecedami (definovanými v modulu Globální nastavení).
2. **Lokální volby modulu (Custom checkboxy):**
   - Vizuálně vyladěné přepínače pro specifické režimy daného nástroje (např. u Morseovky *„Bez mezer“*, u Substituce *„Povolit homofony 1:N“*, u Kalendáře *„Slovenské svátky“*, u Vlajek *„Řadit abecedně“*).
3. **Akce se schránkou:**
   - Tlačítko `[ 📋 Vložit ze schránky ]` (`navigator.clipboard.readText()`) pro okamžité naplnění vstupu bez zdlouhavého boje s mobilní lupou a systémovým kurzorem.
4. **Bezpečné vyčištění modulu:**
   - Tlačítko `[ 🗑️ Vyčistit modul ]` vrátí rozepsaný text a vstupy modulu do čistého výchozího stavu pro novou šifru.
   - **Bezpečnostní pojistka:** Dvoufázové potvrzení – první klik změní tlačítko na výstražné červené s nápisem *„Opravdu vymazat?“* na 3 sekundy. Teprve druhý stisk provede reset. Vše je navíc jištěno krátkým toastem *„Modul vyčištěn – [Vrátit zpět]“* pro případ omylu.

---

### 4.6 Geodetický pomocník & GPS kalkulátor (Podpora terénních přesunů)

Řešením šifry je velmi často poloha dalšího stanoviště – ať už v podobě GPS souřadnic, azimutu a vzdálenosti, nebo popisu cesty. Pro zamezení chyb při nočním zadávání souřadnic do mapy obsahuje aplikace integrovaný lehký geodetický konvertor:

1. **Obousměrný převodník formátů WGS-84:**
   - **DMS (Stupně, minuty, vteřiny):** `49° 12' 20.7" N, 16° 34' 34.0" E`
   - **DM (Stupně a desetinné minuty):** `49° 12.345' N, 16° 34.567' E` (standard geocachingu a šifrovaček)
   - **DD (Desetinné stupně):** `49.20575, 16.57612`
   - Zadání v libovolném formátu okamžitě přepočítá ostatní.
2. **Projekce bodu (Azimut + Vzdálenost):**
   - Vstup: Výchozí souřadnice + Azimut (0–360°) + Vzdálenost (v metrech).
   - Výpočet: Sférická trigonometrie (Vincenty / Haversine) $\to$ cílové souřadnice nového stanoviště.
3. **Výpočet vzdálenosti a azimutu mezi 2 body:**
   - Vstup: Bod A a Bod B $\to$ přesná vzdálenost (m) a počáteční azimut (°).
4. **Offline Export do mapových aplikací:**
   - Tlačítko `[ 🗺️ Otevřít v Mapy.cz ]` generuje offline URI:
     - `geo:49.20575,16.57612?q=Stanoviste` (nativní intent na Androidu)
     - `https://mapy.cz/turisticka?x=16.57612&y=49.20575&z=17` (fallback / web)

---

### 4.7 Navigační model, Hash Routing & Řízený History Stack

Pro bezproblémové chování na mobilních zařízeních v režimu PWA i v běžném prohlížeči aplikace využívá **Hash routing** s přísně normalizovanou historií:

1. **Struktura URL hashů:**
   - `#/` – Hlavní Dashboard (grid všech modulů + Nastavení)
   - `#/<modul>` – Otevřený modul (např. `#/morse`, `#/braille`, `#/settings`)
   - `#/<modul>/menu` – Otevřené kontextové menu daného modulu
   - `#/<modul>/ref` – Otevřený referenční tahák daného modulu
2. **Řízený stack historie (Pravidlo maximální hloubky 3):**
   - V historii prohlížeče je **vždy striktně lineární sekvence**:  
     `Dash > Modul > Nastavení/Modal`
   - **Přepínání mezi moduly:** Pokud je hráč v `#/morse` a přes záhlaví přepne na `#/braille`, navigační engine použije `history.replaceState`. Tím se zabrání zacyklení a vzniku nekonečné historie (`Dash > Morse > Braille > Kříž > Caesar...`). V historii zůstane vždy pouze `Dash > Braille`.
   - **Otevření menu / reference:** Použije `history.pushState` s hashem `#/braille/menu`.
3. **Chování systémového tlačítka / gesta ZPĚT (Hardware Back na Androidu):**
   - **Krok 1 (Z menu/modalu):** Stisk Zpět zavře menu a vrátí hráče na čistý modul (`#/braille`).
   - **Krok 2 (Z modulu):** Stisk Zpět vrátí hráče na hlavní Dashboard (`#/`).
   - **Krok 3 (Z Dashboardu):** Stisk Zpět vyvolá systémové opuštění PWA aplikace (ošetřeno dialogem / potvrzením *"Opravdu opustit aplikaci?"*, aby hráč v zápalu hry nechtěně nezavřel okno).

---

## 5. Sdílený motor tajenkovitosti (Markov Chains z databáze řešení)

V souboru `data/solutions.json` máme 2500+ reálných tajenek z českých šifrovaček (typická syntax šifrovacích hesel: bez diakritiky, bez mezer, instrukce jako *"JDETENAROZCESTI"*, názvy měst, objektů, kót atd.).

### 5.1 Princip fungování jazykového modelu
- **Trénování n-gramového modelu (bigramy / trigramy):**
  - Offline předpočítaná matice přechodů písmen (log-probabilities) sestavená z `data/solutions.json` zkombinovaná s frekvenčním korpusem češtiny.
  - Velikost modelu je zanedbatelná (< 100 KB v JSON / ArrayBufferu), startuje okamžitě.
- **Využití napříč moduly:**
  - **Caesar / posuny:** Místo nutnosti číst všech 25 posunů model automaticky zeleně zvýrazní 1–2 nejpravděpodobnější varianty odpovídající přirozené češtině / stylu tajenek.
  - **Morseovka / permutace symbolů:** Ohodnocení permutací (tečka $\leftrightarrow$ čárka $\leftrightarrow$ lomítko) a čtení pozpátku.
  - **Morseovka bez mezer:** Prořezávání stavového prostoru (beam search / pruning) a seřazení kandidátů podle pravděpodobnosti.

---

## 6. Přehled a seznam modulů (14 modulů)

| Skupina | Číslo & Název modulu | Hlavní funkce & Zvláštnosti |
|---|---|---|
| **A: Kódy & Abecedy** | **Modul 01: Morseovka** | 3 velká tlačítka `. - /`, Markov tajenkovitost, bez mezer |
| | **Modul 02: Braillovo písmo** | 2×3 matice, rub papíru ve flyoutu, vysoký kontrast |
| | **Modul 03: Semaforová abeceda** | 8 zón do kruhu (tap i drag/swipe), kanonický pohled |
| | **Modul 04: Vlajková abeceda** | Barevný fasetový rychlofiltr (dimmed efekt), NATO kód |
| | **Modul 05: Šifrovací tabulky & Kříže** | Velký polský kříž + pigpen/maltézský, 3 sloupce Ř-S-P |
| | **Modul 06: Čísla písmen & Soustavy** | Numpad dle soustavy (2–16), zadávání do Enteru, custom abeceda |
| **B: Krypto-analýza** | **Modul 07: Posuny a aditivní šifry** | Caesar s Markov heatmapou (červená $\to$ zelená), Vigenère, Atbaš |
| | **Modul 08: Monoalfabetická substituce** | Interaktivní matice `A → ?`, 1:1 bijekce, živý převod textu |
| | **Modul 09: Frekvenční analýza & OCR** | Četnosti písmen a bigramů + Tesseract WASM offline skenování |
| | **Modul 13: Rotační šifrovací mřížka** | Fleissnerova mřížka, validace výřezů, 4 rotace po 90° |
| **C: Slovníky & Fakta** | **Modul 10: Databáze slov & Anagramy** | Regex by default, vícevrstvý include/exclude, Web Worker |
| | **Modul 11: Kalendář & Svátky** | 12 tlačítek měsíců, dny v roce, svátky ČR/SR, fáze Měsíce |
| | **Modul 12: Fakta & Reference** | Periodická tabulka, škály Mohs/Beaufort, rezistory, značky |
| | **Modul 14: Barvy & Barevné modely** | Rozklad fotky na kanály (RGB/CMYK/HSV), kapátko, míchání |

---

## 7. Detailní specifikace modulů

### Modul 01: Morseovka

#### 1. Rozložení a ergonomie
- **Horní zóna (Zobrazení a výstupy):**
  - **Zadávací pole (Textarea):** Zobrazuje zadaný kód (tečky, čárky, lomítka). Umožňuje i ruční úpravu nebo vložení ze schránky (pokud někdo zkopíruje kód odjinud).
  - **Primární výsledek (Dekódovaný text):** Zobrazen velkým čitelným písmem. Klepnutí na výsledek = zkopírování do schránky (s haptickým potvrzením a toastem).
  - **Tlačítko „Varianty & Permutace“:** Defaultně skryto, aby neplýtvalo místem. Po rozkliknutí zobrazí panel s permutacemi 3 symbolů ($3! = 6$ kombinací: tečka, čárka, oddělovač) + inverzní čtení pozpátku. Varianty jsou ohodnoceny Markovovým modelem (potenciální čeština zvýrazněna zeleně).
- **Spodní zóna (Thumb Keypad):**
  - Tři velká dominantní tlačítka v řadě ve spodní části displeje:
    1. **`.` (Tečka)**
    2. **`-` (Čárka)**
    3. **`/` (Oddělovač písmen)**
  - Pravidlo pro slova: Dvě rychlá klepnutí na `/` za sebou vloží mezeru mezi slova (zápis `//`).
  - Doplňková tlačítka nad hlavní trojicí:
    - `⌫` (Backspace – smaže poslední symbol; podržení = rychlé smazání).
    - `↵` (Enter – potvrzení pro vložení odřádkování nebo spuštění automatického řešitele).
- **Záhlaví a navigace:**
  - Vlevo: Zpět na Dashboard.
  - Uprostřed: Dropdown přepínač modulů.
  - Vpravo (přímo v záhlaví): **Ikona „Kniha / Reference“** (přímý přístup k nápovědě bez schovávání do menu) $\to$ otevře modal s Morseovým binárním stromem, přehlednou tabulkou písmen, čísel a českých pomocných slov (Akát, Blýskavice, Cílovník...).
  - Vpravo (kraj): **Menu modulu `[ ☰ ]`:**
    - `[ ] Zobrazit česká pomocná slova`
    - `[ 📋 Vložit ze schránky ]`
    - `[ 🗑️ Vyčistit modul ]` (s dvoufázovým potvrzením)

#### 2. Speciální režimy & Algoritmy
- **Automatické vyhodnocení Morseovky bez oddělovačů (Brute-force na Enter):**
  - Žádný speciální režim ani přepínač v menu – rozhraní zůstává čisté.
  - **Spouštěč:** Pokud uživatel zadá sekvenci obsahující **pouze tečky a čárky (bez lomítek)** o délce **7+ znaků** a stiskne `↵ Enter` (nebo v textarey odřádkuje).
  - Algoritmus: Prohledávání stavového prostoru do hloubky s ořezáváním přes Markovovský model tajenek a slovníkovou Trie.
  - Výstup: Panel možných smysluplných rozpadů na slova seřazených od nejvyššího skóre po nejnižší (s barevným indikátorem tajenkovitosti).
### Modul 02: Braillovo písmo

#### 1. Rozložení a ergonomie
- **Horní zóna (Zobrazení a výstupy):**
  - **Textarea dekódovaného textu:** Zobrazuje postupně dekódovaná písmena, klepnutí = kopírovat do schránky.
  - Vizuální náhled právě zadávaného znaku (dynamický náhled písmene odpovídajícího aktuálně nastaveným bodům).
- **Spodní zóna (Thumb Keypad – dosah palce):**
  - **Matice 2×3 bodů:** Velké kruhové přepínače (tlačítka 1, 2, 3 vlevo; 4, 5, 6 vpravo). Každý bod má jasný aktivní/neaktivní stav s vysokým kontrastem (svítící OLED bílá/azurová vs. tmavý obrys).
  - **Spodní akční řádek přímo pod maticí:**
    - `Potvrdit / Vložit znak` (velké centrální tlačítko).
    - `␣` (Mezera).
    - `⌫` (Backspace – smaže poslední znak; podržení = rychlé smazání).
- **Menu modulu `[ ☰ ]`:**
  - Alternativní interpretace (custom checkboxy):
    - `[ ] Inverze bodů`
    - `[ ] Zrcadlení / rub`
    - `[ ] Otočení o 180°`
  - `[ 🗑️ Vyčistit modul ]` (s dvoufázovým potvrzením)
- **Reference (Top bar):**
  - Kompletní přehled 6bodového Brailla (abeceda, diakritika, čísla s prefixem).

---

### Modul 03: Semaforová abeceda

#### 1. Rozložení a ergonomie
- **Kanonická orientace:** Šifry se na hrách standardně přepisují ze zadání na papíře, orientace je vždy kanonická (pohled na obrázek).
- **Zadávací kruh (Dole):**
  - Kruh s 8 velkými zónami ($0^\circ, 45^\circ, 90^\circ, 135^\circ, 180^\circ, 225^\circ, 270^\circ, 315^\circ$).
  - **Dva způsoby zadání (Tap i Drag):**
    1. *Dvě klepnutí:* Hráč klepne na 1. směr a následně na 2. směr.
    2. *Přejetí prstem (Swipe/Drag):* Hráč položí palec na 1. směr a plynule přejede do 2. směru.
  - Znak se po zadání obou ramen ihned potvrdí a vloží do textu.
  - Rychlá tlačítka `␣` (Mezera) a `⌫` (Backspace) po stranách kruhu.
- **Horní zóna:**
  - Textarea s dekódovaným textem (klepnutí = kopírovat do schránky).
  - Vizuální náhled postavičky/praporků právě zadaného písmene.
- **Reference (Top bar):**
  - Kruhový diagram semaforových poloh a přehledná tabulka písmen a číslic.

---

### Modul 04: Vlajková abeceda (Barevný rychlofiltr)

#### 1. Princip fungování & Ergonomie
- Odstraněno nespolehlivé kreslení do canvasu.
- Šifry s vlajkami téměř vždy pracují s barvami $\to$ **fasetový barevný filtr**.
- **Hlavní plocha (Seznam vlajek):**
  - Mřížka všech 26 mezinárodních námořních vlajek (A–Z) s jejich písmeny.
  - **Interaktivní stavy:**
    - Všechny vlajky jsou defaultně plnobarevné.
    - Po stisku barevného filtru zůstanou barevné **pouze ty vlajky, které obsahují zvolené barvy**; nerelevantní vlajky **zešednou (grayscale / dimmed)**.
    - Klepnutí na aktivní (barevnou) vlajku vloží její písmeno do výsledné textarey.
- **Spodní ovládací lišta:**
  - Pás tlačítek 5 základních vlajkových barev: **Bílá, Černá, Červená, Modrá, Žlutá**.
  - Za poslední barvou tlačítko **✕ (Reset filtru barev)**.
  - Tlačítka `␣` (Mezera) a `⌫` (Backspace).
- **Horní zóna:**
  - Textarea s dekódovaným textem (klepnutí = kopírovat).
- **Reference (Top bar):**
  - Přehled všech vlajek včetně NATO fonetických kódů (Alpha, Bravo, Charlie...), námořních významů a číslicových praporků (0–9).

---

### Modul 05: Šifrovací tabulky & Polský kříž

#### 1. Rozložení a interakce
- **Vizuální interaktivní kříž / mřížka (Střed):**
  - Zobrazuje vizuální rozložení kříže/mřížky s vepsanými písmeny.
  - Písmena a rozložení automaticky respektují **aktivní globální abecedu** (např. standardní 26 znaků, česká s CH na 27 pozic, nebo custom layout s heslem).
  - **Možnost přepínat typ kříže / mřížky:**
    - *Velký polský kříž (3×3×3)* – výchozí.
    - *Malý polský kříž (2×2 / 3×3)*.
    - *Zednářský / Pigpen kříž* (mřížky `#` a kříže `X`).
    - *Maltézský kříž*.
  - **Přímé klikání do kříže:** Hráč může kdykoliv klepnout přímo na kterékoliv písmeno uvnitř kříže $\to$ okamžitý zápis znaku do tajenky.
- **Souřadnicové zadávání (Dole – 3 sloupce tlačítek 1, 2, 3):**
  - Odstraňuje zmatky se sekvenčním psaním (hráč nemusí přemýšlet, které číslo bylo řádek a které sloupec).
  - Tři jasně oddělené sloupce tlačítek:
    - Sloupec **Ř (Řádek):** tlačítka `1`, `2`, `3`.
    - Sloupec **S (Sloupec):** tlačítka `1`, `2`, `3`.
    - Sloupec **P (Pozice / tečka v poli):** tlačítka `1`, `2`, `3`.
  - Po zvolení všech tří složek se znak okamžitě zapíše do tajenky.
  - Pod sloupci: tlačítka `␣` (Mezera) a `⌫` (Backspace).
- **Horní zóna:**
  - Textarea s dekódovaným textem (klepnutí = kopírovat do schránky).
  - Drobný textový náhled naposledy zadaných souřadnic (např. `Ř2 S1 P3 = D`).
- **Menu modulu `[ ☰ ]`:**
  - Tlačítko `[ Abeceda: Česká 27 ▾ ]` pro výběr abecedy.
  - `[ 🗑️ Vyčistit modul ]` (s dvoufázovým potvrzením).

---

### Modul 06: Čísla písmen & Poziční soustavy

#### 1. Princip fungování a zadávací model
- **Zadávání po znacích s potvrzením Enterem:**
  - Hráč zadává hodnotu čísla až do stisku klávesy `↵ Enter`.
  - Po stisku Enter se číslo okamžitě namapuje na písmeno podle **aktuální globální abecedy** a vloží do textarey.
  - Žádné zbytečné paralelní vyhodnocování desítek variant – abeceda i soustava jsou explicitně pod kontrolou hráče.
- **Spodní zóna (Touch Keypad):**
  - Velký dedikovaný keypad, jehož aktivní klávesy se dynamicky přizpůsobují zvolené soustavě (např. u binární soustavy jsou vidět jen velká tlačítka `0` a `1`).
  - **Výběr soustavy (nad keypadem):**
    - **Rychlé volby nejčastějších soustav (první řada):**
      - `BIN (2)` – 0, 1
      - `TER (3)` – 0, 1, 2
      - `OCT (8)` – 0–7
      - `DEC (10)` – 0–9
      - `HEX (16)` – 0–9, A–F
    - **Plný výběr soustav (picker 2–16):** Pod rychlými volbami možnost nastavit libovolnou bázi od 2 do 16.
  - **Spodní akční klávesy:**
    - `↵ Enter` – dominantní velké tlačítko pro převod zadaného čísla na písmeno.
    - `␣` – vložení mezery mezi slova v textarey.
    - `⌫` – Backspace (smaže rozepsanou číslici; pokud je vstup prázdný, smaže poslední písmeno z textarey).
- **Horní zóna:**
  - Textarea s dekódovaným textem (klepnutí = kopírovat do schránky).
  - Vstupní řádek aktuálně vyťukávaného čísla v dané soustavě.
- **Globální provázanost:**
  - Písmena odpovídají nastavenému layoutu v Globálním nastavení abecedy (standardně 1=A, 2=B... nebo 0-indexed dle preferencí).

---

### Modul 07: Posuny a aditivní šifry

Využívá breadcrumb v záhlaví pro přepínání podmodulů: `[ Posuny ▾ ] > [ Caesar ▾ ]`. Všechny posuny striktně respektují aktivní **Globální abecedu** (např. délka 26, 27 s CH, nebo custom layout).

#### 1. Submodul: Caesar (Posun o konstantu)
- **Vstupní zóna:** Textarea pro šifrový text (vložení ze schránky nebo systémová klávesnice).
- **Výstupní zóna (Všech $N-1$ posunů):**
  - Přehledný vertikální seznam všech možných posunů (1–25, resp. 1–26).
  - **Markov Heatmap (Barevné podbarvení tajenkovitosti):**
    - Každý řádek má barevný indikátor / podbarvení na škále od **červené** (nepravděpodobná hatmatilka), přes **oranžovou / žlutou** až po **sytě zelenou** (vysoká shoda s českou syntaxí tajenek).
    - Hráč nemusí číst 25 řádků textu, pohledem ihned sjede k zelenému řádku.
  - **Klepnutí na řádek:** Okamžité zkopírování daného posunu do schránky (s haptickou a vizuální odezvou).

#### 2. Submodul: Vigenère (Posun o heslo)
- **Vstup:**
  - Textarea pro text šifry.
  - Vstupní pole pro **Heslo**.
  - Přepínač: `Dešifrovat` / `Šifrovat`.
- **Výstup:** Textarea s dekódovaným textem (one-tap copy).

#### 3. Submodul: Atbaš (Reverzní abeceda)
- Převod první $\leftrightarrow$ poslední písmeno abecedy ($A \leftrightarrow Z, B \leftrightarrow Y\dots$) v reálném čase.

#### 4. Submodul: Autokey (Posun textu sám o sobě)
- Vstup: Text šifry + iniciální heslo / znak klíče.
- Dešifrování posunem o proud šifrového textu (ciphertext autokey).

---

### Modul 08: Monoalfabetická substituce

Určeno pro luštění šifer, kde je každé písmeno abecedy zaměněno za jiné unikátní písmeno.

#### 1. Rozvržení a interakce
- **Interaktivní substituční plocha (Horní/Střední část):**
  - Všechna písmena aktivní globální abecedy vypsána jako tlačítka ve formátu:  
    `A → ?`  `B → ?`  `C → ?`  `D → ?` ...
  - **Přiřazení znaku (Overlay):**
    - Klepnutí na kterékoliv tlačítko (např. `A → ?`) otevře rychlý overlay s nabídkou písmen.
    - Písmena, která již byla přiřazena k jinému znaku, jsou v overlayi **zašedlá a neaktivní** (vynucená bijekce 1:1).
    - V overlayi je tlačítko `✕ Smazat asociaci` pro vyčištění přiřazení.
  - **Nastavení modulu (Flyout):**
    - Možnost vypnout vynucenou unikátnost (povolit přiřazení stejného písmene více znakům pro homofonní šifry).
- **Textová pole:**
  - **Ciphertext (Zadání):** Textarea pro zašifrovaný text (vložení ze schránky nebo z OCR).
  - **Plaintext (Výsledek):** Textarea s živým náhledem dešifrovaného textu:
    - Písmena, která již mají přiřazení, svítí jasnou barvou.
    - Písmena bez přiřazení jsou zobrazena jako šedá s tečkou nebo původní znaky, aby bylo hned vidět, co ještě zbývá rozluštit.
    - Klepnutí na výsledek = zkopírování do schránky.
- **Menu modulu `[ ☰ ]`:**
  - Tlačítko `[ Abeceda: Česká 27 ▾ ]`.
  - Lokální volby: `[ ] Povolit homofony 1:N (vypnout 1:1 bijekci)`.
  - `[ 📋 Vložit ze schránky ]`.
  - `[ 🗑️ Vyčistit substituci ]` (s dvoufázovým potvrzením).

---

### Modul 09: Frekvenční analýza & Terénní OCR

Kombinuje statistickou analýzu textu s možností bleskového digitalizování šifry z terénu.

#### 1. Submodul: Frekvenční analýza
- **Vstup:** Textarea pro zašifrovaný text.
- **Statistika četností:**
  - Graf / tabulka relativních četností jednotlivých písmen v textu seřazená od nejčastějšího po nejméně časté.
  - Vizuální srovnání s referenčním korpusem češtiny (typický profil E, A, O, T, N, I, S, R...).
  - Analýza bigramů (nejčastější dvojice písmen v zadaném textu).
- **Akce:** Tlačítko *"Přenést do Substituce"* (předvyplní text přímo do Modulu 08).

#### 2. Submodul: Terénní OCR (Tesseract.js WASM)
- **Cíl:** Konec zdlouhavého a chybového přepisování dlouhých šifrových textů v zimě na koleni.
- **Implementace:**
  - Plně offline běh přes **Tesseract.js compiled to WebAssembly**.
  - Jazyková data: model pro češtinu (`ces`) a angličtinu (`eng`) uložené v CacheStorage.
  - Vstup: vyfocení textu fotoaparátem zařízení nebo výběr souboru/screenshotu.
  - **Předzpracování obrazu (Image pre-processing):**
    - Automatické zvýšení kontrastu, adaptivní prahování (binarizace černá/bílá) optimalizované pro text osvícený kuželem čelovky v noci.
  - **Výstup rozpoznání:**
    - Náhled rozpoznaného textu s možností rychlé korekce chyb.
---

### Modul 10: Databáze slov & Anagramy

Veškeré prohledávání běží v pozadí přes **Web Worker**, aby UI vlákno nikdy nezamrzalo ani při prohledávání 250k+ slov.

#### 1. Submodul: Hledání ve slovníku (Vícevrstvý filtr & Regex by default)
- **Zadávací filosofie:**
  - **Regex funguje by default:** Tečka `.` znamená libovolný znak (např. `k..k.a` přirozeně najde slova jako *kočka*, *kavka* atd.).
  - **Case-insensitive:** Všechny dotazy i data se vyhodnocují bez ohledu na velikost písmen.
  - **Jediný globální přepínač:** `[ S diakritikou ]` / `[ Bez diakritiky ]`.
- **Vícevrstvé filtrování (Multi-layer include / exclude):**
  - Místo psaní složitých regulárních výrazů si hráč může přidávat jednotlivé řádky podmínek tlačítkem `+ Přidat podmínku`:
    - Řádek typu **Obsahuje vzor (Include):** např. `^p.*ka$`
    - Řádek typu **Neobsahuje (Exclude písmena):** např. `[eor]`
    - Řádek typu **Délka slova:** např. `= 6` nebo `5–8`
  - Všechny podmínky se kombinují logickým AND.
- **Datové zdroje & Řazení:**
  - Primární korpus: podstatná jména s frekvencemi z ČNK (z MySQL VPS).
  - Výsledky se řadí **podle frekvence výskytu v češtině** (nejběžnější slova nahoře).

#### 2. Submodul: Anagramy (Přesmyčky)
- **Vstup:** Řada písmen (např. `kosa`).
- **Implementace:** Předpočítaný hash index v IndexedDB (setříděné znaky jako klíč $\to$ lookup proběhne v čase $O(1)$).
- **Výstup:**
  - Seznam platných českých slov složených ze zadaných písmen, opět seřazených dle frekvence.
  - Možnost přepnout: *Pouze přesná délka (plný anagram)* vs. *I kratší pod-slova (sub-anagrams)*.

---

### Modul 11: Kalendář & Svátky

Specializovaný modul čistě pro časové a kalendářní úlohy, optimalizovaný pro rychlé ovládání v terénu.

#### 1. Funkce a navigace
- **Rychlá volba měsíců (Eliminace zdlouhavého klikání u Potočka):**
  - Místo šipek má hráč k dispozici **pás 12 přímých tlačítek (Led ... Pro)** $\to$ skok z ledna na červenec zabere 1 klepnutí.
  - Přepínání roků: rychlé šipky `◄` / `►` nebo přímé vepsání roku.
- **Vizuální matice měsíce:**
  - Klepnutím na konkrétní den se zobrazí:
    - Kdo má v daný den svátek (český i slovenský kalendář).
    - **Kolikátý je to den v roce (1–365/366)**.
    - Číslo týdne a den v týdnu (1–7).
- **Fuzzy vyhledávání podle jména:**
  - Vyhledávací pole s preferencí prefix-matchingu.
  - Začnu psát např. *"Mart..."* $\to$ okamžitě vrátí datum svátku (11. 11.), den v roce a den v týdnu.
- **Abecední referenční seznam jmen:**
  - Kompletní abecedně řazený jmenný rejstřík všech svátků pro rychlé listování.
- **Měsíční fáze:**
  - Zobrazení přesných dat pro **Nov** (novoluní 🌑) a **Úplněk** 🌕 pro daný měsíc a rok (častý prvek nočních her typu TMOU).
- **Kalkulátor rozdílu dat:**
  - Výpočet počtu dní mezi dvěma libovolnými daty.

---

### Modul 12: Fakta & Referenční přehledy (Knowledge Base)

Centrální offline encyklopedie standardizovaných číselníků, škál a seznamů, které autoři českých šifrovaček pravidelně kódují do zadání.

#### 0. Vyhledávání a navigace (Dvousekční fulltext search)
V horní části modulu je dominantní instant vyhledávací pole. Aby se hráč v terénu okamžitě dostal k tomu, co potřebuje, jsou výsledky hledání striktně rozděleny do **dvou samostatných sekcí**:

1. **Sekce 1: Kategorie & Přehledy (Rychlá navigace):**
   - Hledá shodu v názvech kategorií, tabulek a témat.
   - Zobrazuje se **vždy nahoře** jako první.
   - *Příklad:* Po napsání *"Hor"* se okamžitě nabídne odkaz do kategorie *„Hory a vrcholy (ČR i svět)“* – klepnutím hráč skočí přímo na kompletní přehled hor.
2. **Sekce 2: Konkrétní položky & Záznamy (Data):**
   - Hledá shodu v samotných datech a položkách napříč všemi datasety.
   - Každý řádek jasně zobrazuje název nalezené položky, hodnotu a badge/štítek zdrojové kategorie.
   - *Příklad:* Výsledky jako *„Horoměřice“* (z kategorie Obce), *„Horusický rybník“* (z vodstva) se řadí až pod kategoriemi, takže nepřekážejí rychlému skoku na celou tabulku.

V této fázi definujeme strukturu kategorií a okruhů znalostí. Každá kategorie obsahuje pouze popis a 2–3 ilustrační příklady (samotné rozsáhlé datasety budou napojeny a optimalizovány v implementační fázi):

#### 1. Geografie a místopis
- **Státy světa, hlavní města a mezinárodní kódy:** Kompletní číselník všech suverénních států, jejich hlavních měst, měn a kódů (např. *Česko – Praha – CZK – CZ*, *Japonsko – Tokio – JPY – JP*).
- **Hory a vrcholy (ČR i svět):** Seznam nejvyšších hor jednotlivých pohoří ČR a světové vrcholy Seven Summits (např. *Sněžka – 1603 m*, *Praděd – 1491 m*, *Mt. Everest – 8848 m*).
- **Řeky a vodstvo:** Nejdelší řeky ČR i světa, přehrady a rybníky (např. *Vltava – 430 km*, *Labe – 370 km*, *Nil – 6650 km*).
- **Města, kraje a okresy ČR:** Krajská a okresní města, jejich poloha a příslušnost ke krajům (např. *Brno – Jihomoravský*, *Písek – Jihočeský*).
- **Ochrana přírody ČR:** Národní parky a chráněné krajinné oblasti (např. *KRNAP*, *NP Šumava*, *CHKO Moravský kras*).
- **Turistické značení KČT:** Systém 4 pásových barev pěších tras (červená, modrá, zelená, žlutá), tvarové značky (např. *zřícenina*, *vyhlídka*, *pramen*) a nouzové signály Horské služby.

#### 2. Doprava a mezinárodní identifikátory
- **Dopravní značky ČR:** Normované označení a vizuální atributy výstražných, zákazových, příkazových a informativních značek (např. *A 1a – Zatáčka vpravo*, *B 1 – Zákaz vjezdu*, *IP 4a – Dálnice*).
- **Kódy SPZ (registrační značky ČR):** Krajské kódy i kompletní historické kódy 76 okresů (např. krajské *A – Praha*, *B – Jihomoravský*, okresní *BM – Brno-město*, *KT – Klatovy*).
- **Mezinárodní poznávací značky (MPZ):** Kódy států na automobilech (např. *CZ – Česko*, *D – Německo*, *CH – Švýcarsko*).
- **Kódy letišť (IATA & ICAO):** Třípísmenné a čtyřpísmenné kódy českých i světových letišť (např. *PRG / LKPR – Praha*, *VIE / LOWW – Vídeň*, *LHR / EGLL – Londýn Heathrow*).
- **Internetové domény nejvyššího řádu (TLD):** Národní domény států (ccTLD) a generické domény (např. *.cz – Česko*, *.de – Německo*, *.tv – Tuvalu*).

#### 3. Jazyky, abecedy a kódovací systémy
- **Hláskovací abecedy:** Fonetické tabulky pro mezinárodní i národní komunikaci:
  - *NATO / ICAO:* Alpha, Bravo, Charlie...
  - *Česká telegrafní:* Adam, Božena, Cyril...
- **Cizí abecedy a transkripce:**
  - *Řecká abeceda:* 24 písmen, velká i malá, názvy a pořadí (např. *Α α – Alfa*, *Ω ω – Omega*).
  - *Hebrejská abeceda & Gematrie:* 22 písmen a jejich číselné hodnoty (např. *Alef = 1*, *Tav = 400*).
- **ASCII & binární kódování:** Standardní ASCII tabulka (hodnoty 0–127, dec, hex, bin, tisknutelné znaky a řídicí kódy – např. *65 = 0x41 = 'A'*, *32 = 0x20 = mezera*).
- **Čárové kódy & identifikátory:** Principy a kontrolní číslice (např. *EAN-13 váhy 1 a 3, prefix ČR 859*).

#### 4. Přírodní vědy (Fyzika, Chemie, Biologie)
- **Periodická tabulka prvků (PTP):** Všech 118 prvků s obousměrným vyhledáváním: protonové číslo, značka, český a latinský název (např. *1 – H – Vodík*, *26 – Fe – Železo*, *79 – Au – Zlato*).
- **Mohsova stupnice tvrdosti:** Škála tvrdosti minerálů 1–10 (např. *1 – Mastek*, *7 – Křemen*, *10 – Diamant*).
- **Beaufortova stupnice větru:** Škála síly větru 0–12 (např. *0 – Bezvětří*, *6 – Silný vítr*, *12 – Orkán*).
- **Barevné značení rezistorů:** 10 barevných pruhů pro hodnoty odporů 0–9 a tolerance (např. *Černá = 0*, *Červená = 2*, *Zlatá = 5 %*).
- **Soustava SI:** Základní jednotky, mocninné předpony a fyzikální konstanty (např. *kilo = 10^3*, *mikro = 10^-6*, *rychlost světla c = 299 792 458 m/s*).
- **Genetický kód a biologie člověka:** Nukleové báze DNA/RNA a aminokyseliny (*A, T, C, G, U*), krevní skupiny systému AB0 a Rh faktoru, lidské tělo v číslech (např. *206 kostí*, *32 zubů*).

#### 5. Matematika, Geometrie a Informatika
- **Číselné posloupnosti a konstanty:** Prvočísla, Fibonacciho čísla, mocniny dvou, matematické konstanty (např. *prvočísla 2, 3, 5, 7...*, *Fibonacci 1, 1, 2, 3, 5...*, *π ≈ 3.14159*, *e ≈ 2.71828*).
- **Platónská tělesa & mnohostěny:** Pravidelná tělesa, počty stěn, vrcholů a hran (např. *Tetraedr – 4 stěny*, *Hexaedr / Krychle – 6 stěn*, *Ikosaedr – 20 stěn*).
- **Římská čísla:** Základní číslice a kombinační pravidla (např. *I = 1*, *V = 5*, *X = 10*, *L = 50*, *C = 100*, *D = 500*, *M = 1000*).
- **Logická hradla & Boolovská algebra:** Pravdivostní tabulky a operace (např. *AND*, *OR*, *XOR*, *NAND*).
- **7-segmentový displej:** Standardní značení segmentů a–g a jejich binární/hex kódování pro číslice 0–9 a znaky A–F.

#### 6. Hudební teorie a notace
- **Tóny, solmizace a klíče:** Hudební abeceda, solmizační slabiky a základní notové klíče (např. *C, D, E, F, G, A, H*, solmizace *Do, Re, Mi...*, *Houslový G-klíč*, *Basový F-klíč*).
- **Hudební intervaly:** Půltónové vzdálenosti (např. *prima = 0*, *malá tercie = 3*, *čistá kvinta = 7*, *oktáva = 12*).
- **Kvintový a kvartový kruh:** Pořadí křížků a béček u durových i mollových stupnic (např. *křížky: Fis, Cis, Gis...*, *béčka: Bé, Es, As...*).

#### 7. Astronomie, Čas a Kalendářní systémy
- **Sluneční soustava:** Planety v pořadí od Slunce, počty měsíců a výrazná tělesa (např. *Merkur, Venuše, Země, Mars...*, měsíce *Phobos, Titan, Ganymed*).
- **Zvěrokruh (Zodiac):** 12 znamení zvěrokruhu, latinské názvy, symboly a kalendářní data (např. *Beran / Aries – ♈*, *Býk / Taurus – ♉*).
- **Navigační hvězdy a souhvězdí:** Jasné orientační hvězdy a asterismy (např. *Polárka – Severka*, *Sirius*, *Letní trojúhelník – Vega, Deneb, Altair*).

#### 8. Společnost, Hry a Sport
- **Hrací karty:**
  - *Mariášové (32 karet):* 4 barvy (Červené, Kule, Žaludy, Zelené) a 8 hodnot (7, 8, 9, 10, Spodek, Svršek, Král, Eso).
  - *Francouzské / Pokerové (52 karet):* 4 barvy (♥, ♦, ♣, ♠) a 13 hodnot (2–10, J, Q, K, A).
- **Šachy:** Šachovnice 8×8, označení polí a standardní bodové hodnoty figur (např. *Pěšec = 1*, *Jezdec/Střelec = 3*, *Věž = 5*, *Dáma = 9*).
- **Hrací kostka (K6):** Standardní rozmístění teček (součet protilehlých stěn je vždy 7: *1+6, 2+5, 3+4*).
- **Scrabble (Česká distribuce):** Bodové ohodnocení písmen české verze hry (např. *A, E, I, O = 1 bod*, *Č, Š, Ž = 4 body*, *Á, É, Í = 10 bodů*).
- **Telefonie a tísňové linky:** Národní tísňová čísla ČR a EU (např. *112 – SOS*, *150 – Hasiči*, *155 – Záchranka*, *158 – Policie*), mezinárodní předvolby (*+420 ČR*, *+421 SR*) a mapa klávesnice T9 (*2=ABC*, *3=DEF*...).
- **Čeští panovníci a prezidenti:** Chronologický přehled dynastií a hlav státu (např. *Přemyslovci*, *Lucemburkové*, *prezidenti od T. G. Masaryka po současnost*).


---

### Modul 13: Rotační šifrovací mřížka (Fleissnerova mřížka)

Velmi frekventovaný šifrovací princip na hrách (čtení / zápis textu přes otáčecí mřížku s výřezy ve 4 krocích po 90°).

#### 1. Konfigurace rozměru mřížky
- Rychlé přepínače rozměrů čtverce:
  - `$4 \times 4$` (16 polí, 4 okénka)
  - `$5 \times 5$` (25 polí, 6 okének + 1 pevný střed)
  - `$6 \times 6$` (36 polí, 9 okének) – nejčastější formát
  - `$8 \times 8$` (64 polí, 16 okének)
  - `$10 \times 10$` (100 polí, 25 okének)

#### 2. Definice výřezů a UX prevence chyb (Princip orbit)
- Každá buňka mřížky patří do právě jedné 4-členné skupiny pozic (orbity), které se navzájem překrývají při rotacích o 0°, 90°, 180° a 270°.
- **Inteligentní zamykání kolizních polí:**
  - Jakmile hráč klepne na libovolnou buňku, stane se z ní **otevřené okénko** (svítící tyrkysový otvor).
  - Zbývající 3 buňky patřící do téže orbity se okamžitě **vizuálně zamknou** (zobrazí se v nich šedá tečka / zámek a nelze na ně kliknout).
  - Tím je 100% zaručeno, že mřížka bude matematicky platná a žádné pole se nepřekryje dvakrát.
  - Hráč vidí počítadlo: *"Vyříznuto: 7 / 9 otvorů"*.
  - Tlačítko `Vymazat otvory` (Reset masky).

#### 3. Dva pracovní toky (Luštění vs. Kódování)
- **Režim A: Čtení ze zadaného textu podkladu (Nejčastější terénní případ):**
  - Hráč má na zadání šifry vytištěnou tabulku písmen (např. $6 \times 6$).
  - Vloží písmena do podkladové mřížky (vepsáním po řádcích, po sloupcích, nebo vložením ze schránky).
  - Na obrazovce vidí podkladovou matici písmen, přes kterou je položena virtuální tmavá maska s průhlednými okénky.
  - Tlačítko `↻ 90°` ve spodní zóně pootočí masku s plynulou animací.
  - Písmena prosvítající v otvorech se automaticky přepisují do výsledné textarey. Každá čtvrtina je barevně odlišena (1. rotace žlutá, 2. azurová, 3. zelená, 4. fialová).
  - Tlačítko **„Přečíst celou tajenku naráz“**: jedním klepnutím provede všechny 4 rotace a vysází hotový text do schránky.
- **Režim B: Zápis přes okénka do prázdné tabulky:**
  - Hráč má lineární text šifry v řádku. Píše písmena přímo do otevřených okének, po zaplnění otočí o 90° a pokračuje. Podkladová tabulka se postupně plní. Na konci se podklad přečte po řádcích / sloupcích.

#### 4. Ovládací prvky a terénní záludnosti
- **Tlačítka rotace:**
  - `↻ 90° CW` (po směru hodinových ručiček – výchozí).
  - `↺ 90° CCW` (proti směru).
- **Zrcadlení mřížky (`Rub / Líc`):**
  - Extrémně častý chyták: hráč na hře vyřízne mřížku z papíru a otočí ji lícem dolů.
  - Tlačítko *Zrcadlit vodorovně / svisle* okamžitě překlopí polohy všech otvorů bez nutnosti je znovu naklikávat.
- **Horní zóna:** Textarea s dekódovaným textem, rozděleným na 4 čtvrtiny s indikátorem délky (klepnutí = kopírovat do schránky).

---

### Modul 14: Barvy & Barevné modely (Color Inspector & Reference)

Barevné šifry (filtry, míchání světel a pigmentů, RGB složky, duha) patří k základnímu repertoáru šifrovaček. Modul kombinuje terénní obrazový analyzátor s teoretickými referencemi.

#### 1. Submodul: Terénní inspektor barev z fotky / kamery
- **Vstup:** Vyfocení barevné šifry mobilním fotoaparátem (např. zalaminovaný papír pod svitem čelovky) nebo výběr z galerie.
- **Interaktivní kapátko (EyeDropper API s Canvas fallbackem):**
  - Hráč prstem posouvá po fotce zvětšovací lupu (magnifier) a zaměří konkrétní bod/pixel.
  - **Okamžitý rozklad hodnot vybrané barvy:**
    - **RGB:** složky 0–255 (R, G, B) + hex kód (`#RRGGBB`).
    - **CMYK:** tiskové složky v procentech (C %, M %, Y %, K %) – klíčové pro šifry založené na tiskovém rastru.
    - **HSV / HSL:** úhel na barevném kruhu (Hue 0°–360°), sytost %, světlost % (velmi časté u šifer s hodinami, ciferníky nebo azimuty).
    - **Český název barvy:** nejbližší slovní pojmenování (např. *„tmavě tyrkysová“*, *„okrová“*, *„purpurová“*).
- **Separace a filtrace obrazových kanálů (Barevné přepínače):**
  - **3 nezávislé posuvné přepínače (switch controls):**
    - `🔴 R (Červený kanál)` [ZAP / VYP]
    - `🟢 G (Zelený kanál)` [ZAP / VYP]
    - `🔵 B (Modrý kanál)` [ZAP / VYP]
  - Umožňuje libovolnou kombinaci zapnutí/vypnutí jednotlivých kanálů v reálném čase (např. vypnutí R a B simuluje pohled přes čistě zelený filtr).
  - **Mód CMY v nastavení modulu:** V kontextovém menu modulu lze přepnout barevný prostor z RGB na **CMY** – přepínače se dynamicky změní na azurovou `C`, purpurovou `M` a žlutou `Y` a fungují analogicky pro subtraktivní model.
  - Doplňková tlačítka: `Invertovat barvy` (negativ), `Adaptivní kontrast / Prahování` (vytažení kresby pod čelovkou v noci).

#### 2. Submodul: Reference a míchání barev
- **Aditivní míchání světel (Model RGB):**
  - Interaktivní Vennův diagram:
    - Červená + Zelená = **Žlutá**
    - Červená + Modrá = **Purpurová (Magenta)**
    - Zelená + Modrá = **Azurová (Cyan)**
    - Červená + Zelená + Modrá = **Bílá**
- **Subtraktivní míchání pigmentů (Model CMY / CMYK):**
  - Interaktivní Vennův diagram:
    - Azurová + Purpurová = **Modrá**
    - Azurová + Žlutá = **Zelená**
    - Purpurová + Žlutá = **Červená**
    - Azurová + Purpurová + Žlutá = **Černá**
- **Tradiční malířské míchání (Model RYB):**
  - Červená, Žlutá, Modrá (časté v dětských a skautských šifrách).
- **Spektrum duhy (Pořadí barev):**
  - 7 barev v pevném pořadí: Červená (1), Oranžová (2), Žlutá (3), Zelená (4), Modrá (5), Indigová (6), Fialová (7) – mnemotechnická pomůcka *Čermák Oznámil, Že Zítra Máme I Fyziku* (ČOJ ZS MIF / ROYGBIV).
- **Barevný kruh (Hue úhly 0°–360°):**
  - Přehledná tabulka úhlů: Červená ($0^\circ$), Žlutá ($60^\circ$), Zelená ($120^\circ$), Azurová ($180^\circ$), Modrá ($240^\circ$), Magenta ($300^\circ$).

---

## 8. Technická specifikace & Implementační detaily

### 8.1 Adresářová struktura projektu (Svelte 5 + Vite + TypeScript)

```
sifro-tools/
├── public/
│   ├── favicon.svg
│   ├── manifest.webmanifest      # PWA manifest (standalone, theme-color #000000)
│   ├── version.json              # { "version": "1.0.0", "dataVersion": "1.0.0" }
│   └── icons/                    # Ikony pro iOS a Android (192, 512, maskable)
├── src/
│   ├── app.css                   # Design tokens, CSS proměnné, OLED dark mode
│   ├── App.svelte                # Root shell: Header, Breadcrumbs, Active Module, Toast container
│   ├── main.ts                   # Bootstrapping aplikace, registrace SW
│   ├── sw.ts                     # Service Worker (CacheStorage správa, offline routing)
│   ├── lib/
│   │   ├── components/
│   │   │   ├── ui/               # Základní stavební kameny UI (Design System)
│   │   │   │   ├── Button.svelte
│   │   │   │   ├── Textarea.svelte
│   │   │   │   ├── Modal.svelte
│   │   │   │   ├── Flyout.svelte
│   │   │   │   ├── Toast.svelte
│   │   │   │   └── KeypadGrid.svelte
│   │   │   ├── layout/
│   │   │   │   ├── Header.svelte
│   │   │   │   ├── Breadcrumb.svelte
│   │   │   │   └── Dashboard.svelte
│   │   │   └── alphabet/
│   │   │       ├── AlphabetBuilder.svelte
│   │   │       └── AlphabetReorder.svelte
│   │   ├── modules/              # 14 samostatných modulů
│   │   │   ├── 01-morse/MorseModule.svelte
│   │   │   ├── 02-braille/BrailleModule.svelte
│   │   │   ├── 03-semaphore/SemaphoreModule.svelte
│   │   │   ├── 04-flags/FlagsModule.svelte
│   │   │   ├── 05-cross/CrossModule.svelte
│   │   │   ├── 06-numbers/NumbersModule.svelte
│   │   │   ├── 07-shifts/ShiftsModule.svelte
│   │   │   ├── 08-substitution/SubstitutionModule.svelte
│   │   │   ├── 09-freq-ocr/FreqOcrModule.svelte
│   │   │   ├── 10-words/WordsModule.svelte
│   │   │   ├── 11-calendar/CalendarModule.svelte
│   │   │   ├── 12-facts/FactsModule.svelte
│   │   │   ├── 13-grille/GrilleModule.svelte
│   │   │   └── 14-colors/ColorsModule.svelte
│   │   ├── state/                # Globální reaktivní stav (Svelte 5 Runes)
│   │   │   ├── alphabet.svelte.ts # Globální abeceda a custom layouty
│   │   │   ├── settings.svelte.ts # Haptika, téma, verze, devToolsToggle
│   │   │   └── navigation.svelte.ts# Aktivní modul, breadcrumb historie
│   │   ├── workers/              # Web Workers pro výpočetní úlohy
│   │   │   ├── dictionary.worker.ts # Slovník, regex filtry, anagramy
│   │   │   ├── markov.worker.ts  # Model tajenkovitosti, scoring posunů
│   │   │   └── ocr.worker.ts     # Tesseract.js WASM runner
│   │   ├── db/                   # Offline databáze (IndexedDB)
│   │   │   ├── idb.ts            # Dexie / raw IDB wrapper
│   │   │   ├── schema.ts         # Verze databází a object stores
│   │   │   └── datasets.ts       # Statická referenční data (prvky, stupnice, svátky)
│   │   └── utils/
│   │       ├── clipboard.ts      # One-tap copy s toastem a haptikou
│   │       ├── haptics.ts        # Vibration API wrapper s fallbacks
│   │       └── markov-engine.ts  # Algoritmus n-gramového scoringu
├── scripts/                      # Skripty pro přípravu a export dat
│   ├── export-vps-mysql.ts       # Export slovníků a podstatných jmen z VPS
│   └── train-markov.ts           # Předpočítání n-gramové matice z solutions.json
└── vite.config.ts                # Vite config + Svelte plugin + Worker bundling
```

---

### 8.2 Reaktivní stavový model (Svelte 5 Runes)

Aplikace plně využívá reaktivní systém **Svelte 5 Runes** (`$state`, `$derived`, `$effect`):

1. **Globální stav abecedy (`state/alphabet.svelte.ts`):**
```typescript
export class AlphabetState {
  activeId = $state('czech-27');
  layouts = $state<Record<string, string[]>>({
    'czech-27': ['A','B','C','D','E','F','G','H','CH','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'],
    'english-26': ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']
  });

  currentLetters = $derived(this.layouts[this.activeId] ?? this.layouts['czech-27']);
  length = $derived(this.currentLetters.length);

  letterToIndex(char: string): number {
    return this.currentLetters.indexOf(char.toUpperCase());
  }

  indexToLetter(idx: number): string {
    return this.currentLetters[idx % this.length] ?? '';
  }
}
export const alphabet = new AlphabetState();
```

2. **Perzistence stavu modulu s auto-save (`localStorage`):**
```typescript
export function createModuleState<T>(moduleId: string, initial: T) {
  const stored = localStorage.getItem(`sifro_module_${moduleId}`);
  const state = $state<T>(stored ? JSON.parse(stored) : initial);

  $effect(() => {
    localStorage.setItem(`sifro_module_${moduleId}`, JSON.stringify(state));
  });

  return state;
}
```

3. **Developer Tools & Expertní režim (`state/devtools.svelte.ts` - volitelné):**
```typescript
// Schováno za volitelným přepínačem "Developer Tools / Expertní režim" v modulu Nastavení.
// Slouží power users pro experimentální manuální snapshotování, diagnostiku a export/import.
export interface DevToolsState {
  enabled: boolean;
  snapshots?: Record<string, { id: string; timestamp: number; preview: string; data: any }[]>;
}
```

---

### 8.3 Web Worker topologie & Asynchronní architektura

Aby UI běželo v terénu nekompromisně na 60/120 fps bez jediného trhnutí při psaní:
- **`dictionary.worker.ts`:**
  - V paměti drží kompaktní pole slovníkových indexů.
  - Provádí regex vyhodnocení nad 250k+ slovy v samostatném vlákně.
  - Pro anagramy využívá předpočítaný hash index (`sorted_letters_hash`).
- **`markov.worker.ts`:**
  - Přijme 25 posunů z Caesara nebo permutace z Morseovky.
  - Spočítá log-likelihood skóre každého řetězce vůči trénované matici z `solutions.json`.
  - Vrátí pole skóre normalizovaných do rozsahu 0.0 až 1.0 pro barevnou CSS heatmapu.
- **`ocr.worker.ts`:**
  - Dynamicky načte Tesseract.js WASM binárku a jazyková data z CacheStorage.
  - Provede předzpracování bitmapy (otsu adaptive thresholding).
  - Vrátí extrahovaný text bez blokování hlavní smyčky prohlížeče.

---

### 8.4 Offline Data Pipeline & MySQL export z VPS

Data z uživatelovy VPS MySQL databáze budou jednorázově vyexportována a optimalizována do statických offline formátů:

1. **Tabulka podstatných jmen z korpusu (s frekvencemi):**
   - Export do binárního formátu / komprimovaného JSONu se strukturou:  
     `[ { "word": "LES", "freq": 14502 }, { "word": "CESTA", "freq": 12890 }, ... ]`
2. **Plný slovník z LibreOffice:**
   - Kompaktní textový formát (jeden řádek = jedno slovo, bez mezer) komprimovaný přes gzip/brotli.
3. **Předpočítaný Markov model:**
   - Skript `scripts/train-markov.ts` projde `data/solutions.json`, sestaví matici přechodů písmen (bigramy a trigramy) a uloží ji do statického `src/lib/db/markov-matrix.json` (<80 KB).

---

### 8.5 Service Worker & Caching strategie

PWA architektura garantuje, že se aplikace v terénu nikdy nezhroutí kvůli chybějícímu signálu:

1. **CacheStorage klíče:**
   - `assets-v1.0.0`: HTML, JS bundle, CSS, ikony, SVG symboly.
   - `data-v1.0.0`: Slovníkové datasety, Tesseract WASM moduly a jazykové soubory.
2. **Opt-in aktualizační tok:**
   - Service Worker nikdy neprovádí automatický reload (`skipWaiting()` je zakázáno).
   - Při dostupném připojení SW stáhne `/version.json`. Pokud je novější:
     - V záhlaví v sekci Nastavení se zobrazí diskrétní tečka: *"Dostupná aktualizace v1.1.0"*.
     - Uživatel klikne na *"Aktualizovat"*.
     - Teprve po úspěšném stažení celého nového balíčku do `assets-v1.1.0` a `data-v1.1.0` se aktivuje nový Service Worker a provede se řízený reload.
   - Původní verze cache zůstává funkční i v případě, že proces stahování v půlce selže.





