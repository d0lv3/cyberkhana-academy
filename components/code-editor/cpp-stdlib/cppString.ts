/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * `std::string` for the JSCPP interpreter.
 *
 * JSCPP ships headers for the C library and iostream but nothing from the C++
 * one, so `string` was not a type at all: `#include <string>` failed with
 * "cannot find library" and a bare `string s;` with "type string is not
 * defined". Since a course cannot teach modern C++ without it, the type is
 * supplied here and injected through `config.includes` — JSCPP merges that
 * config deeply, so this adds a header without patching or forking the package.
 *
 * Value semantics come from never mutating an instance in place. JSCPP's
 * `clone()` copies a class value by sharing its `v` object, so `string b = a;`
 * hands both variables the same reference; every operation below therefore
 * REPLACES `v` with a fresh object rather than editing the one it was given.
 * Mutating in place would make `b += "x"` silently change `a` too.
 */

/** The JS string behind any supported value: a std::string, a literal, a char. */
function textOf(rt: any, v: any): string {
  if (v && v.t && v.t.type === 'class' && v.t.name === 'string') return v.v.str ?? '';
  if (rt.isStringType(v)) return rt.getStringFromCharArray(v);
  if (v && v.t && rt.isPrimitiveType(v.t) && String(v.t.name).includes('char')) {
    return String.fromCharCode(v.v);
  }
  return null as unknown as string;
}

const isStr = (v: any) => Boolean(v && v.t && v.t.type === 'class' && v.t.name === 'string');

/** True for our class, given either a type or a value carrying one. */
export function isStringType(t: any): boolean {
  if (!t) return false;
  if (t.type === 'class' && t.name === 'string') return true;
  return Boolean(t.t && t.t.type === 'class' && t.t.name === 'string');
}

/** Anything that converts to a string: a literal, a char buffer, a lone char. */
function charish(rt: any, t: any): boolean {
  try {
    if (rt.isStringType(t)) return true;
    const bare = t && t.t ? t.t : t;
    return Boolean(bare && rt.isPrimitiveType(bare) && String(bare.name).includes('char'));
  } catch {
    return false;
  }
}

/** npos as C++ reports it, clamped to what an int can hold here. */
const NPOS = -1;

export function installString(rt: any): any {
  const existing = rt.types[rt.getTypeSignature({ type: 'class', name: 'string' })];
  if (existing) return existing.__stringType;

  const strType = rt.newClass('string', []);
  const sig = rt.getTypeSignature(strType);
  const INT = rt.intTypeLiteral;
  const CHAR = rt.charTypeLiteral;
  const BOOL = rt.boolTypeLiteral;

  const mk = (s: string, left = false) => rt.val(strType, { members: {}, str: s }, left);
  const need = (v: any, op: string) => {
    const t = textOf(rt, v);
    if (t === null) rt.raiseException(`no match for 'operator${op}' with a std::string`);
    return t;
  };

  const entry = rt.types[sig];
  entry.__stringType = strType;
  entry.father = 'object';
  /* A default-constructed string is "", not a set of uninitialised members. */
  entry.cConstructor = (_rt: any, _this: any) => {
    _this.v = { members: {}, str: '' };
  };

  const handlers = entry.handlers ?? (entry.handlers = {});

  handlers['o(=)'] = {
    default(_rt: any, lhs: any, rhs: any) {
      lhs.v = { members: {}, str: need(rhs, '=') };
      return lhs;
    },
  };

  handlers['o(+)'] = {
    default(_rt: any, lhs: any, rhs: any) {
      return mk(textOf(rt, lhs) + need(rhs, '+'));
    },
  };

  handlers['o(+=)'] = {
    default(_rt: any, lhs: any, rhs: any) {
      lhs.v = { members: {}, str: textOf(rt, lhs) + need(rhs, '+=') };
      return lhs;
    },
  };

  const compare: Record<string, (a: string, b: string) => boolean> = {
    '==': (a, b) => a === b,
    '!=': (a, b) => a !== b,
    '<': (a, b) => a < b,
    '>': (a, b) => a > b,
    '<=': (a, b) => a <= b,
    '>=': (a, b) => a >= b,
  };
  for (const [op, fn] of Object.entries(compare)) {
    handlers[`o(${op})`] = {
      default(_rt: any, lhs: any, rhs: any) {
        return rt.val(BOOL, fn(textOf(rt, lhs), need(rhs, op)) ? 1 : 0);
      },
    };
  }

  /* Indexing yields a char by value. Writing through `s[i] = 'x'` is not
     supported: JSCPP has no reference values, so the assignment would land on
     a detached copy and silently do nothing — better to say so. */
  handlers['o([])'] = {
    default(_rt: any, lhs: any, idx: any) {
      const s = textOf(rt, lhs);
      const i = idx.v;
      if (i < 0 || i >= s.length) rt.raiseException(`string index ${i} is out of range (length ${s.length})`);
      return rt.val(CHAR, s.charCodeAt(i));
    },
  };

  /* ── Member functions ── */
  const member = (name: string, args: any[], ret: any, fn: (...a: any[]) => any) =>
    rt.regFunc(fn, strType, name, args, ret);

  const lengthOf = (_rt: any, _this: any) => rt.val(INT, textOf(rt, _this).length);
  member('length', [], INT, lengthOf);
  member('size', [], INT, lengthOf);

  member('empty', [], BOOL, (_rt: any, _this: any) =>
    rt.val(BOOL, textOf(rt, _this).length === 0 ? 1 : 0));

  member('clear', [], strType, (_rt: any, _this: any) => {
    _this.v = { members: {}, str: '' };
    return _this;
  });

  member('at', [INT], CHAR, (_rt: any, _this: any, i: any) => {
    const s = textOf(rt, _this);
    if (i.v < 0 || i.v >= s.length) rt.raiseException(`at(${i.v}) is out of range (length ${s.length})`);
    return rt.val(CHAR, s.charCodeAt(i.v));
  });

  /* Trailing parameters go through `optionalArgs`, not a second registration.
     JSCPP's overload matcher walks past the declared args straight into
     optionalArgs and reads `.type` off it, so registering the same name at two
     different arities makes it index an empty array and throw. */
  const optional = (name: string, type: any) => [{ name, type }];

  const substr = (_rt: any, _this: any, pos: any, len?: any) => {
    const s = textOf(rt, _this);
    const p = pos ? pos.v : 0;
    if (p < 0 || p > s.length) rt.raiseException(`substr position ${p} is out of range (length ${s.length})`);
    return mk(len === undefined || len === null ? s.substring(p) : s.substr(p, len.v));
  };
  rt.regFunc(substr, strType, 'substr', [INT], strType, optional('len', INT));

  const find = (_rt: any, _this: any, what: any, from?: any) => {
    const idx = textOf(rt, _this).indexOf(need(what, '.find'), from ? from.v : 0);
    return rt.val(INT, idx);
  };
  for (const argType of [strType, rt.normalPointerType(CHAR), CHAR]) {
    rt.regFunc(find, strType, 'find', [argType], INT, optional('pos', INT));
  }

  member('push_back', [CHAR], strType, (_rt: any, _this: any, c: any) => {
    _this.v = { members: {}, str: textOf(rt, _this) + String.fromCharCode(c.v) };
    return _this;
  });

  member('append', [strType], strType, (_rt: any, _this: any, other: any) => {
    _this.v = { members: {}, str: textOf(rt, _this) + need(other, '.append') };
    return _this;
  });
  member('append', [rt.normalPointerType(CHAR)], strType, (_rt: any, _this: any, other: any) => {
    _this.v = { members: {}, str: textOf(rt, _this) + need(other, '.append') };
    return _this;
  });

  /* ── Conversions ──
     Two of JSCPP's own routines give up the moment a class type is involved:
     `cast` raises "not implemented", and so does `castable`, which the overload
     matcher calls to decide whether an argument fits a parameter. Between them
     they blocked `string s = "hello";` and `f("hello")` for a string parameter.
     Both are wrapped rather than replaced — anything not involving our own
     class falls through to the original behaviour untouched. */
  if (!rt.__cppStdlibConvPatched) {
    rt.__cppStdlibConvPatched = true;

    const originalCast = rt.cast.bind(rt);
    rt.cast = (type: any, value: any) => {
      if (isStringType(type) && !isStr(value)) {
        const t = textOf(rt, value);
        if (t !== null) return mk(t);
      }
      return originalCast(type, value);
    };

    const originalCastable = rt.castable.bind(rt);
    rt.castable = (type1: any, type2: any) => {
      const a = isStringType(type1);
      const b = isStringType(type2);
      if (a && b) return true;
      // A literal, a char buffer or a single char all convert to a string.
      if (a) return charish(rt, type2);
      if (b) return charish(rt, type1);
      return originalCastable(type1, type2);
    };
  }

  return strType;
}

/**
 * Teach cin/cout about the type. Separate from installString because the
 * streams only exist once <iostream> has loaded, and a program is free to
 * include <string> on its own.
 */
export function wireStringToStreams(rt: any, strType: any): void {
  const cout = rt.scope[0].variables['cout'];
  const cin = rt.scope[0].variables['cin'];

  if (cout && !rt.__stringCoutWired) {
    rt.__stringCoutWired = true;
    rt.regOperator(
      (_rt: any, _cout: any, s: any) => {
        _cout.v.ostream.write(s.v.str ?? '');
        return _cout;
      },
      cout.t,
      '<<',
      [strType],
      cout.t
    );
  }

  if (cin && !rt.__stringCinWired) {
    rt.__stringCinWired = true;

    /* One whitespace-delimited word, matching cin >> for any other type. */
    const readWord = (_rt: any, _cin: any, target: any) => {
      const buf = String(_cin.v.buf ?? '');
      const rest = buf.replace(/^\s*/, '');
      const word = /^\S*/.exec(rest)?.[0] ?? '';
      _cin.v.eofbit = rest.length === 0;
      _cin.v.failbit = word.length === 0;
      _cin.v.buf = rest.substring(word.length);
      target.v = { members: {}, str: word };
      return _cin;
    };
    rt.regOperator(readWord, cin.t, '>>', [strType], cin.t);

    /* Free-function getline(cin, s) — the form students actually use with
       std::string, as opposed to cin.getline(buffer, n) for char arrays. */
    const getline = (_rt: any, _global: any, stream: any, target: any, delimV?: any) => {
      const delim = delimV ? String.fromCharCode(delimV.v) : '\n';
      const buf = String(stream.v.buf ?? '');
      const at = buf.indexOf(delim);
      const line = at === -1 ? buf : buf.substring(0, at);
      stream.v.eofbit = buf.length === 0;
      stream.v.failbit = buf.length === 0;
      stream.v.buf = at === -1 ? '' : buf.substring(at + 1);
      target.v = { members: {}, str: line };
      return stream;
    };
    rt.regFunc(getline, 'global', 'getline', [cin.t, strType], cin.t, [
      { name: 'delim', type: rt.charTypeLiteral },
    ]);
  }
}

export { NPOS };
