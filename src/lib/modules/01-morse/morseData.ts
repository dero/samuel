export interface MorseEntry {
  char: string;
  code: string;
  mnemonic: string;
  syllables: string;
  isDigit?: boolean;
}

export interface MorseTreeNode {
  char: string;
  code: string;
  dot?: MorseTreeNode;
  dash?: MorseTreeNode;
}

export const MORSE_TABLE: Record<string, string> = {
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
  Z: '--..',
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

export const REVERSE_MORSE_TABLE: Record<string, string> = Object.entries(MORSE_TABLE).reduce(
  (acc, [k, v]) => {
    acc[v] = k;
    return acc;
  },
  {} as Record<string, string>
);

export const CZECH_MNEMONICS: MorseEntry[] = [
  { char: 'A', code: '.-', mnemonic: 'Akát', syllables: 'A-kát' },
  { char: 'B', code: '-...', mnemonic: 'Blýskavice', syllables: 'Blýs-ka-vi-ce' },
  { char: 'C', code: '-.-.', mnemonic: 'Cílovníci', syllables: 'Cí-lov-ní-ci' },
  { char: 'D', code: '-..', mnemonic: 'Dálava', syllables: 'Dá-la-va' },
  { char: 'E', code: '.', mnemonic: 'Erb', syllables: 'Erb' },
  { char: 'F', code: '..-.', mnemonic: 'Filipíny', syllables: 'Fi-li-pí-ny' },
  { char: 'G', code: '--.', mnemonic: 'Grónská zem', syllables: 'Grón-ská zem' },
  { char: 'H', code: '....', mnemonic: 'Hrachovina', syllables: 'Hra-cho-vi-na' },
  { char: 'CH', code: '----', mnemonic: 'Chvátá k nám sám', syllables: 'Chvá-tá k nám sám' },
  { char: 'I', code: '..', mnemonic: 'Ibis', syllables: 'I-bis' },
  { char: 'J', code: '.---', mnemonic: 'Jasmín bílý', syllables: 'Jas-mín bí-lý' },
  { char: 'K', code: '-.-', mnemonic: 'Krákorá', syllables: 'Krá-ko-rá' },
  { char: 'L', code: '.-..', mnemonic: 'Lupínek', syllables: 'Lu-pí-nek' },
  { char: 'M', code: '--', mnemonic: 'Mává', syllables: 'Má-vá' },
  { char: 'N', code: '-.', mnemonic: 'Nástup', syllables: 'Nás-tup' },
  { char: 'O', code: '---', mnemonic: 'O náš pán', syllables: 'Ó náš pán' },
  { char: 'P', code: '.--.', mnemonic: 'Papírníci', syllables: 'Pa-pír-ní-ci' },
  { char: 'Q', code: '--.-', mnemonic: 'Kvílí orkán', syllables: 'Kví-lí or-kán' },
  { char: 'R', code: '.-.', mnemonic: 'Rarášek', syllables: 'Ra-rá-šek' },
  { char: 'S', code: '...', mnemonic: 'Sobota', syllables: 'So-bo-ta' },
  { char: 'T', code: '-', mnemonic: 'Tón', syllables: 'Tón' },
  { char: 'U', code: '..-', mnemonic: 'Uličník', syllables: 'U-lič-ník' },
  { char: 'V', code: '...-', mnemonic: 'Vyučený', syllables: 'Vyu-če-ný' },
  { char: 'W', code: '.--', mnemonic: 'Wagón známý', syllables: 'Wa-gón zná-mý' },
  { char: 'X', code: '-..-', mnemonic: 'Xénokratés', syllables: 'Xé-no-kra-tés' },
  { char: 'Y', code: '-.--', mnemonic: 'Ýgar volá', syllables: 'Ý-gar vo-lá' },
  { char: 'Z', code: '--..', mnemonic: 'Zrádná žena', syllables: 'Zrád-ná že-na' },
  { char: '1', code: '.----', mnemonic: 'Jedna', syllables: '1', isDigit: true },
  { char: '2', code: '..---', mnemonic: 'Dva', syllables: '2', isDigit: true },
  { char: '3', code: '...--', mnemonic: 'Tři', syllables: '3', isDigit: true },
  { char: '4', code: '....-', mnemonic: 'Čtyři', syllables: '4', isDigit: true },
  { char: '5', code: '.....', mnemonic: 'Pět', syllables: '5', isDigit: true },
  { char: '6', code: '-....', mnemonic: 'Šest', syllables: '6', isDigit: true },
  { char: '7', code: '--...', mnemonic: 'Sedm', syllables: '7', isDigit: true },
  { char: '8', code: '---..', mnemonic: 'Osm', syllables: '8', isDigit: true },
  { char: '9', code: '----.', mnemonic: 'Devět', syllables: '9', isDigit: true },
  { char: '0', code: '-----', mnemonic: 'Nula', syllables: '0', isDigit: true }
];

export function buildMorseTree(): MorseTreeNode {
  const root: MorseTreeNode = { char: '', code: '' };

  for (const [char, code] of Object.entries(MORSE_TABLE)) {
    let current = root;
    for (let i = 0; i < code.length; i++) {
      const sym = code[i];
      const subCode = code.slice(0, i + 1);
      if (sym === '.') {
        if (!current.dot) {
          current.dot = { char: '', code: subCode };
        }
        current = current.dot;
      } else if (sym === '-') {
        if (!current.dash) {
          current.dash = { char: '', code: subCode };
        }
        current = current.dash;
      }
    }
    current.char = char;
  }

  return root;
}
