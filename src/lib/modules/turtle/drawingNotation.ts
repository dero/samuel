/**
 * Podklad notation of the drawing modules (DESIGN_SYSTEM §7), split into fields by
 * `parseNotation`: Želva `V3,P90,V,L45,T,V,M`, Plotr `S3,V,JV,T,Z,M`.
 * A field is a code with an optional number: the step count of a move, the angle of a turn.
 */

export type DrawingCommand =
  | { kind: 'move'; code: string; count: number }
  | { kind: 'turn'; code: string; angle: number }
  | { kind: 'pen' }
  | { kind: 'marker' };

/** Reads one field; null marks an invalid piece, which stays in the notation untouched. */
export type DrawingParser = (field: string) => DrawingCommand | null;

const FIELD_PATTERN = /^([A-Z]+)(\d*)$/;
export const MAX_STEP_COUNT = 999;

export function parseDrawingField(
  field: string,
  moveCodes: readonly string[],
  turnCodes: readonly string[] = []
): DrawingCommand | null {
  const match = FIELD_PATTERN.exec(field.toUpperCase());
  if (!match) return null;
  const code = match[1];
  const num = match[2] ? Number(match[2]) : null;

  if (moveCodes.includes(code)) {
    if (num === null) return { kind: 'move', code, count: 1 };
    // A step count beyond 999 is a typo, not a drawing
    return num >= 1 && num <= MAX_STEP_COUNT ? { kind: 'move', code, count: num } : null;
  }
  if (turnCodes.includes(code)) {
    return num === null ? null : { kind: 'turn', code, angle: num };
  }
  if (num !== null) return null;
  if (code === 'T') return { kind: 'pen' };
  if (code === 'M') return { kind: 'marker' };
  return null;
}

export function formatDrawingCommand(cmd: DrawingCommand): string {
  switch (cmd.kind) {
    case 'move':
      return cmd.count === 1 ? cmd.code : `${cmd.code}${cmd.count}`;
    case 'turn':
      return `${cmd.code}${cmd.angle}`;
    case 'pen':
      return 'T';
    case 'marker':
      return 'M';
  }
}

/** One key press at the end; a move merges with the same move right before it (`V2` + `V` = `V3`). */
export function appendPress(
  fields: string[],
  cmd: DrawingCommand,
  parse: DrawingParser
): string[] {
  if (cmd.kind === 'move' && fields.length > 0) {
    const last = parse(fields[fields.length - 1]);
    if (last?.kind === 'move' && last.code === cmd.code && last.count + cmd.count <= MAX_STEP_COUNT) {
      const merged = formatDrawingCommand({ ...last, count: last.count + cmd.count });
      return [...fields.slice(0, -1), merged];
    }
  }
  return [...fields, formatDrawingCommand(cmd)];
}

/**
 * Takes back the last press: `V3` → `V2`, `V` → gone. Invalid pieces are skipped and stay
 * where they are, so the last valid piece is the one that changes.
 */
export function removeLastPress(fields: string[], parse: DrawingParser): string[] {
  for (let i = fields.length - 1; i >= 0; i--) {
    const cmd = parse(fields[i]);
    if (!cmd) continue;
    const next = [...fields];
    if (cmd.kind === 'move' && cmd.count > 1) {
      next[i] = formatDrawingCommand({ ...cmd, count: cmd.count - 1 });
    } else {
      next.splice(i, 1);
    }
    return next;
  }
  return fields;
}

export function countSteps(commands: readonly (DrawingCommand | null)[]): number {
  let steps = 0;
  for (const cmd of commands) if (cmd?.kind === 'move') steps += cmd.count;
  return steps;
}

function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return `1 ${one}`;
  return n >= 2 && n <= 4 ? `${n} ${few}` : `${n} ${many}`;
}

/** Bar status of a drawing, e.g. `12 kroků · 2 značky`. */
export function describeDrawing(steps: number, markers: number): string {
  const parts = [plural(steps, 'krok', 'kroky', 'kroků')];
  if (markers > 0) parts.push(plural(markers, 'značka', 'značky', 'značek'));
  return parts.join(' · ');
}

/** Podklad attention naming the pieces that could not be read. */
export function invalidAttention(pieces: readonly string[]): string | null {
  if (pieces.length === 0) return null;
  const shown = pieces.slice(0, 3).map((p) => `„${p}“`).join(', ');
  return `Nečitelné části zápisu: ${shown}${pieces.length > 3 ? ' …' : ''}`;
}
