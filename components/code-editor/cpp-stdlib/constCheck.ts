/**
 * `const` enforcement for the JSCPP runner.
 *
 * JSCPP parses `const` and then ignores it: a constant is an ordinary variable
 * you can reassign, so a lesson teaching immutability demonstrated the exact
 * opposite of what it claimed. The interpreter offers no hook for this, and
 * const-correctness is not something that can be bolted on from the outside —
 * so this is a source check that runs BEFORE execution and reports the
 * assignment the way a real compiler would.
 *
 * It is a scan, not a type system, and it is tuned to be quiet rather than
 * clever: a false negative just leaves today's behaviour, while a false
 * positive tells a student their correct program is broken. So it only
 * reports a name that is declared const, never redeclared as something else,
 * and then plainly assigned to. Anything subtler — const through a pointer or
 * a reference, a const member, shadowing in a nested scope — is deliberately
 * left alone.
 */

import { blankNonCode } from './sourceMask.ts';

export interface ConstViolation {
  line: number;
  column: number;
  name: string;
  message: string;
}

const IDENT = '[A-Za-z_][A-Za-z0-9_]*';

/** Line and column (both 1-based) of an offset, matching JSCPP's reporting. */
function positionOf(src: string, index: number): { line: number; column: number } {
  const before = src.slice(0, index);
  const line = before.split('\n').length;
  const column = index - (before.lastIndexOf('\n') + 1) + 1;
  return { line, column };
}

/**
 * Find the first assignment to a const variable, or null if there is none.
 * Only the first is reported — a compiler stops being useful after the first
 * error in a ten-line exercise, and a wall of them is worse than one.
 */
export function findConstViolation(source: string): ConstViolation | null {
  const code = blankNonCode(source);

  /* Names introduced as const. The declarator list is captured whole so
     `const int a = 1, b = 2;` contributes both. Pointers are skipped: in
     `const char* p` it is the pointee that is const, not p. */
  const constNames = new Set<string>();
  const declRe = new RegExp(
    `\\bconst\\s+(?:unsigned\\s+|signed\\s+|long\\s+|short\\s+)*${IDENT}\\s+([^;=]*(?:=[^;]*)?);`,
    'g'
  );
  let m: RegExpExecArray | null;
  while ((m = declRe.exec(code)) !== null) {
    const declarators = m[1];
    if (declarators.includes('*') || declarators.includes('&') || declarators.includes('[')) continue;
    for (const part of declarators.split(',')) {
      const name = part.trim().split(/[\s=]/)[0];
      if (name && new RegExp(`^${IDENT}$`).test(name)) constNames.add(name);
    }
  }
  if (constNames.size === 0) return null;

  /* Drop any name that is also declared WITHOUT const somewhere — that is a
     different variable of the same name, and we cannot tell the scopes apart. */
  for (const name of [...constNames]) {
    const shadow = new RegExp(`(^|[^\\w])(?<!const\\s)(?:int|long|short|char|float|double|bool|auto|string)\\s+${name}\\b`);
    const plain = code.replace(new RegExp(`\\bconst\\s+[^;]*\\b${name}\\b[^;]*;`, 'g'), '');
    if (shadow.test(plain)) constNames.delete(name);
  }

  const names = [...constNames];
  if (names.length === 0) return null;

  const group = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');

  /* Plain assignment and every compound form, plus ++/--. `=` is guarded on
     both sides so ==, !=, <=, >= and += are not mistaken for it. */
  const assignRe = new RegExp(
    `\\b(${group})\\s*(?:(?:\\+|-|\\*|/|%|&|\\||\\^|<<|>>)?=(?!=)|\\+\\+|--)|(?:\\+\\+|--)\\s*\\b(${group})\\b`,
    'g'
  );

  while ((m = assignRe.exec(code)) !== null) {
    const name = m[1] ?? m[2];
    // The declaration's own initialiser is not an assignment.
    const upToHere = code.slice(0, m.index);
    const lineStart = upToHere.lastIndexOf('\n') + 1;
    const lineSoFar = code.slice(lineStart, m.index);
    if (/\bconst\b/.test(lineSoFar)) continue;

    const { line, column } = positionOf(source, m.index);
    return {
      line,
      column,
      name,
      message: `${line}:${column} error: assignment of read-only variable '${name}'`,
    };
  }

  return null;
}
