<script lang="ts">
  import { settings } from '../../state/settings.svelte';
  import { toast } from '../../state/toast.svelte';

  type TempleState = 'idle' | 'collapsing' | 'collapsed' | 'rebuilding';

  let templeState = $state<TempleState>('idle');
  let clickTimestamps = $state<number[]>([]);
  let lastQuoteIndex = -1;
  let lastLevel1Time = 0;

  const ROMAN_QUOTES = [
    'Senatus Populusque Romanus 🏛️',
    'Veni, vidi, vici! ⚔️',
    'Alea iacta est! 🎲',
    'Ave Caesar! 👑',
    'Carpe diem! ⏳',
    'Per aspera ad astra! ✨',
    'In vino veritas! 🍷',
    'O tempora, o mores! 🏛️',
    'Fortes fortuna adiuvat! 🛡️',
    'Acta, non verba! 📜'
  ];

  function getRandomQuote(): string {
    let idx: number;
    do {
      idx = Math.floor(Math.random() * ROMAN_QUOTES.length);
    } while (idx === lastQuoteIndex && ROMAN_QUOTES.length > 1);
    lastQuoteIndex = idx;
    return ROMAN_QUOTES[idx];
  }

  function handlePointerDown(e: PointerEvent) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();

    if (templeState === 'collapsing' || templeState === 'collapsed' || templeState === 'rebuilding') {
      return;
    }

    const now = Date.now();
    clickTimestamps.push(now);
    // Keep timestamps from the last 20 seconds
    clickTimestamps = clickTimestamps.filter((t) => now - t <= 20000);

    settings.vibrate(15);

    // Easter egg Level 2: 60 clicks in <= 20 seconds -> Temple collapse!
    if (clickTimestamps.length >= 60) {
      triggerCollapse();
      return;
    }

    // Easter egg Level 1: 5 clicks in <= 3 seconds -> Latin quote
    const recent3s = clickTimestamps.filter((t) => now - t <= 3000);
    if (recent3s.length >= 5 && now - lastLevel1Time > 2000) {
      lastLevel1Time = now;
      settings.vibrate([30, 40, 30, 40, 30]);
      toast.show(getRandomQuote(), { type: 'info', duration: 2500 });
    }
  }

  function triggerCollapse() {
    templeState = 'collapsing';
    clickTimestamps = [];
    // Earthquake rumble vibration
    settings.vibrate([70, 30, 90, 30, 120, 40, 150, 50, 100, 40, 60]);
    toast.show('Zemětřesení v Římě! 🏛️💥', { type: 'warning', duration: 3200 });

    // Transition to collapsed after 1.8s
    setTimeout(() => {
      templeState = 'collapsed';

      // Rebuild after 2.6s
      setTimeout(() => {
        templeState = 'rebuilding';

        setTimeout(() => {
          templeState = 'idle';
          toast.show('Řím znovu povstal! 🏛️✨', { type: 'success', duration: 2500 });
        }, 900);
      }, 2600);
    }, 1800);
  }
</script>

<button
  type="button"
  class="key-btn roman-egg-btn"
  class:is-collapsing={templeState === 'collapsing'}
  class:is-collapsed={templeState === 'collapsed'}
  class:is-rebuilding={templeState === 'rebuilding'}
  onpointerdown={handlePointerDown}
  oncontextmenu={(e) => e.preventDefault()}
  aria-label="SPQR dekorace"
  title="SPQR"
>
  <svg
    class="roman-icon"
    viewBox="0 0 24 20"
    fill="none"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <!-- Roof / Pediment & Architrave -->
    <g class="part-pediment">
      <polygon points="12,2 2,7 22,7" stroke-width="1.3" fill="currentColor" fill-opacity="0.12" />
      <line x1="2" y1="7" x2="22" y2="7" stroke-width="1.4" />
    </g>

    <!-- 4 Columns -->
    <g class="part-columns">
      <line x1="5.5" y1="7" x2="5.5" y2="15" stroke-width="1.2" class="col col-1" />
      <line x1="9.8" y1="7" x2="9.8" y2="15" stroke-width="1.2" class="col col-2" />
      <line x1="14.2" y1="7" x2="14.2" y2="15" stroke-width="1.2" class="col col-3" />
      <line x1="18.5" y1="7" x2="18.5" y2="15" stroke-width="1.2" class="col col-4" />
    </g>

    <!-- Stylobate / Base -->
    <g class="part-base">
      <line x1="2" y1="15" x2="22" y2="15" stroke-width="1.4" />
      <line x1="1" y1="17.5" x2="23" y2="17.5" stroke-width="1.5" />
    </g>

    <!-- Rubble fragments when collapsing/collapsed -->
    {#if templeState === 'collapsing' || templeState === 'collapsed'}
      <g class="part-rubble">
        <circle cx="5" cy="16.5" r="0.8" fill="currentColor" class="debris d1" />
        <circle cx="9" cy="17" r="1.1" fill="currentColor" class="debris d2" />
        <circle cx="15" cy="16.5" r="0.9" fill="currentColor" class="debris d3" />
        <circle cx="19" cy="17" r="0.8" fill="currentColor" class="debris d4" />
        <line x1="10.5" y1="16.5" x2="12.5" y2="17.5" stroke-width="0.9" class="debris d5" />
        <line x1="6.5" y1="16.8" x2="8" y2="16.2" stroke-width="0.8" class="debris d6" />
      </g>
    {/if}
  </svg>
  <span class="key-subval">SPQR</span>
</button>

<style>
  .roman-egg-btn {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 58px;
    background-color: var(--color-surface-2);
    color: var(--color-text-muted);
    border: none;
    border-radius: 2px;
    cursor: pointer;
    touch-action: none;
    min-height: var(--tap-min-size);
    font-family: var(--font-mono, monospace);
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.10),
      inset 0 -1px 0 rgba(0, 0, 0, 0.5);
    transition: background-color 0.08s ease, box-shadow 0.08s ease;
    box-sizing: border-box;
    padding: var(--space-2xs) 0;
    user-select: none;
    -webkit-user-select: none;
  }

  .roman-icon {
    width: 22px;
    height: 18px;
    display: block;
    opacity: 0.65;
    overflow: visible;
  }

  .key-subval {
    font-size: var(--text-2xs);
    font-weight: 600;
    color: var(--color-text-muted);
    line-height: 1;
    margin-top: 3px;
    letter-spacing: 0.5px;
    transition: opacity 0.2s ease;
  }

  .roman-egg-btn:active:not(.is-collapsing):not(.is-collapsed):not(.is-rebuilding) {
    background-color: var(--color-surface-active);
    box-shadow: inset 0 1.5px 3px rgba(0, 0, 0, 0.7);
    transform: none;
  }

  /* Earthquake animation */
  .is-collapsing .roman-icon {
    animation: earthquakeShake 0.12s ease-in-out infinite alternate;
  }
  .is-collapsing .key-subval {
    opacity: 0.4;
  }

  @keyframes earthquakeShake {
    0% { transform: translate(-1px, 0.5px) rotate(-1deg); }
    50% { transform: translate(1px, -0.5px) rotate(1deg); }
    100% { transform: translate(-0.5px, -1px) rotate(0.5deg); }
  }

  /* Collapsing columns */
  .is-collapsing .col-1 {
    transform-origin: 5.5px 15px;
    animation: toppleCol1 1.6s cubic-bezier(0.4, 0, 0.6, 1) forwards;
  }
  .is-collapsing .col-2 {
    transform-origin: 9.8px 15px;
    animation: toppleCol2 1.5s cubic-bezier(0.4, 0, 0.6, 1) forwards;
  }
  .is-collapsing .col-3 {
    transform-origin: 14.2px 15px;
    animation: toppleCol3 1.55s cubic-bezier(0.4, 0, 0.6, 1) forwards;
  }
  .is-collapsing .col-4 {
    transform-origin: 18.5px 15px;
    animation: toppleCol4 1.65s cubic-bezier(0.4, 0, 0.6, 1) forwards;
  }

  @keyframes toppleCol1 {
    0% { transform: rotate(0deg); }
    30% { transform: rotate(8deg); }
    100% { transform: rotate(-78deg) translateY(2px); opacity: 0.35; }
  }
  @keyframes toppleCol2 {
    0% { transform: rotate(0deg); }
    25% { transform: rotate(-6deg); }
    100% { transform: rotate(-35deg) translateY(3px); opacity: 0.35; }
  }
  @keyframes toppleCol3 {
    0% { transform: rotate(0deg); }
    35% { transform: rotate(6deg); }
    100% { transform: rotate(42deg) translateY(2.5px); opacity: 0.35; }
  }
  @keyframes toppleCol4 {
    0% { transform: rotate(0deg); }
    20% { transform: rotate(-5deg); }
    100% { transform: rotate(82deg) translateY(2px); opacity: 0.35; }
  }

  /* Collapsing pediment */
  .is-collapsing .part-pediment {
    transform-origin: 12px 7px;
    animation: dropPediment 1.6s cubic-bezier(0.4, 0, 0.6, 1) forwards;
  }

  @keyframes dropPediment {
    0% { transform: translateY(0) rotate(0deg); }
    35% { transform: translateY(1px) rotate(4deg); }
    70% { transform: translateY(7px) rotate(-14deg); opacity: 0.7; }
    100% { transform: translateY(8.5px) rotate(-18deg); opacity: 0.4; }
  }

  /* Collapsed ruins state */
  .is-collapsed .col-1 {
    transform-origin: 5.5px 15px;
    transform: rotate(-78deg) translateY(2px);
    opacity: 0.35;
  }
  .is-collapsed .col-2 {
    transform-origin: 9.8px 15px;
    transform: rotate(-35deg) translateY(3px);
    opacity: 0.35;
  }
  .is-collapsed .col-3 {
    transform-origin: 14.2px 15px;
    transform: rotate(42deg) translateY(2.5px);
    opacity: 0.35;
  }
  .is-collapsed .col-4 {
    transform-origin: 18.5px 15px;
    transform: rotate(82deg) translateY(2px);
    opacity: 0.35;
  }
  .is-collapsed .part-pediment {
    transform-origin: 12px 7px;
    transform: translateY(8.5px) rotate(-18deg);
    opacity: 0.4;
  }
  .is-collapsed .key-subval {
    opacity: 0.3;
  }

  /* Rebuilding state */
  .is-rebuilding .part-pediment {
    transform-origin: 12px 7px;
    animation: risePediment 0.85s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }
  .is-rebuilding .col-1 {
    transform-origin: 5.5px 15px;
    animation: riseCol1 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }
  .is-rebuilding .col-2 {
    transform-origin: 9.8px 15px;
    animation: riseCol2 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }
  .is-rebuilding .col-3 {
    transform-origin: 14.2px 15px;
    animation: riseCol3 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }
  .is-rebuilding .col-4 {
    transform-origin: 18.5px 15px;
    animation: riseCol4 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }
  .is-rebuilding .key-subval {
    opacity: 1;
  }

  @keyframes risePediment {
    0% { transform: translateY(8.5px) rotate(-18deg); opacity: 0.4; }
    55% { transform: translateY(-1.5px) rotate(2deg); opacity: 0.85; }
    100% { transform: translateY(0) rotate(0deg); opacity: 1; }
  }
  @keyframes riseCol1 {
    0% { transform: rotate(-78deg) translateY(2px); opacity: 0.35; }
    100% { transform: rotate(0deg) translateY(0); opacity: 1; }
  }
  @keyframes riseCol2 {
    0% { transform: rotate(-35deg) translateY(3px); opacity: 0.35; }
    100% { transform: rotate(0deg) translateY(0); opacity: 1; }
  }
  @keyframes riseCol3 {
    0% { transform: rotate(42deg) translateY(2.5px); opacity: 0.35; }
    100% { transform: rotate(0deg) translateY(0); opacity: 1; }
  }
  @keyframes riseCol4 {
    0% { transform: rotate(82deg) translateY(2px); opacity: 0.35; }
    100% { transform: rotate(0deg) translateY(0); opacity: 1; }
  }

  /* Rubble */
  .part-rubble {
    opacity: 0.45;
  }
  .is-rebuilding .part-rubble {
    opacity: 0;
    transition: opacity 0.5s ease-out;
  }
</style>
