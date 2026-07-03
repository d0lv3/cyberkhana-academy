/**
 * A small, safe Bash interpreter that runs entirely in the browser — no server
 * execution, same "secure by design" model as the Python/C++ runners. It is a
 * from-scratch tree-walking interpreter (no eval, no shelling out), so student
 * scripts can never touch the host.
 *
 * Supported subset (plenty for teaching shell fundamentals):
 *   - variables + assignment, quoting (', "), comments
 *   - $VAR, ${VAR}, $?, $(cmd) command substitution, $((arithmetic))
 *   - pipelines (|), && / ||, ; and newlines
 *   - if / elif / else / fi, for … in … do … done, while / until … do … done
 *   - builtins: echo, printf, read, test / [ ], true, false, :, export, cd, pwd,
 *     seq, expr, basename, dirname, exit
 *   - coreutils over stdin: cat, grep, wc, head, tail, tr, rev, sort, uniq, cut, sed
 * Loops/output are bounded and every step is time-checked, so nothing can hang.
 */

import type { ExecutionResult } from './PythonExecutor';

const MAX_OUTPUT = 200_000;
const MAX_LOOP = 200_000;
const DEFAULT_TIMEOUT_MS = 5_000;

class ShellError extends Error {}
class ExitSignal {
  code: number;
  constructor(code: number) { this.code = code | 0; }
}

type Quote = 'none' | 'single' | 'double';
interface Chunk { s: string; q: Quote }
interface Tok { op?: string; word?: Chunk[] }
interface Ctx {
  env: Record<string, string>;
  status: number;
  out: string;
  stdinBuf: string;
  stdinPos: number;
  checkTime: () => void;
}
interface IO { stdin: string; w: (s: string) => void; ctx: Ctx; rawWords?: Tok[] }
/* eslint-disable @typescript-eslint/no-explicit-any */
type Node = any;

/** This runner has no async warm-up, so it's always ready. */
export function isBashReady(): boolean { return true; }

/* ── Tokenizer ── */
function tokenize(src: string): Tok[] {
  const toks: Tok[] = [];
  let i = 0;
  const n = src.length;
  let chunks: Chunk[] | null = null;
  const flush = () => { if (chunks) { toks.push({ word: chunks }); chunks = null; } };
  const add = (s: string, q: Quote) => {
    if (!chunks) chunks = [];
    const last = chunks[chunks.length - 1];
    if (q === 'none' && last && last.q === 'none') last.s += s;
    else chunks.push({ s, q });
  };

  const readDollarParen = () => {
    const start = i;
    i += 2;
    let depth = 1;
    while (i < n && depth > 0) {
      if (src[i] === '(') depth++;
      else if (src[i] === ')') depth--;
      i++;
    }
    return src.slice(start, i);
  };

  while (i < n) {
    const c = src[i];
    if (c === ' ' || c === '\t') { flush(); i++; continue; }
    if (c === '\n') { flush(); toks.push({ op: '\n' }); i++; continue; }
    if (c === '#' && !chunks) { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === ';') { flush(); toks.push({ op: ';' }); i++; continue; }
    if (c === '&' && src[i + 1] === '&') { flush(); toks.push({ op: '&&' }); i += 2; continue; }
    if (c === '|' && src[i + 1] === '|') { flush(); toks.push({ op: '||' }); i += 2; continue; }
    if (c === '|') { flush(); toks.push({ op: '|' }); i++; continue; }
    if (c === '\\') { if (i + 1 < n) { add(src[i + 1], 'none'); i += 2; } else i++; continue; }
    if (c === "'") { i++; let s = ''; while (i < n && src[i] !== "'") { s += src[i]; i++; } i++; add(s, 'single'); continue; }
    if (c === '"') {
      i++; let s = '';
      while (i < n && src[i] !== '"') {
        if (src[i] === '\\' && (src[i + 1] === '"' || src[i + 1] === '\\' || src[i + 1] === '$' || src[i + 1] === '`')) { s += src[i + 1]; i += 2; }
        else if (src[i] === '$' && src[i + 1] === '(') { s += readDollarParen(); }
        else { s += src[i]; i++; }
      }
      i++; add(s, 'double'); continue;
    }
    if (c === '$' && src[i + 1] === '(') { add(readDollarParen(), 'none'); continue; }
    add(c, 'none'); i++;
  }
  flush();
  return toks;
}

const RESERVED = new Set(['if', 'then', 'elif', 'else', 'fi', 'for', 'while', 'until', 'do', 'done', 'in']);
const wordText = (w: Tok) => (w.word ?? []).map((c) => c.s).join('');
const wordPlain = (w: Tok) => (w.word ?? []).every((c) => c.q === 'none');
const wordKw = (w: Tok) => (wordPlain(w) ? wordText(w) : null);

/* ── Parser → AST ── */
function parse(toks: Tok[]): Node {
  let p = 0;
  const peek = () => toks[p];
  const atOp = (v: string) => peek() && peek().op === v;
  const atKw = (v: string) => !!(peek() && peek().word && wordKw(peek()) === v);
  const skipSep = () => { while (atOp(';') || atOp('\n')) p++; };

  function parseList(terms: Set<string>): Node {
    const items: Node[] = [];
    skipSep();
    while (peek() && !(peek().word && terms.has(wordKw(peek()) ?? ''))) {
      const ao = parseAndOr();
      if (ao) items.push(ao);
      if (atOp(';') || atOp('\n')) { skipSep(); continue; }
      break;
    }
    return { type: 'list', items };
  }

  function parseAndOr(): Node {
    let left = parsePipeline();
    while (atOp('&&') || atOp('||')) {
      const op = peek().op; p++;
      while (atOp('\n')) p++;
      const right = parsePipeline();
      left = { type: 'andor', op, left, right };
    }
    return left;
  }

  function parsePipeline(): Node {
    const cmds: Node[] = [parseCommand()];
    while (atOp('|')) { p++; while (atOp('\n')) p++; cmds.push(parseCommand()); }
    return cmds.length === 1 ? cmds[0] : { type: 'pipe', cmds };
  }

  function parseCommand(): Node {
    const kw = peek() && peek().word ? wordKw(peek()) : null;
    if (kw === 'if') return parseIf();
    if (kw === 'for') return parseFor();
    if (kw === 'while' || kw === 'until') return parseLoop(kw);
    const words: Tok[] = [];
    while (peek() && peek().word && !RESERVED.has(wordKw(peek()) ?? '')) { words.push(peek()); p++; }
    return { type: 'cmd', words };
  }

  function parseIf(): Node {
    p++;
    const cond = parseList(new Set(['then']));
    expectKw('then');
    const then = parseList(new Set(['elif', 'else', 'fi']));
    const elifs: Node[] = [];
    let elseBranch: Node = null;
    while (atKw('elif')) {
      p++;
      const c = parseList(new Set(['then']));
      expectKw('then');
      const bd = parseList(new Set(['elif', 'else', 'fi']));
      elifs.push({ cond: c, body: bd });
    }
    if (atKw('else')) { p++; elseBranch = parseList(new Set(['fi'])); }
    expectKw('fi');
    return { type: 'if', cond, then, elifs, else: elseBranch };
  }

  function parseFor(): Node {
    p++;
    const varName = wordText(peek()); p++;
    const words: Tok[] = [];
    if (atKw('in')) {
      p++;
      while (peek() && peek().word && !RESERVED.has(wordKw(peek()) ?? '')) { words.push(peek()); p++; }
    }
    skipSep();
    expectKw('do');
    const body = parseList(new Set(['done']));
    expectKw('done');
    return { type: 'for', varName, words, body };
  }

  function parseLoop(kind: string): Node {
    p++;
    const cond = parseList(new Set(['do']));
    expectKw('do');
    const body = parseList(new Set(['done']));
    expectKw('done');
    return { type: 'loop', kind, cond, body };
  }

  function expectKw(v: string) {
    skipSep();
    if (!atKw(v)) throw new ShellError(`syntax error: expected '${v}'`);
    p++;
  }

  return parseList(new Set());
}

/* ── Arithmetic ── */
function arith(expr: string, env: Record<string, string>): number {
  const s = expr;
  let i = 0;
  const skip = () => { while (i < s.length && /\s/.test(s[i])) i++; };
  function primary(): number {
    skip();
    if (s[i] === '(') { i++; const v = cmp(); skip(); if (s[i] === ')') i++; return v; }
    if (s[i] === '-') { i++; return -primary(); }
    if (s[i] === '+') { i++; return primary(); }
    if (s[i] === '!') { i++; return primary() ? 0 : 1; }
    if (s[i] === '$') i++;
    let m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(s.slice(i));
    if (m) { i += m[0].length; const num = parseInt(env[m[0]], 10); return Number.isNaN(num) ? 0 : num; }
    m = /^\d+/.exec(s.slice(i));
    if (m) { i += m[0].length; return parseInt(m[0], 10); }
    return 0;
  }
  function muldiv(): number { let v = primary(); for (;;) { skip(); const op = s[i]; if (op === '*' || op === '/' || op === '%') { i++; const r = primary(); v = op === '*' ? v * r : op === '/' ? Math.trunc(v / r) : v % r; } else break; } return v; }
  function addsub(): number { let v = muldiv(); for (;;) { skip(); const op = s[i]; if (op === '+' || op === '-') { i++; const r = muldiv(); v = op === '+' ? v + r : v - r; } else break; } return v; }
  function cmp(): number {
    let v = addsub();
    for (;;) {
      skip();
      const two = s.slice(i, i + 2);
      if (['==', '!=', '<=', '>='].includes(two)) { i += 2; const r = addsub(); v = ({ '==': v === r, '!=': v !== r, '<=': v <= r, '>=': v >= r } as Record<string, boolean>)[two] ? 1 : 0; }
      else if (s[i] === '<' || s[i] === '>') { const op = s[i]; i++; const r = addsub(); v = (op === '<' ? v < r : v > r) ? 1 : 0; }
      else break;
    }
    return v;
  }
  return cmp() | 0;
}

/* ── Expansion ── */
const lookup = (name: string, ctx: Ctx) => { const v = ctx.env[name]; return v === undefined || v === null ? '' : String(v); };

function expandDollar(text: string, ctx: Ctx): string {
  let out = '';
  let i = 0;
  const n = text.length;
  while (i < n) {
    const c = text[i];
    if (c !== '$') { out += c; i++; continue; }
    if (text[i + 1] === '(' && text[i + 2] === '(') {
      let k = i + 3, d = 0, inner = '';
      while (k < n) {
        const ch = text[k];
        if (ch === '(') { d++; inner += ch; k++; }
        else if (ch === ')') { if (d > 0) { d--; inner += ch; k++; } else { k += 2; break; } }
        else { inner += ch; k++; }
      }
      out += String(arith(inner, ctx.env)); i = k; continue;
    }
    if (text[i + 1] === '(') {
      let k = i + 2, d = 0, inner = '';
      while (k < n) {
        const ch = text[k];
        if (ch === '(') { d++; inner += ch; k++; }
        else if (ch === ')') { if (d > 0) { d--; inner += ch; k++; } else { k++; break; } }
        else { inner += ch; k++; }
      }
      const sub = runProgram(parse(tokenize(inner)), '', ctx);
      out += sub.out.replace(/\n+$/, ''); i = k; continue;
    }
    if (text[i + 1] === '{') {
      let k = i + 2, name = '';
      while (k < n && text[k] !== '}') { name += text[k]; k++; }
      k++; out += lookup(name, ctx); i = k; continue;
    }
    if (text[i + 1] === '?') { out += String(ctx.status); i += 2; continue; }
    const m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(text.slice(i + 1));
    if (m) { out += lookup(m[0], ctx); i += 1 + m[0].length; continue; }
    out += '$'; i++;
  }
  return out;
}

function expandWord(w: Tok, ctx: Ctx): string[] {
  const fields: string[] = [''];
  const pushLiteral = (s: string) => { fields[fields.length - 1] += s; };
  const hasQuote = (w.word ?? []).some((c) => c.q !== 'none');
  for (const ch of w.word ?? []) {
    if (ch.q === 'single') { pushLiteral(ch.s); continue; }
    const expanded = expandDollar(ch.s, ctx);
    if (ch.q === 'double') { pushLiteral(expanded); continue; }
    const parts = expanded.split(/[ \t\n]+/);
    for (let idx = 0; idx < parts.length; idx++) {
      if (idx === 0) pushLiteral(parts[0]);
      else fields.push(parts[idx]);
    }
  }
  return fields.filter((f, idx) => f !== '' || (idx === 0 && fields.length === 1 && hasQuote));
}

function expandWords(words: Tok[], ctx: Ctx): string[] {
  const out: string[] = [];
  for (const w of words) for (const f of expandWord(w, ctx)) out.push(f);
  return out;
}

/* ── Execution ── */
function runProgram(ast: Node, stdin: string, ctx: Ctx): { out: string; status: number } {
  const sub: Ctx = {
    env: Object.assign(Object.create(null), ctx.env),
    status: ctx.status,
    out: '',
    stdinBuf: stdin ?? '',
    stdinPos: 0,
    checkTime: ctx.checkTime,
  };
  const status = runList(ast, sub);
  return { out: sub.out, status };
}

function runList(node: Node, ctx: Ctx): number {
  let status = 0;
  for (const item of node.items) status = runNode(item, ctx, '');
  return status;
}

function runNode(node: Node, ctx: Ctx, stdin: string): number {
  ctx.checkTime();
  switch (node.type) {
    case 'list': return runList(node, ctx);
    case 'andor': {
      const l = runNode(node.left, ctx, stdin);
      if (node.op === '&&') return l === 0 ? runNode(node.right, ctx, stdin) : l;
      return l !== 0 ? runNode(node.right, ctx, stdin) : l;
    }
    case 'pipe': {
      let data = stdin; let st = 0;
      for (let k = 0; k < node.cmds.length; k++) {
        const r = execCaptured(node.cmds[k], ctx, data);
        st = r.status;
        if (k === node.cmds.length - 1) { ctx.out += r.out; if (ctx.out.length > MAX_OUTPUT) throw new ShellError('output limit'); }
        else data = r.out;
      }
      ctx.status = st; return st;
    }
    case 'cmd': { const r = execSimple(node, ctx, stdin, false); ctx.status = r.status; return r.status; }
    case 'if': {
      if (runNode(node.cond, ctx, '') === 0) return runNode(node.then, ctx, '');
      for (const e of node.elifs) if (runNode(e.cond, ctx, '') === 0) return runNode(e.body, ctx, '');
      if (node.else) return runNode(node.else, ctx, '');
      return 0;
    }
    case 'for': {
      const vals = expandWords(node.words, ctx);
      let st = 0; let count = 0;
      for (const v of vals) { ctx.env[node.varName] = v; st = runNode(node.body, ctx, ''); if (++count > MAX_LOOP) throw new ShellError('loop limit'); ctx.checkTime(); }
      return st;
    }
    case 'loop': {
      let st = 0; let count = 0;
      for (;;) {
        const cond = runNode(node.cond, ctx, '');
        const go = node.kind === 'while' ? cond === 0 : cond !== 0;
        if (!go) break;
        st = runNode(node.body, ctx, '');
        if (++count > MAX_LOOP) throw new ShellError('loop limit');
        ctx.checkTime();
      }
      return st;
    }
    default: return 0;
  }
}

function execCaptured(node: Node, ctx: Ctx, stdin: string): { out: string; status: number } {
  if (node.type === 'cmd') return execSimple(node, ctx, stdin, true);
  if (node.type === 'pipe') {
    let data = stdin; let st = 0; let out = '';
    for (let k = 0; k < node.cmds.length; k++) {
      const r = execCaptured(node.cmds[k], ctx, data);
      st = r.status;
      if (k === node.cmds.length - 1) out = r.out; else data = r.out;
    }
    return { out, status: st };
  }
  const saved = ctx.out; ctx.out = '';
  const status = runNode(node, ctx, stdin);
  const out = ctx.out; ctx.out = saved;
  return { out, status };
}

function execSimple(node: Node, ctx: Ctx, stdin: string, captured: boolean): { out: string; status: number } {
  let idx = 0;
  const assigns: Tok[] = [];
  while (idx < node.words.length) {
    const w: Tok = node.words[idx];
    const first = w.word?.[0];
    if (first && first.q === 'none' && /^[A-Za-z_][A-Za-z0-9_]*=/.test(first.s)) { assigns.push(w); idx++; } else break;
  }
  const rest: Tok[] = node.words.slice(idx);
  for (const a of assigns) applyAssign(a, ctx);
  if (rest.length === 0) return { out: '', status: 0 };

  const argv = expandWords(rest, ctx);
  const cmd = argv[0];
  const args = argv.slice(1);
  let out = '';
  const w = (s: string) => { out += s; };
  let status = 0;
  const b = BUILTINS[cmd];
  if (b) status = b(args, { stdin, w, ctx, rawWords: rest }) | 0;
  else { out += `${cmd}: command not found\n`; status = 127; }

  if (!captured) { ctx.out += out; if (ctx.out.length > MAX_OUTPUT) throw new ShellError('output limit'); }
  return { out, status };
}

function applyAssign(w: Tok, ctx: Ctx) {
  const full = wordText(w);
  const eq = full.indexOf('=');
  const name = full.slice(0, eq);
  let expanded = '';
  for (const ch of w.word ?? []) expanded += ch.q === 'single' ? ch.s : expandDollar(ch.s, ctx);
  ctx.env[name] = expanded.slice(name.length + 1);
}

/* ── Builtins & coreutils ── */
const splitLines = (s: string) => (s === '' ? [] : s.replace(/\n$/, '').split('\n'));

function headTailCount(args: string[], def: number): number {
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '-n') return parseInt(args[i + 1], 10) || def;
    if (/^-n\d+$/.test(a)) return parseInt(a.slice(2), 10);
    if (/^-\d+$/.test(a)) return parseInt(a.slice(1), 10);
  }
  return def;
}

function expandSet(spec: string): string {
  if (!spec) return '';
  let out = '';
  for (let i = 0; i < spec.length; i++) {
    if (spec[i + 1] === '-' && spec[i + 2]) { for (let c = spec.charCodeAt(i); c <= spec.charCodeAt(i + 2); c++) out += String.fromCharCode(c); i += 2; }
    else out += spec[i];
  }
  return out;
}

function testBuiltin(args: string[], _io: IO): number {
  let neg = false;
  let a = args;
  if (a[0] === '!') { neg = true; a = a.slice(1); }
  let res: boolean;
  if (a.length === 0) res = false;
  else if (a.length === 1) res = a[0] !== '';
  else if (a.length === 2) {
    const [op, x] = a;
    if (op === '-z') res = x === '';
    else if (op === '-n') res = x !== '';
    else res = false;
  } else {
    const [x, op, y] = a;
    const nx = parseInt(x, 10); const ny = parseInt(y, 10);
    switch (op) {
      case '=': case '==': res = x === y; break;
      case '!=': res = x !== y; break;
      case '-eq': res = nx === ny; break;
      case '-ne': res = nx !== ny; break;
      case '-lt': res = nx < ny; break;
      case '-le': res = nx <= ny; break;
      case '-gt': res = nx > ny; break;
      case '-ge': res = nx >= ny; break;
      default: res = false;
    }
  }
  return (neg ? !res : res) ? 0 : 1;
}

const BUILTINS: Record<string, (args: string[], io: IO) => number> = {
  echo(args, { w }) {
    let interpret = false; let nl = true; let i = 0;
    while (args[i] === '-n' || args[i] === '-e' || args[i] === '-E' || args[i] === '-ne' || args[i] === '-en') {
      if (args[i].includes('n')) nl = false;
      if (args[i].includes('e')) interpret = true;
      i++;
    }
    let text = args.slice(i).join(' ');
    if (interpret) text = text.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\\\/g, '\\');
    w(text + (nl ? '\n' : '')); return 0;
  },
  printf(args, { w }) {
    const fmt = args[0] ?? '';
    let ai = 1;
    const out = fmt.replace(/%[sd%]|\\n|\\t/g, (m) => {
      if (m === '\\n') return '\n';
      if (m === '\\t') return '\t';
      if (m === '%%') return '%';
      const v = args[ai++] ?? '';
      return m === '%d' ? String(parseInt(v, 10) || 0) : String(v);
    });
    w(out); return 0;
  },
  ':': () => 0,
  true: () => 0,
  false: () => 1,
  read(args, { ctx }) {
    let i = 0; while (args[i] === '-r') i++;
    const names = args.slice(i);
    if (ctx.stdinPos >= ctx.stdinBuf.length) return 1;
    let nl = ctx.stdinBuf.indexOf('\n', ctx.stdinPos);
    if (nl === -1) nl = ctx.stdinBuf.length;
    const line = ctx.stdinBuf.slice(ctx.stdinPos, nl);
    ctx.stdinPos = nl + 1;
    if (names.length === 0) { ctx.env.REPLY = line; return 0; }
    const parts = line.trim().split(/\s+/);
    for (let k = 0; k < names.length; k++) {
      ctx.env[names[k]] = k === names.length - 1 ? parts.slice(k).join(' ') : (parts[k] ?? '');
    }
    return 0;
  },
  cat(_args, { stdin, w }) { w(stdin ?? ''); return 0; },
  wc(args, { stdin, w }) {
    const s = stdin ?? '';
    const lines = s === '' ? 0 : s.split('\n').length - (s.endsWith('\n') ? 1 : 0);
    const words = s.trim() === '' ? 0 : s.trim().split(/\s+/).length;
    const chars = s.length;
    if (args.includes('-l')) w(`${lines}\n`);
    else if (args.includes('-w')) w(`${words}\n`);
    else if (args.includes('-c')) w(`${chars}\n`);
    else w(`${lines} ${words} ${chars}\n`);
    return 0;
  },
  head(args, { stdin, w }) { const k = headTailCount(args, 10); w(splitLines(stdin ?? '').slice(0, k).map((l) => l + '\n').join('')); return 0; },
  tail(args, { stdin, w }) { const k = headTailCount(args, 10); const L = splitLines(stdin ?? ''); w(L.slice(Math.max(0, L.length - k)).map((l) => l + '\n').join('')); return 0; },
  rev(_args, { stdin, w }) { w(splitLines(stdin ?? '').map((l) => l.split('').reverse().join('')).map((l) => l + '\n').join('')); return 0; },
  sort(args, { stdin, w }) {
    let L = splitLines(stdin ?? '');
    const num = args.includes('-n'); const rev = args.includes('-r'); const uniq = args.includes('-u');
    L.sort((x, y) => (num ? (parseFloat(x) || 0) - (parseFloat(y) || 0) : x < y ? -1 : x > y ? 1 : 0));
    if (rev) L.reverse();
    if (uniq) L = L.filter((x, k) => k === 0 || x !== L[k - 1]);
    w(L.map((l) => l + '\n').join('')); return 0;
  },
  uniq(args, { stdin, w }) {
    const L = splitLines(stdin ?? ''); const count = args.includes('-c');
    const out: { v: string; c: number }[] = [];
    for (const l of L) { if (out.length && out[out.length - 1].v === l) out[out.length - 1].c++; else out.push({ v: l, c: 1 }); }
    w(out.map((o) => (count ? `${String(o.c).padStart(7)} ${o.v}` : o.v) + '\n').join('')); return 0;
  },
  grep(args, { stdin, w }) {
    let inv = false; let ic = false; let cnt = false;
    const pats: string[] = [];
    for (const a of args) { if (a === '-v') inv = true; else if (a === '-i') ic = true; else if (a === '-c') cnt = true; else if (a === '-E' || a === '-e') { /* flag */ } else pats.push(a); }
    const pat = pats[0] ?? '';
    let re: RegExp;
    try { re = new RegExp(pat, ic ? 'i' : ''); } catch { re = new RegExp(pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), ic ? 'i' : ''); }
    const L = splitLines(stdin ?? '').filter((l) => re.test(l) !== inv);
    if (cnt) { w(`${L.length}\n`); return L.length ? 0 : 1; }
    w(L.map((l) => l + '\n').join('')); return L.length ? 0 : 1;
  },
  tr(args, { stdin, w }) {
    const del = args[0] === '-d';
    const a = expandSet(del ? args[1] : args[0]); const bset = del ? '' : expandSet(args[1] ?? '');
    let s = stdin ?? '';
    if (del) { const set = new Set(a.split('')); s = s.split('').filter((c) => !set.has(c)).join(''); }
    else { s = s.split('').map((c) => { const k = a.indexOf(c); return k >= 0 && bset[k] !== undefined ? bset[Math.min(k, bset.length - 1)] : c; }).join(''); }
    w(s); return 0;
  },
  cut(args, { stdin, w }) {
    let d = '\t'; let f = '1';
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === '-d') d = args[++i] ?? '\t';
      else if (a.startsWith('-d')) d = a.slice(2);
      else if (a === '-f') f = args[++i] ?? '1';
      else if (a.startsWith('-f')) f = a.slice(2);
    }
    const fi = parseInt(f, 10) || 1;
    w(splitLines(stdin ?? '').map((l) => (l.split(d)[fi - 1] ?? '')).map((l) => l + '\n').join('')); return 0;
  },
  sed(args, { stdin, w }) {
    const expr = args.find((a) => a.startsWith('s'));
    const m = expr && /^s(.)(.*)\1(.*)\1([gi]*)$/.exec(expr);
    let s = stdin ?? '';
    if (m) { const re = new RegExp(m[2], m[4].includes('g') ? 'g' : ''); s = splitLines(s).map((l) => l.replace(re, m[3])).map((l) => l + '\n').join(''); }
    w(s); return 0;
  },
  seq(args, { w }) {
    let a = 1; let step = 1; let b: number;
    if (args.length === 1) b = parseInt(args[0], 10);
    else if (args.length === 2) { a = parseInt(args[0], 10); b = parseInt(args[1], 10); }
    else { a = parseInt(args[0], 10); step = parseInt(args[1], 10); b = parseInt(args[2], 10); }
    let s = ''; let count = 0;
    for (let x = a; step > 0 ? x <= b : x >= b; x += step) { s += x + '\n'; if (++count > MAX_LOOP) break; }
    w(s); return 0;
  },
  expr(args, { w, ctx }) { const v = arith(args.join(' '), ctx.env); w(String(v) + '\n'); return v === 0 ? 1 : 0; },
  basename(args, { w }) { const p = (args[0] ?? '').replace(/\/+$/, ''); w((p.split('/').pop() || '/') + '\n'); return 0; },
  dirname(args, { w }) { const p = (args[0] ?? '').replace(/\/+$/, ''); const i = p.lastIndexOf('/'); w((i <= 0 ? (i === 0 ? '/' : '.') : p.slice(0, i)) + '\n'); return 0; },
  pwd(_args, { w }) { w('/home/khana\n'); return 0; },
  cd() { return 0; },
  export(args, { ctx }) { for (const a of args) { const m = /^([A-Za-z_]\w*)=(.*)$/s.exec(a); if (m) ctx.env[m[1]] = m[2]; } return 0; },
  sleep() { return 0; },
  exit(args) { throw new ExitSignal(parseInt(args[0], 10) || 0); },
  test: testBuiltin,
  '[': (args, io) => { if (args[args.length - 1] !== ']') return 2; return testBuiltin(args.slice(0, -1), io); },
};

/**
 * Run a Bash script, feeding `stdin` to `read`, and capture stdout.
 */
export async function runBash(
  code: string,
  stdin = '',
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<ExecutionResult> {
  const start = performance.now();
  const deadline = Date.now() + timeoutMs;
  const ctx: Ctx = {
    env: Object.create(null),
    status: 0,
    out: '',
    stdinBuf: stdin ?? '',
    stdinPos: 0,
    checkTime() { if (Date.now() > deadline) throw new ShellError('timed out'); },
  };
  try {
    runList(parse(tokenize(code)), ctx);
    return { output: ctx.out, durationMs: Math.round(performance.now() - start) };
  } catch (e) {
    if (e instanceof ExitSignal) return { output: ctx.out, durationMs: Math.round(performance.now() - start) };
    const msg = e instanceof ShellError ? e.message : (e instanceof Error ? e.message : String(e));
    return { output: ctx.out, error: `bash: ${msg}`, durationMs: Math.round(performance.now() - start) };
  }
}
