<script lang="ts">
  import { settings } from '../../state/settings.svelte';
  import { toast } from '../../state/toast.svelte';

  type BoatState = 'idle' | 'rocking' | 'sinking' | 'submerged' | 'resurfacing';

  let boatState = $state<BoatState>('idle');
  let clickTimestamps = $state<number[]>([]);
  let lastQuoteIndex = -1;

  const NAUTICAL_QUOTES = [
    'Ahoj námořníku! ⛵',
    'Vítr do plachet! 🌬️',
    'Kormidlo na pravobok! 🧭',
    'Kormidlo na levobok! 🧭',
    'Země na obzoru! 🏝️',
    'Plachty napnout! 🗺️',
    'Pozor na mělčinu! ⚓',
    'Sedm stop pod kýlem! 🌊',
    'Slovo kapitána platí! 👨‍✈️',
    'Maják na dohled! 🏮',
    'Mraky na obzoru! ⛅',
    'Kotva vytažena! ⚓',
    'Klidné moře a čisté nebe! 🌅',
    'Vzhůru na palubu! 🚢',
    'Příznivý vítr! 💨⛵',
    'Plnou parou vpřed! 🧭⚡'
  ];

  function getRandomQuote(): string {
    let idx: number;
    do {
      idx = Math.floor(Math.random() * NAUTICAL_QUOTES.length);
    } while (idx === lastQuoteIndex && NAUTICAL_QUOTES.length > 1);
    lastQuoteIndex = idx;
    return NAUTICAL_QUOTES[idx];
  }

  function handleClick() {
    if (boatState === 'sinking' || boatState === 'submerged') return;

    const now = Date.now();
    clickTimestamps.push(now);
    // Keep timestamps from the last 20 seconds
    clickTimestamps = clickTimestamps.filter((t) => now - t <= 20000);

    settings.vibrate(15);

    // Easter Egg Level 2: 60 clicks in <= 20 seconds -> Sinking!
    if (clickTimestamps.length >= 60) {
      triggerSinking();
      return;
    }

    // Easter Egg Level 1: 5 clicks in <= 3 seconds -> Rocking!
    const recent3s = clickTimestamps.filter((t) => now - t <= 3000);
    if (recent3s.length >= 5 && boatState === 'idle') {
      triggerRocking();
    }
  }

  function triggerRocking() {
    boatState = 'rocking';
    settings.vibrate([35, 40, 35, 40, 35]);
    const phrase = getRandomQuote();
    toast.show(phrase, { type: 'info', duration: 2500 });

    setTimeout(() => {
      if (boatState === 'rocking') {
        boatState = 'idle';
      }
    }, 1300);
  }

  function triggerSinking() {
    boatState = 'sinking';
    clickTimestamps = [];
    // SOS in Morse: ... --- ...
    settings.vibrate([60, 40, 60, 40, 60, 80, 120, 80, 120, 80, 120, 80, 60, 40, 60, 40, 60]);
    toast.show('Mayday! Jdeme ke dnu! 🌊🫧', { type: 'warning', duration: 3500 });

    // Transition to submerged after sinking animation
    setTimeout(() => {
      boatState = 'submerged';

      // Resurface after 3.2s
      setTimeout(() => {
        boatState = 'resurfacing';

        setTimeout(() => {
          boatState = 'idle';
          toast.show('Znovu na hladině! ⛵✨', { type: 'success', duration: 2500 });
        }, 850);
      }, 3200);
    }, 1800);
  }
</script>

<button
  type="button"
  class="boat-card"
  class:is-rocking={boatState === 'rocking'}
  class:is-sinking={boatState === 'sinking'}
  class:is-submerged={boatState === 'submerged'}
  class:is-resurfacing={boatState === 'resurfacing'}
  oncontextmenu={(e) => e.preventDefault()}
  onclick={handleClick}
  aria-label="Lodička na vlnách"
  title="Lodička na vlnách"
>
  <svg class="boat-svg" viewBox="0 0 120 90" preserveAspectRatio="xMidYMid meet">
    <!-- Sailboat Assembly (Animated) -->
    <g class="sailboat-body">
      <!-- Mast -->
      <line x1="58" y1="16" x2="58" y2="58" class="line-mast" />

      <!-- Top Pennant Flag -->
      <path d="M 58,17 L 68,20 L 58,23 z" class="fill-pennant" />

      <!-- Mainsail (Back sail) -->
      <path d="M 56,20 L 28,52 H 56 z" class="sail mainsail" />

      <!-- Jib (Front sail) -->
      <path d="M 60,25 L 84,52 H 60 z" class="sail jib" />

      <!-- Hull (Lodní trup) -->
      <path d="M 24,53 Q 58,63 92,53 L 84,65 Q 58,72 32,65 z" class="hull" />
      <!-- Waterline stripe on hull -->
      <path d="M 28,59 Q 58,67 88,59" class="hull-line" />
    </g>

    <!-- Back Wave Layer -->
    <path
      class="wave wave-back"
      d="M -10,63 Q 20,59 50,63 T 110,63 T 140,63"
    />

    <!-- Front Wave Layer -->
    <path
      class="wave wave-front"
      d="M -10,67 Q 25,63 60,67 T 120,67"
    />

    <!-- Secondary subtle ripple -->
    <path
      class="wave wave-subtle"
      d="M 15,73 Q 45,70 75,73 T 115,73"
    />

    <!-- Bubbles for sinking state -->
    {#if boatState === 'sinking' || boatState === 'submerged'}
      <g class="bubbles-group">
        <circle cx="45" cy="70" r="2.5" class="bubble b1" />
        <circle cx="58" cy="74" r="3.5" class="bubble b2" />
        <circle cx="68" cy="68" r="2" class="bubble b3" />
        <circle cx="52" cy="78" r="4" class="bubble b4" />
        <circle cx="75" cy="76" r="2.5" class="bubble b5" />
      </g>
    {/if}
  </svg>
</button>

<style>
  .boat-card {
    grid-column: 1 / span 2;
    grid-row: 1 / span 2;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-surface-2);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding: 0;
    overflow: hidden;
    position: relative;
    cursor: pointer;
    touch-action: manipulation;
    color: var(--color-text-muted);
    opacity: 0.6;
    transition: opacity 0.2s ease, border-color 0.15s ease, background-color 0.15s ease;
  }

  .boat-card:hover {
    opacity: 0.85;
    border-color: var(--color-border-default);
  }

  .boat-card:active {
    opacity: 1;
    background-color: var(--color-surface-active);
  }

  .boat-svg {
    width: 100%;
    height: 100%;
    display: block;
  }

  /* Monochromatic styling */
  .line-mast {
    stroke: currentColor;
    stroke-width: 1.5;
    stroke-linecap: round;
    opacity: 0.7;
  }

  .fill-pennant {
    fill: currentColor;
    opacity: 0.65;
  }

  .sail {
    stroke: currentColor;
    stroke-width: 1.2;
    stroke-linejoin: round;
    fill: currentColor;
  }
  .mainsail {
    fill-opacity: 0.08;
  }
  .jib {
    fill-opacity: 0.05;
  }

  .hull {
    stroke: currentColor;
    stroke-width: 1.3;
    stroke-linejoin: round;
    fill: currentColor;
    fill-opacity: 0.12;
  }

  .hull-line {
    fill: none;
    stroke: currentColor;
    stroke-width: 1;
    opacity: 0.45;
  }

  .wave {
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
  }
  .wave-back {
    stroke-width: 1.2;
    opacity: 0.35;
    animation: waveDriftBack 3.6s ease-in-out infinite alternate;
  }
  .wave-front {
    stroke-width: 1.4;
    opacity: 0.55;
    animation: waveDriftFront 2.6s ease-in-out infinite alternate;
  }
  .wave-subtle {
    stroke-width: 1;
    opacity: 0.25;
    animation: waveDriftBack 4.2s ease-in-out infinite alternate;
  }

  /* Gentle ambient floating */
  .sailboat-body {
    transform-origin: 58px 60px;
    animation: gentleBob 2.8s ease-in-out infinite alternate;
    transition: transform 0.2s ease-out;
  }

  @keyframes gentleBob {
    0% {
      transform: translateY(0px) rotate(-1.5deg);
    }
    100% {
      transform: translateY(-2px) rotate(1.8deg);
    }
  }

  @keyframes waveDriftBack {
    0% {
      transform: translateX(-3px);
    }
    100% {
      transform: translateX(3px);
    }
  }

  @keyframes waveDriftFront {
    0% {
      transform: translateX(3px);
    }
    100% {
      transform: translateX(-3px);
    }
  }

  /* Level 1: Rocking animation */
  .is-rocking .sailboat-body {
    animation: rockBoat 1.25s cubic-bezier(0.36, 0.07, 0.19, 0.97) forwards;
  }

  @keyframes rockBoat {
    0% {
      transform: rotate(0deg);
    }
    15% {
      transform: rotate(-22deg) translateY(-2px);
    }
    35% {
      transform: rotate(20deg) translateY(-1px);
    }
    55% {
      transform: rotate(-14deg);
    }
    75% {
      transform: rotate(9deg);
    }
    90% {
      transform: rotate(-3deg);
    }
    100% {
      transform: rotate(0deg);
    }
  }

  /* Level 2: Sinking animation */
  .is-sinking .sailboat-body {
    animation: sinkBoat 1.75s ease-in forwards;
  }

  @keyframes sinkBoat {
    0% {
      transform: translateY(0) rotate(0deg);
      opacity: 1;
    }
    20% {
      transform: translateY(4px) rotate(22deg);
      opacity: 1;
    }
    45% {
      transform: translateY(18px) rotate(52deg);
      opacity: 0.9;
    }
    75% {
      transform: translateY(42px) rotate(78deg);
      opacity: 0.5;
    }
    100% {
      transform: translateY(75px) rotate(90deg);
      opacity: 0;
    }
  }

  /* Submerged state */
  .is-submerged .sailboat-body {
    opacity: 0;
    transform: translateY(80px);
  }

  /* Resurfacing animation */
  .is-resurfacing .sailboat-body {
    animation: resurfaceBoat 0.85s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }

  @keyframes resurfaceBoat {
    0% {
      transform: translateY(60px) scale(0.65);
      opacity: 0;
    }
    60% {
      transform: translateY(-6px) scale(1.06);
      opacity: 0.8;
    }
    80% {
      transform: translateY(2px) scale(0.98);
      opacity: 0.9;
    }
    100% {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
  }

  /* Bubbles animation */
  .bubble {
    fill: currentColor;
    opacity: 0.5;
    animation: bubbleRise 1.4s ease-out infinite;
  }
  .b1 { animation-delay: 0.1s; }
  .b2 { animation-delay: 0.4s; }
  .b3 { animation-delay: 0.7s; }
  .b4 { animation-delay: 0.25s; }
  .b5 { animation-delay: 0.55s; }

  @keyframes bubbleRise {
    0% {
      transform: translateY(0) scale(0.6);
      opacity: 0.5;
    }
    50% {
      opacity: 0.7;
    }
    100% {
      transform: translateY(-24px) scale(1.3);
      opacity: 0;
    }
  }
</style>
