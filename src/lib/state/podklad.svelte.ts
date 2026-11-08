// Podklad = bulk external data a module works on (DESIGN_SYSTEM §3 Podklad).
// The active module declares it through <ModuleShell podklad={…}>; the header icon,
// the Podklad phase and the editor / image sheet all read this shared state.

export type PodkladKind = 'text' | 'grid' | 'position' | 'image';
export type PodkladMethodId = 'write' | 'camera' | 'gallery';

export interface PodkladMethod {
  id: PodkladMethodId;
  label: string;
}

/** Ways to insert a podklad, registered per kind so every module of that kind gets them. */
export const PODKLAD_METHODS: Record<PodkladKind, PodkladMethod[]> = {
  text: [{ id: 'write', label: 'Napsat nebo vložit' }],
  grid: [{ id: 'write', label: 'Napsat nebo vložit' }],
  position: [{ id: 'write', label: 'Napsat nebo vložit' }],
  image: [
    { id: 'camera', label: 'Vyfotit' },
    { id: 'gallery', label: 'Vybrat z galerie' }
  ]
};

interface PodkladBase {
  /** Required podklad: the module shows the Podklad phase while it is empty. */
  required: boolean;
  empty: boolean;
  /** Name of the data, e.g. "Šifrový text". Used as the phase heading and sheet title. */
  title: string;
  /** One sentence for the Podklad phase. */
  description: string;
  example?: string;
  /** Why the podklad needs a look (lights the warning dot); null when it is fine. */
  attention?: string | null;
}

export interface TextPodklad extends PodkladBase {
  kind: 'text' | 'grid' | 'position';
  value: string;
  placeholder?: string;
  autocapitalize?: 'none' | 'characters' | 'words' | 'sentences' | 'off' | 'on';
  /** Offer copying the editor content (export of a podklad built in the app). */
  copyable?: boolean;
  onSave: (value: string) => void;
}

export interface ImagePodklad extends PodkladBase {
  kind: 'image';
  /** Image URL for the sheet preview. */
  preview?: string | null;
  onFile: (file: File) => void;
  onClear: () => void;
}

export type PodkladConfig = TextPodklad | ImagePodklad;

class PodkladState {
  config = $state.raw<PodkladConfig | null>(null);
  sheetOpen = $state(false);

  phaseActive = $derived(!!this.config && this.config.required && this.config.empty);
  /** Highlight for the header icon: the phase or the sheet is showing. */
  active = $derived(this.sheetOpen || this.phaseActive);

  open() {
    if (this.config) this.sheetOpen = true;
  }

  close() {
    this.sheetOpen = false;
  }

  toggle() {
    if (this.sheetOpen) this.close();
    else this.open();
  }

  reset() {
    this.config = null;
    this.sheetOpen = false;
  }
}

export const podklad = new PodkladState();

/** Shrinks a document card from the phase into the header icon, so players learn where the podklad lives. */
export function flyToPodkladIcon(from: DOMRect) {
  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const icon = document.querySelector<HTMLElement>('[data-podklad-icon]');
  if (!icon) return;
  const to = icon.getBoundingClientRect();

  const size = 72;
  const ghost = document.createElement('div');
  ghost.className = 'podklad-fly-ghost';
  ghost.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">' +
    '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5M9 13h7M9 17h7"/></svg>';
  Object.assign(ghost.style, {
    left: `${from.left + from.width / 2 - size / 2}px`,
    top: `${from.top + from.height / 2 - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`
  });
  document.body.appendChild(ghost);

  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const flight = ghost.animate(
    [
      { transform: 'translate(0, 0) scale(1)', opacity: 0.9 },
      { transform: `translate(${dx}px, ${dy}px) scale(${to.height / size})`, opacity: 0.35 }
    ],
    { duration: 300, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }
  );
  flight.onfinish = () => {
    ghost.remove();
    icon.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }],
      { duration: 220, easing: 'ease-out' }
    );
  };
  flight.oncancel = () => ghost.remove();
}
