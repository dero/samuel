export type CubeVariant = 'grid27' | 'shell26';
export type CubeViewMode = 'wireframe' | 'layers';
export type GridFillOrder = 'front-row-col' | 'top-row-col';
export type ShellFillOrder = 'faces-edges-corners' | 'corners-edges-faces' | 'shell-layers';
export type ShellElementType = 'face' | 'edge' | 'corner';
export type RotationDirection = 'left' | 'right' | 'up' | 'down' | 'roll-ccw' | 'roll-cw';

export type AxisSign = -1 | 0 | 1;

export interface CubeCoord {
  x: AxisSign;
  y: AxisSign;
  z: AxisSign;
}

export interface CubeCellValue {
  char: string;
  tag?: string;
}

export interface CubeSlot {
  id: string;
  coord: CubeCoord;
  elementType: ShellElementType | 'core';
}

export interface CubeNode extends CubeSlot {
  char: string;
  tag?: string;
  viewCoord: CubeCoord;
}

/** 3x3 row-major integer rotation matrix in SO(3). */
export type RotationMatrix = [
  number, number, number,
  number, number, number,
  number, number, number
];

export interface CubeTypeConfig {
  id: CubeVariant;
  name: string;
  shortName: string;
  capacity: number;
  defaultAlphabetId: string;
  standardAlphabetIds: string[];
}

export const CUBE_TYPES: CubeTypeConfig[] = [
  {
    id: 'grid27',
    name: '3×3×3 (27)',
    shortName: '3×3×3',
    capacity: 27,
    defaultAlphabetId: 'english-26',
    standardAlphabetIds: ['english-26', 'english-ch-27']
  },
  {
    id: 'shell26',
    name: '8+12+6 (26)',
    shortName: '8+12+6',
    capacity: 26,
    defaultAlphabetId: 'english-26',
    standardAlphabetIds: ['english-26']
  }
];

export const SHELL_FILL_OPTIONS: { id: ShellFillOrder; label: string; hint: string }[] = [
  { id: 'faces-edges-corners', label: 'Stěny → Hrany → Vrcholy', hint: '6 stěn, 12 hran, 8 vrcholů' },
  { id: 'corners-edges-faces', label: 'Vrcholy → Hrany → Stěny', hint: '8 vrcholů, 12 hran, 6 stěn' },
  { id: 'shell-layers', label: 'Po vrstvách pláště', hint: 'Zepředu dozadu bez vnitřního středu' }
];

export const AXIS_LABELS = {
  z: { '-1': 'Přední', '0': 'Střední', '1': 'Zadní' },
  y: { '-1': 'Horní', '0': 'Střední', '1': 'Dolní' },
  x: { '-1': 'Levý', '0': 'Střední', '1': 'Pravý' }
} as const;

export const DIRECTION_LABELS = {
  z: { '-1': 'Přední', '1': 'Zadní' },
  y: { '-1': 'Horní', '1': 'Dolní' },
  x: { '-1': 'Levá', '1': 'Pravá' }
} as const;
