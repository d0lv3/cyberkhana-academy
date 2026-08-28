/**
 * A browser stand-in for Node's `stream`, for one dependency that needs it.
 *
 * JSCPP implements C's `printf`/`puts`/`sprintf` with the npm `printf`
 * package, whose entry point begins:
 *
 *     if (args[0] instanceof require('stream').Stream) { ... }
 *
 * `stream` is a Node built-in with no browser equivalent, so the bundler
 * substitutes an empty object, `.Stream` is `undefined`, and `instanceof
 * undefined` throws "Right-hand side of 'instanceof' is not an object" — on
 * the very first `printf` a student runs. Every C lesson calls `printf`, so
 * the whole track fails at Run while `<iostream>` C++ carries on working.
 *
 * All the check wants to know is "was I handed a stream to write to?", and in
 * the browser the answer is always no. An empty class is enough to give
 * `instanceof` a right-hand side and let the call fall through to returning a
 * formatted string, which is what JSCPP does with it.
 *
 * Deliberately not `stream-browserify`: that pulls in a readable-stream tree
 * for one `instanceof` that can only ever be false here.
 */
export class Stream {}

export default { Stream };
