# Samuel Design System

> Závazná pravidla interakce a vzhledu aplikace **Samuel**. Popisuje cílový stav z revize 2026-11-09; kód na něj teprve přechází (viz §14).

---

## Shrnutí pro lidi

Samuel je mobilní pomůcka pro luštění šifer v terénu: zkřehlé ruce, slunce i slabě podsvícené displeje, různé telefony. Malý displej (320 × 540) bereme jako kreativní vodítko, které tlačí k jednoduchému ovládání.

```
┌────────────────────────────────────┐
│ [◧ Morse ▾]          [⌨ | 📄 | ☰]  │  Hlavička: kde jsem + čím zadávám
├────────────────────────────────────┤
│ VÝSTUP                             │  Vždy nahoře, vždy vidět výsledek
├────────────────────────────────────┤
│ ● Stav nebo nápověda    [akce] [📖]│  Lišta: displej s kontrolkou, předěl
├────────────────────────────────────┤
│  [ Caesar | Vigenère | Autokey ]   │  Řádek variant: volitelný
│ PANEL: Interakce / Podklad / Menu  │  Dole, na dosah palce
└────────────────────────────────────┘
```

**Zásady**

1. **Výstup nahoře, vstup dole.** Záložky mění jen spodek, výsledek zůstává vidět.
2. **Interakce a Podklad jsou dvě cesty k týmž datům.** Znak zadaný klávesou je vidět v zápisu a naopak.
3. **Hledat, ne procházet.** Launcher je abecední mřížka všech nástrojů s hledáním a odkazy do obecných modulů (Binárka v Číslech).
4. **Název v hlavičce je identita modulu.** Odkaz je jen cesta dovnitř.
5. **Plastická klávesa znamená „zmáčkni mě“.** Je jen v hlavním vstupu a na displeji lišty, nikde jinde.
6. **Barva má jednu roli.** Výběr se nikdy neznačí jen barvou.
7. **Co nejde vrátit, se drží.** Žádné mazání klepnutím ani potvrzovací okna.
8. **Tahák vysvětluje.** Dá se posouvat, takže nemusí šetřit místem.
9. **Odchylka je signál.** Obvykle znamená, že je modul moc složitý. Vždy se nejdřív zeptej.

**Tři typy modulů**

| Typ | Poznávací znak | Moduly |
| :--- | :--- | :--- |
| **Přepis** | velká plastická klávesnice a spodní řádek | Morse, Braille, Semafor, Vlajky, Kříže, Polybius, Mobil, Čísla |
| **Plocha** | nahoře pracovní plocha, dole úzké ovládání | Frekvence, Substituce, Posuny, Mřížka, Barvy, Sudoku, Nonogram, Šachy, Želva, Plotr |
| **Přehled** | výsledky nahoře, filtr nebo pole dole | Slovník, Fakta, Státy, Chemie, Kalendář |

**Pevná čísla:** nejmenší displej 320 × 540, ovládací prvek nejméně 32 px na výšku, výstup nejméně 84 px, lišta 34 px (displej 28 px), řádek variant 36 px, spodní řádek kláves 42 px, hlavička 52 px.

---

## Pravidla pro agenty

### 1. Práce s dokumentem

- **POKUD** ti některé pravidlo v modulu překáží, **POTOM** se před odchylkou VŽDY zeptej uživatele a navrhni, jak modul zjednodušit. Žádná odchylka se neschvaluje sama.
- **POKUD** hledáš konkrétní hodnotu, **POTOM** ji ber z tokenu nebo sdílené komponenty (§13). Dokument říká kdy a proč, hodnoty žijí v kódu.
- **POKUD** měníš chování modulu, **POTOM** aktualizuj jeho Návod (§10).
- **POKUD** pracuješ na modulu, který ještě neodpovídá tomuto dokumentu, **POTOM** nerozšiřuj staré vzory a přidej ho k migraci (§14).

### 2. Launcher a vstupy do modulů

- **POKUD** píšeš text pro hráče, **POTOM** modulu říkej **nástroj** (Nástroje, Hledej nástroj…, Reset nástroje). Slovo modul zůstává jen v kódu a v tomto dokumentu.

- **POKUD** rozhoduješ, co je modul, **POTOM** rozliš **modul** (jeden nástroj v kódu) a **vstup** (dlaždice nebo výsledek hledání s vlastním názvem a předvolbou).
- **POKUD** se liší vstupní médium (kříž, souřadnice, telefon), **POTOM** vytvoř samostatný modul. Odlišná média neslučuj.
- **POKUD** jde o příbuzné varianty téhož vstupu (Caesar a Vigenère, Braille 6 a 8 bodů), **POTOM** patří do jednoho modulu do řádku variant.
- **POKUD** častý úkon žije hluboko v obecném modulu, **POTOM** přidej odkaz do `MODULE_SHORTCUTS`: dlaždice s vlastním názvem a ikonou a pod názvem „v <modulu>“. Předvolba nastaví jen to, co odkaz pojmenovává, ostatní volby respektuje. Mění-li převod, rozepsaný vstup vymaže a oznámí to toastem.
- **POKUD** přidáváš modul nebo variantu, **POTOM** doplň přezdívky do `MODULE_KEYWORDS` (komunitní názvy, varianty, zkratky) a přiřaď `group` v `MODULES`. Kategorie se nezobrazuje, její název slouží jen jako slovo pro hledání („kódování“ najde Morse).
- **POKUD** hráč hledá, **POTOM** se mřížka nahradí seznamem řádků nad polem. Hledá se bez diakritiky podle začátku slov a každé slovo dotazu musí začínat některé slovo položky (název nebo přezdívka). Pořadí podle váhy: název začíná dotazem → slova názvu → přezdívka; při stejné váze vede odkaz (existuje, protože jde o častý úkon: „pol“ → Polák), pak Nedávné, pak abeceda. Nejlepší řádek je dole u pole a nese značku Enter. Řádek nalezený přes přezdívku ukáže, čím se našel („hex“ → Čísla). Prázdné pole s fokusem ukáže celé Nedávné. Tlačítko ✕ v poli vrátí mřížku a schová klávesnici.
- **POKUD** řadíš Nedávné, **POTOM** od naposledy otevřeného a bez dlaždice, ve které hráč je. Zaznamenává se klepnutá dlaždice, ne cílový modul. V launcheru je Nedávné tenký řádek čipů nad polem hledání.
- **POKUD** stavíš launcher, **POTOM** je přes celou obrazovku: nahoře ✕ a Nástroje, pod tím abecední mřížka všech nástrojů (moduly i odkazy, bez kategorií, barev a záslepek), dole Nedávné, pole Hledej nástroj… a ikony Nápověda a Nastavení (s tečkou aktualizace). Navrhuj ho pro víc nástrojů, než se vejde na obrazovku: mřížka se posouvá a hledání je hlavní cesta. Žádné přepínače ani filtrovací čipy.

### 3. Hlavička a záložky

- **POKUD** stavíš hlavičku (52 px), **POTOM** vlevo leží tlačítko launcheru (ikona + **název modulu** + šipka) a vpravo blok záložek. Nic dalšího v ní není.
- **POKUD** modul otevřel odkaz, **POTOM** hlavička dál ukazuje název modulu (Čísla, ne Binárka). Hráč tam může přepnout na jinou soustavu.
- **POKUD** modul nemá vstup, který by záložky přepínaly (Fakta, Státy), **POTOM** záložky nemá.
- **POKUD** je modul s podkladem, **POTOM** má záložky **Interakce | Podklad | Menu**. Modul bez podkladu má **Interakce | Menu**. Menu má jen modul s volbami; samotný Reset by jen opakoval Smazat vše podržením. Jediná záložka se nezobrazuje. V hlavičce jsou záložky jako ikony, název slouží popiskům a přístupnosti.
- **POKUD** zvažuješ svájp mezi záložkami, **POTOM** ho nepřidávej. Svájp po liště se v testu na telefonu neosvědčil. Panel i výstup patří gestům modulu a klávesy reagují už na dotyk. Záložky se přepínají jen v hlavičce.
- **POKUD** značíš aktivní záložku, **POTOM** použij akcent a tvarový signál (podtržení, podklad).
- **POKUD** přepínáš záložku, **POTOM** se mění jen spodní panel. Výstup i lišta zůstávají a stav modulu se neztrácí.
- **POKUD** vyžaduje podklad nebo nastavení pozornost, **POTOM** nese příslušná záložka varovnou tečku `--color-accent-warning`. Tečka NIKDY neznamená „vloženo“.

**Hash a tlačítko Zpět**

- **POKUD** se mění pohled, **POTOM** se mění hash a vzniká jeden krok zpět. NIKDY nepoužívej `replaceState` pro změnu pohledu a nezaváděj limit zanoření.

| Pohled | Hash |
| :--- | :--- |
| Interakce | `#/morse` |
| Podklad | `#/morse/podklad` |
| Menu | `#/morse/menu` |
| Tahák | `#/morse/tahak` |
| Detail položky Přehledu | `#/facts/detail/<id>` |
| Launcher | `#/nastroje` |

### 4. Obrazovka a výšky

- **POKUD** skládáš modul, **POTOM** použij `<ModuleShell>`. Pořadí je pevné: hlavička → výstup → lišta → řádek variant (volitelný) → panel. Žádný celostránkový scroll; posouvat se smí jen uvnitř zóny.
- **POKUD** navrhuješ jakýkoli modul, **POTOM** výsledek patří nahoru a zadávání dolů. Obrácený tok je zakázaný.
- **POKUD** navrhuješ rozhraní, **POTOM** minimální viewport je **320 × 540 px**, pouze na výšku. Když je obrazovka na šířku a okno nižší než 540 px, zobrazí se `<LandscapeWarning>`. Orientaci určuje obrazovka, ne poměr stran okna: klávesnice telefonu okno zmenší a telefon na výšku se nesmí tvářit jako na šířku.

**Rozpočet na 320 × 540**

```
540 = 52 (hlavička) + 84 (výstup min.) + 34 (lišta) + 370 (zbytek)
370 = 6 (odskok od lišty) + [36 řádek variant + 8 (mezera)] + hlavní vstup + 12 (spodní odsazení)
```

Hlavní vstup včetně spodního řádku kláves má tedy nejvýš **352 px**, s řádkem variant **308 px**.

- **POKUD** je panel na záložce Interakce, **POTOM** výšku určuje modul. Vstup má přednost: bere si z výstupu, dokud výstup nenarazí na 84 px. NIKDY nezmenšuj klávesy přes `vh` / `dvh`, když je místo.
- **POKUD** je panel na záložce Podklad nebo Menu, **POTOM** má pevně polovinu výšky obrazovky, bez ohledu na Interakci. Proměnnou výšku má jen Interakce. Co se nevejde, posouvá se uvnitř panelu v `<ScrollArea>`. Řádek variant se na těchto záložkách skryje.
- **POKUD** panel mění výšku, **POTOM** výstup dostane zbytek, nejméně 84 px, a nesmí přitom ztratit stav. Změna je krátká animace; při `prefers-reduced-motion` bez animace.

### 5. Lišta a řádek variant

- **POKUD** stavíš modul, **POTOM** má vždy lištu: zapuštěný displej (28 px, černý jako šasi kláves, s rámečkem a vtlačeným stínem) v horním okraji panelu, se stejnými bočními okraji jako klávesnice. Je to výrazný předěl mezi výstupem a panelem. Lišta zabírá i s odskokem 40 px, stejně jako dřív plochá lišta, takže žádný modul kvůli ní nepřijde o výšku. Kreslí ji `ModuleShell`.
- **POKUD** svítí kontrolka vlevo na displeji, **POTOM** říká stav modulu: zhasnutá, dokud čeká na vstup (nápověda), akcentová, když drží data, oranžová při varování (oranžový je pak i text a rámeček displeje). Kontrolka je tvar, ne jen barva textu, a nikdy neznamená výběr.
- **POKUD** plníš lištu vlevo, **POTOM** platí jeden text podle priority: varování → nápověda (dokud je modul prázdný) → stav. Modul bez vlastního stavu ukáže počet znaků.
- **POKUD** zvažuješ varování v liště, **POTOM** ho použij jen pro to, co brání výsledku (chybí slovník, neplatný kus zápisu). Nestandardní nastavení (abeceda, zrcadlení) značí jen tečka na záložce Menu (§3), lišta dál ukazuje nápovědu nebo stav.
- **POKUD** píšeš nápovědu lišty, **POTOM** jedna věta do ~38 znaků, která říká další krok. Zmizí prvním vstupem, po vymazání se vrátí. Delší výklad patří do Návodu.
- **POKUD** plníš lištu vpravo, **POTOM** je tam nejvýš jedna akce modulu a kniha otevírající tahák. Modul bez taháku knihu nemá.
- **POKUD** je prvek v liště aktivní (akce, kniha), **POTOM** je to malá plastická klávesa na displeji (`<Keycap compact>`), aby bylo vidět, že jde stisknout. Reaguje na dokončené klepnutí, ne na dotyk: kniha otevírá tahák přes lištu a stisk by se do něj propsal. Klávesa je nižší než 32 px, její dotyková plocha ale přesahuje displej nahoru i dolů. Text stavu klávesou nikdy není. Vzhled drží `ModuleBar`, modul ho nestyluje.
- **POKUD** rozhoduješ, kam prvek patří, **POTOM** se zeptej: mění to, jak zadávám? → řádek variant. Říká to něco o výsledku, nebo s ním něco dělá? → lišta.
- **POKUD** má modul varianty, **POTOM** je dej do řádku variant (`<SegmentedControl size="sm">`, 36 px) přes snippet `variants`. Je součástí panelu Interakce: od lišty odskočený o 6 px (`--zone-input-offset`), se stejnými bočními okraji jako klávesnice a s mezerou 8 px (`--zone-input-gap`) nad hlavním vstupem.
- **POKUD** mění způsob zadávání jiný prvek než přepínač variant (směr převodu v Číslech, barevný filtr Vlajek), **POTOM** smí do řádku variant také. Musí být plochý a vysoký 36 px.
- **POKUD** má modul rozepsaný stav s kontextovými akcemi (kandidáti T9), **POTOM** se jimi řádek variant dočasně nahradí. Žádný prvek z něj nesmí přetékat.

### 6. Typy modulů

- **POKUD** přidáváš nebo předěláváš modul, **POTOM** ho zařaď do typu a dodrž jeho znak (viz Shrnutí). Nový typ je odchylka, zeptej se.
- **Přepis:** hlavní vstup je plastická matice a spodní řádek. Výstup je rostoucí text, poslední znak musí zůstat vidět. Podklad je zápis šifry, volitelný.
- **Plocha:** nahoře plocha (text, mřížka, deska, plátno, graf), která umí změnit výšku bez ztráty stavu. Dole úzké ovládání. Podklad jsou data, u analýzy povinná, u desek a kreslení volitelná.
- **Přehled:** výsledky nahoře, pole nebo filtr dole, bez spodního řádku kláves. Podklad nemá; dotaz je parametr.
- **POKUD** Přehled ukazuje detail jedné položky (článek Fakt, vlajka, prvek), **POTOM** ho otevři přes celou plochu jako tahák (`navigation.openDetail(id)`, snippet `detail` v `ModuleShell`). Hlavička zůstane, zavírá se ✕ nebo tlačítkem Zpět. Detail se čte, klávesnice by jen brala místo.

### 7. Podklad

> Stav v `state/podklad.svelte.ts`, komponenty v `components/podklad/`, deklarace přes prop `podklad` na `<ModuleShell>`.

**Podklad** jsou uživatelská data, se kterými modul pracuje. Je to jediný zdroj dat: klávesy i textový editor upravují totéž a výstup se z toho počítá. Podklad mají jen moduly, do kterých vstupují uživatelská data. **Parametr** je krátký údaj laděný naživo (klíč, heslo, maska, posun, řazení).

- **POKUD** rozhoduješ, jestli je vstup podklad, **POTOM** se zeptej: „Jsou to data, nad kterými modul pracuje?“ → podklad. „Ladí se naživo a výsledek se mění s každou změnou?“ → parametr. NIKDY parametr do podkladu.
- **POKUD** píšeš zápis pro přepisový modul, **POTOM** jsou to indexy, které zadává klávesnice. Vlastní konvence je v pořádku, hráč ji musí rychle pochopit.

| Modul | Zápis | Příklad |
| :--- | :--- | :--- |
| Braille | čísla bodů | `1,125,135,245,,12` |
| Semafor | dvojice ramen 1–8, od „dolů“ po směru hodinových ručiček; pořadí ve dvojici nerozhoduje | `12,23,34,57` |
| Velký kříž | řádek, sloupec, pozice | `111,132,231,212` |
| Malý kříž | tabulka 1–4 a pozice v ní (9 + 9 + 4 + 4) | `11,18,26,21,22,43` |
| Polybius | řádek a sloupec podle zvolených popisků | `11,23,35,25` |
| Mobil | opakovaná klávesa; slovo z T9 se uloží stejně | `2,44,666,5` |
| Čísla | číslo ve zvolené soustavě | `01000001,01001000` |
| Sudoku | 9 skupin po 9, prázdné pole je tečka (nebo 0 z webu); vložení 81 znaků v kuse také platí | `53..7....,6..195...` |
| Malovaná křížovka | `,` mezi čísly v políčku, `/` mezi políčky, `//` mezi osami (první řádky), prázdné políčko je `0` | `3,1/2/5//1,1/4/1` |
| Želva | `V` vpřed, `Z` zpět, `L` a `P` otočení o úhel, `T` tužka, `M` značka; číslo u pohybu je počet kroků | `V3,P90,V,L45,T,V,M` |
| Plotr | světové strany, `T` tužka, `M` značka; číslo u pohybu je počet kroků | `S3,V,JV,T,Z,M` |
| Šachy | FEN nebo tahy | |
| Morse (výjimka) | doslovná morseovka: `/` mezi znaky, `//` mezi slovy, `///` STOP | `-/.-/-.-//.` |
| Vlajky (výjimka) | přímo písmena, mezera je mezera | `AHOJ SVETE` |

- **POKUD** zpracováváš zápis, **POTOM** čárka odděluje znaky a prázdné pole je mezera (`1,,2`). Mezeru kódování běžně potřebují a čárka je na klávesnici telefonu jedno klepnutí. Použij `parseNotation` a `serializeNotation` z `utils/notation.ts`: mezery kolem čárky se ignorují, poslední čárka jen otevírá další znak. Výjimky jsou v tabulce.
- **POKUD** je kus zápisu neplatný, **POTOM** zůstane v textu a označí se, NIKDY se nesmaže.
- **POKUD** stavíš editor zápisu, **POTOM** musí být živě vidět, co který kus znamená (`<InterlinearText>` ve výstupu nad panelem). U Plochy to ukazuje plocha sama (mřížka, deska, kresba) a neplatné kusy hlásí lišta varováním s jejich počtem.
- **POKUD** je zápis zdrojem dat, **POTOM** změna abecedy nebo zrcadlení přepočítá už zadaný text.
- **POKUD** je podklad povinný a prázdný, **POTOM** modul startuje na záložce Podklad se způsoby vložení. Volitelný podklad startuje na záložce Interakce.
- **POKUD** přidáváš způsob vložení (OCR, galerie), **POTOM** ho registruj k **typu** podkladu, ne k modulu.
- **POKUD** způsob vložení vytváří text, **POTOM** vždy skončí v editoru, kde ho hráč zkontroluje.
- **POKUD** stavíš editor podkladu, **POTOM** má dole plastický řádek 1+2 (`<SplitBottomRow>`): u textu `[ Smazat podržením ] [ Ze schránky | Do schránky ]`, u fotky `[ Smazat podržením ] [ Vyfotit | Z galerie ]`. Každá klávesa má nahoře ikonu (16 px) a pod ní popisek verzálkami (10 px), stejně jako klávesy matice (TEČKA, ČÁRKA); vedle sebe by se popisky na 320 px nevešly. Obsah stojí uprostřed, aby měl vzduch nad ikonou i pod textem. Stejně vypadá Pero v Želvě a Plotru. U schránky ukazuje směr šipka čtená zleva: schránka → ven, → do schránky. Volby zpracování patří do Menu, editor obsahuje jen data.
- **POKUD** je podklad fotka, **POTOM** její rámeček vyplní celou výšku panelu nad spodním řádkem a fotka se do něj vejde celá (`object-fit: contain`). Prázdný rámeček je čárkovaný, s ikonou obrázku a textem „Zatím žádná fotka“, aby panel nezůstal z většiny prázdný.
- **POKUD** hráč bere text ze schránky, **POTOM** nahradí celý podklad, nikdy se do něj nevmíchá. Funguje jen do prázdného editoru; rozepsaný text se nejdřív smaže podržením, protože nahrazení nejde vrátit. Slovo „Vložit“ nepoužívej, zní jako „vlož můj text do modulu“.
- **POKUD** je editor prázdný, **POTOM** jeho placeholder má dva řádky: příklad (`Např. …`) a stručně formát zápisu (`format`, jinak `description`).
- **POKUD** hráč odejde z podkladu jakkoli, **POTOM** se obsah VŽDY uloží. Text se nikdy tiše nezahazuje.
- **POKUD** hráč píše do podkladu a klávesnice telefonu je otevřená, **POTOM** výstup i spodní řádek editoru zmizí a hlavička, lišta a textové pole vyplní plochu nad klávesnicí. Klávesnice telefonu má vlastní schránku a klávesy těsně nad ní by se mačkaly omylem. Lišta zůstává, protože živě hlásí neplatné kusy zápisu. Textové pole má nejméně dva řádky.
- **POKUD** se podklad upraví, **POTOM** zachovej práci, kde ještě platí (Substituce: přiřazení; Mřížka: otvory při stejné velikosti). Neplatnou práci zahoď a oznam to toastem.
- **POKUD** je podklad text, **POTOM** se ukládá přes `localSettingsService`. Obrázek se drží jen v paměti ve sdíleném `.svelte.ts` a NIKDY se nemaže při `visibilitychange`.

**Klávesnice telefonu**

- **POKUD** potřebuješ klávesnici telefonu, **POTOM** se otevře jen po klepnutí a jen na třech místech: v záložce Podklad, v hledání launcheru a v editoru krátkého parametru `<TextEntrySheet>` přes celou obrazovku (trigger `button.cipher-input-trigger`).
- **POKUD** je na obrazovce klávesnice modulu, **POTOM** na ní NIKDY neleží pole, které by klávesnici telefonu otevřelo samo.

**Posouvání**

- **POKUD** se obsah posouvá (Menu, tahák, detail, spodní list), **POTOM** použij `<ScrollArea>`: systémový posuvník je skrytý, tenký ukazatel leží v okraji vedle textu a je vidět pořád, když je co posouvat. Okraj, za kterým obsah pokračuje, ztmavne, takže i seznam končící přesně na zlomu je poznat. Ukazatel se netahá, posouvá se prstem po obsahu.
- **POKUD** potřebuje spodní list tlačítko, které musí být vždy vidět (Potvrdit), **POTOM** ho dej do snippetu `footer`, mimo posouvaný obsah. Nikdy plovoucí tlačítko přes obsah.

### 8. Klávesy a ovládání

- **POKUD** přímo zadáváš hlavní vstup modulu (matice, spodní řádek, hlavní ovládání Plochy, spodní řádek Podkladu), **POTOM** použij plastickou klávesu `Keycap` v šasi `Chassis`. Řádek variant, záložky, Menu a vše ve výstupu jsou ploché. Jedinou další plastickou klávesou je akce na displeji lišty (§5).
- **POKUD** klávesa potřebuje od prohlížeče potvrzené klepnutí (schránka, výběr souboru), **POTOM** jí dej `pressOn="click"`. Ostatní klávesy reagují už na dotyk.
- **POKUD** navrhuješ ovládací prvek, **POTOM** má nejméně **32 px** na výšku. Kde je místo, použij větší; preferovaná výška matice je podle hustoty (42 px abeceda, 46 px kříž, 52 px číselník).
- **POKUD** jde o buňky mřížky nebo desky, kterou hráč přibližuje (`PanZoomViewport` v Sudoku a Nonogramu), **POTOM** smí být na malém displeji menší než 32 px. Malou buňku řeší přiblížení.
- **POKUD** mřížka nekončí na celém řádku, **POTOM** doplň záslepku `.grid-filler`.
- **POKUD** implementuješ zadávání znaků, **POTOM** použij `onpointerdown` s `e.preventDefault()` a kontejneru nastav `touch-action: none`.
- **POKUD** je tlačítko `disabled`, **POTOM** NIKDY nedávej `opacity` na kořen. Povrch drží barvu, tlumí se jen obsah.
- **POKUD** implementuješ haptiku, **POTOM** volej synchronně `settings.vibrate(ms)` přímo při gestu a nezdvojuj vibrace u tlačítek, která vibrují sama.
- **POKUD** umisťuješ easter egg, **POTOM** smí být jen záslepkou nebo spodním bufferem, nikdy vlastním ovládacím řádkem.

**Spodní řádek kláves**

- **POKUD** se v modulu postupně zadává (Přepis, Sudoku, Nonogram, Želva, Plotr, Šachy), **POTOM** má dole jeden řádek 42 px v pevném pořadí:
  `[ Smazat vše podržením | Hlavní akce | Zpět o krok ]`
- **POKUD** obsazuješ prostřední tlačítko, **POTOM** nese hlavní akci zadávání v modulu: mezeru nebo potvrzení znaku v Přepisu, Vyřešit v Sudoku a Nonogramu, Pero v Želvě a Plotru. Je plastické (`Keycap` nebo `<SpaceCommitButton>`).
- **POKUD** modul hlavní akci nemá, **POTOM** na jejím místě zůstane prázdná záslepka, aby levé a pravé tlačítko měly stejnou šířku.
- **POKUD** modul potvrzuje rozepsaný znak, **POTOM** použij `<SpaceCommitButton>`, který se z mezery přepne na potvrzení.
- **POKUD** má modul místo hlavní akce dvojici rovnocenných akcí (Zpět | Vpřed v Šachách, Vložit | Kopírovat v Podkladu), **POTOM** použij řádek 1+2 `<SplitBottomRow>`: `[ Smazat vše podržením ] [ A | B ]`. Mazání stojí samo, dvojice je spojená a jde ve směru čtení.

**Nevratné akce**

- **POKUD** akci nejde vrátit (vymazání celého vstupu, smazání podkladu, reset modulu), **POTOM** se VŽDY potvrzuje podržením přes `<HoldToAction>`. Nikdy klepnutím, nikdy potvrzovacím dialogem. Délku podržení určuje komponenta. Backspace zůstává na klepnutí.

### 9. Barvy a písmo

Každá barva má právě jednu roli.

| Role | Sděluje | Tokeny | Kde |
| :--- | :--- | :--- | :--- |
| **Akcent** | vybráno, aktivní, hlavní akce | `--color-accent-primary` | ovládací prvky včetně záložek |
| **Stav** | úspěch, chyba, varování | `--color-accent-success`, `-danger`, `-warning` | výsledky, toasty, lišta |
| **Obsah** | barva je sama informací | vlastní hodnoty modulu | data modulu (fotka, vlajka, otočení mřížky), nikdy ovládání |
| **Neutrální** | struktura, text, plochy | `--color-surface-*`, `--color-text-*`, `--color-border-*` | výchozí volba |

- **POKUD** přidáváš barvu, **POTOM** si odpověz „proč tu je?“ a použij token role. Akcent ani stavové barvy NIKDY nepřepisuj do hexu.
- **POKUD** značíš výběr nebo aktivní stav, **POTOM** nikdy jen barvou, přidej tvarový signál.
- **POKUD** navrhuješ plochy a rámečky, **POTOM** musí být rozeznatelné na slabě podsvíceném displeji. Pozadí zůstává OLED černé.

**Písmo.** Velikosti se násobí `--font-scale` (1,08 / 1,2 / 1,32, výchozí 1,2).

| Název | Základ | Token | Použití |
| :--- | :--- | :--- | :--- |
| Popisek | 11 px | `--text-xs` | lišta, poznámky, drobné popisky |
| Text | 13 px | `--text-sm` | běžný text, menu |
| Důraz | 15 px | `--text-base` | výstup, důležité hodnoty |
| Nadpis | 20 px | `--text-xl` | název modulu, nadpisy |
| Znak-S | 13 px | `--key-s` | hustá klávesa |
| Znak-M | 20 px | `--key-m` | běžná klávesa |
| Znak-L | 32 px | `--key-l` | dominantní klávesa |

- **POKUD** nastavuješ velikost textu, **POTOM** použij token, ne vlastní `calc()`. Nový stupeň je odchylka, zeptej se.
- **POKUD** kreslíš popisek klávesy, **POTOM** velikost určí `Keycap` podle typu klávesy a popisek nikdy nepřesáhne 60 % její výšky.
- **POKUD** se krátký popisek v hustém řádku nevejde na 320 px, **POTOM** omez písmo šířkou: `min(var(--text-xs), 3.6vw)`.
- **POKUD** text patří do pevné geometrie, která se musí vejít celá (dlaždice Chemie, tabula recta), **POTOM** smí zůstat v holých `px`.

### 10. Tahák

> Komponenty v `components/reference/`. Otevírá se knihou v liště.

- **POKUD** se otevře tahák, **POTOM** zakryje obě zóny i lištu a hlavička zůstane. Zavírá se ✕, tlačítkem Zpět nebo klepnutím na záložku v hlavičce. Psaní za taháku nedává smysl: bez výstupu hráč nevidí, co píše.
- **POKUD** píšeš tahák, **POTOM** ho postav na `<RefLayout>`: nejvýš tři datové záložky a poslední je VŽDY **Návod**. Modul bez dat má jen Návod a lišta záložek se skryje.
- **POKUD** píšeš Návod, **POTOM** učí, ale stručně, žádná kniha. Pořadí sekcí: **K čemu to je** (jedna až dvě věty: co to je a co s tím modul udělá), **Jak na to** (princip ve dvou až třech větách a aspoň jeden příklad krok za krokem: co udělat → co uvidíte), **Ovládání**, **Pozor**. Prázdnou sekci vynech. Vzor je Návod Morse.
- **POKUD** píšeš Ovládání, **POTOM** pojmenuj každý prvek přesně jako v aplikaci, s místem, kde ho najít („Zpět (vpravo dole)“, „Bez mezer (v liště)“, „Menu → Permutace“), a pod něj jednu větu, co dělá.
- **POKUD** Návod vysvětluje ovládání nebo postup, **POTOM** přidej výřez obrazovky nebo krátkou animaci, kde to pomůže. Média musí fungovat offline, mít popis a být malá (WebP nebo animovaný WebP místo GIFu).
- **POKUD** píšeš položku Pozor, **POTOM** nejdřív zkus nástroj zjednodušit, aby úskalí zmizelo. Nadpis položky je otázka, ve které se hráč pozná („V šifře nejsou oddělovače mezi tečkami a čárkami?“), pod ní je, co udělat.
- **POKUD** má modul nástroje s rozdílným chováním (SMS a T9), **POTOM** předej `tools` a Návod je lineární: nejdřív Společné, pak bloky v pořadí řádku variant, aktivní nese štítek. Žádný přepínač uvnitř Návodu.
- **POKUD** odkazuješ na ovládací prvek, **POTOM** ho pojmenuj přesně jako v aplikaci („záložka Podklad“, „Menu → <Label>“).
- **POKUD** tahák závisí na nastavení (abeceda), **POTOM** předej data přes props, aby odpovídal aktuální konfiguraci.
- **POKUD** stejná data používá víc taháků, **POTOM** je drž v jednom `*Data.ts` a sdílené komponentě.

**Čitelnost a tabulky.** Tahák se dá posouvat, proto nešetří místem.

- **POKUD** skládáš obsah taháku, **POTOM** nech mu vzduch: nejméně velikost Text, řádky pohodlně vysoké, zřetelné odstupy mezi bloky.
- **POKUD** stavíš tabulku, **POTOM** drž hodnoty ve sloupcích pod sebou, se svislými linkami mezi sloupci. Místo řádků `pojem: hodnota` použij dva sloupce.
- **POKUD** stavíš tabulku, **POTOM** použij `.ref-table-wrap` a `.ref-table` s třídami `.col-num`, `.col-val`, `.col-code`, `.col-name`. Šířky NIKDY inline procenty.
- **POKUD** má tabulka na 320 px víc než 2 textové sloupce, **POTOM** další údaj patří do spodního řádku záznamu `<tr class="desc-row">`. Stejně tak delší popis.
- **POKUD** záznam nese index nebo stupeň, **POTOM** patří do prvního sloupce `<td rowspan="2" class="col-num">`.
- **POKUD** tabulka obsahuje dvouřádkové záznamy, **POTOM** zebra střídá celé dvojice a mezi záznamy je zřetelný předěl.
- **POKUD** buňka obsahuje čísla, **POTOM** `.col-val` nebo `.col-code` s `white-space: nowrap` a `font-variant-numeric: tabular-nums`. Rozsahy bez mezer (`0–0,2`), relační operátory s pevnou mezerou (`&ge;&nbsp;118`).

### 11. Menu

- **POKUD** přidáváš volbu modulu, **POTOM** patří do záložky Menu: statická konfigurace (odchylky abecedy, zrcadlení, vynechaná písmena) a Reset modulu. Skupiny voleb stav přes sdílený `MenuGroup` a řádky přes `<OptionRow>`.
- **POKUD** stavíš Reset modulu, **POTOM** vrátí data i volby z Menu na výchozí hodnoty. Zvolená varianta zůstane, je to cesta do modulu, ne nastavení.
- **POKUD** jde o preference zařízení (offline databáze, velikost písma, haptika, globální abecedy), **POTOM** patří do Nastavení, ne do modulu.

### 12. Microcopy

- **POKUD** píšeš text v aplikaci, **POTOM** vykej a piš stručně (taháky viz §10).
- **POKUD** zobrazuješ toast, **POTOM** nejvýš 30 znaků a 2 emoji, v imperativu nebo krátkém stavu („Zkopírováno“).

### 13. Tokeny a komponenty

Hodnoty žijí v `src/app.css` a ve sdílených komponentách. Modul si je NIKDY neopisuje.

| Token | Hodnota |
| :--- | :--- |
| `--header-height` | 52 px |
| `--status-bar-height` | 34 px (lišta: hrana, římsa, displej) |
| `--bar-display-height` | 28 px |
| `--zone-input-offset` | 6 px (odskok panelu od lišty) |
| `--subtoolbar-height` | 36 px |
| `--utility-row-height` | 42 px |
| `--output-min-height` | 84 px |
| `--control-min-height` | 32 px |
| `--zone-input-gap` | 8 px |
| `--panel-max-height` | 352 px |

| Komponenta | Účel |
| :--- | :--- |
| `ModuleShell` | kostra modulu: lišta, řádek variant, panel, záložky, tahák |
| `Keycap`, `Chassis` | plastická klávesa (i malá `compact` na displeji lišty) a zapuštěné šasi, jediný zdroj jejich vzhledu |
| `MenuGroup`, `OptionRow`, `AlphabetSelect` | obsah záložky Menu |
| `TranslationCard` | výstup: auto-scroll, kopírování klepnutím |
| `SegmentedControl` | řádek variant |
| `KeypadBottomRow`, `SplitBottomRow` | spodní řádek kláves: 3 sloupce, nebo 1+2 |
| `HoldToAction`, `SpaceCommitButton`, `BackspaceButton` | tlačítka spodního řádku |
| `DigitKeypad`, `SimpleKeyboard`, `AlphabetGrid` | sdílené matice |
| `InterlinearText` | zápis s živým překladem |
| `PanZoomViewport` | přiblížení ploch a mřížek |
| `BottomSheet`, `TextEntrySheet` | list (s volitelnou patičkou `footer`) a editor parametru |
| `ScrollArea` | posouvaná oblast s vlastním ukazatelem a ztmavnutím okrajů |
| `RefLayout`, `RefSection`, `RefList` | tahák |
| `LandscapeWarning`, `ToastContainer` | systémové vrstvy |

**PanZoom:** interaktivní mřížky se posouvají dvěma prsty, jedním prstem jen obsah určený pouze ke čtení.

### 14. Migrace kódu

Hotový je základ (tokeny, `Keycap`, `Chassis`, `KeypadBottomRow`, `MenuGroup`, `ModuleShell` se záložkami, lištou a panelem, navigace přes hash, tahák přes celou plochu) a pilotní moduly Morse, Frekvence a Slovník. První dávka převedla přepisové moduly Braille, Semafor, Vlajky, Kříže, Polybius, Mobil a Čísla (zápis jako zdroj dat, lišta, `Keycap`, Menu). Druhá dávka převedla Plochy Posuny, Substituce, Mřížka, Barvy, Sudoku, Nonogram, Šachy, Želva a Plotr (podklad, lišta, řádek variant, `Keycap`, spodní řádek s hlavní akcí, Menu, reset). Třetí dávka převedla Přehledy Fakta, Státy, Chemie a Kalendář (výsledky ve výstupu, lišta, `Keycap` a `SimpleKeyboard` s řádkem dotazu, detail položky přes celou plochu).

Zbývá:

- Přepsání Návodů do vysvětlujícího stylu (§10) a tabulky v článcích Fakt, které mají na 320 px víc než 2 textové sloupce.
- Úklid: nepoužívané props `ModuleShell` (`title`, `hasAlphabet`, `alphabetHint`, `layoutMode`), `hasMenu` v `types.ts`, třídy `.zone-input-flow`, `.subtoolbar-container` a `.keypad-dominant-*`, komponenty `ConfirmDialog`, `RadioGroup`, `SpaceButton` a nástroje podkladu v `TextEntrySheet`.

### 15. Otevřené otázky

- Hodnoty kontrastu ploch a rámečků: ověřit na slabém displeji.
