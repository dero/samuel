import type { TurtleState } from '../turtle/turtleTypes';
import {
  createInitialState,
  stepDirection,
  togglePen,
  addMarker
} from '../turtle/turtleEngine';
import { parseDrawingField, type DrawingCommand } from '../turtle/drawingNotation';

export interface CompassDirection {
  code: string;
  name: string;
  dx: number;
  dy: number;
  heading: number;
}

/** Keypad order, row by row; the centre cell of the 3 × 3 pad is the marker. */
export const PLOTTER_DIRECTIONS: CompassDirection[] = [
  { code: 'SZ', name: 'Severozápad', dx: -1, dy: 1, heading: 315 },
  { code: 'S', name: 'Sever', dx: 0, dy: 1, heading: 0 },
  { code: 'SV', name: 'Severovýchod', dx: 1, dy: 1, heading: 45 },
  { code: 'Z', name: 'Západ', dx: -1, dy: 0, heading: 270 },
  { code: 'V', name: 'Východ', dx: 1, dy: 0, heading: 90 },
  { code: 'JZ', name: 'Jihozápad', dx: -1, dy: -1, heading: 225 },
  { code: 'J', name: 'Jih', dx: 0, dy: -1, heading: 180 },
  { code: 'JV', name: 'Jihovýchod', dx: 1, dy: -1, heading: 135 }
];

const DIRECTION_BY_CODE = new Map(PLOTTER_DIRECTIONS.map((d) => [d.code, d]));
const DIRECTION_CODES = PLOTTER_DIRECTIONS.map((d) => d.code);

/** Plotr notation `S3,V,JV,T,Z,M`: compass directions, `T` pen, `M` marker. */
export function parsePlotterField(field: string): DrawingCommand | null {
  return parseDrawingField(field, DIRECTION_CODES);
}

/** Replays the notation from the start; invalid pieces (null) are skipped. */
export function replayPlotter(commands: readonly (DrawingCommand | null)[]): TurtleState {
  let state = createInitialState(0);
  for (const cmd of commands) {
    if (!cmd) continue;
    if (cmd.kind === 'move') {
      const dir = DIRECTION_BY_CODE.get(cmd.code)!;
      state = stepDirection(state, dir.dx * cmd.count, dir.dy * cmd.count, dir.heading);
    } else if (cmd.kind === 'pen') {
      state = togglePen(state);
    } else if (cmd.kind === 'marker') {
      state = addMarker(state);
    }
  }
  return state;
}
