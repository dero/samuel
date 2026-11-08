import {
  MODULES,
  MODULE_KEYWORDS,
  MODULE_SHORTCUTS,
  type ModuleGroupId,
  type ModuleId,
  type ModuleShortcut,
  type NumbersPreset
} from '../types';
import { localSettingsService } from '../services/localSettingsService';

/** One launcher tile: a module, or a shortcut opening a module with a preset. */
export interface LauncherEntry {
  id: string;
  name: string;
  /** Key for <ModuleIcon>. */
  icon: string;
  group: ModuleGroupId;
  target: ModuleId;
  shortcut?: ModuleShortcut;
  /** Normalized words the query is matched against. */
  words: string[];
}

export function normalizeSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

function toWords(phrases: string[]): string[] {
  return phrases.flatMap((p) => normalizeSearch(p).split(/[\s\-–/]+/)).filter(Boolean);
}

export const LAUNCHER_ENTRIES: LauncherEntry[] = [
  ...MODULES.map((m) => ({
    id: m.id,
    name: m.name,
    icon: m.id,
    group: m.group,
    target: m.id,
    words: toWords([m.name, ...(MODULE_KEYWORDS[m.id] ?? [])])
  })),
  ...MODULE_SHORTCUTS.map((s) => ({
    id: s.id,
    name: s.name,
    icon: s.icon,
    group: s.group,
    target: s.target,
    shortcut: s,
    words: toWords([s.name, ...s.keywords])
  }))
];

/** Every query word must start some word of the entry ("pol kri" → Polský kříž). */
export function matchesSearch(entry: LauncherEntry, query: string): boolean {
  const queryWords = normalizeSearch(query).split(/\s+/).filter(Boolean);
  if (queryWords.length === 0) return true;
  return queryWords.every((q) => entry.words.some((w) => w.startsWith(q)));
}

const RECENT_LIMIT = 8;

class LauncherState {
  private appScope = localSettingsService.forSection('app');

  /** Entry ids, most recent first. */
  recent = $state<string[]>(this.appScope.getJSON<string[]>('recent_entries', []));

  /** Preset handed to the target module of a shortcut; the module takes it once. */
  pendingPreset = $state<{ target: ModuleId; preset: NumbersPreset } | null>(null);

  record(id: string) {
    this.recent = [id, ...this.recent.filter((r) => r !== id)].slice(0, RECENT_LIMIT);
    this.appScope.setJSON('recent_entries', this.recent);
  }

  takePreset(target: ModuleId): NumbersPreset | null {
    const pending = this.pendingPreset;
    if (!pending || pending.target !== target) return null;
    this.pendingPreset = null;
    return pending.preset;
  }
}

export const launcher = new LauncherState();
