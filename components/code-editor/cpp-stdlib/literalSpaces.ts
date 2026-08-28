/**
 * Repairs string literals that JSCPP's preprocessor would otherwise corrupt.
 *
 * JSCPP re-emits every function call it sees while looking for macros, and the
 * code that reassembles the argument list is not aware of string literals
 * (lib/preprocessor.js: `node.Identifier.val + "(" + v.join(",") + ")"`). The
 * argument text is split on commas — commas *inside* a literal included — and
 * rejoined with a bare comma, so the whitespace that followed one is dropped:
 *
 *     printf("Hello, World!\n");   prints   Hello,World!
 *     printf("%d, %d\n", a, b);    prints   1,2
 *     strlen("a, b")               returns  3
 *
 * Only calls are affected — `const char* s = "a, b";` survives — and only real
 * spaces, since an escape such as `\t` passes through untouched. That is the
 * repair: rewrite each space that follows a comma inside a string literal as
 * `\x20`, which JSCPP's lexer reads back as a space and its preprocessor cannot
 * mistake for argument padding.
 *
 * `\x20` is safe here even before a hex digit. C's `\x` is greedy — `"\x20A"`
 * would be one character 0x20A to a real compiler — but JSCPP's grammar takes
 * exactly two digits, so `"a,\x20Abc"` reads back as `a, Abc`. This runs on
 * source that is on its way into JSCPP and nowhere else.
 *
 * The one cost: `\x20` is four characters where there was one, so a column
 * number JSCPP reports later on that same line, after that literal, shifts by
 * three per repaired space. Line numbers are untouched, no newline is added or
 * removed, and a wrong column beats wrong output.
 */

import { scanNonCode } from './sourceMask.ts';

/** Spaces immediately following a comma, one or more of them. */
const AFTER_COMMA = /,( +)/g;

export function repairLiteralSpaces(source: string): string {
  const spans = scanNonCode(source).filter((s) => s.kind === 'string');
  if (spans.length === 0) return source;

  let out = '';
  let cursor = 0;
  for (const { start, end } of spans) {
    out += source.slice(cursor, start);
    out += source
      .slice(start, end)
      .replace(AFTER_COMMA, (_m, spaces: string) => ',' + '\\x20'.repeat(spaces.length));
    cursor = end;
  }
  return out + source.slice(cursor);
}
