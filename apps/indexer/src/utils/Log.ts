export function perf() {
  const ts = performance.now();
  return {
    get now() {
      return ((performance.now() - ts) / 1000).toFixed(3);
    },
  };
}
