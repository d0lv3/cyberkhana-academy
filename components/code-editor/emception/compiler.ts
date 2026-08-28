/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * The C/C++ compiler: a real clang, running in the student's browser.
 *
 * Emception is clang, lld, binaryen and the Emscripten sysroot compiled to
 * WebAssembly. It is vendored into public/emception by scripts/copy-emception.mjs
 * and driven here through Comlink, which is the interface its worker exposes.
 *
 * One worker, kept alive for the session: it holds a hundred megabytes of
 * decompressed toolchain, and paying that cost once per tab is the whole point.
 * Compilation is serialised through `queue` because the worker is a single
 * Emscripten instance with one filesystem — two builds at once would write over
 * each other's main.cpp.
 *
 * Nothing here loads until someone presses Run. See `ensureCompiler`.
 */

import * as Comlink from 'comlink';

/** Where copy-emception.mjs puts the toolchain. */
const BASE = '/emception';

export interface CompileSuccess {
  ok: true;
  /** Self-contained JS+wasm module, ready to hand to the sandbox. */
  artifact: string;
  /** Warnings, if the compiler had any. */
  diagnostics: string;
}

export interface CompileFailure {
  ok: false;
  /** clang's own diagnostics, as a student should see them. */
  diagnostics: string;
}

export type CompileResult = CompileSuccess | CompileFailure;

export type LoadPhase = 'downloading' | 'starting' | 'ready';

export interface LoadProgress {
  phase: LoadPhase;
  /** 0–1 during `downloading`, undefined once the bytes are in. */
  fraction?: number;
}

interface RemoteEmception {
  init(): Promise<void>;
  run(cmdline: string): Promise<{ returncode: number; stdout: string; stderr: string }>;
  onstdout: (s: string) => void;
  onstderr: (s: string) => void;
  fileSystem: {
    writeFile(path: string, contents: string): Promise<void>;
    readFile(path: string, opts: { encoding: 'utf8' }): Promise<string>;
    unlink(path: string): Promise<void>;
    exists(path: string): Promise<boolean>;
  };
}

let bootPromise: Promise<RemoteEmception> | null = null;
let remote: RemoteEmception | null = null;
let queue: Promise<unknown> = Promise.resolve();

/** True once the toolchain is warm — drives the button's loading label. */
export function isCompilerReady(): boolean {
  return remote !== null;
}

/**
 * Pull the one big archive ourselves before handing over to the toolchain.
 *
 * Emception's own startup reports nothing, and it begins with a 22 MB fetch
 * that on a phone is most of the wait. Streaming it here first means the
 * student sees a real percentage instead of a spinner that might be broken,
 * and the toolchain then finds it in the HTTP cache. If anything about this
 * fails it is not fatal — the toolchain will just fetch it again itself.
 */
async function prefetchArchive(onProgress: (p: LoadProgress) => void): Promise<void> {
  try {
    const res = await fetch(`${BASE}/bootstrap.json`);
    if (!res.ok) return;
    const { archive, bytes } = (await res.json()) as { archive: string; bytes: number };
    if (!archive) return;

    const body = await fetch(`${BASE}/${archive}`);
    if (!body.ok || !body.body) return;

    const reader = body.body.getReader();
    let received = 0;
    // The bytes are only being pulled to warm the cache, so they are read and
    // dropped rather than assembled — no reason to hold 22 MB twice.
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      onProgress({ phase: 'downloading', fraction: bytes ? Math.min(1, received / bytes) : undefined });
    }
  } catch {
    /* Cache warming is an optimisation; the compiler still boots without it. */
  }
}

/** Boot the toolchain, or return the boot already in flight. */
export function ensureCompiler(onProgress: (p: LoadProgress) => void = () => {}): Promise<RemoteEmception> {
  if (bootPromise) return bootPromise;

  bootPromise = (async () => {
    await prefetchArchive(onProgress);
    onProgress({ phase: 'starting' });

    const worker = new Worker(`${BASE}/emception.worker.bundle.worker.js`);
    const em = Comlink.wrap<RemoteEmception>(worker);
    await em.init();

    remote = em as unknown as RemoteEmception;
    onProgress({ phase: 'ready' });
    return remote;
  })();

  // A failed boot must not poison every later attempt.
  bootPromise.catch(() => {
    bootPromise = null;
    remote = null;
  });

  return bootPromise;
}

/* `em++` and `emcc` differ in more than the name: emcc will not link the C++
   standard library, and em++ compiles a .c file as C++. Getting this wrong
   turns a working C lesson into a wall of linker errors. */
const DRIVER = { c: 'emcc', cpp: 'em++' } as const;
const SOURCE = { c: 'main.c', cpp: 'main.cpp' } as const;

/* -O0 because a student is waiting: optimisation is most of the compile time
   and none of the teaching value. SINGLE_FILE inlines the wasm as base64 so
   the result is one string we can hand straight to the sandbox, with nothing
   left to fetch. INVOKE_RUN=0 keeps main from starting before stdin is wired,
   and EXIT_RUNTIME=1 makes `return 0` actually end the program. */
const FLAGS = [
  '-O0',
  '-sSINGLE_FILE=1',
  '-sMODULARIZE=1',
  '-sEXPORT_NAME=createProgram',
  '-sEXIT_RUNTIME=1',
  '-sINVOKE_RUN=0',
  // INVOKE_RUN=0 is only useful if we can start main ourselves afterwards,
  // and callMain is not exported by default.
  '-sEXPORTED_RUNTIME_METHODS=callMain',
  '-sALLOW_MEMORY_GROWTH=1',
  '-sENVIRONMENT=web',
].join(' ');

/**
 * Two kinds of noise sit around the part a student needs.
 *
 * Emscripten's failure line repeats the entire internal clang invocation —
 * sysroot paths, -mllvm flags, a temp directory — and buries the diagnostic
 * above it. Its INFO chatter ("Running sanity checks") is about the toolchain
 * setting itself up and says nothing about the program. Both go. What clang
 * itself wrote is kept exactly as clang wrote it, carets and all.
 */
const TOOLCHAIN_NOISE = [
  /^(em\+\+|emcc): error: '.*' failed \(returned \d+\)/,
  /^\s*(shared|cache|system_libs|emcc):INFO:/,
];

// Emscripten colours its own log lines; the output panel is not a terminal.
// Written as an escape rather than the raw control byte, which is invisible
// in an editor and easy to lose in a copy-paste.
const ANSI = /\u001b\[[0-9;]*m/g;

function cleanDiagnostics(raw: string): string {
  return raw
    .replace(ANSI, '')
    .split('\n')
    .filter((line) => !TOOLCHAIN_NOISE.some((pattern) => pattern.test(line)))
    .join('\n')
    .trim();
}

/** Compile one file. Serialised: the toolchain has a single filesystem. */
export function compile(
  source: string,
  language: 'c' | 'cpp',
  onProgress?: (p: LoadProgress) => void
): Promise<CompileResult> {
  const task = queue.then(async (): Promise<CompileResult> => {
    const em = await ensureCompiler(onProgress);

    let output = '';
    const collect = Comlink.proxy((s: unknown) => {
      output += String(s) + '\n';
    });
    // Assigning through the proxy is how Comlink sets a remote property.
    (em as any).onstdout = collect;
    (em as any).onstderr = collect;

    const file = SOURCE[language];
    await em.fileSystem.writeFile(`/working/${file}`, source);

    // A previous build's artifact would otherwise be read back as this one's.
    if (await em.fileSystem.exists('/working/main.js')) {
      await em.fileSystem.unlink('/working/main.js');
    }

    const result = await em.run(`${DRIVER[language]} ${FLAGS} ${file} -o main.js`);
    const diagnostics = cleanDiagnostics(output || result.stderr || '');

    if (result.returncode !== 0) {
      return { ok: false, diagnostics: diagnostics || 'Compilation failed.' };
    }

    const artifact = await em.fileSystem.readFile('/working/main.js', { encoding: 'utf8' });
    return { ok: true, artifact, diagnostics };
  });

  // Keep the chain alive even when one compile rejects.
  queue = task.catch(() => {});
  return task;
}
