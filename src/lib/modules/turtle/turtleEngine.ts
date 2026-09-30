import type {
  TurtleState,
  TurtleAction,
  Segment,
  Marker,
  Point
} from './turtleTypes';

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
    nextMarkerId: 1,
    history: []
  };
}

export function stepForward(state: TurtleState, distance = 1): TurtleState {
  const rad = (state.heading * Math.PI) / 180;
  const dx = distance * Math.sin(rad);
  const dy = distance * Math.cos(rad);

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

  const action: TurtleAction = {
    type: 'step',
    from: { ...state.position },
    to: nextPos,
    prevHeading: state.heading,
    heading: state.heading,
    distance,
    penDown: state.penDown
  };

  return {
    ...state,
    position: nextPos,
    segments: [...state.segments, newSegment],
    history: [...state.history, action]
  };
}

export function stepBackward(state: TurtleState, distance = 1): TurtleState {
  const rad = (state.heading * Math.PI) / 180;
  const dx = -distance * Math.sin(rad);
  const dy = -distance * Math.cos(rad);

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

  const action: TurtleAction = {
    type: 'step',
    from: { ...state.position },
    to: nextPos,
    prevHeading: state.heading,
    heading: state.heading,
    distance: -distance,
    penDown: state.penDown
  };

  return {
    ...state,
    position: nextPos,
    segments: [...state.segments, newSegment],
    history: [...state.history, action]
  };
}

export function turn(state: TurtleState, deltaAngle: number): TurtleState {
  const prevHeading = state.heading;
  const newHeading = normalizeHeading(state.heading + deltaAngle);

  const action: TurtleAction = {
    type: 'turn',
    fromHeading: prevHeading,
    toHeading: newHeading,
    delta: deltaAngle
  };

  return {
    ...state,
    heading: newHeading,
    history: [...state.history, action]
  };
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

  const prevHeading = state.heading;
  const nextHeading = normalizeHeading(newHeading);
  const action: TurtleAction = {
    type: 'step',
    from: { ...state.position },
    to: nextPos,
    prevHeading,
    heading: nextHeading,
    distance: Math.hypot(dx, dy),
    penDown: state.penDown
  };

  return {
    ...state,
    position: nextPos,
    heading: nextHeading,
    segments: [...state.segments, newSegment],
    history: [...state.history, action]
  };
}

export function togglePen(state: TurtleState): TurtleState {
  const prev = state.penDown;
  const next = !prev;

  const action: TurtleAction = {
    type: 'pen',
    prevPenDown: prev,
    newPenDown: next
  };

  return {
    ...state,
    penDown: next,
    history: [...state.history, action]
  };
}

export function addMarker(state: TurtleState): TurtleState {
  const newMarker: Marker = {
    id: state.nextMarkerId,
    position: { ...state.position }
  };

  const action: TurtleAction = {
    type: 'marker',
    marker: newMarker
  };

  return {
    ...state,
    markers: [...state.markers, newMarker],
    nextMarkerId: state.nextMarkerId + 1,
    history: [...state.history, action]
  };
}

export function undo(state: TurtleState): TurtleState {
  if (state.history.length === 0) return state;

  const lastAction = state.history[state.history.length - 1];
  const newHistory = state.history.slice(0, -1);

  if (lastAction.type === 'step') {
    return {
      ...state,
      position: { ...lastAction.from },
      heading: lastAction.prevHeading,
      segments: state.segments.slice(0, -1),
      history: newHistory
    };
  }

  if (lastAction.type === 'turn') {
    return {
      ...state,
      heading: lastAction.fromHeading,
      history: newHistory
    };
  }

  if (lastAction.type === 'marker') {
    return {
      ...state,
      markers: state.markers.filter((m) => m.id !== lastAction.marker.id),
      nextMarkerId: lastAction.marker.id,
      history: newHistory
    };
  }

  if (lastAction.type === 'pen') {
    return {
      ...state,
      penDown: lastAction.prevPenDown,
      history: newHistory
    };
  }

  return state;
}
