export const PHONE_KEYS: Record<string, string[]> = {
  '0': [' ', '0'],
  '1': ['.', ',', '?', '!'],
  '2': ['A', 'B', 'C'],
  '3': ['D', 'E', 'F'],
  '4': ['G', 'H', 'I'],
  '5': ['J', 'K', 'L'],
  '6': ['M', 'N', 'O'],
  '7': ['P', 'Q', 'R', 'S'],
  '8': ['T', 'U', 'V'],
  '9': ['W', 'X', 'Y', 'Z'],
  '*': ['*', '+'],
  '#': ['#']
};

export const PHONE_GRID = [
  { digit: '1', keyId: '1' },
  { digit: '2', keyId: '2' },
  { digit: '3', keyId: '3' },
  { digit: '4', keyId: '4' },
  { digit: '5', keyId: '5' },
  { digit: '6', keyId: '6' },
  { digit: '7', keyId: '7' },
  { digit: '8', keyId: '8' },
  { digit: '9', keyId: '9' },
  { digit: '*', keyId: '*' },
  { digit: '0', keyId: '0' },
  { digit: '#', keyId: '#' }
];

export function getPhoneKeyLetters(keyId: string): string[] {
  return PHONE_KEYS[keyId] ?? [];
}
