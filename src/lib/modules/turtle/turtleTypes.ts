export type TurtleGranularity = 1 | 5 | 15 | 45 | 90;

export const GRANULARITY_PRESETS: TurtleGranularity[] = [1, 5, 15, 45, 90];

export interface Point {
  x: number;
  y: number;
}

export interface Segment {
  id: number;
  from: Point;
  to: Point;
  penDown: boolean;
}

export interface Marker {
  id: number;
  position: Point;
}

/** A drawing replayed from its notation; nothing here is stored. */
export interface TurtleState {
  position: Point;
  heading: number; // 0 = up/north, 90 = right/east, 180 = down/south, 270 = left/west
  penDown: boolean;
  segments: Segment[];
  markers: Marker[];
  nextMarkerId: number;
}
