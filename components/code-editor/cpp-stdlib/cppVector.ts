/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * `std::vector` for the JSCPP interpreter.
 *
 * Harder than string, because the obstacle is the grammar rather than the
 * library. JSCPP's parser has no rule for template arguments at all, so
 * `vector<int> v;` is a *parse* failure — it never reaches the point where a
 * missing header could be reported, and no amount of library code can rescue
 * it. What works is erasing the angle brackets before the parser runs (see
 * `eraseTemplateArgs`), leaving a plain `vector v;` that the grammar accepts as
 * an ordinary class-typed declaration.
 *
 * The consequence is that the element type is erased with them: one `vector`
 * class holds values of whatever was pushed into it. For teaching loops,
 * push_back and indexing that is invisible, but it does mean a `vector<int>`
 * will accept a string without complaining, where a real compiler would refuse.
 * That limit is deliberate and documented rather than hidden.
 *
 * Like the string class, instances are never mutated through a shared
 * reference: JSCPP's `clone()` copies a class value by sharing its `v` object,
 * so each mutating operation installs a fresh array.
 */

import { blankNonCode } from './sourceMask.ts';

const isVec = (v: any) => Boolean(v && v.t && v.t.type === 'class' && v.t.name === 'vector');

export function isVectorType(t: any): boolean {
  if (!t) return false;
  if (t.type === 'class' && t.name === 'vector') return true;
  return Boolean(t.t && t.t.type === 'class' && t.t.name === 'vector');
}

/** Containers whose template arguments we erase before parsing. */
const TEMPLATED = ['vector'];

/**
 * Rewrite `vector<int>` to `vector` while keeping the source the same length.
 *
 * The replacement is padded with spaces so every line and column in the
 * student's code stays where it was — JSCPP reports errors as `line:column`,
 * and silently shifting them would make every message point at the wrong spot.
 *
 * Matching runs against a masked copy in which comments and literals have been
 * blanked, so `cout << "vector<int> is a template"` prints what it says instead
 * of being rewritten mid-sentence. Offsets survive the masking, so a match
 * found there applies directly to the real source.
 *
 * Only the known container names are touched, anchored on a word boundary, so
 * an expression like `a<b` or `x < y > z` is left completely alone.
 */
export function eraseTemplateArgs(source: string): string {
  const out = source.split('');
  // Two passes so one level of nesting (vector<vector<int>>) also clears.
  for (let pass = 0; pass < 2; pass++) {
    const masked = blankNonCode(out.join(''));
    let changed = false;
    for (const name of TEMPLATED) {
      const re = new RegExp(`\\b${name}\\s*<[^<>;{}()]*>`, 'g');
      let m: RegExpExecArray | null;
      while ((m = re.exec(masked)) !== null) {
        for (let k = m.index + name.length; k < m.index + m[0].length; k++) {
          out[k] = ' ';
        }
        changed = true;
      }
    }
    if (!changed) break;
  }
  return out.join('');
}

export function installVector(rt: any): any {
  const existing = rt.types[rt.getTypeSignature({ type: 'class', name: 'vector' })];
  if (existing) return existing.__vectorType;

  const vecType = rt.newClass('vector', []);
  const sig = rt.getTypeSignature(vecType);
  const INT = rt.intTypeLiteral;
  const BOOL = rt.boolTypeLiteral;

  const items = (v: any): any[] => (isVec(v) ? (v.v.items ?? []) : []);
  const reseat = (v: any, next: any[]) => {
    v.v = { members: {}, items: next };
  };

  const entry = rt.types[sig];
  entry.__vectorType = vecType;
  entry.father = 'object';
  entry.cConstructor = (_rt: any, _this: any) => {
    _this.v = { members: {}, items: [] };
  };

  const handlers = entry.handlers ?? (entry.handlers = {});

  handlers['o(=)'] = {
    default(_rt: any, lhs: any, rhs: any) {
      if (!isVec(rhs)) rt.raiseException("no match for 'operator=' with a std::vector");
      reseat(lhs, items(rhs).slice());
      return lhs;
    },
  };

  /* Subscript hands back the stored value itself, not a copy, so `v[0] = 7`
     writes through to the element rather than to a detached temporary. */
  handlers['o([])'] = {
    default(_rt: any, lhs: any, idx: any) {
      const list = items(lhs);
      const i = idx.v;
      if (i < 0 || i >= list.length) {
        rt.raiseException(`vector index ${i} is out of range (size ${list.length})`);
      }
      return list[i];
    },
  };

  const member = (name: string, args: any[], ret: any, fn: (...a: any[]) => any, optionalArgs?: any[]) =>
    rt.regFunc(fn, vecType, name, args, ret, optionalArgs);

  /* '?' is JSCPP's varargs marker — the only way to accept any element type
     once the template argument has been erased. */
  member('push_back', ['?'], vecType, (_rt: any, _this: any, value: any) => {
    /* Stored as a left value: subscript returns the element itself, so
       `v[0] = 42` assigns through to it, and JSCPP refuses to assign to
       anything not marked as one. */
    const stored = rt.clone(value, true);
    stored.left = true;
    reseat(_this, items(_this).concat([stored]));
    return _this;
  });

  member('pop_back', [], vecType, (_rt: any, _this: any) => {
    const list = items(_this);
    if (list.length === 0) rt.raiseException('pop_back() on an empty vector');
    reseat(_this, list.slice(0, -1));
    return _this;
  });

  member('size', [], INT, (_rt: any, _this: any) => rt.val(INT, items(_this).length));
  member('empty', [], BOOL, (_rt: any, _this: any) => rt.val(BOOL, items(_this).length === 0 ? 1 : 0));
  member('clear', [], vecType, (_rt: any, _this: any) => {
    reseat(_this, []);
    return _this;
  });

  const bounded = (label: string, pick: (list: any[], i?: number) => any) =>
    (_rt: any, _this: any, idx?: any) => {
      const list = items(_this);
      const i = idx ? idx.v : undefined;
      if (list.length === 0) rt.raiseException(`${label} on an empty vector`);
      if (i !== undefined && (i < 0 || i >= list.length)) {
        rt.raiseException(`${label}(${i}) is out of range (size ${list.length})`);
      }
      return pick(list, i);
    };

  member('at', [INT], '?' as any, bounded('at', (list, i) => list[i as number]));
  member('front', [], '?' as any, bounded('front', (list) => list[0]));
  member('back', [], '?' as any, bounded('back', (list) => list[list.length - 1]));

  /* ── Conversions ──
     Same story as string: rt.castable raises the moment a class type appears,
     which breaks passing a vector to a function. Wrapped, not replaced. */
  if (!rt.__vectorConvPatched) {
    rt.__vectorConvPatched = true;
    const originalCastable = rt.castable.bind(rt);
    rt.castable = (type1: any, type2: any) => {
      const a = isVectorType(type1);
      const b = isVectorType(type2);
      if (a || b) return a && b;
      return originalCastable(type1, type2);
    };
  }

  return vecType;
}
