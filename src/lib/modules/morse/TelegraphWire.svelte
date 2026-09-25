<script lang="ts">
  import { untrack } from 'svelte';
  import { settings } from '../../state/settings.svelte';
  import { toast } from '../../state/toast.svelte';

  export interface PulseEvent {
    type: '.' | '-' | '/';
    id: number;
  }

  interface Props {
    pulse?: PulseEvent | null;
  }

  let { pulse = null }: Props = $props();

  interface ActivePulse {
    id: number;
    type: '.' | '-' | '/';
  }

  let activePulses = $state<ActivePulse[]>([]);
  let clickTimestamps: number[] = [];
  let isOverloaded = $state(false);

  let nextPulseId = 0;
  let lastHandledId = 0;

  interface IconicMessage {
    id: string;
    title: string;
    symbols: ('.' | '-' | '/')[];
  }

  const ICONIC_MESSAGES: IconicMessage[] = [
    {
      id: 'morse-1844',
      title: 'Samuel Morse (1844)',
      // WHAT HATH GOD WROUGHT
      symbols: [
        '.', '-', '-', '/', '.', '.', '.', '.', '/', '.', '-', '/', '-', '/', '/',
        '.', '.', '.', '.', '/', '.', '-', '/', '-', '/', '.', '.', '.', '.', '/', '/',
        '-', '-', '.', '/', '-', '-', '-', '/', '-', '.', '.', '/', '/',
        '.', '-', '-', '/', '.', '-', '.', '/', '-', '-', '-', '/', '.', '.', '-', '/', '-', '-', '.', '/', '.', '.', '.', '.', '/', '-'
      ]
    },
    {
      id: 'rickroll',
      title: 'Rick Astley',
      // NEVER GONNA GIVE YOU UP
      symbols: [
        '-', '.', '/', '.', '/', '.', '.', '.', '-', '/', '.', '/', '.', '-', '.', '/', '/',
        '-', '-', '.', '/', '-', '-', '-', '/', '-', '.', '/', '.', '-', '/', '/',
        '-', '-', '.', '/', '.', '.', '/', '.', '.', '.', '-', '/', '.', '/', '/',
        '-', '.', '-', '-', '/', '-', '-', '-', '/', '.', '.', '-', '/', '/',
        '.', '.', '-', '/', '.', '-', '-', '.'
      ]
    },
    {
      id: 'apollo11',
      title: 'Apollo 11 (1969)',
      // ONE SMALL STEP
      symbols: [
        '-', '-', '-', '/', '-', '.', '/', '.', '/', '/',
        '.', '.', '.', '/', '-', '-', '/', '.', '-', '/', '.', '-', '.', '.', '/', '.', '-', '.', '.', '/', '/',
        '.', '.', '.', '/', '-', '/', '.', '/', '.', '-', '-', '.'
      ]
    },
    {
      id: 'starwars',
      title: 'Star Wars',
      // MAY THE FORCE BE WITH YOU
      symbols: [
        '-', '-', '/', '.', '-', '/', '-', '.', '-', '-', '/', '/',
        '-', '/', '.', '.', '.', '.', '/', '.', '/', '/',
        '.', '.', '-', '.', '/', '-', '-', '-', '/', '.', '-', '.', '/', '-', '.', '-', '.', '/', '.', '/', '/',
        '-', '.', '.', '.', '/', '.', '/', '/',
        '.', '-', '-', '/', '.', '.', '/', '-', '/', '.', '.', '.', '.', '/', '/',
        '-', '.', '-', '-', '/', '-', '-', '-', '/', '.', '.', '-'
      ]
    },
    {
      id: 'radio',
      title: 'Radiotelegrafie',
      // CQ CQ CQ DE OK1SAM
      symbols: [
        '-', '.', '-', '.', '/', '-', '-', '.', '-', '/', '/',
        '-', '.', '-', '.', '/', '-', '-', '.', '-', '/', '/',
        '-', '.', '-', '.', '/', '-', '-', '.', '-', '/', '/',
        '-', '.', '.', '/', '.', '/', '/',
        '-', '-', '-', '/', '-', '.', '-', '/', '.', '-', '-', '-', '-', '/', '.', '.', '.', '/', '.', '-', '/', '-', '-'
      ]
    },
    {
      id: 'titanic',
      title: 'Titanic (1912)',
      // SOS TITANIC
      symbols: [
        '.', '.', '.', '/', '-', '-', '-', '/', '.', '.', '.', '/', '/',
        '-', '/', '.', '.', '/', '-', '/', '.', '-', '/', '-', '.', '/', '.', '.', '/', '-', '.', '-', '.'
      ]
    },
    {
      id: 'coder',
      title: 'Programátoři',
      // HELLO WORLD
      symbols: [
        '.', '.', '.', '.', '/', '.', '/', '.', '-', '.', '.', '/', '.', '-', '.', '.', '/', '-', '-', '-', '/', '/',
        '.', '-', '-', '/', '-', '-', '-', '/', '.', '-', '.', '/', '.', '-', '.', '.', '/', '-', '.', '.'
      ]
    },
    {
      id: 'samuel',
      title: 'Samuel 1844',
      // SAMUEL 1844
      symbols: [
        '.', '.', '.', '/', '.', '-', '/', '-', '-', '/', '.', '.', '-', '/', '.', '/', '.', '-', '.', '.', '/', '/',
        '.', '-', '-', '-', '-', '/', '-', '-', '-', '.', '.', '/', '.', '.', '.', '.', '-', '/', '.', '.', '.', '.', '-'
      ]
    }
  ];

  // Pick iconic message once on component creation; remains unchanged for the session
  const chosenMessage = ICONIC_MESSAGES[Math.floor(Math.random() * ICONIC_MESSAGES.length)];
  let secretSymbolIndex = 0;

  const OVERLOAD_QUOTES = [
    'Přepětí! Sloupy jiskří! ⚡🔌',
    'Zkrat na lince! 💥⚡',
    'Pozor, dráty žhnou! 🔥⚡',
    'Roztavený telegraf! 💥📻',
    'Příliš mnoho voltů! ⚡😱',
    'Klíč se přehřál! 🌡️⚡'
  ];

  let lastOverloadIndex = -1;

  function getRandomOverloadQuote(): string {
    let idx: number;
    do {
      idx = Math.floor(Math.random() * OVERLOAD_QUOTES.length);
    } while (idx === lastOverloadIndex && OVERLOAD_QUOTES.length > 1);
    lastOverloadIndex = idx;
    return OVERLOAD_QUOTES[idx];
  }

  // Watch for new incoming pulses triggered by dominant buttons - purely visual, non-blocking!
  $effect(() => {
    const current = pulse;
    if (!current || current.id === lastHandledId) return;
    lastHandledId = current.id;

    untrack(() => {
      spawnPulse(current.type);
    });
  });

  function spawnPulse(type: '.' | '-' | '/') {
    const internalId = ++nextPulseId;
    // Keep max 6 active pulses on screen to ensure zero DOM overhead
    activePulses = [...activePulses.slice(-5), { id: internalId, type }];

    const duration = type === '-' ? 650 : 540;
    setTimeout(() => {
      activePulses = activePulses.filter((p) => p.id !== internalId);
    }, duration);
  }

  function handleWireClick() {
    const now = Date.now();
    clickTimestamps.push(now);
    // Keep timestamps from the last 20 seconds
    clickTimestamps = clickTimestamps.filter((t) => now - t <= 20000);

    settings.vibrate(20);

    // Advance secret iconic message transmission
    const sym = chosenMessage.symbols[secretSymbolIndex];
    spawnPulse(sym);
    secretSymbolIndex++;

    let completedTransmission = false;
    if (secretSymbolIndex >= chosenMessage.symbols.length) {
      secretSymbolIndex = 0;
      completedTransmission = true;
    }

    // Easter Egg Level 2: 60 clicks in <= 20 seconds -> Spark overload!
    if (clickTimestamps.length >= 60 && !isOverloaded) {
      triggerOverload();
      return;
    }

    // Completed secret transmission milestone - wrap around seamlessly without spoiling the decrypted message
    if (completedTransmission && !isOverloaded) {
      settings.vibrate([30, 40, 30]);
      return;
    }
  }

  function triggerOverload() {
    isOverloaded = true;
    clickTimestamps = [];
    // Crackling electric vibration
    settings.vibrate([45, 25, 75, 25, 95, 30, 140, 40, 70, 25, 95]);
    const quote = getRandomOverloadQuote();
    toast.show(quote, { type: 'warning', duration: 3600 });

    setTimeout(() => {
      isOverloaded = false;
    }, 2500);
  }
</script>

<button
  type="button"
  class="telegraph-strip"
  class:is-overloaded={isOverloaded}
  oncontextmenu={(e) => e.preventDefault()}
  onclick={handleWireClick}
  aria-label="Telegrafní vedení s drátem"
  title="Telegrafní vedení – klikněte pro vysílání"
>
  <svg class="wire-svg" viewBox="0 0 320 48" preserveAspectRatio="none">
    <defs>
      <!-- Glow filter for cyan dot pulse -->
      <filter id="glowDot" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#00d2ff" flood-opacity="1" />
      </filter>

      <!-- Glow filter for amber dash pulse -->
      <filter id="glowDash" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="0" stdDeviation="3.5" flood-color="#f59e0b" flood-opacity="1" />
      </filter>

      <!-- Glow filter for white/gray slash pulse -->
      <filter id="glowSlash" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="0" stdDeviation="2.5" flood-color="#ffffff" flood-opacity="0.9" />
      </filter>

      <!-- Spark filter -->
      <filter id="sparkGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#facc15" flood-opacity="1" />
      </filter>
    </defs>

    <!-- Invisible Touch Hit-Box covering the entire 320x48 area -->
    <rect x="0" y="0" width="320" height="48" fill="rgba(0, 0, 0, 0.001)" />

    <!-- Ground reference dashed line (subtle bottom) -->
    <line x1="12" y1="46" x2="308" y2="46" class="ground-line" />

    <!-- Left Telegraph Pole -->
    <g class="pole pole-left">
      <!-- Main timber post -->
      <line x1="24" y1="6" x2="24" y2="46" class="pole-post" />
      <!-- Horizontal crossarm -->
      <line x1="10" y1="14" x2="38" y2="14" class="pole-crossarm" />
      <!-- Diagonal support braces -->
      <line x1="15" y1="21" x2="24" y2="27" class="pole-brace" />
      <line x1="33" y1="21" x2="24" y2="27" class="pole-brace" />
      <!-- Ceramic insulators -->
      <rect x="13" y="9" width="4" height="5" rx="1" class="insulator" />
      <rect x="31" y="9" width="4" height="5" rx="1" class="insulator" />
    </g>

    <!-- Right Telegraph Pole -->
    <g class="pole pole-right">
      <!-- Main timber post -->
      <line x1="296" y1="6" x2="296" y2="46" class="pole-post" />
      <!-- Horizontal crossarm -->
      <line x1="282" y1="14" x2="310" y2="14" class="pole-crossarm" />
      <!-- Diagonal support braces -->
      <line x1="287" y1="21" x2="296" y2="27" class="pole-brace" />
      <line x1="305" y1="21" x2="296" y2="27" class="pole-brace" />
      <!-- Ceramic insulators -->
      <rect x="285" y="9" width="4" height="5" rx="1" class="insulator" />
      <rect x="303" y="9" width="4" height="5" rx="1" class="insulator" />
    </g>

    <!-- Secondary subtle sag wire (background depth) -->
    <path
      d="M 15,14 Q 160,33 305,14"
      class="wire-secondary"
    />

    <!-- Primary Sagging Wire (Path where pulses travel) -->
    <path
      d="M 24,14 Q 160,38 296,14"
      class="wire-main"
      class:is-active-wire={activePulses.length > 0}
      class:is-sparking-wire={isOverloaded}
    />

    <!-- Active Signal Pulses traveling along the wire (GPU-accelerated CSS offset-path) -->
    {#each activePulses as ap (ap.id)}
      <g class="traveling-pulse pulse-{ap.type === '.' ? 'dot' : ap.type === '-' ? 'dash' : 'slash'}">
        {#if ap.type === '.'}
          <!-- Blue / Cyan Dot -->
          <circle r="4.5" fill="#00d2ff" filter="url(#glowDot)" />
        {:else if ap.type === '-'}
          <!-- Amber / Orange Dash (auto-rotates along wire) -->
          <rect
            x="-8"
            y="-3"
            width="16"
            height="6"
            rx="3"
            fill="#f59e0b"
            filter="url(#glowDash)"
          />
        {:else}
          <!-- White / Gray Slash -->
          <rect
            x="-4"
            y="-4"
            width="8"
            height="8"
            rx="2"
            fill="#ffffff"
            filter="url(#glowSlash)"
          />
        {/if}
      </g>
    {/each}

    <!-- Spark Arcs when Overloaded -->
    {#if isOverloaded}
      <g class="sparks-layer" filter="url(#sparkGlow)">
        <!-- Left pole sparks -->
        <path d="M 14,10 L 8,4 L 16,1 L 12,-4" class="spark s1" />
        <path d="M 32,10 L 38,5 L 30,1 L 38,-3" class="spark s2" />
        <path d="M 24,14 L 18,8 L 26,6" class="spark s3" />

        <!-- Mid-wire electric arcs -->
        <path d="M 90,23 L 94,17 L 88,14 L 96,10" class="spark s4" />
        <path d="M 160,26 L 165,19 L 157,16 L 166,10" class="spark s5" />
        <path d="M 230,23 L 226,17 L 232,14 L 227,10" class="spark s6" />

        <!-- Right pole sparks -->
        <path d="M 286,10 L 280,4 L 288,1 L 284,-4" class="spark s1" />
        <path d="M 304,10 L 310,5 L 302,1 L 310,-3" class="spark s2" />
        <path d="M 296,14 L 300,8 L 293,6" class="spark s3" />
      </g>
    {/if}
  </svg>
</button>

<style>
  .telegraph-strip {
    width: 100%;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.001);
    border: none;
    padding: 0;
    margin-top: var(--space-xs);
    margin-bottom: var(--space-2xs);
    position: relative;
    cursor: pointer;
    touch-action: manipulation;
    user-select: none;
    -webkit-user-select: none;
    color: var(--color-text-muted);
    opacity: 0.6;
    transition: opacity 0.2s ease;
    box-sizing: border-box;
  }

  .telegraph-strip:hover {
    opacity: 0.85;
  }

  .telegraph-strip:active {
    opacity: 1;
  }

  .telegraph-strip.is-overloaded {
    opacity: 1;
  }

  .wire-svg {
    width: 100%;
    height: 100%;
    display: block;
    overflow: visible;
    pointer-events: none;
  }

  /* Ground line */
  .ground-line {
    stroke: currentColor;
    stroke-width: 0.8;
    stroke-dasharray: 2 4;
    opacity: 0.25;
  }

  /* Pole lines */
  .pole-post {
    stroke: currentColor;
    stroke-width: 2.2;
    stroke-linecap: round;
    opacity: 0.65;
  }

  .pole-crossarm {
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    opacity: 0.65;
  }

  .pole-brace {
    stroke: currentColor;
    stroke-width: 1;
    opacity: 0.35;
  }

  .insulator {
    fill: currentColor;
    opacity: 0.7;
  }

  /* Wires */
  .wire-secondary {
    fill: none;
    stroke: currentColor;
    stroke-width: 0.8;
    stroke-dasharray: 3 3;
    opacity: 0.2;
  }

  .wire-main {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.4;
    opacity: 0.55;
    transition: stroke 0.15s ease, opacity 0.15s ease, filter 0.15s ease;
  }

  .wire-main.is-active-wire {
    opacity: 0.85;
  }

  .wire-main.is-sparking-wire {
    stroke: #facc15;
    opacity: 1;
    filter: drop-shadow(0 0 8px rgba(250, 204, 21, 0.95));
  }

  /* Traveling Signal Pulses (GPU accelerated) */
  .traveling-pulse {
    offset-path: path("M 24,14 Q 160,38 296,14");
    offset-rotate: auto;
    animation: travelWire 0.52s ease-in-out forwards;
    will-change: transform, opacity;
    pointer-events: none;
  }

  .traveling-pulse.pulse-dot {
    animation-duration: 0.48s;
  }

  .traveling-pulse.pulse-dash {
    animation-duration: 0.62s;
  }

  .traveling-pulse.pulse-slash {
    animation-duration: 0.52s;
  }

  @keyframes travelWire {
    0% {
      offset-distance: 0%;
      opacity: 0;
    }
    10% {
      opacity: 1;
    }
    88% {
      opacity: 1;
    }
    100% {
      offset-distance: 100%;
      opacity: 0;
    }
  }

  /* Electric Sparks */
  .spark {
    fill: none;
    stroke: #facc15;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    animation: sparkFlicker 0.12s infinite alternate;
  }

  .s2 {
    stroke: #00d2ff;
    animation-delay: 0.05s;
  }
  .s3 {
    animation-delay: 0.08s;
  }
  .s4 {
    stroke: #ffffff;
    animation-delay: 0.03s;
  }
  .s5 {
    stroke: #00d2ff;
    stroke-width: 2.4;
    animation-delay: 0.06s;
  }
  .s6 {
    animation-delay: 0.09s;
  }

  @keyframes sparkFlicker {
    0% {
      opacity: 0.3;
      transform: scale(0.95);
    }
    100% {
      opacity: 1;
      transform: scale(1.08);
    }
  }
</style>
