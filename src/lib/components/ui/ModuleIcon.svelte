<script lang="ts">
  import type { ModuleId } from '../../types';
  import {
    Broadcast,
    DotsSixVertical,
    FlagBanner,
    FlagCheckered,
    Hash,
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
    GridNine,
    Atom
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
    polybius: GridFour,
    mobile: DeviceMobile,
    numbers: Calculator,
    shifts: ArrowsClockwise,
    substitution: TextAa,
    freq: ChartBar,
    'freq-ocr': ChartBar,
    sudoku: GridNine,
    grille: SquaresFour,
    turtle: Path,
    words: BookOpen,
    calendar: CalendarBlank,
    facts: Lightbulb,
    colors: Palette,
    elements: Atom,
    settings: Gear,
    help: Question,

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
    gridfour: GridFour,
    squaresfour: SquaresFour,
    path: Path,
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
