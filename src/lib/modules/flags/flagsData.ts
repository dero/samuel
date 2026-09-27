export type FlagColor = 'white' | 'black' | 'red' | 'blue' | 'yellow';

export interface FlagColorInfo {
  id: FlagColor;
  name: string;
  hex: string;
  borderHex?: string;
}

export const FLAG_COLORS: FlagColorInfo[] = [
  { id: 'white', name: 'Bílá', hex: '#FFFFFF', borderHex: '#4a4a58' },
  { id: 'black', name: 'Černá', hex: '#161616', borderHex: '#525266' },
  { id: 'red', name: 'Červená', hex: '#EF4444' },
  { id: 'blue', name: 'Modrá', hex: '#2563EB' },
  { id: 'yellow', name: 'Žlutá', hex: '#FACC15' }
];

export interface FlagItem {
  code: string;
  name: string;
  colors: FlagColor[];
  meaning: string;
  isNumber?: boolean;
  svg: string;
}

export const LETTER_FLAGS: FlagItem[] = [
  {
    code: 'A',
    name: 'Alfa',
    colors: ["white", "blue"],
    meaning: 'Potápěč pod vodou, držte se dál a plujte pomalu.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 180 180">
	<path d="M 18,18 H 162 L 126,90 L 162,162 H 18 z" fill="#000094"/>
	<rect x="18" y="18" width="72" height="144" fill="#fff"/>
	<path d="M 18,18 H 162 L 126,90 L 162,162 H 18 z" fill="none" stroke="#000" stroke-width="3.75" stroke-linejoin="round"/>
</svg>`
  },
  {
    code: 'B',
    name: 'Bravo',
    colors: ["red"],
    meaning: 'Manipuluji s nebezpečným nákladem.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 180 180">
	<path d="M 18,18 H 162 L 126,90 L 162,162 H 18 z" fill="#f00" stroke="#000" stroke-width="3.75" stroke-linejoin="round"/>
</svg>`
  },
  {
    code: 'C',
    name: 'Charlie',
    colors: ["blue", "white", "red"],
    meaning: 'Ano.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 180 180">
	<rect x="18" y="18" width="144" height="144" fill="#000094"/>
	<rect x="18" y="46.8" width="144" height="86.4" fill="#fff"/>
	<rect x="18" y="75.6" width="144" height="28.8" fill="#f00"/>
	<path d="M 18,18 H 162 V 162 H 18 z" fill="none" stroke="#000" stroke-width="3.75" stroke-linejoin="round"/>
</svg>`
  },
  {
    code: 'D',
    name: 'Delta',
    colors: ["yellow", "blue"],
    meaning: 'Držte se dál, manévruji s obtížemi.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 180 180">
	<rect x="18" y="18" width="144" height="144" fill="#fc0"/>
	<rect x="18" y="54" width="144" height="72" fill="#000094"/>
	<path d="M 18,18 H 162 V 162 H 18 z" fill="none" stroke="#000" stroke-width="3.75" stroke-linejoin="round"/>
</svg>`
  },
  {
    code: 'E',
    name: 'Echo',
    colors: ["blue", "red"],
    meaning: 'Měním kurz vpravo.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 180 180">
	<rect x="18" y="18" width="144" height="144" fill="#000094"/>
	<rect x="18" y="90" width="144" height="72" fill="#f00"/>
	<path d="M 18,18 H 162 V 162 H 18 z" fill="none" stroke="#000" stroke-width="3.75" stroke-linejoin="round"/>
</svg>`
  },
  {
    code: 'F',
    name: 'Foxtrot',
    colors: ["white", "red"],
    meaning: 'Nemohu manévrovat, navažte spojení.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 180 180">
	<rect x="18" y="18" width="144" height="144" fill="#fff"/>
	<path d="M 90,18 l 72,72 l -72,72 l -72,-72 z" fill="#f00"/>
	<path d="M 18,18 H 162 V 162 H 18 z" fill="none" stroke="#000" stroke-width="3.75" stroke-linejoin="round"/>
</svg>`
  },
  {
    code: 'G',
    name: 'Golf',
    colors: ["yellow", "blue"],
    meaning: 'Požaduji lodivoda. Rybáři: vytahuji sítě.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 180 180">
<path fill="#000094" d="m18,18h144v144H18"/>
<path stroke="#FC0" stroke-width="24" d="m30,18v144m48,0V18m48,0v144"/>
<path d="M18,18H162V162H18z" fill="none" stroke="#000" stroke-width="3.75" stroke-linejoin="round"/>
</svg>`
  },
  {
    code: 'H',
    name: 'Hotel',
    colors: ["white", "red"],
    meaning: 'Mám na palubě lodivoda.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 180 180">
	<rect x="18" y="18" width="144" height="144" fill="#f00"/>
	<rect x="18" y="18" width="72" height="144" fill="#fff"/>
	<path d="M 18,18 H 162 V 162 H 18 z" fill="none" stroke="#000" stroke-width="3.75" stroke-linejoin="round"/>
</svg>`
  },
  {
    code: 'I',
    name: 'India',
    colors: ["yellow", "black"],
    meaning: 'Měním kurz vlevo.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 180 180">
	<rect x="18" y="18" width="144" height="144" fill="#fc0"/>
	<circle cx="90" cy="90" r="36" fill="#000"/>
	<path d="M 18,18 H 162 V 162 H 18 z" fill="none" stroke="#000" stroke-width="3.75" stroke-linejoin="round"/>
</svg>`
  },
  {
    code: 'J',
    name: 'Juliett',
    colors: ["blue", "white"],
    meaning: 'Požár a nebezpečný náklad, držte se dál.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 180 180">
	<rect x="18" y="18" width="144" height="144" fill="#000094"/>
	<rect x="18" y="66" width="144" height="48" fill="#fff"/>
	<path d="M 18,18 H 162 V 162 H 18 z" fill="none" stroke="#000" stroke-width="3.75" stroke-linejoin="round"/>
</svg>`
  },
  {
    code: 'K',
    name: 'Kilo',
    colors: ["yellow", "blue"],
    meaning: 'Chci s vámi navázat spojení.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 180 180">
	<rect x="18" y="18" width="144" height="144" fill="#000094"/>
	<rect x="18" y="18" width="72" height="144" fill="#fc0"/>
	<path d="M 18,18 H 162 V 162 H 18 z" fill="none" stroke="#000" stroke-width="3.75" stroke-linejoin="round"/>
</svg>`
  },
  {
    code: 'L',
    name: 'Lima',
    colors: ["yellow", "black"],
    meaning: 'Okamžitě zastavte.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 180 180">
<rect x="16" y="16" width="148" height="148" rx="2"/>
<path fill="#FC0" d="m20,20h70v140h70V90H20"/>
</svg>`
  },
  {
    code: 'M',
    name: 'Mike',
    colors: ["blue", "white"],
    meaning: 'Stojím, nemám rychlost.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 180 180">
	<clipPath id="c">
		<path d="M 18,18 H 162 V 162 H 18 z"/>
	</clipPath>
	<rect x="18" y="18" width="144" height="144" fill="#000094"/>
	<path d="M 18,18 L 162,162 M 162,18 L 18,162" clip-path="url(#c)" stroke="#fff" stroke-width="28.8"/>
	<path d="M 18,18 H 162 V 162 H 18 z" fill="none" stroke="#000" stroke-width="3.75" stroke-linejoin="round"/>
</svg>`
  },
  {
    code: 'N',
    name: 'November',
    colors: ["blue", "white"],
    meaning: 'Ne.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 180 180">
	<rect x="18" y="18" width="144" height="144" fill="#fff"/>
	<path d="M 18,18 H 54 V 162 H 90 V 18 H 126 V 162 H 162 V 126 H 18 V 90 H 162 V 54 H 18 z" fill="#000094"/>
	<path d="M 18,18 H 162 V 162 H 18 z" fill="none" stroke="#000" stroke-width="3.75" stroke-linejoin="round"/>
</svg>`
  },
  {
    code: 'O',
    name: 'Oscar',
    colors: ["yellow", "red"],
    meaning: 'Muž přes palubu.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 180 180">
	<rect x="18" y="18" width="144" height="144" fill="#fc0"/>
	<path d="M 18,18 H 162 V 162 z" fill="#f00"/>
	<path d="M 18,18 H 162 V 162 H 18 z" fill="none" stroke="#000" stroke-width="3.75" stroke-linejoin="round"/>
</svg>`
  },
  {
    code: 'P',
    name: 'Papa',
    colors: ["blue", "white"],
    meaning: 'V přístavu: všichni na palubu, vyplouváme. Na moři: sítě zachyceny.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 180 180">
	<rect x="18" y="18" width="144" height="144" fill="#000094"/>
	<rect x="54" y="54" width="72" height="72" fill="#fff"/>
	<path d="M 18,18 H 162 V 162 H 18 z" fill="none" stroke="#000" stroke-width="3.75" stroke-linejoin="round"/>
</svg>`
  },
  {
    code: 'Q',
    name: 'Quebec',
    colors: ["yellow"],
    meaning: 'Loď je zdravá, žádám volný styk s pobřežím.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 180 180">
	<rect x="18" y="18" width="144" height="144" fill="#fc0"/>
	<path d="M 18,18 H 162 V 162 H 18 z" fill="none" stroke="#000" stroke-width="3.75" stroke-linejoin="round"/>
</svg>`
  },
  {
    code: 'R',
    name: 'Romeo',
    colors: ["red", "yellow"],
    meaning: 'Přijal jsem vaši zprávu.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 180 180">
	<rect x="18" y="18" width="144" height="144" fill="#f00"/>
	<path d="M 90,18 V 162 M 18,90 H 162" stroke="#fc0" stroke-width="36"/>
	<path d="M 18,18 H 162 V 162 H 18 z" fill="none" stroke="#000" stroke-width="3.75" stroke-linejoin="round"/>
</svg>`
  },
  {
    code: 'S',
    name: 'Sierra',
    colors: ["white", "blue"],
    meaning: 'Stroj jede zpět.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 180 180">
	<rect x="18" y="18" width="144" height="144" fill="#fff"/>
	<rect x="54" y="54" width="72" height="72" fill="#000094"/>
	<path d="M 18,18 H 162 V 162 H 18 z" fill="none" stroke="#000" stroke-width="3.75" stroke-linejoin="round"/>
</svg>`
  },
  {
    code: 'T',
    name: 'Tango',
    colors: ["red", "white", "blue"],
    meaning: 'Držte se dál, vlečeme sítě v páru.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 180 180">
	<rect x="18" y="18" width="144" height="144" fill="#000094"/>
	<rect x="18" y="18" width="96" height="144" fill="#fff"/>
	<rect x="18" y="18" width="48" height="144" fill="#f00"/>
	<path d="M 18,18 H 162 V 162 H 18 z" fill="none" stroke="#000" stroke-width="3.75" stroke-linejoin="round"/>
</svg>`
  },
  {
    code: 'U',
    name: 'Uniform',
    colors: ["red", "white"],
    meaning: 'Hrozí vám nebezpečí.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 180 180">
	<rect x="18" y="18" width="144" height="144" fill="#fff"/>
	<path d="M 18,18 H 90 V 162 H 162 V 90 H 18 z" fill="#f00"/>
	<path d="M 18,18 H 162 V 162 H 18 z" fill="none" stroke="#000" stroke-width="3.75" stroke-linejoin="round"/>
</svg>`
  },
  {
    code: 'V',
    name: 'Victor',
    colors: ["white", "red"],
    meaning: 'Žádám o pomoc.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 180 180">
	<clipPath id="c">
		<path d="M 18,18 H 162 V 162 H 18 z"/>
	</clipPath>
	<rect x="18" y="18" width="144" height="144" fill="#fff"/>
	<path d="M 18,18 L 162,162 M 162,18 L 18,162" clip-path="url(#c)" stroke="#f00" stroke-width="28.8"/>
	<path d="M 18,18 H 162 V 162 H 18 z" fill="none" stroke="#000" stroke-width="3.75" stroke-linejoin="round"/>
</svg>`
  },
  {
    code: 'W',
    name: 'Whiskey',
    colors: ["blue", "white", "red"],
    meaning: 'Žádám lékařskou pomoc.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 180 180">
	<rect x="18" y="18" width="144" height="144" fill="#000094"/>
	<rect x="42" y="42" width="96" height="96" fill="#fff"/>
	<rect x="66" y="66" width="48" height="48" fill="#f00"/>
	<path d="M 18,18 H 162 V 162 H 18 z" fill="none" stroke="#000" stroke-width="3.75" stroke-linejoin="round"/>
</svg>`
  },
  {
    code: 'X',
    name: 'X-ray',
    colors: ["white", "blue"],
    meaning: 'Přerušte manévr a sledujte mé signály.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 180 180">
	<rect x="18" y="18" width="144" height="144" fill="#fff"/>
	<path d="M 90,18 V 162 M 18,90 H 162" stroke="#000094" stroke-width="36"/>
	<path d="M 18,18 H 162 V 162 H 18 z" fill="none" stroke="#000" stroke-width="3.75" stroke-linejoin="round"/>
</svg>`
  },
  {
    code: 'Y',
    name: 'Yankee',
    colors: ["yellow", "red"],
    meaning: 'Vleču kotvu.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 180 180">
<clipPath id="c"><path d="m18,18h144v144H18"/></clipPath>
<path fill="#FC0" d="m18,18h144v144H18"/>
<path stroke="#F00" stroke-dasharray="18.8" stroke-width="250" clip-path="url(#c)" d="M -18,198 L 198,-18"/>
<path d="m18,18h144v144H18z" fill="none" stroke="#000" stroke-width="3.75" stroke-linejoin="round"/>
</svg>`
  },
  {
    code: 'Z',
    name: 'Zulu',
    colors: ["black", "red", "yellow", "blue"],
    meaning: 'Požaduji remorkér. Rybáři: vrhám sítě.',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 180 180">
<rect x="18" y="18" width="144" height="144" fill="#fc0"/>
<path d="M 18,18 H 162 L 90,90 z" fill="#000"/>
<path d="M 18,162 H 162 L 90,90 z" fill="#f00"/>
<path d="M 18,18 V 162 L 90,90 z" fill="#fc0"/>
<path d="M 162,18 V 162 L 90,90 z" fill="#000094"/>
<path d="M 18,18 H 162 V 162 H 18 z" fill="none" stroke="#000" stroke-width="3.75" stroke-linejoin="round"/>
</svg>`
  },
];

export const NUMBER_FLAGS: FlagItem[] = [
  {
    code: '0',
    name: 'Nadazero',
    colors: ["yellow", "red"],
    meaning: 'Číslice 0',
    isNumber: true,
    svg: `<svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 600 300">
	<path d="M 0,0 V 300 L 600,225 V 75 z" fill="#ff0"/>
	<path d="M 200,25 V 275 L 400,250 V 50 z" fill="#f00"/>
</svg>`
  },
  {
    code: '1',
    name: 'Unaone',
    colors: ["white", "red"],
    meaning: 'Číslice 1',
    isNumber: true,
    svg: `<svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 600 300">
<path d="M 0,0 V 300 L 600,225 V 75 z" fill="#fff"/>
<circle cx="200" cy="150" r="70" fill="#f00"/>
<path d="M 0,0 V 300 L 600,225 V 75 z" fill="none" stroke="#000" stroke-width="6"/>
</svg>`
  },
  {
    code: '2',
    name: 'Bissotwo',
    colors: ["blue", "white"],
    meaning: 'Číslice 2',
    isNumber: true,
    svg: `<svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 600 300">
<path d="M 0,0 V 300 L 600,225 V 75 z" fill="#039"/>
<circle cx="200" cy="150" r="70" fill="#fff"/>
<path d="M 0,0 V 300 L 600,225 V 75 z" fill="none" stroke="#000" stroke-width="6"/>
</svg>`
  },
  {
    code: '3',
    name: 'Terrathree',
    colors: ["red", "white", "blue"],
    meaning: 'Číslice 3',
    isNumber: true,
    svg: `<svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 600 300">
	<path d="M 0,0 V 300 L 200,275 V 25 z" fill="#f00"/>
	<path d="M 200,25 V 275 L 400,250 V 50 z" fill="#fff"/>
	<path d="M 400,50 V 250 L 600,225 V 75 z" fill="#039"/>
</svg>`
  },
  {
    code: '4',
    name: 'Kartefour',
    colors: ["red", "white"],
    meaning: 'Číslice 4',
    isNumber: true,
    svg: `<svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 600 300">
<path d="M 0,0 V 300 L 600,225 V 75 z" fill="#f00"/>
<path d="M 0,115 H 600 V 185 H 0 z M 165,0 H 235 V 300 H 165 z" fill="#fff" clip-path="url(#p4)"/>
<clipPath id="p4"><path d="M 0,0 V 300 L 600,225 V 75 z"/></clipPath>
<path d="M 0,0 V 300 L 600,225 V 75 z" fill="none" stroke="#000" stroke-width="6"/>
</svg>`
  },
  {
    code: '5',
    name: 'Pantafive',
    colors: ["yellow", "blue"],
    meaning: 'Číslice 5',
    isNumber: true,
    svg: `<svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 600 300">
<path d="M 0,0 V 300 L 300,262.5 V 37.5 z" fill="#ff0"/>
<path d="M 300,37.5 V 262.5 L 600,225 V 75 z" fill="#039"/>
<path d="M 0,0 V 300 L 600,225 V 75 z" fill="none" stroke="#000" stroke-width="6"/>
</svg>`
  },
  {
    code: '6',
    name: 'Soxisix',
    colors: ["black", "white"],
    meaning: 'Číslice 6',
    isNumber: true,
    svg: `<svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 600 300">
<path d="M 0,0 V 150 L 600,150 V 75 z" fill="#000"/>
<path d="M 0,150 V 300 L 600,225 V 150 z" fill="#fff"/>
<path d="M 0,0 V 300 L 600,225 V 75 z" fill="none" stroke="#000" stroke-width="6"/>
</svg>`
  },
  {
    code: '7',
    name: 'Setteseven',
    colors: ["yellow", "red"],
    meaning: 'Číslice 7',
    isNumber: true,
    svg: `<svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 600 300">
<path d="M 0,0 V 150 L 600,150 V 75 z" fill="#ff0"/>
<path d="M 0,150 V 300 L 600,225 V 150 z" fill="#f00"/>
<path d="M 0,0 V 300 L 600,225 V 75 z" fill="none" stroke="#000" stroke-width="6"/>
</svg>`
  },
  {
    code: '8',
    name: 'Oktoeight',
    colors: ["white", "red"],
    meaning: 'Číslice 8',
    isNumber: true,
    svg: `<svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 600 300">
<path d="M 0,0 V 300 L 600,225 V 75 z" fill="#fff"/>
<path d="M 0,115 H 600 V 185 H 0 z M 165,0 H 235 V 300 H 165 z" fill="#f00" clip-path="url(#p8)"/>
<clipPath id="p8"><path d="M 0,0 V 300 L 600,225 V 75 z"/></clipPath>
<path d="M 0,0 V 300 L 600,225 V 75 z" fill="none" stroke="#000" stroke-width="6"/>
</svg>`
  },
  {
    code: '9',
    name: 'Novenine',
    colors: ["white", "black", "red", "yellow"],
    meaning: 'Číslice 9',
    isNumber: true,
    svg: `<svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 600 300">
<clipPath id="p9"><path d="M 0,0 V 300 L 600,225 V 75 z"/></clipPath>
<g clip-path="url(#p9)">
  <rect x="0" y="0" width="300" height="150" fill="#fff"/>
  <rect x="0" y="150" width="300" height="150" fill="#000"/>
  <rect x="300" y="0" width="300" height="150" fill="#f00"/>
  <rect x="300" y="150" width="300" height="150" fill="#ff0"/>
</g>
<path d="M 0,0 V 300 L 600,225 V 75 z" fill="none" stroke="#000" stroke-width="6"/>
</svg>`
  },
];

export const ALL_FLAGS: FlagItem[] = [...LETTER_FLAGS, ...NUMBER_FLAGS];

export function getFlag(code: string): FlagItem | undefined {
  return ALL_FLAGS.find((f) => f.code.toUpperCase() === code.toUpperCase());
}
