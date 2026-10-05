/* One account's writes to one thing happen one at a time. Each reads a record,
   decides, and writes it back, and two at once (a double click, two tabs)
   would each write over the other. The server runs as one process, so a queue
   per key is enough. The same shape as the queue in routes/progress.ts. */

const queues = new Map<string, Promise<void>>();

export async function oneAtATime<T>(key: string, work: () => Promise<T>): Promise<T> {
  const before = queues.get(key) ?? Promise.resolve();
  let release: () => void = () => undefined;
  const mine = new Promise<void>((resolve) => {
    release = resolve;
  });
  const tail = before.then(() => mine);
  queues.set(key, tail);
  await before;
  try {
    return await work();
  } finally {
    release();
    if (queues.get(key) === tail) queues.delete(key);
  }
}
