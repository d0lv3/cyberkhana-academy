/** A terminated worker cannot reply; abort must also settle its waiting caller. */
export function withAbort<T>(task: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason ?? new Error('Cancelled.'));
    if (signal.aborted) { task.catch(() => {}); abort(); return; }
    signal.addEventListener('abort', abort, { once: true });
    task.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
  });
}
