import type { TurtleState, Segment, Marker, Point } from './turtleTypes';
import { parseDrawingField, type DrawingCommand } from './drawingNotation';

export function cleanCoord(n: number): number {
  const rounded = Math.round(n);
  if (Math.abs(n - rounded) < 1e-9) return rounded;
  return Math.round(n * 10000) / 10000;
}

export function normalizeHeading(deg: number): number {
  const mod = deg % 360;
  return cleanCoord(mod < 0 ? mod + 360 : mod);
}

export function createInitialState(initialHeading = 0): TurtleState {
  return {
    position: { x: 0, y: 0 },
    heading: normalizeHeading(initialHeading),
    penDown: true,
    segments: [],
    markers: [],
    nextMarkerId: 1
  };
}

export function stepForward(state: TurtleState, distance = 1): TurtleState {
  const rad = (state.heading * Math.PI) / 180;
  return stepDirection(state, distance * Math.sin(rad), distance * Math.cos(rad), state.heading);
}

export function stepBackward(state: TurtleState, distance = 1): TurtleState {
  return stepForward(state, -distance);
}

export function turn(state: TurtleState, deltaAngle: number): TurtleState {
  return { ...state, heading: normalizeHeading(state.heading + deltaAngle) };
}

export function stepDirection(
  state: TurtleState,
  dx: number,
  dy: number,
  newHeading: number
): TurtleState {
  const nextPos: Point = {
    x: cleanCoord(state.position.x + dx),
    y: cleanCoord(state.position.y + dy)
  };

  const newSegment: Segment = {
    id: state.segments.length + 1,
    from: { ...state.position },
    to: nextPos,
    penDown: state.penDown
  };

  return {
    ...state,
    position: nextPos,
    heading: normalizeHeading(newHeading),
    segments: [...state.segments, newSegment]
  };
}

export function togglePen(state: TurtleState): TurtleState {
  return { ...state, penDown: !state.penDown };
}

export function addMarker(state: TurtleState): TurtleState {
  const newMarker: Marker = {
    id: state.nextMarkerId,
    position: { ...state.position }
  };

  return {
    ...state,
    markers: [...state.markers, newMarker],
    nextMarkerId: state.nextMarkerId + 1
  };
}

// --- Želva notation: `V3,P90,V,L45,T,V,M` ---

/** `V` vpřed, `Z` zpět; `L` / `P` turn by the angle in degrees. */
export function parseTurtleField(field: string): DrawingCommand | null {
  return parseDrawingField(field, ['V', 'Z'], ['L', 'P']);
}

/** Replays the notation from the start; invalid pieces (null) are skipped. */
export function replayTurtle(
  commands: readonly (DrawingCommand | null)[],
  initialHeading = 0
): TurtleState {
  let state = createInitialState(initialHeading);
  for (const cmd of commands) {
    if (!cmd) continue;
    switch (cmd.kind) {
      case 'move':
        state = cmd.code === 'V' ? stepForward(state, cmd.count) : stepBackward(state, cmd.count);
        break;
      case 'turn':
        state = turn(state, cmd.code === 'L' ? -cmd.angle : cmd.angle);
        break;
      case 'pen':
        state = togglePen(state);
        break;
      case 'marker':
        state = addMarker(state);
        break;
    }
  }
  return state;
}
