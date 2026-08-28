/**
 * Locating the parts of C/C++ source that are not code — comments, string
 * literals and character literals — without disturbing a single offset.
 *
 * Everything here works on spans and blanking rather than deletion, because
 * every caller needs a match found in the processed text to apply straight back
 * to the real source. The const check needs it so `// x = 99;` is not read as
 * an assignment, the template eraser needs it so `cout << "vector<int>"` is
 * printed rather than rewritten, and the literal repair needs to know which
 * spans are strings so it only touches those.
 */

export type SpanKind = 'comment' | 'string' | 'char';

export interface Span {
  start: number;
  /** Exclusive. */
  end: number;
  kind: SpanKind;
}

/** Every comment and literal in `src`, in the order they appear. */
export function scanNonCode(src: string): Span[] {
  const spans: Span[] = [];
  let i = 0;

  while (i < src.length) {
    const two = src.slice(i, i + 2);
    if (two === '//') {
      const end = src.indexOf('\n', i);
      const stop = end === -1 ? src.length : end;
      spans.push({ start: i, end: stop, kind: 'comment' });
      i = stop;
    } else if (two === '/*') {
      const end = src.indexOf('*/', i + 2);
      const stop = end === -1 ? src.length : end + 2;
      spans.push({ start: i, end: stop, kind: 'comment' });
      i = stop;
    } else if (src[i] === '"' || src[i] === "'") {
      const quote = src[i];
      let j = i + 1;
      while (j < src.length && src[j] !== quote) {
        if (src[j] === '\\') j++;
        j++;
      }
      const stop = Math.min(j + 1, src.length);
      spans.push({ start: i, end: stop, kind: quote === '"' ? 'string' : 'char' });
      i = stop;
    } else {
      i++;
    }
  }

  return spans;
}

/**
 * Replace every comment and literal with spaces, keeping newlines so that
 * offsets, lines and columns all still line up with the original.
 */
export function blankNonCode(src: string): string {
  const out = src.split('');
  for (const { start, end } of scanNonCode(src)) {
    for (let k = start; k < end && k < out.length; k++) {
      if (out[k] !== '\n') out[k] = ' ';
    }
  }
  return out.join('');
}
