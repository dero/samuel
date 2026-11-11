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
  <svg class="turtle-svg" viewBox="-35.0 -7.0 170.0 112.0" preserveAspectRatio="xMidYMid meet">
    <g class="turtle-body">
      <!-- Main turtle silhouette with shell scute & head cutouts -->
      <path
        class="turtle-main-path"
        d="m93.027 64.953c1.2539-1.0195 1.9727-2.5273 1.9727-4.1367 0-1.9766-1.1172-3.7734-2.8906-4.6758-0.30469-0.16016-0.57422-0.33984-0.85156-0.51562 0.25781-0.49609 0.46875-1.0234 0.57031-1.5859 0.27344-1.543-0.10938-3.1445-1.0508-4.3945-1.0312-1.3633-2.5938-2.1094-4.2031-2.1914-3.2734-12.742-14.828-21.832-28.137-21.832-10.316 0-19.586 5.4609-24.762 13.852-1.5742-1.6797-3.3398-3.8984-4.7188-6.6133-3.0156-5.9414-9.5742-8.6602-15.59-6.4609-6.4375 2.3555-9.8984 9.1797-7.7148 15.207 1.7266 4.75 6.6289 7.7461 11.914 7.4336 5.5703 6.1133 9.7695 8.6172 9.9531 8.7266 0.92578 0.59375 1.875 1.1406 2.8242 1.6797-1.5703 2.9492-2.6953 6.1133-3.2891 9.4688-0.23438 1.3477 0.13672 2.7266 1.0234 3.7812 0.89844 1.0664 2.2109 1.6836 3.6016 1.6836h5.043c2.5234 0 4.7422-1.7578 5.3906-4.2617 0.48438-1.8125 1.2695-3.4922 2.3086-5.0273 4.5586 1.1562 9.2539 1.7852 14.012 1.7852 4.7578 0 9.4531-0.62891 14.012-1.7852 1.0391 1.5312 1.8242 3.2109 2.3047 5.0117 0.65234 2.5156 2.8711 4.2734 5.3945 4.2734h5.043c1.3906 0 2.7031-0.61328 3.6016-1.6836 0.88672-1.0547 1.2578-2.4336 1.0195-3.7852-0.17188-0.96875-0.39062-1.918-0.64453-2.8555 0.20313 0.023438 0.41016 0.0625 0.61328 0.0625 1.1641 0 2.3086-0.40234 3.2422-1.1641zm-10.059-16.473c-1.9727 1.2461-4.0547 2.3359-6.2031 3.2695l-6.4102-11.125 3.4688-6.0078c4.4258 3.3906 7.7188 8.2109 9.1484 13.863zm-33.199-5.9805h17.336l6.1172 10.613c-4.7695 1.6289-9.7969 2.5117-14.781 2.5117-4.9883 0-10.012-0.88672-14.781-2.5117l6.1172-10.613zm20.91-9.9453-3.5742 6.1953h-17.336l-3.5742-6.1953c3.6562-2.0234 7.8359-3.1797 12.242-3.1797s8.5898 1.1523 12.242 3.1797zm-27.625 2.0625 3.4688 6.0078-6.4102 11.125c-2.1523-0.93359-4.2305-2.0195-6.2031-3.2695 1.4297-5.6523 4.7227-10.473 9.1484-13.863zm-23.324 11.219c-0.41797-0.47266-1.0469-0.69922-1.668-0.61328-3.9102 0.55859-7.6484-1.5-8.8828-4.8945-1.4805-4.0898 0.98047-8.7578 5.4805-10.406 4.2812-1.5586 8.7812 0.34766 10.961 4.6367 1.8398 3.6211 4.2578 6.4688 6.2344 8.4219-0.63281 1.4297-1.1523 2.9219-1.5508 4.4727-1.6133 0.082031-3.1758 0.82422-4.207 2.1914-0.38281 0.51172-0.64844 1.0898-0.83984 1.6875-1.5625-1.3594-3.4531-3.1641-5.5273-5.4961zm18.762 23.324c-0.22656 0.875-0.9375 1.4648-1.7656 1.4648h-5.043c-0.28125 0-0.54688-0.125-0.73047-0.34375-0.10156-0.12109-0.26172-0.37109-0.19922-0.71875 0.52734-2.9727 1.5234-5.7773 2.9219-8.3867 2.2773 1.1016 4.6172 2.0391 7.0117 2.8242-0.95312 1.6016-1.6992 3.3203-2.1914 5.1602zm-8.9375-14.547c-0.43359-0.27734-0.72266-0.71484-0.81641-1.2305-0.09375-0.52734 0.03125-1.0508 0.35156-1.4805 0.36328-0.48047 0.91016-0.73828 1.4766-0.73828 0.35547 0 0.71484 0.10156 1.0391 0.30859 8.0391 5.168 17.316 7.8984 26.832 7.8984s18.793-2.7305 26.832-7.8984c0.83594-0.54297 1.9219-0.35938 2.5156 0.42969 0.32031 0.42578 0.44531 0.94922 0.35156 1.4805-0.09375 0.51563-0.38281 0.94922-0.81641 1.2305-8.5312 5.4883-18.789 8.5117-28.887 8.5117-10.094 0-20.352-3.0234-28.887-8.5117zm56.367 15.668c-0.18359 0.21875-0.44922 0.34375-0.73047 0.34375h-5.043c-0.82813 0-1.5391-0.58984-1.7695-1.4766-0.48828-1.8281-1.2344-3.5469-2.1875-5.1484 2.3906-0.78516 4.7305-1.7227 7.0117-2.8242 1.3945 2.6094 2.3906 5.4141 2.918 8.3828 0.0625 0.34766-0.097656 0.60156-0.19922 0.71875zm1.7695-8.3945c-0.35547-0.82812-0.74219-1.6445-1.1641-2.4414 0.66406-0.375 1.3203-0.76562 1.9688-1.1719 0.57812 0.42578 1.1953 0.82812 1.8867 1.1953 0.52734 0.26953 0.86719 0.79688 0.86719 1.3477 0 0.47656-0.21484 0.92188-0.58984 1.2266-0.19531 0.15625-0.60547 0.40625-1.1367 0.29688-0.71484-0.15234-1.293-0.30469-1.8359-0.45312z"
      />
      <!-- Eye -->
      <path
        class="turtle-eye-path"
        d="m18.125 35c0 2.5-3.75 2.5-3.75 0s3.75-2.5 3.75 0z"
      />
    </g>
  </svg>
</button>

<style>
  /* A flat filler in the keypad, not a plastic key (DESIGN_SYSTEM §8) */
  .turtle-card {
    width: 100%;
    height: var(--key-height, 100%);
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
    transition: background-color 0.12s, color 0.15s;
    user-select: none;
    -webkit-user-select: none;
  }

  .turtle-card:hover {
    color: var(--color-text-secondary);
  }

  .turtle-card:active {
    background-color: var(--color-surface-active);
  }

  .turtle-svg {
    width: 100%;
    height: 100%;
    max-height: 100%;
    display: block;
    opacity: 0.72;
    transition: opacity 0.15s ease;
  }

  /* SVG Elements Styling */
  .turtle-main-path {
    fill: currentColor;
    opacity: 0.85;
    transition: opacity 0.15s;
  }

  .turtle-eye-path {
    fill: currentColor;
    opacity: 0.95;
  }

  .turtle-card:hover .turtle-svg {
    opacity: 0.95;
  }

  /* Ambient Idle Bobbing */
  .turtle-body {
    transform-origin: 49px 49px;
    animation: gentleBob 3s ease-in-out infinite alternate;
    transition: transform 0.2s ease-out;
  }

  @keyframes gentleBob {
    0% {
      transform: translateY(0px) rotate(0deg);
    }
    50% {
      transform: translateY(-1.2px) rotate(-1deg);
    }
    100% {
      transform: translateY(0px) rotate(1deg);
    }
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
      transform: rotate(-16deg) scale(1.06);
    }
    35% {
      transform: rotate(16deg) scale(1.06);
    }
    55% {
      transform: rotate(-10deg);
    }
    75% {
      transform: rotate(6deg);
    }
    90% {
      transform: rotate(-2deg);
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
      transform: rotate(25deg) translateY(-2px) scale(1.08);
    }
    45% {
      transform: rotate(60deg) translateY(-4px) scale(1.12);
    }
    75% {
      transform: rotate(160deg) translateY(-2px) scale(1.04);
    }
    90% {
      transform: rotate(190deg) scale(0.96);
    }
    100% {
      transform: rotate(180deg) scale(1);
    }
  }

  /* Upside-down state: lying helplessly on its rounded shell, rocking like a cradle */
  .is-upside-down .turtle-body {
    transform: rotate(180deg);
    animation: shellRock 1.4s ease-in-out infinite alternate;
  }

  @keyframes shellRock {
    0% {
      transform: rotate(168deg) translateY(-1px);
    }
    50% {
      transform: rotate(192deg) translateY(1px);
    }
    100% {
      transform: rotate(172deg) translateY(-0.5px);
    }
  }

  /* Righting animation (rolling back onto feet) */
  .is-righting .turtle-body {
    animation: rightTurtle 0.9s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }

  @keyframes rightTurtle {
    0% {
      transform: rotate(180deg) scale(0.96);
    }
    25% {
      transform: rotate(220deg) scale(0.92);
    }
    60% {
      transform: rotate(345deg) translateY(-4px) scale(1.1);
    }
    85% {
      transform: rotate(365deg) scale(1.04);
    }
    100% {
      transform: rotate(360deg) scale(1);
    }
  }
</style>
