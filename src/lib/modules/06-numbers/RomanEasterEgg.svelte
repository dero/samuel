<script lang="ts">
  import { settings } from '../../state/settings.svelte';
  import { toast } from '../../state/toast.svelte';

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

    const now = Date.now();
    clickTimestamps.push(now);
    clickTimestamps = clickTimestamps.filter((t) => now - t <= 12000);

    settings.vibrate(15);

    // Easter egg Level 2: 20 clicks in <= 12 seconds
    if (clickTimestamps.length >= 20) {
      clickTimestamps = [];
      settings.vibrate([50, 40, 50, 40, 80, 50, 120]);
      toast.show('Roma invicta! 🦅🏛️', { type: 'success', duration: 3200 });
      return;
    }

    // Easter egg Level 1: 5 clicks in <= 3 seconds
    const recent3s = clickTimestamps.filter((t) => now - t <= 3000);
    if (recent3s.length >= 5 && now - lastLevel1Time > 2000) {
      lastLevel1Time = now;
      settings.vibrate([30, 40, 30, 40, 30]);
      toast.show(getRandomQuote(), { type: 'info', duration: 2500 });
    }
  }
</script>

<button
  type="button"
  class="key-btn roman-egg-btn"
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
    <!-- Pediment -->
    <polygon points="12,2 2,7 22,7" stroke-width="1.3" fill="currentColor" fill-opacity="0.12" />
    <!-- Architrave -->
    <line x1="2" y1="7" x2="22" y2="7" stroke-width="1.4" />
    <!-- Columns -->
    <line x1="5.5" y1="7" x2="5.5" y2="15" stroke-width="1.2" />
    <line x1="9.8" y1="7" x2="9.8" y2="15" stroke-width="1.2" />
    <line x1="14.2" y1="7" x2="14.2" y2="15" stroke-width="1.2" />
    <line x1="18.5" y1="7" x2="18.5" y2="15" stroke-width="1.2" />
    <!-- Base -->
    <line x1="2" y1="15" x2="22" y2="15" stroke-width="1.4" />
    <line x1="1" y1="17.5" x2="23" y2="17.5" stroke-width="1.5" />
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
    height: clamp(48px, 7.2vh, 60px);
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
  }

  .key-subval {
    font-size: var(--text-2xs);
    font-weight: 600;
    color: var(--color-text-muted);
    line-height: 1;
    margin-top: 3px;
    letter-spacing: 0.5px;
  }

  .roman-egg-btn:active {
    background-color: var(--color-surface-active);
    box-shadow: inset 0 1.5px 3px rgba(0, 0, 0, 0.7);
    transform: none;
  }
</style>
