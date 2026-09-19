/**
 * Runs a compiled student program, contained.
 *
 * The program goes into an `<iframe sandbox="allow-scripts">`, which the
 * browser gives an opaque origin: no cookies, no same-origin fetch, no reach
 * into the page that created it. A Web Worker would have been simpler and is
 * what a code runner usually gets, but a worker shares our origin, and C can
 * embed arbitrary JavaScript through `EM_ASM` — so "compile and run C" would
 * quietly become "run JavaScript with the student's session". The iframe costs
 * a postMessage round trip and closes that off.
 *
 * A run is stopped by deleting the iframe. That is a genuine kill rather than a
 * cooperative one, which matters because the usual first infinite loop in a
 * teaching course is `while (true) {}` and nothing polite will interrupt it.
 */

import bootstrapHtml from './sandboxBootstrap.html?raw';

const TIMEOUT_MS = 10_000;

export interface RunOutcome {
  output: string;
  error?: string;
  timedOut: boolean;
}

/* The sandbox's whole program: it evaluates the artifact, wires the three
   stdio hooks, runs main, and reports back. It lives in its own file, and
   not as a string here, because the Content Security Policy has to name it.
   A sandboxed srcdoc document inherits the page's policy but not its origin,
   so `script-src 'self'` can never match anything it loads — this script has
   to be inline, and inline means the policy needs its hash. vite.config.ts
   reads this same file and hashes it at build time, so the two cannot drift:
   edit the bootstrap and the hash that admits it is recomputed with it.

   Line endings are normalised because the hash is taken over these exact
   bytes and a checkout on Windows may not store them the way it built them. */
const BOOTSTRAP = bootstrapHtml.replace(/\r\n/g, '\n');

/** Compile output in, program output back. Never rejects; failures are data. */
export function runArtifact(artifact: string, stdin = ''): Promise<RunOutcome> {
  return new Promise((resolve) => {
    const frame = document.createElement('iframe');
    frame.sandbox.add('allow-scripts');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText = 'position:absolute;width:0;height:0;border:0;visibility:hidden';
    frame.srcdoc = BOOTSTRAP;

    let settled = false;
    const finish = (outcome: RunOutcome) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      frame.remove();
      resolve(outcome);
    };

    const timer = setTimeout(
      () =>
        finish({
          output: '',
          error: 'Execution timed out, your code took too long. Check for infinite loops.',
          timedOut: true,
        }),
      TIMEOUT_MS
    );

    function onMessage(event: MessageEvent) {
      // Only this frame's messages: the page has other postMessage traffic.
      if (event.source !== frame.contentWindow) return;
      const data = event.data as { ready?: boolean; done?: boolean; output?: string; error?: string };
      if (data?.ready) {
        frame.contentWindow?.postMessage({ artifact, stdin }, '*');
        return;
      }
      if (data?.done) {
        finish({ output: data.output ?? '', error: data.error, timedOut: false });
      }
    }

    window.addEventListener('message', onMessage);
    document.body.appendChild(frame);
  });
}
