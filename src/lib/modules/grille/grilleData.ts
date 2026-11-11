export interface RotationColorInfo {
  deg: number;
  label: string;
  color: string;
}

// Content colours: each marks one position of the turning grille
export const ROTATION_COLORS: RotationColorInfo[] = [
  { deg: 0, label: '0°', color: '#F472B6' },     // Pink
  { deg: 90, label: '90°', color: '#A3E635' },   // Lime
  { deg: 180, label: '180°', color: '#FDE047' }, // Yellow
  { deg: 270, label: '270°', color: '#A78BFA' }  // Violet / Purple
];
