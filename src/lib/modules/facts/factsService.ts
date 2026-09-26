import { marked } from 'marked';
import { removeDiacritics } from '../../utils/text';

export interface FactArticle {
  id: string;
  title: string;
  category: string;
  keywords: string[];
  html: string;
  previewText: string;
  plainBody: string;
  normPlainBody: string;
  searchTarget: string;
}

interface FrontMatter {
  id?: string;
  title?: string;
  category?: string;
  keywords?: string;
  [key: string]: string | undefined;
}

function parseFrontMatter(rawContent: string): { data: FrontMatter; body: string } {
  const trimmed = rawContent.trim();
  if (!trimmed.startsWith('---')) {
    return { data: {}, body: trimmed };
  }

  const endMatch = trimmed.indexOf('\n---', 3);
  if (endMatch === -1) {
    return { data: {}, body: trimmed };
  }

  const frontMatterBlock = trimmed.slice(3, endMatch).trim();
  const body = trimmed.slice(endMatch + 4).trim();

  const data: FrontMatter = {};
  for (const line of frontMatterBlock.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const val = line.slice(colonIdx + 1).trim();
      data[key] = val;
    }
  }

  return { data, body };
}

function stripMarkdown(text: string): string {
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/#+\s+/g, '')
    .replace(/\|/g, ' ')
    .replace(/[-*]\s+/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

let cachedArticles: FactArticle[] | null = null;

export function loadFactArticles(): FactArticle[] {
  if (cachedArticles) return cachedArticles;

  const rawFiles = import.meta.glob('/src/content/facts/*.md', {
    query: '?raw',
    eager: true,
    import: 'default'
  }) as Record<string, string>;

  const articles: FactArticle[] = [];

  for (const [filepath, content] of Object.entries(rawFiles)) {
    const { data, body } = parseFrontMatter(content);

    // Derive fallback id from filename if not specified
    const filenameId = filepath.split('/').pop()?.replace(/\.md$/, '') || 'article';
    const id = data.id || filenameId;
    const title = data.title || id;
    const category = data.category || 'Všeobecné';
    const keywords = (data.keywords || '')
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    const html = marked.parse(body, { gfm: true, breaks: true }) as string;
    const plainBody = stripMarkdown(body);
    const normPlainBody = removeDiacritics(plainBody).toLowerCase();
    const previewText = plainBody.slice(0, 160) + (plainBody.length > 160 ? '…' : '');

    // Combine all fields into a single pre-normalized search target for instant lookups
    const searchTarget = removeDiacritics(
      `${title} ${category} ${keywords.join(' ')} ${plainBody}`
    ).toLowerCase();

    articles.push({
      id,
      title,
      category,
      keywords,
      html,
      previewText,
      plainBody,
      normPlainBody,
      searchTarget
    });
  }

  // Sort articles alphabetically by title
  articles.sort((a, b) => a.title.localeCompare(b.title, 'cs'));

  cachedArticles = articles;
  return articles;
}

/**
 * Searches articles using normalized token matching with weighted sorting:
 * 1. Title match
 * 2. Keyword match
 * 3. Body text match
 */
export function searchFacts(query: string, articles: FactArticle[]): FactArticle[] {
  const normQuery = removeDiacritics(query.trim()).toLowerCase();
  if (!normQuery) {
    return articles;
  }

  const queryTokens = normQuery.split(/\s+/).filter(Boolean);

  const scored = articles
    .map((article) => {
      // Must match all tokens
      const matchesAll = queryTokens.every((token) => article.searchTarget.includes(token));
      if (!matchesAll) return null;

      const normTitle = removeDiacritics(article.title).toLowerCase();
      const normCategory = removeDiacritics(article.category).toLowerCase();
      const normKeywords = removeDiacritics(article.keywords.join(' ')).toLowerCase();

      let score = 0;
      if (normTitle.includes(normQuery)) {
        score += 100;
        if (normTitle.startsWith(normQuery)) score += 50;
      } else if (queryTokens.every((t) => normTitle.includes(t))) {
        score += 60;
      }

      if (queryTokens.some((t) => normKeywords.includes(t))) {
        score += 30;
      }

      if (normCategory.includes(normQuery)) {
        score += 20;
      }

      score += 10; // Base match score
      return { article, score };
    })
    .filter((item): item is { article: FactArticle; score: number } => item !== null);

  scored.sort((a, b) => b.score - a.score || a.article.title.localeCompare(b.article.title, 'cs'));
  return scored.map((item) => item.article);
}

export interface HighlightSegment {
  text: string;
  isMatch: boolean;
}

/**
 * Splits text into segments marking matches with the search query (diacritics and case-insensitive).
 */
export function highlightMatches(original: string, query: string): HighlightSegment[] {
  if (!query || !query.trim() || !original) {
    return [{ text: original, isMatch: false }];
  }

  const normQuery = removeDiacritics(query.trim()).toLowerCase();
  const queryTokens = normQuery.split(/\s+/).filter(Boolean);
  if (queryTokens.length === 0) {
    return [{ text: original, isMatch: false }];
  }

  const normOriginal = removeDiacritics(original).toLowerCase();

  // Find all match intervals [start, end)
  const intervals: Array<{ start: number; end: number }> = [];

  for (const token of queryTokens) {
    let pos = 0;
    while (pos < normOriginal.length) {
      const idx = normOriginal.indexOf(token, pos);
      if (idx === -1) break;
      intervals.push({ start: idx, end: idx + token.length });
      pos = idx + 1;
    }
  }

  if (intervals.length === 0) {
    return [{ text: original, isMatch: false }];
  }

  // Merge overlapping or adjacent intervals
  intervals.sort((a, b) => a.start - b.start || b.end - a.end);
  const merged: Array<{ start: number; end: number }> = [];
  for (const int of intervals) {
    if (merged.length === 0) {
      merged.push({ ...int });
    } else {
      const last = merged[merged.length - 1];
      if (int.start <= last.end) {
        last.end = Math.max(last.end, int.end);
      } else {
        merged.push({ ...int });
      }
    }
  }

  // Build segments from original string
  const segments: HighlightSegment[] = [];
  let curr = 0;
  for (const { start, end } of merged) {
    if (start > curr) {
      segments.push({ text: original.slice(curr, start), isMatch: false });
    }
    segments.push({ text: original.slice(start, end), isMatch: true });
    curr = end;
  }
  if (curr < original.length) {
    segments.push({ text: original.slice(curr), isMatch: false });
  }

  return segments;
}

/**
 * Extracts a dynamic contextual snippet around the matched search terms within an article.
 * Centers around the first matched occurrence with clean word boundary snapping.
 */
export function getArticleSnippet(article: FactArticle, query: string, maxLength = 110): string {
  if (!query || !query.trim()) {
    return article.previewText;
  }

  const normQuery = removeDiacritics(query.trim()).toLowerCase();
  const queryTokens = normQuery.split(/\s+/).filter(Boolean);
  if (queryTokens.length === 0) {
    return article.previewText;
  }

  // 1. Try to find the full query in plainBody first
  let matchIdx = article.normPlainBody.indexOf(normQuery);
  let matchLen = normQuery.length;

  // 2. If not found, find the earliest matching query token
  if (matchIdx === -1) {
    let earliestIdx = -1;
    let earliestTokenLen = 0;

    for (const token of queryTokens) {
      const idx = article.normPlainBody.indexOf(token);
      if (idx !== -1 && (earliestIdx === -1 || idx < earliestIdx)) {
        earliestIdx = idx;
        earliestTokenLen = token.length;
      }
    }

    if (earliestIdx !== -1) {
      matchIdx = earliestIdx;
      matchLen = earliestTokenLen;
    }
  }

  // 3. If no match in plainBody (e.g. matched in title or keywords only), fallback to default preview
  if (matchIdx === -1) {
    return article.previewText;
  }

  // 4. Position window so the match is clearly visible
  // Give ~26 chars of context before match, and rest after
  const charsBefore = 26;
  let start = Math.max(0, matchIdx - charsBefore);
  let end = Math.min(article.plainBody.length, start + maxLength);

  if (end === article.plainBody.length) {
    start = Math.max(0, end - maxLength);
  }

  // Snap start to word boundary
  if (start > 0) {
    const spaceIdx = article.plainBody.indexOf(' ', start);
    if (spaceIdx !== -1 && spaceIdx < matchIdx) {
      start = spaceIdx + 1;
    }
  }

  // Snap end to word boundary
  if (end < article.plainBody.length) {
    const spaceIdx = article.plainBody.lastIndexOf(' ', end);
    if (spaceIdx !== -1 && spaceIdx > matchIdx + matchLen) {
      end = spaceIdx;
    }
  }

  let snippet = article.plainBody.slice(start, end).trim();
  if (start > 0) {
    snippet = '… ' + snippet;
  }
  if (end < article.plainBody.length) {
    snippet = snippet + ' …';
  }

  return snippet;
}

