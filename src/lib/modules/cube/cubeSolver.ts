import type {
  AxisSign,
  CubeCellValue,
  CubeCoord,
  CubeNode,
  CubeSlot,
  CubeVariant,
  GridFillOrder,
  RotationDirection,
  RotationMatrix,
  ShellElementType,
  ShellFillOrder
} from './cubeData';
import { AXIS_LABELS, DIRECTION_LABELS } from './cubeData';
import { parseNotation, serializeNotation } from '../../utils/notation';

export const IDENTITY_ROTATION: RotationMatrix = [1, 0, 0, 0, 1, 0, 0, 0, 1];

const ROTATION_STEP: Record<RotationDirection, RotationMatrix> = {
  // Push front toward left: Right (+x) moves to Front (-z), Front (-z) moves to Left (-x)
  left: [0, 0, 1, 0, 1, 0, -1, 0, 0],
  // Push front toward right: Left (-x) moves to Front (-z), Front (-z) moves to Right (+x)
  right: [0, 0, -1, 0, 1, 0, 1, 0, 0],
  // Push front upward: Bottom (+y) moves to Front (-z), Front (-z) moves to Top (-y)
  up: [1, 0, 0, 0, 0, 1, 0, -1, 0],
  // Push front downward: Top (-y) moves to Front (-z), Front (-z) moves to Bottom (+y)
  down: [1, 0, 0, 0, 0, -1, 0, 1, 0],
  // Rotate front face counter-clockwise around screen Z: Top (-y) -> Left (-x)
  'roll-ccw': [0, 1, 0, -1, 0, 0, 0, 0, 1],
  // Rotate front face clockwise around screen Z: Top (-y) -> Right (+x)
  'roll-cw': [0, -1, 0, 1, 0, 0, 0, 0, 1]
};

export function isIdentityRotation(rot: RotationMatrix): boolean {
  return rot.every((v, i) => v === IDENTITY_ROTATION[i]);
}

export function isValidRotationMatrix(rot: unknown): rot is RotationMatrix {
  if (!Array.isArray(rot) || rot.length !== 9) return false;
  return rot.every((v) => v === -1 || v === 0 || v === 1);
}

function multiplyMatrices(a: RotationMatrix, b: RotationMatrix): RotationMatrix {
  const out = new Array(9).fill(0) as RotationMatrix;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      out[r * 3 + c] =
        a[r * 3 + 0] * b[0 * 3 + c] +
        a[r * 3 + 1] * b[1 * 3 + c] +
        a[r * 3 + 2] * b[2 * 3 + c];
    }
  }
  return out;
}

export function rotateCube(rot: RotationMatrix, dir: RotationDirection): RotationMatrix {
  return multiplyMatrices(ROTATION_STEP[dir], rot);
}

export function applyRotation(rot: RotationMatrix, c: CubeCoord): CubeCoord {
  const clampSign = (n: number): AxisSign => (n > 0 ? 1 : n < 0 ? -1 : 0);
  return {
    x: clampSign(rot[0] * c.x + rot[1] * c.y + rot[2] * c.z),
    y: clampSign(rot[3] * c.x + rot[4] * c.y + rot[5] * c.z),
    z: clampSign(rot[6] * c.x + rot[7] * c.y + rot[8] * c.z)
  };
}

export interface FloatCoord {
  x: number;
  y: number;
  z: number;
}

export function applyFloatRotation(mat: readonly number[], c: CubeCoord): FloatCoord {
  return {
    x: mat[0] * c.x + mat[1] * c.y + mat[2] * c.z,
    y: mat[3] * c.x + mat[4] * c.y + mat[5] * c.z,
    z: mat[6] * c.x + mat[7] * c.y + mat[8] * c.z
  };
}

function multiplyFloatMatrices(a: readonly number[], b: readonly number[]): number[] {
  const out = new Array(9).fill(0);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      out[r * 3 + c] =
        a[r * 3 + 0] * b[0 * 3 + c] +
        a[r * 3 + 1] * b[1 * 3 + c] +
        a[r * 3 + 2] * b[2 * 3 + c];
    }
  }
  return out;
}

/**
 * Smoothly interpolates between two SO(3) rotation matrices via shortest-arc axis-angle
 * (Rodrigues' rotation formula). Works identically for single 90° steps and multi-step resets.
 */
export function interpolateRotationMatrix(
  from: readonly number[],
  to: readonly number[],
  t: number
): number[] {
  if (t <= 0) return [...from];
  if (t >= 1) return [...to];

  // Relative rotation D = to * from^T
  const d = [
    to[0] * from[0] + to[1] * from[1] + to[2] * from[2],
    to[0] * from[3] + to[1] * from[4] + to[2] * from[5],
    to[0] * from[6] + to[1] * from[7] + to[2] * from[8],
    to[3] * from[0] + to[4] * from[1] + to[5] * from[2],
    to[3] * from[3] + to[4] * from[4] + to[5] * from[5],
    to[3] * from[6] + to[4] * from[7] + to[5] * from[8],
    to[6] * from[0] + to[7] * from[1] + to[8] * from[2],
    to[6] * from[3] + to[7] * from[4] + to[8] * from[5],
    to[6] * from[6] + to[7] * from[7] + to[8] * from[8]
  ];

  const trace = d[0] + d[4] + d[8];
  const cosAngle = Math.max(-1, Math.min(1, (trace - 1) / 2));
  const fullAngle = Math.acos(cosAngle);
  if (fullAngle < 1e-4) return [...to];

  let kx = 0;
  let ky = 0;
  let kz = 0;

  if (Math.PI - fullAngle < 1e-3) {
    // 180-degree rotation: extract axis from largest diagonal column of (D + I)
    let bestCol = 0;
    if (d[4] > d[0]) bestCol = 1;
    if (d[8] > d[bestCol * 3 + bestCol]) bestCol = 2;
    const ux = d[0 * 3 + bestCol] + (bestCol === 0 ? 1 : 0);
    const uy = d[1 * 3 + bestCol] + (bestCol === 1 ? 1 : 0);
    const uz = d[2 * 3 + bestCol] + (bestCol === 2 ? 1 : 0);
    const len = Math.hypot(ux, uy, uz) || 1;
    kx = ux / len;
    ky = uy / len;
    kz = uz / len;
  } else {
    const denom = 2 * Math.sin(fullAngle);
    kx = (d[7] - d[5]) / denom;
    ky = (d[2] - d[6]) / denom;
    kz = (d[3] - d[1]) / denom;
  }

  const theta = fullAngle * t;
  const s = Math.sin(theta);
  const oneMinusC = 1 - Math.cos(theta);

  // Rodrigues: R = I + s*K + (1-c)*K^2
  const r = [
    1 - oneMinusC * (ky * ky + kz * kz),
    -s * kz + oneMinusC * kx * ky,
    s * ky + oneMinusC * kx * kz,
    s * kz + oneMinusC * kx * ky,
    1 - oneMinusC * (kx * kx + kz * kz),
    -s * kx + oneMinusC * ky * kz,
    -s * ky + oneMinusC * kx * kz,
    s * kx + oneMinusC * ky * kz,
    1 - oneMinusC * (kx * kx + ky * ky)
  ];

  return multiplyFloatMatrices(r, from);
}

export function coordToId(c: CubeCoord): string {
  return `${c.x},${c.y},${c.z}`;
}

export function classifyCoord(c: CubeCoord): ShellElementType | 'core' {
  const nonZero = (c.x !== 0 ? 1 : 0) + (c.y !== 0 ? 1 : 0) + (c.z !== 0 ? 1 : 0);
  if (nonZero === 0) return 'core';
  if (nonZero === 1) return 'face';
  if (nonZero === 2) return 'edge';
  return 'corner';
}

const SIGNS: AxisSign[] = [-1, 0, 1];

const FACE_ORDER: CubeCoord[] = [
  { x: 0, y: 0, z: -1 }, // Front
  { x: 0, y: -1, z: 0 }, // Top
  { x: -1, y: 0, z: 0 }, // Left
  { x: 1, y: 0, z: 0 },  // Right
  { x: 0, y: 1, z: 0 },  // Bottom
  { x: 0, y: 0, z: 1 }   // Back
];

function makeSlot(coord: CubeCoord): CubeSlot {
  return {
    id: coordToId(coord),
    coord,
    elementType: classifyCoord(coord)
  };
}

/**
 * Returns the canonical slots of the cube in fill order.
 * For `grid27`: 27 slots; for `shell26`: 26 slots (without the core `(0,0,0)`).
 */
export function getCanonicalSlots(
  variant: CubeVariant,
  gridFillOrder: GridFillOrder,
  shellFillOrder: ShellFillOrder
): CubeSlot[] {
  if (variant === 'grid27') {
    const slots: CubeSlot[] = [];
    if (gridFillOrder === 'top-row-col') {
      for (const y of SIGNS) {
        for (const z of SIGNS) {
          for (const x of SIGNS) {
            slots.push(makeSlot({ x, y, z }));
          }
        }
      }
    } else {
      for (const z of SIGNS) {
        for (const y of SIGNS) {
          for (const x of SIGNS) {
            slots.push(makeSlot({ x, y, z }));
          }
        }
      }
    }
    return slots;
  }

  // shell26 (8 corners + 12 edges + 6 faces)
  const layerShellSlots: CubeSlot[] = [];
  for (const z of SIGNS) {
    for (const y of SIGNS) {
      for (const x of SIGNS) {
        if (x === 0 && y === 0 && z === 0) continue;
        layerShellSlots.push(makeSlot({ x, y, z }));
      }
    }
  }

  if (shellFillOrder === 'shell-layers') {
    return layerShellSlots;
  }

  const faces = FACE_ORDER.map(makeSlot);
  const edges = layerShellSlots.filter((s) => s.elementType === 'edge');
  const corners = layerShellSlots.filter((s) => s.elementType === 'corner');

  if (shellFillOrder === 'corners-edges-faces') {
    return [...corners, ...edges, ...faces];
  }
  return [...faces, ...edges, ...corners];
}

/**
 * Maps `letters` onto canonical `slots` in order.
 * On the 27-slot cube (`grid27`), when using a 26-letter alphabet (e.g. `english-26`),
 * the center core `(0,0,0)` stays empty so all 26 outer nodes hold one letter.
 */
export function getDefaultSlotChars(slots: CubeSlot[], letters: string[]): string[] {
  const skipCore = slots.length === 27 && letters.length <= 26;
  let letterIdx = 0;
  return slots.map((slot) => {
    if (skipCore && slot.elementType === 'core') return '';
    return letters[letterIdx++] ?? '';
  });
}

export function buildCubeNodes(
  slots: CubeSlot[],
  letters: string[],
  customCells: Record<string, CubeCellValue> | null,
  rot: RotationMatrix
): CubeNode[] {
  const defaultChars = getDefaultSlotChars(slots, letters);
  return slots.map((slot, index) => {
    const custom = customCells?.[slot.id];
    const char = custom !== undefined ? custom.char : (defaultChars[index] ?? '');
    const tag = custom !== undefined ? custom.tag : undefined;
    return {
      ...slot,
      char,
      tag,
      viewCoord: applyRotation(rot, slot.coord)
    };
  });
}

/**
 * Serializes current cell contents in fill order for Podklad (`A,B,...,M,,N,...,Z` or `B/K`).
 * Empty slots are serialized as empty fields (`,,` between adjacent populated cells) matching
 * Samuel's shared notation; returns `''` if every node is empty.
 */
export function serializeCubePodklad(nodes: CubeNode[]): string {
  const hasAnyContent = nodes.some((n) => n.char.trim() !== '' || Boolean(n.tag?.trim()));
  if (!hasAnyContent) return '';

  const fields = nodes.map((n) => {
    const ch = n.char.trim();
    const tg = n.tag?.trim();
    if (!ch && !tg) return '';
    return tg ? `${ch}/${tg}` : ch;
  });

  return serializeNotation(fields);
}

export interface ParsedPodkladResult {
  cells: Record<string, CubeCellValue> | null;
  warning: string | null;
}

/**
 * Parses Podklad text into `customCells` keyed by canonical slot ID.
 * Empty fields (`,,`), `.`, or empty text clear slots (`{ char: '' }`);
 * `/TAG` attaches `TAG` to the default letter for that slot.
 */
export function parseCubePodklad(
  text: string,
  slots: CubeSlot[],
  letters: string[]
): ParsedPodkladResult {
  const defaultChars = getDefaultSlotChars(slots, letters);
  const cells: Record<string, CubeCellValue> = {};

  if (!text.trim()) {
    for (const slot of slots) {
      cells[slot.id] = { char: '' };
    }
    return { cells, warning: null };
  }

  const tokens = parseNotation(text);

  slots.forEach((slot, i) => {
    const raw = tokens[i];
    if (raw === undefined || raw === '') {
      cells[slot.id] = { char: '' };
      return;
    }

    const slashIdx = raw.indexOf('/');
    let charPart = slashIdx >= 0 ? raw.slice(0, slashIdx).trim() : raw;
    const tagPart = slashIdx >= 0 ? raw.slice(slashIdx + 1).trim() : '';

    if (charPart === '' && slashIdx >= 0 && tagPart !== '') {
      // `/TAG` keeps the default letter for that slot
      charPart = defaultChars[i] ?? '';
    } else if (charPart === '.' || charPart === '␣' || charPart === '-') {
      charPart = '';
    }

    cells[slot.id] = tagPart ? { char: charPart, tag: tagPart } : { char: charPart };
  });

  const warning =
    tokens.length > slots.length
      ? `${tokens.length} položek, krychle má ${slots.length}`
      : null;

  return { cells, warning };
}

export interface AxisFilter {
  x: AxisSign | null;
  y: AxisSign | null;
  z: AxisSign | null;
}

export function hasActiveAxisFilter(filter: AxisFilter): boolean {
  return filter.x !== null || filter.y !== null || filter.z !== null;
}

export function matchesFilter(
  node: CubeNode,
  variant: CubeVariant,
  axisFilter: AxisFilter,
  shellTypeFilter: ShellElementType | null
): boolean {
  const v = node.viewCoord;
  if (variant === 'shell26' && shellTypeFilter !== null && node.elementType !== shellTypeFilter) {
    return false;
  }
  if (axisFilter.x !== null && v.x !== axisFilter.x) return false;
  if (axisFilter.y !== null && v.y !== axisFilter.y) return false;
  if (axisFilter.z !== null && v.z !== axisFilter.z) return false;
  return true;
}

/**
 * Human-readable coordinate description in current view orientation.
 */
export function describeViewCoord(viewCoord: CubeCoord, variant: CubeVariant): string {
  if (variant === 'grid27') {
    const zLabel = AXIS_LABELS.z[String(viewCoord.z) as '-1' | '0' | '1'];
    const yLabel = AXIS_LABELS.y[String(viewCoord.y) as '-1' | '0' | '1'];
    const xLabel = AXIS_LABELS.x[String(viewCoord.x) as '-1' | '0' | '1'];
    return `${zLabel} · ${yLabel} · ${xLabel}`;
  }

  const dirs: string[] = [];
  if (viewCoord.z !== 0) dirs.push(DIRECTION_LABELS.z[String(viewCoord.z) as '-1' | '1']);
  if (viewCoord.y !== 0) dirs.push(DIRECTION_LABELS.y[String(viewCoord.y) as '-1' | '1']);
  if (viewCoord.x !== 0) dirs.push(DIRECTION_LABELS.x[String(viewCoord.x) as '-1' | '1']);

  const type = classifyCoord(viewCoord);
  const noun = type === 'face' ? 'stěna' : type === 'edge' ? 'hrana' : 'vrchol';
  return `${dirs.join(' · ')} ${noun}`;
}

export function describeFrontFace(rot: RotationMatrix): string {
  // Inverse rotation of view Front (0, 0, -1) tells which original face is currently facing the user
  const origX = rot[6] * 0 + rot[7] * 0 + rot[8] * 0; // unused, transpose*v:
  void origX;
  const cx = -rot[6];
  const cy = -rot[7];
  const cz = -rot[8];
  const tx = -rot[3];
  const ty = -rot[4];
  const tz = -rot[5];

  const faceName = (x: number, y: number, z: number): string => {
    if (z === -1) return 'Přední';
    if (z === 1) return 'Zadní';
    if (y === -1) return 'Horní';
    if (y === 1) return 'Dolní';
    if (x === -1) return 'Levá';
    return 'Pravá';
  };

  return `Vpředu: ${faceName(cx, cy, cz)} · Nahoře: ${faceName(tx, ty, tz)}`;
}

export function projectFloatCoord(
  v: FloatCoord,
  variant: CubeVariant
): { px: number; py: number } {
  const sx = variant === 'shell26' ? 90 : 82;
  const sy = variant === 'shell26' ? 88 : 80;
  const zx = variant === 'shell26' ? 40 : 36;
  const zy = variant === 'shell26' ? -22 : -20;

  // ViewBox 304 x 256 (grid27) / 316 x 272 (shell26), centered
  const cx = variant === 'shell26' ? 158 : 152;
  const cy = variant === 'shell26' ? 136 : 128;

  return {
    px: cx + v.x * sx + v.z * zx,
    py: cy + v.y * sy + v.z * zy
  };
}

/**
 * Non-overlapping oblique projection onto SVG canvas.
 * Minimum node-to-node distance is ~41 px (grid27) / ~45 px (shell26).
 */
export function projectViewCoord(
  v: CubeCoord,
  variant: CubeVariant
): { px: number; py: number } {
  return projectFloatCoord(v, variant);
}

export interface WireframeEdge {
  from: CubeNode;
  to: CubeNode;
  avgZ: number;
  kind: 'lattice' | 'face-guide';
}

export function buildWireframeEdges(nodes: CubeNode[], variant: CubeVariant): WireframeEdge[] {
  const byViewKey = new Map<string, CubeNode>();
  for (const n of nodes) {
    byViewKey.set(coordToId(n.viewCoord), n);
  }

  const edges: WireframeEdge[] = [];

  if (variant === 'grid27') {
    for (const a of nodes) {
      const v = a.viewCoord;
      const neighbors: CubeCoord[] = [
        { x: (v.x + 1) as AxisSign, y: v.y, z: v.z },
        { x: v.x, y: (v.y + 1) as AxisSign, z: v.z },
        { x: v.x, y: v.y, z: (v.z + 1) as AxisSign }
      ];
      for (const nb of neighbors) {
        if (nb.x > 1 || nb.y > 1 || nb.z > 1) continue;
        const b = byViewKey.get(coordToId(nb));
        if (b) {
          edges.push({ from: a, to: b, avgZ: (v.z + nb.z) / 2, kind: 'lattice' });
        }
      }
    }
  } else {
    // shell26: connect corners <-> outer edge midpoints, and faint crosshairs edge midpoints <-> face centers
    for (const a of nodes) {
      const v = a.viewCoord;
      if (a.elementType === 'edge' || a.elementType === 'corner') {
        const neighbors: CubeCoord[] = [
          { x: (v.x + 1) as AxisSign, y: v.y, z: v.z },
          { x: v.x, y: (v.y + 1) as AxisSign, z: v.z },
          { x: v.x, y: v.y, z: (v.z + 1) as AxisSign }
        ];
        for (const nb of neighbors) {
          if (nb.x > 1 || nb.y > 1 || nb.z > 1) continue;
          const b = byViewKey.get(coordToId(nb));
          if (!b) continue;
          const isGuide = b.elementType === 'face';
          edges.push({
            from: a,
            to: b,
            avgZ: (v.z + nb.z) / 2,
            kind: isGuide ? 'face-guide' : 'lattice'
          });
        }
      } else if (a.elementType === 'face') {
        // Connect face center to its 4 adjacent edge midpoints
        const deltas: CubeCoord[] = [
          { x: (v.x + 1) as AxisSign, y: v.y, z: v.z },
          { x: v.x, y: (v.y + 1) as AxisSign, z: v.z },
          { x: v.x, y: v.y, z: (v.z + 1) as AxisSign }
        ];
        for (const nb of deltas) {
          if (nb.x > 1 || nb.y > 1 || nb.z > 1) continue;
          const b = byViewKey.get(coordToId(nb));
          if (b && b.elementType === 'edge') {
            edges.push({ from: a, to: b, avgZ: (v.z + nb.z) / 2, kind: 'face-guide' });
          }
        }
      }
    }
  }

  return edges.sort((e1, e2) => e2.avgZ - e1.avgZ);
}
