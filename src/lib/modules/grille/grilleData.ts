export interface RotationColorInfo {
  deg: number;
  label: string;
  color: string;
  className: string;
}

export const ROTATION_COLORS: RotationColorInfo[] = [
  { deg: 0, label: '0°', color: '#F59E0B', className: 'rotation-0' },     // Amber / Yellow
  { deg: 90, label: '90°', color: '#00D2FF', className: 'rotation-1' },   // Cyan / Azure
  { deg: 180, label: '180°', color: '#10B981', className: 'rotation-2' }, // Emerald / Green
  { deg: 270, label: '270°', color: '#A78BFA', className: 'rotation-3' }  // Violet / Purple
];
