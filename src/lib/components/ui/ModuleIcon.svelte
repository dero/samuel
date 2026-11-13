<script lang="ts">
  import type { ModuleId } from '../../types';
  import {
    Broadcast,
    DotsSixVertical,
    FlagBanner,
    FlagCheckered,
    Hash,
    Cube,
    Calculator,
    ArrowsClockwise,
    TextAa,
    ChartBar,
    GridFour,
    BookOpen,
    CalendarBlank,
    Lightbulb,
    Palette,
    Question,
    Gear,
    DeviceMobile,
    SquaresFour,
    GlobeSimple,
    Path,
    Compass,
    Graph,
    GridNine,
    PaintBrushBroad,
    Horse,
    Atom,
    Binary,
    NumberSquareThree,
    Bank
  } from 'phosphor-svelte';
  import type { Component } from 'svelte';

  interface Props {
    id?: ModuleId | string;
    icon?: string;
    size?: number | string;
    weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
    color?: string;
    class?: string;
  }

  let {
    id,
    icon,
    size = '1em',
    weight = 'duotone',
    color = 'currentColor',
    class: className = ''
  }: Props = $props();

  const iconMap: Record<string, Component<any>> = {
    // Module IDs
    morse: Broadcast,
    braille: DotsSixVertical,
    semaphore: FlagBanner,
    flags: FlagCheckered,
    states: GlobeSimple,
    cross: Hash,
    cube: Cube,
    polybius: GridFour,
    mobile: DeviceMobile,
    numbers: Calculator,
    shifts: ArrowsClockwise,
    substitution: TextAa,
    freq: ChartBar,
    'freq-ocr': ChartBar,
    sudoku: GridNine,
    nonogram: PaintBrushBroad,
    chess: Horse,
    grille: SquaresFour,
    turtle: Path,
    plotter: Compass,
    graph: Graph,
    words: BookOpen,
    calendar: CalendarBlank,
    facts: Lightbulb,
    colors: Palette,
    elements: Atom,
    settings: Gear,
    help: Question,

    // Launcher shortcuts
    binary: Binary,
    ternary: NumberSquareThree,
    roman: Bank,

    // Phosphor Name aliases
    atom: Atom,
    broadcast: Broadcast,
    dotssixvertical: DotsSixVertical,
    flagbanner: FlagBanner,
    flagcheckered: FlagCheckered,
    globesimple: GlobeSimple,
    globe: GlobeSimple,
    hash: Hash,
    calculator: Calculator,
    arrowsclockwise: ArrowsClockwise,
    textaa: TextAa,
    chartbar: ChartBar,
    gridnine: GridNine,
    paintbrushbroad: PaintBrushBroad,
    horse: Horse,
    gridfour: GridFour,
    squaresfour: SquaresFour,
    path: Path,
    compass: Compass,
    devicemobile: DeviceMobile,
    bookopen: BookOpen,
    calendarblank: CalendarBlank,
    lightbulb: Lightbulb,
    palette: Palette,
    gear: Gear,
    question: Question
  };

  let key = $derived((id || icon || '').toLowerCase());
  let IconComponent = $derived(iconMap[key] ?? Question);
</script>

<IconComponent {size} {weight} {color} class={className} />
