import {
  MODULES,
  MODULE_GROUPS,
  MODULE_KEYWORDS,
  MODULE_SHORTCUTS,
  type ModuleId,
  type ModuleShortcut,
  type ShortcutPreset
} from '../types';
import { localSettingsService } from '../services/localSettingsService';

/** One launcher tile: a module, or a shortcut opening a module with a preset. */
export interface LauncherEntry {
  id: string;
  name: string;
  /** Key for <ModuleIcon>. */
  icon: string;
  target: ModuleId;
  shortcut?: ModuleShortcut;
  /** Normalized words of the name. */
  nameWords: string[];
  /** Nicknames, variants and the category word, as written (shown as the reason of a match). */
  aliases: string[];
}

export function normalizeSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function toWords(phrase: string): string[] {
  return normalizeSearch(phrase).split(/[\s\-–/]+/).filter(Boolean);
}

const groupName = (id: string) => MODULE_GROUPS.find((g) => g.id === id)?.name;

export const LAUNCHER_ENTRIES: LauncherEntry[] = [
  ...MODULES.map((m) => ({
    id: m.id,
    name: m.name,
    icon: m.id,
    target: m.id,
    nameWords: toWords(m.name),
    aliases: [...(MODULE_KEYWORDS[m.id] ?? []), groupName(m.group) ?? ''].filter(Boolean)
  })),
  ...MODULE_SHORTCUTS.map((s) => ({
    id: s.id,
    name: s.name,
    icon: s.icon,
    target: s.target,
    shortcut: s,
    nameWords: toWords(s.name),
    aliases: [...s.keywords, groupName(s.group) ?? ''].filter(Boolean)
  }))
];

/** A search hit with its weight and, for a nickname match, the phrase that matched. */
export interface RankedEntry {
  entry: LauncherEntry;
  score: number;
  /** The alias that matched, when the name did not. */
  reason?: string;
}

const startsSome = (words: string[], q: string) => words.some((w) => w.startsWith(q));

/**
 * Every query word must start some word of the entry (name or aliases): "pol kri" → Polský kříž.
 * Weight: the name starts with the query, then every query word starts a name word, then a
 * nickname. Ties go to the more recently used entry, then the alphabet.
 */
export function rankEntries(entries: LauncherEntry[], query: string, recent: string[]): RankedEntry[] {
  const q = normalizeSearch(query);
  const queryWords = q.split(/\s+/).filter(Boolean);
  if (queryWords.length === 0) return [];

  const ranked: RankedEntry[] = [];
  for (const entry of entries) {
    const aliasWords = entry.aliases.map(toWords);
    const allWords = [...entry.nameWords, ...aliasWords.flat()];
    if (!queryWords.every((w) => startsSome(allWords, w))) continue;

    if (normalizeSearch(entry.name).startsWith(q)) {
      ranked.push({ entry, score: 3 });
    } else if (queryWords.every((w) => startsSome(entry.nameWords, w))) {
      ranked.push({ entry, score: 2 });
    } else {
      const index = aliasWords.findIndex((words) => queryWords.some((w) => startsSome(words, w)));
      ranked.push({ entry, score: 1, reason: entry.aliases[index] });
    }
  }

  const recency = (id: string) => {
    const i = recent.indexOf(id);
    return i < 0 ? Number.MAX_SAFE_INTEGER : i;
  };
  // On equal weight a shortcut leads: it exists because the task is common ("pol" → Polák)
  const shortcutFirst = (r: RankedEntry) => (r.entry.shortcut ? 0 : 1);
  return ranked.sort(
    (a, b) =>
      b.score - a.score ||
      shortcutFirst(a) - shortcutFirst(b) ||
      recency(a.entry.id) - recency(b.entry.id) ||
      a.entry.name.localeCompare(b.entry.name, 'cs')
  );
}

const RECENT_LIMIT = 8;

class LauncherState {
  private appScope = localSettingsService.forSection('app');

  /** Entry ids, most recent first. */
  recent = $state<string[]>(this.appScope.getJSON<string[]>('recent_entries', []));

  /** Preset handed to the target module of a shortcut; the module takes it once. */
  pendingPreset = $state<{ target: ModuleId; preset: ShortcutPreset } | null>(null);

  record(id: string) {
    this.recent = [id, ...this.recent.filter((r) => r !== id)].slice(0, RECENT_LIMIT);
    this.appScope.setJSON('recent_entries', this.recent);
  }

  takePreset(target: ModuleId): ShortcutPreset | null {
    const pending = this.pendingPreset;
    if (!pending || pending.target !== target) return null;
    this.pendingPreset = null;
    return pending.preset;
  }
}

export const launcher = new LauncherState();
