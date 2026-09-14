export interface MorseEntry {
  char: string;
  code: string;
  mnemonic: string;
}

export const MORSE_LETTERS: Record<string, string> = {
  A: '.-',
  B: '-...',
  C: '-.-.',
  D: '-..',
  E: '.',
  F: '..-.',
  G: '--.',
  H: '....',
  CH: '----',
  I: '..',
  J: '.---',
  K: '-.-',
  L: '.-..',
  M: '--',
  N: '-.',
  O: '---',
  P: '.--.',
  Q: '--.-',
  R: '.-.',
  S: '...',
  T: '-',
  U: '..-',
  V: '...-',
  W: '.--',
  X: '-..-',
  Y: '-.--',
  Z: '--..'
};

export const MORSE_DIGITS: Record<string, string> = {
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.',
  '0': '-----'
};

export const MORSE_OTHER: Record<string, string> = {
  '.': '.-.-.-',
  ',': '--..--',
  ':': '---...',
  '?': '..--..',
  "'": '.----.',
  '-': '-....-',
  '/': '-..-.',
  '(': '-.--.',
  ')': '-.--.-',
  '"': '.-..-.',
  '=': '-...-',
  '+': '.-.-.',
  '@': '.--.-.',
  '!': '-.-.--',
  ';': '-.-.-.',
  '_': '..--.-',
  '$': '...-..-',
  '&': '.-...'
};

export const MORSE_TABLE: Record<string, string> = {
  ...MORSE_LETTERS,
  ...MORSE_DIGITS,
  ...MORSE_OTHER
};

export const REVERSE_MORSE_LETTERS: Record<string, string> = Object.entries(MORSE_LETTERS).reduce(
  (acc, [k, v]) => {
    acc[v] = k;
    return acc;
  },
  {} as Record<string, string>
);

export const REVERSE_MORSE_DIGITS: Record<string, string> = Object.entries(MORSE_DIGITS).reduce(
  (acc, [k, v]) => {
    acc[v] = k;
    return acc;
  },
  {} as Record<string, string>
);

export const REVERSE_MORSE_OTHER: Record<string, string> = Object.entries(MORSE_OTHER).reduce(
  (acc, [k, v]) => {
    acc[v] = k;
    return acc;
  },
  {} as Record<string, string>
);

export const CZECH_MNEMONICS: MorseEntry[] = [
  { char: 'A', code: '.-', mnemonic: 'Akát' },
  { char: 'B', code: '-...', mnemonic: 'Blýskavice' },
  { char: 'C', code: '-.-.', mnemonic: 'Cílovníci' },
  { char: 'D', code: '-..', mnemonic: 'Dálava' },
  { char: 'E', code: '.', mnemonic: 'Erb' },
  { char: 'F', code: '..-.', mnemonic: 'Filipíny' },
  { char: 'G', code: '--.', mnemonic: 'Grónská zem' },
  { char: 'H', code: '....', mnemonic: 'Hrachovina' },
  { char: 'CH', code: '----', mnemonic: 'Chléb nám dává' },
  { char: 'I', code: '..', mnemonic: 'Ibis' },
  { char: 'J', code: '.---', mnemonic: 'Jasmín bílý' },
  { char: 'K', code: '-.-', mnemonic: 'Krákorá' },
  { char: 'L', code: '.-..', mnemonic: 'Lupíneček' },
  { char: 'M', code: '--', mnemonic: 'Mává' },
  { char: 'N', code: '-.', mnemonic: 'Nástup' },
  { char: 'O', code: '---', mnemonic: 'O náš pán' },
  { char: 'P', code: '.--.', mnemonic: 'Papírníci' },
  { char: 'Q', code: '--.-', mnemonic: 'Kvílí orkán' },
  { char: 'R', code: '.-.', mnemonic: 'Rarášek' },
  { char: 'S', code: '...', mnemonic: 'Sobota' },
  { char: 'T', code: '-', mnemonic: 'Tón' },
  { char: 'U', code: '..-', mnemonic: 'Učený' },
  { char: 'V', code: '...-', mnemonic: 'Vyučený' },
  { char: 'W', code: '.--', mnemonic: 'Wagón klád' },
  { char: 'X', code: '-..-', mnemonic: 'Xénokratés' },
  { char: 'Y', code: '-.--', mnemonic: 'Ýgar mává' },
  { char: 'Z', code: '--..', mnemonic: 'Známá žena' },
  { char: '1', code: '.----', mnemonic: 'Jedna' },
  { char: '2', code: '..---', mnemonic: 'Dva' },
  { char: '3', code: '...--', mnemonic: 'Tři' },
  { char: '4', code: '....-', mnemonic: 'Čtyři' },
  { char: '5', code: '.....', mnemonic: 'Pět' },
  { char: '6', code: '-....', mnemonic: 'Šest' },
  { char: '7', code: '--...', mnemonic: 'Sedm' },
  { char: '8', code: '---..', mnemonic: 'Osm' },
  { char: '9', code: '----.', mnemonic: 'Devět' },
  { char: '0', code: '-----', mnemonic: 'Nula' },
  { char: '.', code: '.-.-.-', mnemonic: 'Tečka' },
  { char: ',', code: '--..--', mnemonic: 'Čárka' },
  { char: '?', code: '..--..', mnemonic: 'Otazník' },
  { char: '!', code: '-.-.--', mnemonic: 'Vykřičník' },
  { char: ':', code: '---...', mnemonic: 'Dvojtečka' },
  { char: ';', code: '-.-.-.', mnemonic: 'Středník' },
  { char: '-', code: '-....-', mnemonic: 'Spojovník / Mínus' },
  { char: '/', code: '-..-.', mnemonic: 'Lomítko' },
  { char: '(', code: '-.--.', mnemonic: 'Závorka (otevírací)' },
  { char: ')', code: '-.--.-', mnemonic: 'Závorka (uzavírací)' },
  { char: '"', code: '.-..-.', mnemonic: 'Uvozovky' },
  { char: "'", code: '.----.', mnemonic: 'Apostrof' },
  { char: '=', code: '-...-', mnemonic: 'Rovnítko' },
  { char: '+', code: '.-.-.', mnemonic: 'Plus' },
  { char: '@', code: '.--.-.', mnemonic: 'Zavináč' },
  { char: '_', code: '..--.-', mnemonic: 'Podtržítko' },
  { char: '$', code: '...-..-', mnemonic: 'Dolar' },
  { char: '&', code: '.-...', mnemonic: 'Ampersand' }
];
