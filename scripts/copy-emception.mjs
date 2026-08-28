/**
 * Vendors the Emception toolchain — clang, lld, binaryen and the Emscripten
 * sysroot, all compiled to WebAssembly — into public/emception so C and C++
 * compile in the student's browser with no server involved.
 *
 * Same shape as copy-pyodide.mjs: the runtime is fetched once into a gitignored
 * folder and served from our own origin, never a CDN at run time. It differs in
 * where it comes from. Pyodide ships on npm; Emception does not publish the
 * built toolchain anywhere, so this pulls the artifacts of its demo deployment,
 * pinned to one commit and checked file by file against the git object ids in
 * emception-manifest.json. A changed byte fails the build.
 *
 * The pin is deliberate. That commit is from February 2023 and nothing upstream
 * has replaced it, which sounds worse than it is: this is a C++17 toolchain for
 * teaching fundamentals, and a compiler does not go stale the way a library
 * does. What matters is that it is reproducible, and that swapping it later —
 * for a self-built toolchain, or a real distribution if one appears — is a new
 * manifest rather than new code.
 *
 * Roughly 355 MB across 255 files. A student downloads about 25 MB of that on
 * their first Run and nothing afterwards, but the whole tree has to be on the
 * server: the compiler pulls headers and archives on demand, and a pack that is
 * missing is a compile error the student cannot do anything about.
 *
 * Usage: npm run vendor:emception  (also runs from predev / prebuild)
 *        npm run vendor:emception -- --force   re-download everything
 */
import { createHash } from 'crypto';
import { mkdirSync, writeFileSync, readFileSync, existsSync, statSync, rmSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const manifest = JSON.parse(readFileSync(join(root, 'scripts', 'emception-manifest.json'), 'utf8'));
const dest = join(root, 'public', 'emception');
const statePath = join(dest, 'vendor-state.json');
const force = process.argv.includes('--force');

const RAW = `https://raw.githubusercontent.com/${manifest.repo}/${manifest.commit}/`;
const CONCURRENCY = 8;

/* The startup archive is named `<hash>.br`, and it is brotli data that
   Emception decompresses itself with its own brotli.wasm. It cannot be renamed
   to dodge servers that read the extension as transfer encoding — that same
   extension is what tells Emception to decompress — so the serving side is
   where this is handled. See emceptionRawAssets in vite.config.ts, and give any
   other server hosting this tree the same rule: .br under /emception/ goes out
   as application/octet-stream with no Content-Encoding. */

/** Git's object id for a blob: sha1 of "blob <size>\0" followed by the bytes. */
function gitBlobSha(buf) {
  return createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');
}

/** Vendoring is all-or-nothing, recorded only once the tree is complete. */
function currentState() {
  try {
    return JSON.parse(readFileSync(statePath, 'utf8'));
  } catch {
    return null;
  }
}

async function fetchOne(file) {
  const res = await fetch(RAW + file.path);
  if (!res.ok) throw new Error(`${file.path}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());

  const sha = gitBlobSha(buf);
  if (sha !== file.sha) {
    throw new Error(`${file.path}: content does not match the manifest (${sha} != ${file.sha})`);
  }

  const out = join(dest, file.path);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, buf);
  return buf.length;
}

/** Which file the app should stream itself to show a real download percentage. */
function startupArchive() {
  const archive = manifest.files.find((f) => f.path.endsWith('.br'));
  return archive ? { archive: archive.path, bytes: archive.size } : {};
}

/** Present and the right size. Hashing 355 MB on every dev start would turn a
 *  no-op into a wait; the bytes were verified when they were written. */
function alreadyVendored(file) {
  try {
    return statSync(join(dest, file.path)).size === file.size;
  } catch {
    return false;
  }
}

/* ── Run ── */

const state = currentState();
if (!force && state?.commit === manifest.commit && state?.files === manifest.files.length) {
  console.log(`[emception] ${manifest.files.length} files already vendored → public/emception`);
  process.exit(0);
}

/* A tree left over from a different commit cannot be mixed with this one, so it
   goes. A tree from THIS commit is a run that was interrupted — 355 MB over a
   connection that may not be reliable is exactly the download worth resuming
   rather than restarting. */
if (existsSync(dest) && (force || (state && state.commit !== manifest.commit))) {
  rmSync(dest, { recursive: true, force: true });
}
mkdirSync(dest, { recursive: true });

const pending = manifest.files.filter((f) => !alreadyVendored(f));
const resumed = manifest.files.length - pending.length;

console.log(
  `[emception] fetching ${pending.length} files ` +
    `(${(pending.reduce((s, f) => s + f.size, 0) / 1048576).toFixed(0)} MB) from ` +
    `${manifest.repo}@${manifest.commit.slice(0, 7)}` +
    (resumed ? `, resuming past ${resumed} already there` : '')
);

let done = 0;
let bytes = 0;
let failed = null;

/** A small worker pool: 255 files at once would just fight for the socket. */
async function worker(queue) {
  while (queue.length && !failed) {
    const file = queue.pop();
    try {
      // Read-modify-write has to happen after the await, not across it, or the
      // eight workers overwrite each other's totals and the count comes out low.
      const written = await fetchOne(file);
      bytes += written;
      done++;
      if (done % 25 === 0 || done === pending.length) {
        console.log(`[emception]   ${done}/${pending.length}  ${(bytes / 1048576).toFixed(0)} MB`);
      }
    } catch (err) {
      failed = err;
    }
  }
}

const queue = [...pending];
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)));

if (failed) {
  console.error(`[emception] FAILED: ${failed.message}`);
  console.error('[emception] the toolchain is incomplete; C/C++ will fall back to the interpreter.');
  console.error('[emception] no state was written, so running this again resumes where it stopped.');
  process.exit(1);
}

const bootstrap = startupArchive();

/* Names the startup archive so the app can stream it itself and show a real
   percentage; the toolchain's own startup reports no progress at all, and on a
   phone this one file is most of the wait. */
writeFileSync(join(dest, 'bootstrap.json'), JSON.stringify(bootstrap) + '\n');
writeFileSync(
  statePath,
  JSON.stringify({ commit: manifest.commit, files: manifest.files.length }, null, 2) + '\n'
);

console.log(`[emception] ${manifest.files.length} files → public/emception (${(bytes / 1048576).toFixed(0)} MB fetched)`);
