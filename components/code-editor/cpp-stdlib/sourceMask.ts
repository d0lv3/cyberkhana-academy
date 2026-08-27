/**
 * Blank out everything in C/C++ source that is not code — comments, string
 * literals and character literals — replacing each character with a space.
 *
 * Blanking rather than deleting is the whole point: every offset, line and
 * column in the result still matches the original, so a match found in the
 * masked text can be applied straight back to the real source. Both callers
 * depend on that. The const check needs it so `// x = 99;` is not read as an
 * assignment, and the template eraser needs it so the text
 * `cout << "vector<int>"` is printed rather than rewritten.
 *
 * Newlines are preserved so line counting still works.
 */
export function blankNonCode(src: string): string {
  const out = src.split('');
  let i = 0;

  const blankTo = (end: number) => {
    for (let k = i; k < end && k < out.length; k++) {
      if (out[k] !== '\n') out[k] = ' ';
    }
  };

  while (i < src.length) {
    const two = src.slice(i, i + 2);
    if (two === '//') {
      const end = src.indexOf('\n', i);
      const stop = end === -1 ? src.length : end;
      blankTo(stop);
      i = stop;
    } else if (two === '/*') {
      const end = src.indexOf('*/', i + 2);
      const stop = end === -1 ? src.length : end + 2;
      blankTo(stop);
      i = stop;
    } else if (src[i] === '"' || src[i] === "'") {
      const quote = src[i];
      let j = i + 1;
      while (j < src.length && src[j] !== quote) {
        if (src[j] === '\\') j++;
        j++;
      }
      const stop = Math.min(j + 1, src.length);
      blankTo(stop);
      i = stop;
    } else {
      i++;
    }
  }

  return out.join('');
}
