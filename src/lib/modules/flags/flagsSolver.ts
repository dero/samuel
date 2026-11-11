import type { InterlinearToken } from '../../components/ui/InterlinearText.svelte';
import { LETTER_FLAGS } from './flagsData';

const FLAG_BY_LETTER = new Map(LETTER_FLAGS.map((flag) => [flag.code, flag]));

/** The podklad is the letters themselves: a space is a space, anything else stays and is marked. */
export function flagTextToTokens(text: string): InterlinearToken[] {
  return Array.from(text, (ch): InterlinearToken => {
    if (ch === ' ') return { primary: ' ', isSpace: true };
    const flag = FLAG_BY_LETTER.get(ch.toUpperCase());
    if (flag) return { primary: flag.code, secondary: flag.name };
    return {
      primary: ch === '\n' ? '↵' : ch,
      isError: true,
      errorText: `Znak „${ch}“ nemá vlajku`
    };
  });
}
