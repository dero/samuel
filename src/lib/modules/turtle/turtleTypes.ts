export type TurtleFlavour = 'angles' | 'directions';

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

export type TurtleAction =
  | {
      type: 'step';
      from: Point;
      to: Point;
      prevHeading: number;
      heading: number;
      distance: number;
      penDown: boolean;
    }
  | { type: 'turn'; fromHeading: number; toHeading: number; delta: number }
  | { type: 'marker'; marker: Marker }
  | { type: 'pen'; prevPenDown: boolean; newPenDown: boolean };

export interface TurtleState {
  position: Point;
  heading: number; // 0 = up/north, 90 = right/east, 180 = down/south, 270 = left/west
  penDown: boolean;
  segments: Segment[];
  markers: Marker[];
  nextMarkerId: number;
  history: TurtleAction[];
}
