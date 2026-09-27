/**
 * Generates PNG icons and the social share image from the app logo.
 * Output goes to public/ and is committed; rerun after changing the logo:
 *   yarn icons
 */
import { Resvg } from '@resvg/resvg-js';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PUBLIC_DIR = resolve(import.meta.dirname, '../../public');
const FONT_FILES = [
  '/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf',
  '/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf'
];

const ACCENT = '#00D2FF';

// Logo content in a 512×512 coordinate space, without background.
const LOGO = `
  <circle cx="256" cy="256" r="230" fill="#121212" stroke="${ACCENT}" stroke-width="16" />
  <path d="M 280 100 L 170 270 L 260 270 L 220 410 L 350 230 L 260 230 Z" fill="${ACCENT}" />
`;

function render(svg: string, width: number, file: string): void {
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: 'Noto Sans' }
  })
    .render()
    .asPng();
  writeFileSync(resolve(PUBLIC_DIR, file), png);
  console.log(`✓ ${file} (${png.length} B)`);
}

/** Square icon on a full black background; `scale` shrinks the logo into the safe zone. */
function squareIcon(scale: number, rounded: boolean): string {
  const offset = (512 * (1 - scale)) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <rect width="512" height="512" ${rounded ? 'rx="100"' : ''} fill="#000000" />
    <g transform="translate(${offset} ${offset}) scale(${scale})">${LOGO}</g>
  </svg>`;
}

const ogImage = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#000000" />
  <g transform="translate(90 135) scale(0.703)">${LOGO}</g
  ><text x="530" y="300" font-family="Noto Sans" font-weight="700" font-size="112" fill="#FFFFFF">Samuel</text>
  <text x="534" y="378" font-family="Noto Sans" font-size="44" fill="${ACCENT}">Šifrovací pomůcky</text>
  <text x="534" y="440" font-family="Noto Sans" font-size="32" fill="#B3B3B3">Offline, do terénu, na mobil</text>
</svg>`;

render(squareIcon(1, true), 192, 'icon-192.png');
render(squareIcon(1, true), 512, 'icon-512.png');
// Maskable: launchers crop to a circle/squircle, keep the logo inside the 80 % safe zone.
render(squareIcon(0.78, false), 512, 'icon-maskable-512.png');
// iOS applies its own rounded mask; a transparent or rounded corner would show as black wedges.
render(squareIcon(0.9, false), 180, 'apple-touch-icon.png');
render(ogImage, 1200, 'og-image.png');
