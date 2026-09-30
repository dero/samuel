<script lang="ts">
  import { settings } from '../../state/settings.svelte';
  import { toast } from '../../state/toast.svelte';

  type TurtleAnimState = 'idle' | 'wobbling' | 'flipping' | 'upside_down' | 'righting';

  let turtleAnimState = $state<TurtleAnimState>('idle');
  let clickTimestamps = $state<number[]>([]);
  let lastQuoteIndex = -1;

  const TURTLE_QUOTES = [
    'Pomalu, ale jistě! 🐢',
    'Logo žije! 🐢📐',
    'Krok za krokem k cíli! 🧭',
    'Krunýř vyleštěn! ✨',
    'Papert by měl radost! 🐢',
    'Kam ten spěch? Máme čas! 🐢🌿',
    'Úhel je jen číslo! 📐',
    'Otáčím se na pětníku! 🔄',
    'Kdo si počká, ten se dočká! 🐢',
    'Stopa v písku zůstává! 🐾',
    'Pero píše jako drak! ✏️',
    'Pozor na salát! 🥬',
    'Pravá, levá, vpřed! 🐢⚡',
    'Tvrdý krunýř, měkké srdce! 💚',
    'Všechny cesty vedou k šifře! 🗺️',
    'Želví rychlostí vpřed! 🐢💨'
  ];

  function getRandomQuote(): string {
    let idx: number;
    do {
      idx = Math.floor(Math.random() * TURTLE_QUOTES.length);
    } while (idx === lastQuoteIndex && TURTLE_QUOTES.length > 1);
    lastQuoteIndex = idx;
    return TURTLE_QUOTES[idx];
  }

  function handleClick() {
    if (turtleAnimState === 'flipping' || turtleAnimState === 'upside_down' || turtleAnimState === 'righting') return;

    const now = Date.now();
    clickTimestamps.push(now);
    // Keep timestamps from the last 20 seconds
    clickTimestamps = clickTimestamps.filter((t) => now - t <= 20000);

    settings.vibrate(15);

    // Easter Egg Level 2: 60 clicks in <= 20 seconds -> Flips onto shell!
    if (clickTimestamps.length >= 60) {
      triggerFlipping();
      return;
    }

    // Easter Egg Level 1: 5 clicks in <= 3 seconds -> Wobbling & quote!
    const recent3s = clickTimestamps.filter((t) => now - t <= 3000);
    if (recent3s.length >= 5 && turtleAnimState === 'idle') {
      triggerWobbling();
    }
  }

  function triggerWobbling() {
    turtleAnimState = 'wobbling';
    settings.vibrate([35, 40, 35, 40, 35]);
    const phrase = getRandomQuote();
    toast.show(phrase, { type: 'info', duration: 2500 });

    setTimeout(() => {
      if (turtleAnimState === 'wobbling') {
        turtleAnimState = 'idle';
      }
    }, 1300);
  }

  function triggerFlipping() {
    turtleAnimState = 'flipping';
    clickTimestamps = [];
    // SOS / distress vibration pattern
    settings.vibrate([60, 40, 60, 40, 60, 80, 120, 80, 120, 80, 120, 80, 60, 40, 60, 40, 60]);
    toast.show('Pomoc! Jsem na krunýři! 🐢🙃', { type: 'warning', duration: 3500 });

    // Transition to upside_down after flipping animation
    setTimeout(() => {
      turtleAnimState = 'upside_down';

      // Right itself after 3.2s
      setTimeout(() => {
        turtleAnimState = 'righting';

        setTimeout(() => {
          turtleAnimState = 'idle';
          toast.show('Želvička je zase na nohou! 🐢✨', { type: 'success', duration: 2500 });
        }, 900);
      }, 3200);
    }, 1200);
  }
</script>

<button
  type="button"
  class="turtle-card"
  class:is-wobbling={turtleAnimState === 'wobbling'}
  class:is-flipping={turtleAnimState === 'flipping'}
  class:is-upside-down={turtleAnimState === 'upside_down'}
  class:is-righting={turtleAnimState === 'righting'}
  oncontextmenu={(e) => e.preventDefault()}
  onclick={handleClick}
  aria-label="Dekorativní želvička"
  title="Dekorativní želvička"
>
  <svg class="turtle-svg" viewBox="0 0 64 36" preserveAspectRatio="xMidYMid meet">
    <g class="turtle-body">
      <!-- Tail -->
      <path d="M 30.5,28.5 L 32,33.5 L 33.5,28.5 Z" class="turtle-tail" />

      <!-- Back Flippers -->
      <g class="flipper flipper-bl">
        <path d="M 22,21 C 16,23 15,26 18,27.5 C 21,28.5 23.5,25.5 23.5,23 Z" />
      </g>
      <g class="flipper flipper-br">
        <path d="M 42,21 C 48,23 49,26 46,27.5 C 43,28.5 40.5,25.5 40.5,23 Z" />
      </g>

      <!-- Front Flippers -->
      <g class="flipper flipper-fl">
        <path d="M 22,14 C 15,11 12,12.5 13,16.5 C 14,19.5 19,19 22,17 Z" />
      </g>
      <g class="flipper flipper-fr">
        <path d="M 42,14 C 49,11 52,12.5 51,16.5 C 50,19.5 45,19 42,17 Z" />
      </g>

      <!-- Head & Neck -->
      <g class="turtle-head-group">
        <ellipse cx="32" cy="6" rx="4.2" ry="5.2" class="turtle-head" />
        <!-- Eyes -->
        <circle cx="30.2" cy="5" r="0.8" class="turtle-eye" />
        <circle cx="33.8" cy="5" r="0.8" class="turtle-eye" />
        <circle cx="30.4" cy="4.7" r="0.3" fill="#ffffff" />
        <circle cx="34" cy="4.7" r="0.3" fill="#ffffff" />
      </g>

      <!-- Carapace (Shell) -->
      <g class="turtle-shell-group">
        <!-- Main Carapace Rim & Body -->
        <ellipse cx="32" cy="18" rx="14" ry="11" class="turtle-shell" />
        <!-- Scutes Pattern (Geometric Logo hexagons) -->
        <path
          d="M 32,12 L 36,15 L 36,21 L 32,24 L 28,21 L 28,15 Z"
          class="shell-scute central-scute"
        />
        <!-- Radiating Divider Lines -->
        <line x1="32" y1="12" x2="32" y2="7.2" class="scute-line" />
        <line x1="36" y1="15" x2="45.5" y2="13.2" class="scute-line" />
        <line x1="36" y1="21" x2="45.5" y2="22.8" class="scute-line" />
        <line x1="32" y1="24" x2="32" y2="28.8" class="scute-line" />
        <line x1="28" y1="21" x2="18.5" y2="22.8" class="scute-line" />
        <line x1="28" y1="15" x2="18.5" y2="13.2" class="scute-line" />
      </g>
    </g>

    <!-- Sweat droplets for flipping/upside-down struggle -->
    {#if turtleAnimState === 'flipping' || turtleAnimState === 'upside_down'}
      <g class="sweat-group">
        <path d="M 12,13 C 10,11 10,8.5 12,6.5 C 14,8.5 14,11 12,13 Z" class="sweat s1" />
        <path d="M 52,13 C 50,11 50,8.5 52,6.5 C 54,8.5 54,11 52,13 Z" class="sweat s2" />
      </g>
    {/if}
  </svg>
</button>

<style>
  .turtle-card {
    width: 100%;
    height: 100%;
    max-height: 100%;
    min-height: 0;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-surface-2);
    border: none;
    border-radius: 2px;
    padding: 0;
    overflow: hidden;
    position: relative;
    cursor: pointer;
    touch-action: manipulation;
    color: var(--color-text-muted);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.10),
      inset 0 -1px 0 rgba(0, 0, 0, 0.5);
    transition: background-color 0.12s, box-shadow 0.08s, color 0.15s;
    user-select: none;
    -webkit-user-select: none;
  }

  .turtle-card:hover {
    color: var(--color-text-secondary);
  }

  .turtle-card:active {
    background-color: var(--color-surface-active);
    box-shadow: inset 0 1.5px 3px rgba(0, 0, 0, 0.7);
  }

  .turtle-svg {
    width: 100%;
    height: 100%;
    max-height: 100%;
    display: block;
    opacity: 0.85;
  }

  /* SVG Elements Styling */
  .turtle-tail,
  .flipper path,
  .turtle-head {
    fill: currentColor;
    fill-opacity: 0.22;
    stroke: currentColor;
    stroke-width: 1.1;
    stroke-linejoin: round;
  }

  .turtle-eye {
    fill: currentColor;
    opacity: 0.85;
  }

  .turtle-shell {
    fill: currentColor;
    fill-opacity: 0.14;
    stroke: currentColor;
    stroke-width: 1.25;
  }

  .shell-scute {
    fill: currentColor;
    fill-opacity: 0.10;
    stroke: currentColor;
    stroke-width: 1;
    stroke-linejoin: round;
  }

  .scute-line {
    stroke: currentColor;
    stroke-width: 0.9;
    opacity: 0.6;
    stroke-linecap: round;
  }

  /* Ambient Idle Breathing */
  .turtle-body {
    transform-origin: 32px 18px;
    animation: gentleBreathe 3s ease-in-out infinite alternate;
    transition: transform 0.2s ease-out;
  }

  @keyframes gentleBreathe {
    0% {
      transform: scale(0.97);
    }
    100% {
      transform: scale(1.02);
    }
  }

  /* Flipper pivot points */
  .flipper-fl {
    transform-origin: 22px 15px;
  }
  .flipper-fr {
    transform-origin: 42px 15px;
  }
  .flipper-bl {
    transform-origin: 22px 22px;
  }
  .flipper-br {
    transform-origin: 42px 22px;
  }

  /* Level 1: Wobbling Animation */
  .is-wobbling .turtle-body {
    animation: wobbleTurtle 1.25s cubic-bezier(0.36, 0.07, 0.19, 0.97) forwards;
  }

  @keyframes wobbleTurtle {
    0% {
      transform: rotate(0deg);
    }
    15% {
      transform: rotate(-18deg) scale(1.08);
    }
    35% {
      transform: rotate(18deg) scale(1.08);
    }
    55% {
      transform: rotate(-12deg);
    }
    75% {
      transform: rotate(8deg);
    }
    90% {
      transform: rotate(-3deg);
    }
    100% {
      transform: rotate(0deg);
    }
  }

  /* Level 2: Flipping Animation (rolling onto shell) */
  .is-flipping .turtle-body {
    animation: flipTurtle 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  @keyframes flipTurtle {
    0% {
      transform: rotate(0deg) scale(1);
    }
    20% {
      transform: rotate(-25deg) scale(1.1);
    }
    45% {
      transform: rotate(50deg) translateY(-3px) scale(1.15);
    }
    75% {
      transform: rotate(160deg) translateY(-2px) scale(1.05);
    }
    90% {
      transform: rotate(190deg) scale(0.96);
    }
    100% {
      transform: rotate(180deg) scale(1);
    }
  }

  /* Upside-down state: lying helplessly on back, wriggling */
  .is-upside-down .turtle-body {
    transform: rotate(180deg);
    animation: upsideDownStruggle 1.8s ease-in-out infinite alternate;
  }

  @keyframes upsideDownStruggle {
    0% {
      transform: rotate(172deg) translateY(-1px);
    }
    50% {
      transform: rotate(188deg) translateY(1px);
    }
    100% {
      transform: rotate(175deg) translateY(-0.5px);
    }
  }

  /* Kicking/wriggling legs when upside down */
  .is-upside-down .flipper-fl,
  .is-upside-down .flipper-br {
    animation: flipperKickA 0.3s ease-in-out infinite alternate;
  }

  .is-upside-down .flipper-fr,
  .is-upside-down .flipper-bl {
    animation: flipperKickB 0.3s ease-in-out infinite alternate;
  }

  @keyframes flipperKickA {
    0% {
      transform: rotate(-24deg);
    }
    100% {
      transform: rotate(20deg);
    }
  }

  @keyframes flipperKickB {
    0% {
      transform: rotate(20deg);
    }
    100% {
      transform: rotate(-24deg);
    }
  }

  /* Righting animation (flipping back onto feet) */
  .is-righting .turtle-body {
    animation: rightTurtle 0.9s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }

  @keyframes rightTurtle {
    0% {
      transform: rotate(180deg) scale(0.95);
    }
    25% {
      transform: rotate(225deg) scale(0.9);
    }
    60% {
      transform: rotate(345deg) translateY(-3px) scale(1.1);
    }
    85% {
      transform: rotate(365deg) scale(1.04);
    }
    100% {
      transform: rotate(360deg) scale(1);
    }
  }

  /* Sweat droplets */
  .sweat {
    fill: var(--color-accent-primary);
    opacity: 0.7;
    animation: sweatBounce 0.8s ease-in-out infinite alternate;
  }

  .s1 {
    transform-origin: 12px 10px;
  }

  .s2 {
    transform-origin: 52px 10px;
    animation-delay: 0.3s;
  }

  @keyframes sweatBounce {
    0% {
      transform: translateY(0) scale(0.8);
      opacity: 0.4;
    }
    100% {
      transform: translateY(-2px) scale(1.1);
      opacity: 0.8;
    }
  }
</style>
