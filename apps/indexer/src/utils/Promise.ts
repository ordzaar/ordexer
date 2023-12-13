import * as pLimit from "p-limit";

export function promiseLimiter<T>(concurrency: number) {
  const limit = pLimit(concurrency);
  const input: Promise<any>[] = [];
  return {
    push: (fn: () => Promise<T>) => {
      input.push(limit(fn));
    },
    run: async (): Promise<T[]> => Promise.all(input),
  };
}
