// Podklad = user data a module works on (DESIGN_SYSTEM §7).
// The active module declares it through <ModuleShell podklad={…}>; the header tab and
// the Podklad panel read this shared state.

export type PodkladKind = 'text' | 'grid' | 'position' | 'image';
export type PodkladMethodId = 'camera' | 'gallery';

export interface PodkladMethod {
  id: PodkladMethodId;
  label: string;
}

/** Ways to bring a podklad in, registered per kind. Text kinds are typed or pasted in the editor. */
export const PODKLAD_METHODS: Record<PodkladKind, PodkladMethod[]> = {
  text: [],
  grid: [],
  position: [],
  image: [
    { id: 'camera', label: 'Vyfotit' },
    { id: 'gallery', label: 'Z galerie' }
  ]
};

interface PodkladBase {
  /** Required podklad: the module opens on the Podklad tab while it is empty. */
  required: boolean;
  empty: boolean;
  /** Name of the data, e.g. "Šifrový text". */
  title: string;
  /** One sentence shown above the empty Podklad panel. */
  description: string;
  example?: string;
  /** Why the podklad needs a look (lights the warning dot); null when it is fine. */
  attention?: string | null;
}

export interface TextPodklad extends PodkladBase {
  kind: 'text' | 'grid' | 'position';
  value: string;
  /** First placeholder line; defaults to `Např. <example>`. */
  placeholder?: string;
  /** Second placeholder line: how the notation is written; defaults to `description`. */
  format?: string;
  autocapitalize?: 'none' | 'characters' | 'words' | 'sentences' | 'off' | 'on';
  /** Called on every edit, so the output above the panel stays live. */
  onSave: (value: string) => void;
}

export interface ImagePodklad extends PodkladBase {
  kind: 'image';
  /** Image URL for the panel preview. */
  preview?: string | null;
  onFile: (file: File) => void;
  onClear: () => void;
}

export type PodkladConfig = TextPodklad | ImagePodklad;

class PodkladState {
  config = $state.raw<PodkladConfig | null>(null);
  /** Height of the OS keyboard covering the layout while the editor has focus. */
  keyboardInset = $state(0);
  /** The editor has focus and the OS keyboard takes part of the screen: the output steps aside. */
  keyboardOpen = $state(false);

  /** Required podklad still missing: the module has nothing to interact with yet. */
  phaseActive = $derived(!!this.config && this.config.required && this.config.empty);

  reset() {
    this.config = null;
    this.keyboardInset = 0;
    this.keyboardOpen = false;
  }
}

export const podklad = new PodkladState();
