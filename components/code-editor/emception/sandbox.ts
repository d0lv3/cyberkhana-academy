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

const TIMEOUT_MS = 10_000;

export interface RunOutcome {
  output: string;
  error?: string;
  timedOut: boolean;
}

/* The sandbox's whole program. It evaluates the artifact, wires the three
   stdio hooks, runs main, and reports back. Kept as a string because a
   sandboxed srcdoc document cannot load a module from our origin. */
const BOOTSTRAP = `<!doctype html><meta charset="utf-8"><script>
(function () {
  var out = [];
  function send(msg) { parent.postMessage(msg, '*'); }

  addEventListener('message', function (event) {
    var artifact = event.data && event.data.artifact;
    var stdin = (event.data && event.data.stdin) || '';
    if (typeof artifact !== 'string') return;

    var cursor = 0;
    var Module = {
      noInitialRun: true,
      print: function (line) { out.push(line); },
      // A program's own cerr is output, not a failure of the runner, so both
      // streams land in the same place and in the order they were written.
      printErr: function (line) { out.push(line); },
      stdin: function () {
        if (cursor >= stdin.length) return null;
        return stdin.charCodeAt(cursor++) & 0xff;
      },
      quit: function () {},
    };

    try {
      // The artifact is Emscripten's MODULARIZE output: defining createProgram.
      (0, eval)(artifact);
      createProgram(Module).then(function (instance) {
        var code = 0;
        try {
          code = instance.callMain([]) || 0;
        } catch (err) {
          if (err && err.name === 'ExitStatus') code = err.status;
          else throw err;
        }
        send({ done: true, output: out.join('\\n'), exitCode: code });
      }).catch(function (err) {
        send({ done: true, output: out.join('\\n'), error: String((err && err.message) || err) });
      });
    } catch (err) {
      send({ done: true, output: out.join('\\n'), error: String((err && err.message) || err) });
    }
  });

  send({ ready: true });
})();
<\/script>`;

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
