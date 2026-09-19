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
    Scan
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
    cross: Hash,
    polybius: GridFour,
    mobile: DeviceMobile,
    numbers: Calculator,
    shifts: ArrowsClockwise,
    substitution: TextAa,
    'freq-ocr': ChartBar,
    grille: SquaresFour,
    words: BookOpen,
    calendar: CalendarBlank,
    facts: Lightbulb,
    colors: Palette,
    ocr: Scan,
    settings: Gear,
    help: Question,

    // Phosphor Name aliases
    broadcast: Broadcast,
    dotssixvertical: DotsSixVertical,
    flagbanner: FlagBanner,
    flagcheckered: FlagCheckered,
    hash: Hash,
    calculator: Calculator,
    arrowsclockwise: ArrowsClockwise,
    textaa: TextAa,
    chartbar: ChartBar,
    gridfour: GridFour,
    squaresfour: SquaresFour,
    devicemobile: DeviceMobile,
    bookopen: BookOpen,
    calendarblank: CalendarBlank,
    lightbulb: Lightbulb,
    palette: Palette,
    scan: Scan,
    gear: Gear,
    question: Question
  };

  let key = $derived((id || icon || '').toLowerCase());
  let IconComponent = $derived(iconMap[key] ?? Question);
</script>

<IconComponent {size} {weight} {color} class={className} />
