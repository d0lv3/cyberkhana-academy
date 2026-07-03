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

const SHELL_HELP = `A practice shell — runs safely in your browser, never a real machine.

  Navigate : ls  cd  pwd  tree  find  stat  file  realpath
  Files    : cat  cp  mv  rm  mkdir  rmdir  touch  ln  chmod  du
  Text     : echo  grep  wc  sort  uniq  head  tail  tac  nl  cut  tr
             sed  rev  tee  more  less  seq  printf
  System   : whoami  id  groups  uname  hostname  arch  date  uptime
             ps  free  df  who  w  env  printenv  history  which  type
  Shell    : variables (x=5)  ·  \$(( )) math  ·  \$(cmd)  ·  pipes |
             &&  ||  ·  redirection > >> <  ·  if / for / while  ·  clear

Try:  ls -la      ·   cat readme.md      ·   grep -i error /var/log/syslog
      cd projects && tree     ·   echo "hi" > note.txt && cat note.txt
`;

class ShellError extends Error {}
class ExitSignal {
  code: number;
  constructor(code: number) { this.code = code | 0; }
}

type Quote = 'none' | 'single' | 'double';
interface Chunk { s: string; q: Quote }
interface Tok { op?: string; word?: Chunk[] }
/* ── Virtual filesystem (used by the interactive shell; unused by one-shot runBash) ── */
interface FSFile { file: string; mode?: string }
interface FSDir { dir: Record<string, FSNode>; mode?: string }
type FSNode = FSFile | FSDir;
const isDir = (n: FSNode | undefined): n is FSDir => !!n && 'dir' in n;
const isFile = (n: FSNode | undefined): n is FSFile => !!n && 'file' in n;
const modeOf = (n: FSNode) => n.mode ?? (isDir(n) ? 'rwxr-xr-x' : 'rw-r--r--');

interface Ctx {
  env: Record<string, string>;
  status: number;
  out: string;
  stdinBuf: string;
  stdinPos: number;
  checkTime: () => void;
  fs?: FSDir;
  cwd?: string;
  home?: string;
  user?: string;
  history?: string[];
  cleared?: boolean;
}
interface IO { stdin: string; w: (s: string) => void; ctx: Ctx; rawWords?: Tok[] }
/* eslint-disable @typescript-eslint/no-explicit-any */
type Node = any;

/* ── Path helpers ── */
const splitPath = (p: string) => p.split('/').filter((x) => x !== '');
function resolvePath(ctx: Ctx, p: string): string {
  const home = ctx.home ?? '/root';
  let segs: string[];
  if (p === '' || p === '~') return home;
  if (p.startsWith('~/')) { segs = splitPath(home).concat(splitPath(p.slice(2))); }
  else if (p.startsWith('/')) segs = splitPath(p);
  else segs = splitPath(ctx.cwd ?? home).concat(splitPath(p));
  const out: string[] = [];
  for (const s of segs) {
    if (s === '.') continue;
    else if (s === '..') out.pop();
    else out.push(s);
  }
  return '/' + out.join('/');
}
function nodeAt(root: FSDir, abs: string): FSNode | undefined {
  let cur: FSNode = root;
  for (const s of splitPath(abs)) { if (!isDir(cur)) return undefined; cur = cur.dir[s]; if (cur === undefined) return undefined; }
  return cur;
}
/** Ensure a directory exists (mkdir -p style); returns it or null on conflict. */
function ensureDir(root: FSDir, abs: string): FSDir | null {
  let cur: FSDir = root;
  for (const s of splitPath(abs)) {
    const next = cur.dir[s];
    if (next === undefined) { const d: FSDir = { dir: {} }; cur.dir[s] = d; cur = d; }
    else if (isDir(next)) cur = next;
    else return null;
  }
  return cur;
}
function parentAndName(abs: string): { parent: string; name: string } {
  const segs = splitPath(abs);
  const name = segs.pop() ?? '';
  return { parent: '/' + segs.join('/'), name };
}
function writeFile(ctx: Ctx, abs: string, content: string): string | null {
  const { parent, name } = parentAndName(abs);
  if (!name) return 'invalid path';
  const dir = nodeAt(ctx.fs!, parent);
  if (!isDir(dir)) return `${parent}: No such file or directory`;
  dir.dir[name] = { file: content };
  return null;
}
/** cwd shown with $HOME collapsed to ~ (for the prompt). */
export function prettyCwd(ctx: { cwd?: string; home?: string }): string {
  const cwd = ctx.cwd ?? '/';
  const home = ctx.home ?? '';
  if (home && (cwd === home || cwd.startsWith(home + '/'))) return '~' + cwd.slice(home.length);
  return cwd;
}

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
    if (c === '>' && src[i + 1] === '>') { flush(); toks.push({ op: '>>' }); i += 2; continue; }
    if (c === '>') { flush(); toks.push({ op: '>' }); i++; continue; }
    if (c === '<') { flush(); toks.push({ op: '<' }); i++; continue; }
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
    const redirs: { op: string; target: Tok }[] = [];
    for (;;) {
      const t = peek();
      if (t && t.word && !RESERVED.has(wordKw(t) ?? '')) { words.push(t); p++; continue; }
      if (t && (t.op === '>' || t.op === '>>' || t.op === '<')) {
        const op = t.op; p++;
        const target = peek();
        if (target && target.word) { redirs.push({ op, target }); p++; }
        continue;
      }
      break;
    }
    return { type: 'cmd', words, redirs };
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

  const redirs: { op: string; target: Tok }[] = node.redirs ?? [];
  const finish = (out: string, status: number): { out: string; status: number } => {
    if (!captured) { ctx.out += out; if (ctx.out.length > MAX_OUTPUT) throw new ShellError('output limit'); return { out: '', status }; }
    return { out, status };
  };
  const applyOutRedir = (out: string, status: number): { out: string; status: number } => {
    const r = redirs.find((x) => x.op === '>' || x.op === '>>');
    if (!r) return finish(out, status);
    if (ctx.fs) {
      const path = expandWord(r.target, ctx)[0] ?? '';
      const abs = resolvePath(ctx, path);
      const existing = nodeAt(ctx.fs, abs);
      const prev = r.op === '>>' && isFile(existing) ? existing.file : '';
      const err = writeFile(ctx, abs, prev + out);
      if (err) return finish(`bash: ${path}: ${err}\n`, 1);
    }
    return finish('', status); // output was redirected to a file
  };

  if (rest.length === 0) return applyOutRedir('', 0);

  // input redirection: `< file`
  let effStdin = stdin;
  for (const r of redirs) {
    if (r.op === '<') {
      const path = expandWord(r.target, ctx)[0] ?? '';
      const n = ctx.fs ? nodeAt(ctx.fs, resolvePath(ctx, path)) : undefined;
      if (isFile(n)) effStdin = n.file;
      else return finish(`bash: ${path}: No such file or directory\n`, 1);
    }
  }

  const argv = expandWords(rest, ctx);
  const cmd = argv[0];
  const args = argv.slice(1);
  let out = '';
  const w = (s: string) => { out += s; };
  let status = 0;
  const b = BUILTINS[cmd];
  if (b) status = b(args, { stdin: effStdin, w, ctx, rawWords: rest }) | 0;
  else { out += `${cmd}: command not found\n`; status = 127; }

  return applyOutRedir(out, status);
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

/** Read from file arguments if given, else fall back to piped/redirected stdin. */
function readInput(ctx: Ctx, files: string[], stdin: string): { data: string; errors: string } {
  if (files.length === 0) return { data: stdin ?? '', errors: '' };
  let data = '';
  let errors = '';
  for (const f of files) {
    const n = ctx.fs ? nodeAt(ctx.fs, resolvePath(ctx, f)) : undefined;
    if (isFile(n)) data += n.file;
    else if (isDir(n)) errors += `${f}: Is a directory\n`;
    else errors += `${f}: No such file or directory\n`;
  }
  return { data, errors };
}

/** Non-flag args, skipping the value that follows each flag in `valueFlags`. */
function nonFlagFiles(args: string[], valueFlags: string[] = []): string[] {
  const files: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (valueFlags.includes(a)) { i++; continue; }
    if (a.startsWith('-')) continue;
    files.push(a);
  }
  return files;
}

/** Deep-clone a filesystem node (for cp). */
function cloneNode(n: FSNode): FSNode {
  return isDir(n)
    ? { dir: Object.fromEntries(Object.entries(n.dir).map(([k, v]) => [k, cloneNode(v)])), mode: n.mode }
    : { file: n.file, mode: n.mode };
}

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
  cat(args, { stdin, w, ctx }) {
    const files = args.filter((a) => !a.startsWith('-'));
    if (files.length === 0) { w(stdin ?? ''); return 0; }
    let status = 0;
    for (const f of files) {
      const n = ctx.fs ? nodeAt(ctx.fs, resolvePath(ctx, f)) : undefined;
      if (isFile(n)) w(n.file);
      else if (isDir(n)) { w(`cat: ${f}: Is a directory\n`); status = 1; }
      else { w(`cat: ${f}: No such file or directory\n`); status = 1; }
    }
    return status;
  },
  wc(args, { stdin, w, ctx }) {
    const { data, errors } = readInput(ctx, args.filter((a) => !a.startsWith('-')), stdin);
    if (errors) w(errors.split('\n').filter(Boolean).map((e) => `wc: ${e}\n`).join(''));
    const s = data;
    const lines = s === '' ? 0 : s.split('\n').length - (s.endsWith('\n') ? 1 : 0);
    const words = s.trim() === '' ? 0 : s.trim().split(/\s+/).length;
    const chars = s.length;
    if (args.includes('-l')) w(`${lines}\n`);
    else if (args.includes('-w')) w(`${words}\n`);
    else if (args.includes('-c') || args.includes('-m')) w(`${chars}\n`);
    else w(`${lines} ${words} ${chars}\n`);
    return errors ? 1 : 0;
  },
  head(args, { stdin, w, ctx }) { const k = headTailCount(args, 10); const { data } = readInput(ctx, nonFlagFiles(args, ['-n']), stdin); w(splitLines(data).slice(0, k).map((l) => l + '\n').join('')); return 0; },
  tail(args, { stdin, w, ctx }) { const k = headTailCount(args, 10); const { data } = readInput(ctx, nonFlagFiles(args, ['-n']), stdin); const L = splitLines(data); w(L.slice(Math.max(0, L.length - k)).map((l) => l + '\n').join('')); return 0; },
  tac(args, { stdin, w, ctx }) { const { data } = readInput(ctx, args.filter((a) => !a.startsWith('-')), stdin); w(splitLines(data).reverse().map((l) => l + '\n').join('')); return 0; },
  nl(args, { stdin, w, ctx }) { const { data } = readInput(ctx, args.filter((a) => !a.startsWith('-')), stdin); const L = splitLines(data); w(L.map((l, i) => `${String(i + 1).padStart(6)}\t${l}`).join('\n') + (L.length ? '\n' : '')); return 0; },
  rev(args, { stdin, w, ctx }) { const { data } = readInput(ctx, args.filter((a) => !a.startsWith('-')), stdin); w(splitLines(data).map((l) => l.split('').reverse().join('')).map((l) => l + '\n').join('')); return 0; },
  sort(args, { stdin, w, ctx }) {
    const { data } = readInput(ctx, args.filter((a) => !a.startsWith('-')), stdin);
    let L = splitLines(data);
    const num = args.includes('-n'); const rev = args.includes('-r'); const uniq = args.includes('-u');
    L.sort((x, y) => (num ? (parseFloat(x) || 0) - (parseFloat(y) || 0) : x < y ? -1 : x > y ? 1 : 0));
    if (rev) L.reverse();
    if (uniq) L = L.filter((x, k) => k === 0 || x !== L[k - 1]);
    w(L.map((l) => l + '\n').join('')); return 0;
  },
  uniq(args, { stdin, w, ctx }) {
    const { data } = readInput(ctx, args.filter((a) => !a.startsWith('-')), stdin);
    const L = splitLines(data); const count = args.includes('-c');
    const out: { v: string; c: number }[] = [];
    for (const l of L) { if (out.length && out[out.length - 1].v === l) out[out.length - 1].c++; else out.push({ v: l, c: 1 }); }
    w(out.map((o) => (count ? `${String(o.c).padStart(7)} ${o.v}` : o.v) + '\n').join('')); return 0;
  },
  grep(args, { stdin, w, ctx }) {
    let inv = false; let ic = false; let cnt = false; let num = false;
    const rest: string[] = [];
    for (const a of args) {
      if (a === '-v') inv = true; else if (a === '-i') ic = true; else if (a === '-c') cnt = true; else if (a === '-n') num = true;
      else if (a === '-E' || a === '-e') { /* flag */ } else rest.push(a);
    }
    const pat = rest[0] ?? '';
    const { data } = readInput(ctx, rest.slice(1), stdin);
    let re: RegExp;
    try { re = new RegExp(pat, ic ? 'i' : ''); } catch { re = new RegExp(pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), ic ? 'i' : ''); }
    const matched = splitLines(data).map((l, i) => ({ l, i })).filter(({ l }) => re.test(l) !== inv);
    if (cnt) { w(`${matched.length}\n`); return matched.length ? 0 : 1; }
    w(matched.map(({ l, i }) => (num ? `${i + 1}:${l}` : l) + '\n').join('')); return matched.length ? 0 : 1;
  },
  tr(args, { stdin, w }) {
    const del = args[0] === '-d';
    const a = expandSet(del ? args[1] : args[0]); const bset = del ? '' : expandSet(args[1] ?? '');
    let s = stdin ?? '';
    if (del) { const set = new Set(a.split('')); s = s.split('').filter((c) => !set.has(c)).join(''); }
    else { s = s.split('').map((c) => { const k = a.indexOf(c); return k >= 0 && bset[k] !== undefined ? bset[Math.min(k, bset.length - 1)] : c; }).join(''); }
    w(s); return 0;
  },
  cut(args, { stdin, w, ctx }) {
    let d = '\t'; let f = '1'; const files: string[] = [];
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === '-d') d = args[++i] ?? '\t';
      else if (a.startsWith('-d')) d = a.slice(2);
      else if (a === '-f') f = args[++i] ?? '1';
      else if (a.startsWith('-f')) f = a.slice(2);
      else if (!a.startsWith('-')) files.push(a);
    }
    const fi = parseInt(f, 10) || 1;
    const { data } = readInput(ctx, files, stdin);
    w(splitLines(data).map((l) => (l.split(d)[fi - 1] ?? '')).map((l) => l + '\n').join('')); return 0;
  },
  sed(args, { stdin, w, ctx }) {
    const expr = args.find((a) => /^s(.).*\1/.test(a));
    const files = args.filter((a) => a !== expr && !a.startsWith('-'));
    const m = expr && /^s(.)(.*)\1(.*)\1([gi]*)$/.exec(expr);
    const { data } = readInput(ctx, files, stdin);
    let s = data;
    if (m) { const re = new RegExp(m[2], m[4].includes('g') ? 'g' : ''); s = splitLines(s).map((l) => l.replace(re, m[3])).map((l) => l + '\n').join(''); }
    w(s); return 0;
  },
  more(args, io) { return BUILTINS.cat(args, io); },
  less(args, io) { return BUILTINS.cat(args, io); },
  tee(args, { stdin, w, ctx }) {
    const append = args.some((a) => a.startsWith('-') && a.includes('a'));
    const data = stdin ?? '';
    if (ctx.fs) for (const f of args.filter((a) => !a.startsWith('-'))) {
      const abs = resolvePath(ctx, f);
      const existing = nodeAt(ctx.fs, abs);
      const prev = append && isFile(existing) ? existing.file : '';
      writeFile(ctx, abs, prev + data);
    }
    w(data); return 0;
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
  pwd(_args, { w, ctx }) { w((ctx.cwd ?? '/') + '\n'); return 0; },
  cd(args, { w, ctx }) {
    if (!ctx.fs) return 0;
    const target = args.find((a) => !a.startsWith('-')) ?? '~';
    const abs = resolvePath(ctx, target);
    const n = nodeAt(ctx.fs, abs);
    if (n === undefined) { w(`cd: ${target}: No such file or directory\n`); return 1; }
    if (!isDir(n)) { w(`cd: ${target}: Not a directory\n`); return 1; }
    ctx.cwd = abs === '' ? '/' : abs;
    ctx.env.PWD = ctx.cwd;
    return 0;
  },
  ls(args, { w, ctx }) {
    if (!ctx.fs) return 0;
    const flags = args.filter((a) => a.startsWith('-')).join('');
    const long = flags.includes('l');
    const all = flags.includes('a');
    const target = args.find((a) => !a.startsWith('-')) ?? '.';
    const abs = resolvePath(ctx, target);
    const n = nodeAt(ctx.fs, abs);
    if (n === undefined) { w(`ls: cannot access '${target}': No such file or directory\n`); return 1; }
    if (isFile(n)) {
      if (long) w(`-${modeOf(n)} 1 ${ctx.user ?? 'user'} ${ctx.user ?? 'user'} ${String(n.file.length).padStart(5)} ${target}\n`);
      else w(target + '\n');
      return 0;
    }
    let names = Object.keys(n.dir).sort();
    if (!all) names = names.filter((nm) => !nm.startsWith('.'));
    if (all) names = ['.', '..', ...names];
    const child = (nm: string): FSNode => (nm === '.' || nm === '..' ? { dir: {} } : n.dir[nm]);
    if (long) {
      w(names.map((nm) => {
        const c = child(nm);
        const size = isFile(c) ? c.file.length : 4096;
        return `${isDir(c) ? 'd' : '-'}${modeOf(c)} 1 ${ctx.user ?? 'user'} ${ctx.user ?? 'user'} ${String(size).padStart(5)} ${isDir(c) ? nm + '/' : nm}`;
      }).join('\n') + (names.length ? '\n' : ''));
    } else {
      w(names.map((nm) => (isDir(child(nm)) ? nm + '/' : nm)).join('  ') + (names.length ? '\n' : ''));
    }
    return 0;
  },
  mkdir(args, { w, ctx }) {
    if (!ctx.fs) return 0;
    const p = args.some((a) => a.startsWith('-') && a.includes('p'));
    let status = 0;
    for (const t of args.filter((a) => !a.startsWith('-'))) {
      const abs = resolvePath(ctx, t);
      if (p) { if (!ensureDir(ctx.fs, abs)) { w(`mkdir: cannot create directory '${t}': Not a directory\n`); status = 1; } continue; }
      const { parent, name } = parentAndName(abs);
      const par = nodeAt(ctx.fs, parent);
      if (!isDir(par)) { w(`mkdir: cannot create directory '${t}': No such file or directory\n`); status = 1; }
      else if (par.dir[name]) { w(`mkdir: cannot create directory '${t}': File exists\n`); status = 1; }
      else par.dir[name] = { dir: {} };
    }
    return status;
  },
  touch(args, { w, ctx }) {
    if (!ctx.fs) return 0;
    for (const t of args.filter((a) => !a.startsWith('-'))) {
      const abs = resolvePath(ctx, t);
      if (nodeAt(ctx.fs, abs) === undefined) { const err = writeFile(ctx, abs, ''); if (err) w(`touch: cannot touch '${t}': ${err}\n`); }
    }
    return 0;
  },
  rm(args, { w, ctx }) {
    if (!ctx.fs) return 0;
    const rec = args.some((a) => a.startsWith('-') && /[rR]/.test(a));
    const force = args.some((a) => a.startsWith('-') && a.includes('f'));
    let status = 0;
    for (const t of args.filter((a) => !a.startsWith('-'))) {
      const abs = resolvePath(ctx, t);
      const { parent, name } = parentAndName(abs);
      const par = nodeAt(ctx.fs, parent);
      const target = isDir(par) ? par.dir[name] : undefined;
      if (target === undefined) { if (!force) { w(`rm: cannot remove '${t}': No such file or directory\n`); status = 1; } continue; }
      if (isDir(target) && !rec) { w(`rm: cannot remove '${t}': Is a directory\n`); status = 1; continue; }
      delete (par as FSDir).dir[name];
    }
    return status;
  },
  clear(_args, { ctx }) { ctx.cleared = true; return 0; },
  whoami(_args, { w, ctx }) { w((ctx.user ?? 'user') + '\n'); return 0; },
  history(_args, { w, ctx }) {
    const h = ctx.history ?? [];
    w(h.map((c, i) => `${String(i + 1).padStart(4)}  ${c}`).join('\n') + (h.length ? '\n' : ''));
    return 0;
  },
  env(_args, { w, ctx }) { w(Object.entries(ctx.env).map(([k, v]) => `${k}=${v}`).join('\n') + '\n'); return 0; },
  help(_args, { w }) { w(SHELL_HELP); return 0; },
  cp(args, { w, ctx }) {
    if (!ctx.fs) return 0;
    const rec = args.some((a) => a.startsWith('-') && /[rR]/.test(a));
    const files = args.filter((a) => !a.startsWith('-'));
    if (files.length < 2) { w('cp: missing destination file operand\n'); return 1; }
    const dest = files.pop() as string;
    const destAbs = resolvePath(ctx, dest);
    const intoDir = isDir(nodeAt(ctx.fs, destAbs));
    let status = 0;
    for (const src of files) {
      const srcNode = nodeAt(ctx.fs, resolvePath(ctx, src));
      if (srcNode === undefined) { w(`cp: cannot stat '${src}': No such file or directory\n`); status = 1; continue; }
      if (isDir(srcNode) && !rec) { w(`cp: -r not specified; omitting directory '${src}'\n`); status = 1; continue; }
      const targetAbs = intoDir ? `${destAbs === '/' ? '' : destAbs}/${parentAndName(resolvePath(ctx, src)).name}` : destAbs;
      const { parent, name } = parentAndName(targetAbs);
      const par = nodeAt(ctx.fs, parent);
      if (!isDir(par)) { w(`cp: cannot create '${dest}': No such file or directory\n`); status = 1; continue; }
      par.dir[name] = cloneNode(srcNode);
    }
    return status;
  },
  mv(args, { w, ctx }) {
    if (!ctx.fs) return 0;
    const files = args.filter((a) => !a.startsWith('-'));
    if (files.length < 2) { w('mv: missing destination file operand\n'); return 1; }
    const dest = files.pop() as string;
    const destAbs = resolvePath(ctx, dest);
    const intoDir = isDir(nodeAt(ctx.fs, destAbs));
    let status = 0;
    for (const src of files) {
      const srcAbs = resolvePath(ctx, src);
      const srcNode = nodeAt(ctx.fs, srcAbs);
      if (srcNode === undefined) { w(`mv: cannot stat '${src}': No such file or directory\n`); status = 1; continue; }
      const targetAbs = intoDir ? `${destAbs === '/' ? '' : destAbs}/${parentAndName(srcAbs).name}` : destAbs;
      const { parent: tp, name: tn } = parentAndName(targetAbs);
      const tpar = nodeAt(ctx.fs, tp);
      if (!isDir(tpar)) { w(`mv: cannot move '${src}': No such file or directory\n`); status = 1; continue; }
      tpar.dir[tn] = srcNode;
      const { parent: sp, name: sn } = parentAndName(srcAbs);
      const spar = nodeAt(ctx.fs, sp);
      if (isDir(spar)) delete spar.dir[sn];
    }
    return status;
  },
  rmdir(args, { w, ctx }) {
    if (!ctx.fs) return 0;
    let status = 0;
    for (const t of args.filter((a) => !a.startsWith('-'))) {
      const { parent, name } = parentAndName(resolvePath(ctx, t));
      const par = nodeAt(ctx.fs, parent);
      const node = isDir(par) ? par.dir[name] : undefined;
      if (!isDir(node)) { w(`rmdir: failed to remove '${t}': Not a directory\n`); status = 1; continue; }
      if (Object.keys(node.dir).length) { w(`rmdir: failed to remove '${t}': Directory not empty\n`); status = 1; continue; }
      delete (par as FSDir).dir[name];
    }
    return status;
  },
  ln(args, { w, ctx }) {
    if (!ctx.fs) return 0;
    const files = args.filter((a) => !a.startsWith('-'));
    if (files.length < 2) { w('ln: missing file operand\n'); return 1; }
    const tn = nodeAt(ctx.fs, resolvePath(ctx, files[0]));
    if (tn === undefined) { w(`ln: failed to access '${files[0]}': No such file or directory\n`); return 1; }
    const { parent, name } = parentAndName(resolvePath(ctx, files[1]));
    const par = nodeAt(ctx.fs, parent);
    if (isDir(par)) par.dir[name] = cloneNode(tn);
    return 0;
  },
  find(args, { w, ctx }) {
    if (!ctx.fs) return 0;
    let start = '.'; let namePat: RegExp | null = null; let typ: 'f' | 'd' | null = null;
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === '-name') { const g = args[++i] ?? ''; namePat = new RegExp('^' + g.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$'); }
      else if (a === '-type') { typ = args[++i] === 'd' ? 'd' : 'f'; }
      else if (!a.startsWith('-')) start = a;
    }
    const startAbs = resolvePath(ctx, start);
    const root = nodeAt(ctx.fs, startAbs);
    if (root === undefined) { w(`find: '${start}': No such file or directory\n`); return 1; }
    const out: string[] = [];
    const rec = (path: string, node: FSNode) => {
      const nm = parentAndName(path).name || '/';
      if ((!namePat || namePat.test(nm)) && (!typ || (typ === 'd' ? isDir(node) : isFile(node)))) out.push(path);
      if (isDir(node)) for (const k of Object.keys(node.dir).sort()) rec(path === '/' ? '/' + k : path + '/' + k, node.dir[k]);
    };
    rec(startAbs, root);
    const disp = (p: string) => (p === startAbs ? start : (start.replace(/\/$/, '')) + p.slice(startAbs.length));
    w(out.map(disp).join('\n') + (out.length ? '\n' : ''));
    return 0;
  },
  tree(args, { w, ctx }) {
    if (!ctx.fs) return 0;
    const start = args.find((a) => !a.startsWith('-')) ?? '.';
    const root = nodeAt(ctx.fs, resolvePath(ctx, start));
    if (!isDir(root)) { w(`${start} [error opening dir]\n\n0 directories, 0 files\n`); return 1; }
    let dirs = 0; let files = 0;
    const lines = [start];
    const rec = (node: FSDir, prefix: string) => {
      const names = Object.keys(node.dir).sort();
      names.forEach((name, idx) => {
        const last = idx === names.length - 1;
        const child = node.dir[name];
        lines.push(prefix + (last ? '└── ' : '├── ') + (isDir(child) ? name + '/' : name));
        if (isDir(child)) { dirs++; rec(child, prefix + (last ? '    ' : '│   ')); } else files++;
      });
    };
    rec(root, '');
    lines.push('', `${dirs} director${dirs === 1 ? 'y' : 'ies'}, ${files} file${files === 1 ? '' : 's'}`);
    w(lines.join('\n') + '\n');
    return 0;
  },
  stat(args, { w, ctx }) {
    if (!ctx.fs) return 0;
    const t = args.find((a) => !a.startsWith('-')) ?? '';
    const n = nodeAt(ctx.fs, resolvePath(ctx, t));
    if (n === undefined) { w(`stat: cannot stat '${t}': No such file or directory\n`); return 1; }
    const size = isFile(n) ? n.file.length : 4096;
    w(`  File: ${t}\n  Size: ${size}\t\tType: ${isDir(n) ? 'directory' : 'regular file'}\nAccess: (${isDir(n) ? '0755' : '0644'}/${isDir(n) ? 'd' : '-'}${modeOf(n)})  Uid: (1000/${ctx.user ?? 'user'})  Gid: (1000/${ctx.user ?? 'user'})\n`);
    return 0;
  },
  du(args, { w, ctx }) {
    if (!ctx.fs) return 0;
    const start = args.find((a) => !a.startsWith('-')) ?? '.';
    const root = nodeAt(ctx.fs, resolvePath(ctx, start));
    if (root === undefined) { w(`du: cannot access '${start}': No such file or directory\n`); return 1; }
    const size = (n: FSNode): number => (isDir(n) ? Object.values(n.dir).reduce((s, c) => s + size(c), 4) : Math.max(1, Math.ceil(n.file.length / 1024)));
    w(`${size(root)}\t${start}\n`);
    return 0;
  },
  df(_args, { w }) { w('Filesystem     1K-blocks    Used Available Use% Mounted on\n/dev/vda1       20512768 6291456  14221312  31% /\ntmpfs            1024000       0   1024000   0% /dev/shm\n'); return 0; },
  file(args, { w, ctx }) {
    if (!ctx.fs) return 0;
    for (const t of args.filter((a) => !a.startsWith('-'))) {
      const n = nodeAt(ctx.fs, resolvePath(ctx, t));
      if (n === undefined) w(`${t}: cannot open (No such file or directory)\n`);
      else if (isDir(n)) w(`${t}: directory\n`);
      else if (n.file === '') w(`${t}: empty\n`);
      else w(`${t}: ASCII text\n`);
    }
    return 0;
  },
  chmod(args, { w, ctx }) {
    if (!ctx.fs) return 0;
    const spec = args.find((a) => /^[0-7]{3,4}$/.test(a) || /^[ugoa]*[+-][rwx]+$/.test(a)) ?? args[0] ?? '';
    const targets = args.filter((a) => a !== spec && !a.startsWith('-'));
    const num2mode = (t: string) => { const map = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx']; return t.split('').map((d) => map[parseInt(d, 10)] ?? '---').join(''); };
    let status = 0;
    for (const t of targets) {
      const n = nodeAt(ctx.fs, resolvePath(ctx, t));
      if (n === undefined) { w(`chmod: cannot access '${t}': No such file or directory\n`); status = 1; continue; }
      if (/^[0-7]{3,4}$/.test(spec)) { n.mode = num2mode(spec.slice(-3)); }
      else {
        const sym = /^([ugoa]*)([+-])([rwx]+)$/.exec(spec);
        if (sym) {
          const m = (n.mode ?? modeOf(n)).split('');
          const posMap: Record<string, number[]> = { r: [0, 3, 6], w: [1, 4, 7], x: [2, 5, 8] };
          for (const p of sym[3]) for (const i of posMap[p]) m[i] = sym[2] === '+' ? 'rwxrwxrwx'[i] : '-';
          n.mode = m.join('');
        }
      }
    }
    return status;
  },
  uname(args, { w }) {
    if (args.includes('-a')) { w('Linux cyberkhana 6.1.0-cyberkhana #1 SMP x86_64 GNU/Linux\n'); return 0; }
    if (args.includes('-r')) { w('6.1.0-cyberkhana\n'); return 0; }
    if (args.includes('-m')) { w('x86_64\n'); return 0; }
    if (args.includes('-n')) { w('cyberkhana\n'); return 0; }
    w('Linux\n'); return 0;
  },
  hostname(_args, { w }) { w('cyberkhana\n'); return 0; },
  arch(_args, { w }) { w('x86_64\n'); return 0; },
  id(_args, { w, ctx }) { const u = ctx.user ?? 'user'; w(`uid=1000(${u}) gid=1000(${u}) groups=1000(${u}),27(sudo)\n`); return 0; },
  groups(_args, { w, ctx }) { w(`${ctx.user ?? 'user'} sudo\n`); return 0; },
  date(_args, { w }) { w(new Date().toString().replace(/ \(.*\)$/, '') + '\n'); return 0; },
  uptime(_args, { w }) { w(' 10:30:01 up 2 days,  3:14,  1 user,  load average: 0.08, 0.03, 0.01\n'); return 0; },
  who(_args, { w, ctx }) { w(`${(ctx.user ?? 'user').padEnd(8)} pts/0        2026-07-03 10:00 (:0)\n`); return 0; },
  w(_args, { w, ctx }) { w(` 10:30:01 up 2 days,  1 user,  load average: 0.08, 0.03, 0.01\nUSER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT\n${(ctx.user ?? 'user').padEnd(8)} pts/0    :0               10:00    0.00s  0.10s  0.00s w\n`); return 0; },
  ps(_args, { w }) { w('    PID TTY          TIME CMD\n   1337 pts/0    00:00:00 bash\n   1420 pts/0    00:00:00 ps\n'); return 0; },
  free(args, { w }) {
    if (args.includes('-h')) { w('               total        used        free      shared  buff/cache   available\nMem:           2.0Gi       512Mi       1.0Gi        10Mi       500Mi       1.4Gi\nSwap:          1.0Gi          0B       1.0Gi\n'); return 0; }
    w('               total        used        free      shared  buff/cache   available\nMem:         2048000      512000     1024000       10240      512000     1433600\nSwap:        1048576           0     1048576\n'); return 0;
  },
  printenv(args, { w, ctx }) {
    if (args[0]) { const v = ctx.env[args[0]]; if (v !== undefined) w(v + '\n'); return v !== undefined ? 0 : 1; }
    w(Object.entries(ctx.env).map(([k, v]) => `${k}=${v}`).join('\n') + '\n'); return 0;
  },
  which(args, { w }) { let status = 0; for (const a of args) { if (BUILTINS[a]) w(`/usr/bin/${a}\n`); else status = 1; } return status; },
  type(args, { w }) { for (const a of args) w(BUILTINS[a] ? `${a} is a shell builtin\n` : `bash: type: ${a}: not found\n`); return 0; },
  man(args, { w }) { w(`No manual entry for ${args[0] ?? ''}. Try "help" for the list of available commands.\n`); return 0; },
  alias(_args) { return 0; },
  unalias(_args) { return 0; },
  unset(args, { ctx }) { for (const a of args) delete ctx.env[a]; return 0; },
  realpath(args, { w, ctx }) { w(resolvePath(ctx, args[0] ?? '.') + '\n'); return 0; },
  yes(args, { w }) { const s = args.join(' ') || 'y'; let out = ''; for (let i = 0; i < 1000; i++) out += s + '\n'; w(out); return 0; },
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

/* ── Interactive shell session ── */

export interface ShellRunResult {
  output: string;
  error?: string;
  /** `clear` was run — the UI should wipe the scrollback. */
  cleared?: boolean;
  /** `exit` was run — the UI may close the terminal. */
  exited?: boolean;
  cwd: string;
  cwdLabel: string;
}

export interface ShellSession {
  readonly user: string;
  /** Run one command line against the persistent session. */
  run(line: string, timeoutMs?: number): ShellRunResult;
  /** Current working directory with $HOME shown as ~ (for the prompt). */
  cwdLabel(): string;
  /** Serialize fs + env + cwd + history so a popped-out tab can continue. */
  snapshot(): string;
  /** Reset to a fresh home + welcome file. */
  reset(): void;
}

function seedSession(user: string): { fs: FSDir; env: Record<string, string>; cwd: string; home: string } {
  const home = `/home/${user}`;
  const fs: FSDir = { dir: {} };
  const c = { fs } as Ctx;
  const F = (path: string, content: string, mode?: string) => { writeFile(c, path, content); if (mode) { const n = nodeAt(fs, path); if (n) n.mode = mode; } };

  // A realistic little Linux tree.
  for (const d of ['/bin', '/etc', '/tmp', '/root', '/opt', '/usr/bin', '/usr/share', '/var/log', '/var/www/html',
    home, `${home}/Documents`, `${home}/Downloads`, `${home}/Desktop`, `${home}/Pictures`,
    `${home}/projects/webapp`, `${home}/scripts`, `${home}/notes`, `${home}/.config`]) ensureDir(fs, d);

  // System files
  F('/etc/hostname', 'cyberkhana\n');
  F('/etc/hosts', '127.0.0.1\tlocalhost\n127.0.1.1\tcyberkhana\n::1\t\tlocalhost ip6-localhost\n');
  F('/etc/os-release', 'PRETTY_NAME="CyberKhana Linux"\nNAME="CyberKhana Linux"\nVERSION="1.0"\nID=cyberkhana\n');
  F('/etc/passwd',
    `root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\n${user}:x:1000:1000:${user}:/home/${user}:/bin/bash\n`);
  F('/etc/shadow', 'root:!:19000:0:99999:7:::\n', 'r--------');
  F('/etc/motd', 'Welcome to CyberKhana Linux — a safe practice sandbox.\n');
  F('/var/log/syslog',
    'Jul  3 10:00:01 cyberkhana systemd[1]: Started Daily apt download activities.\n' +
    'Jul  3 10:05:14 cyberkhana kernel: [  0.000000] Linux version 6.1.0-cyberkhana\n' +
    'Jul  3 10:12:33 cyberkhana CRON[1420]: (root) CMD (cd / && run-parts /etc/cron.hourly)\n' +
    'Jul  3 10:18:07 cyberkhana kernel: [ 12.441] EXT4-fs error (device vda1): failed to read block 42\n' +
    'Jul  3 10:22:19 cyberkhana nginx[1502]: [error] 1502#0: connect() failed while reaching 10.0.0.99\n' +
    'Jul  3 10:30:02 cyberkhana sshd[2001]: Accepted password for ' + user + ' from 10.0.0.5 port 51234\n');
  F('/var/log/auth.log',
    'Jul  3 10:29:58 cyberkhana sshd[2001]: Failed password for invalid user admin from 10.0.0.9 port 40012\n' +
    'Jul  3 10:30:02 cyberkhana sshd[2001]: Accepted password for ' + user + ' from 10.0.0.5 port 51234\n' +
    'Jul  3 10:30:02 cyberkhana sudo:   ' + user + ' : TTY=pts/0 ; PWD=/home/' + user + ' ; USER=root ; COMMAND=/usr/bin/apt update\n');
  F('/var/www/html/index.html', '<!doctype html>\n<html><body><h1>It works!</h1></body></html>\n');

  // Home files
  F(`${home}/welcome.txt`,
    `Welcome to your CyberKhana practice shell, ${user}!\n\n` +
    `This is a safe, in-browser Linux sandbox — explore freely.\n` +
    `Try:   ls -la      cat readme.md      cd projects      tree      help\n`);
  F(`${home}/readme.md`,
    `# ${user}'s sandbox\n\nA place to practice Linux commands. Nothing here can affect a real machine.\n\n` +
    `## Folders\n- Documents/  — text files and notes\n- Downloads/  — a sample file or two\n- projects/   — a tiny web app\n- scripts/    — example shell scripts\n`);
  F(`${home}/.bashrc`, "export PS1='\\u@\\h:\\w\\$ '\nalias ll='ls -la'\nalias ..='cd ..'\n");
  F(`${home}/.bash_history`, 'ls -la\ncd projects\ncat readme.md\ngrep -i error /var/log/syslog\nwhoami\n');
  F(`${home}/todo.txt`, '[ ] learn ls, cd, pwd\n[ ] practice grep and pipes\n[ ] write a bash script\n[x] open the terminal\n');
  F(`${home}/Documents/notes.md`, '# Notes\n\n- pipes send one command\'s output into another: `cat file | grep x`\n- redirect output to a file with `>` (overwrite) or `>>` (append)\n');
  F(`${home}/Documents/quotes.txt`, 'Talk is cheap. Show me the code.\nGiven enough eyeballs, all bugs are shallow.\nThe quieter you become, the more you can hear.\n');
  F(`${home}/Documents/servers.csv`, 'name,ip,role\nweb01,10.0.0.11,web\ndb01,10.0.0.12,database\ncache01,10.0.0.13,cache\n');
  F(`${home}/Downloads/report.txt`,
    'INFO  service started\nWARN  disk usage at 71%\nERROR failed to reach 10.0.0.99\nINFO  retry succeeded\nERROR timeout on backup job\n');
  F(`${home}/Downloads/numbers.txt`, '42\n7\n15\n3\n99\n23\n8\n');
  F(`${home}/projects/webapp/index.html`, '<!doctype html>\n<html><head><title>webapp</title></head><body>hello</body></html>\n');
  F(`${home}/projects/webapp/app.js`, "console.log('starting webapp');\nconst port = 3000;\nconsole.log('listening on ' + port);\n");
  F(`${home}/projects/README`, 'webapp — a demo project. run: node app.js\n');
  F(`${home}/scripts/hello.sh`, '#!/bin/bash\necho "Hello from a script!"\nfor i in 1 2 3; do\n  echo "count $i"\ndone\n', 'rwxr-xr-x');
  F(`${home}/scripts/backup.sh`, '#!/bin/bash\n# pretend to back up the home folder\necho "backing up $HOME ..."\necho "done"\n', 'rwxr-xr-x');

  const env: Record<string, string> = {
    USER: user, LOGNAME: user, HOME: home, PWD: home, HOSTNAME: 'cyberkhana',
    SHELL: '/bin/bash', PATH: '/usr/local/bin:/usr/bin:/bin', LANG: 'en_US.UTF-8', TERM: 'xterm-256color',
  };
  return { fs, env, cwd: home, home };
}

/**
 * Create a persistent interactive shell for the given user. State (variables,
 * working directory, and an in-memory filesystem) carries across commands. It
 * runs entirely in the browser — a safe sandbox, never the real machine.
 */
export function createShellSession(opts: { user?: string; restore?: string | null } = {}): ShellSession {
  const user = (opts.user || 'user').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '') || 'user';

  const seed = seedSession(user);
  const ctx: Ctx = {
    env: seed.env,
    status: 0,
    out: '',
    stdinBuf: '',
    stdinPos: 0,
    checkTime: () => {},
    fs: seed.fs,
    cwd: seed.cwd,
    home: seed.home,
    user,
    history: [],
  };

  if (opts.restore) {
    try {
      const s = JSON.parse(opts.restore);
      if (s.fs) ctx.fs = s.fs;
      if (s.env) ctx.env = s.env;
      if (typeof s.cwd === 'string') ctx.cwd = s.cwd;
      if (Array.isArray(s.history)) ctx.history = s.history;
    } catch {
      /* corrupt snapshot — keep the fresh seed */
    }
  }

  const run = (line: string, timeoutMs = DEFAULT_TIMEOUT_MS): ShellRunResult => {
    ctx.out = '';
    ctx.stdinBuf = '';
    ctx.stdinPos = 0;
    ctx.cleared = false;
    if (line.trim() !== '') ctx.history!.push(line);
    const deadline = Date.now() + timeoutMs;
    ctx.checkTime = () => { if (Date.now() > deadline) throw new ShellError('command timed out'); };
    let error: string | undefined;
    let exited = false;
    try {
      runList(parse(tokenize(line)), ctx);
    } catch (e) {
      if (e instanceof ExitSignal) exited = true;
      else if (e instanceof ShellError) error = `bash: ${e.message}`;
      else error = `bash: ${e instanceof Error ? e.message : String(e)}`;
    }
    ctx.env.PWD = ctx.cwd!;
    return { output: ctx.out, error, cleared: ctx.cleared, exited, cwd: ctx.cwd!, cwdLabel: prettyCwd(ctx) };
  };

  const reset = () => {
    const fresh = seedSession(user);
    ctx.fs = fresh.fs;
    ctx.env = fresh.env;
    ctx.cwd = fresh.cwd;
    ctx.home = fresh.home;
    ctx.history = [];
    ctx.status = 0;
  };

  return {
    user,
    run,
    cwdLabel: () => prettyCwd(ctx),
    snapshot: () => JSON.stringify({ fs: ctx.fs, env: ctx.env, cwd: ctx.cwd, history: ctx.history }),
    reset,
  };
}
