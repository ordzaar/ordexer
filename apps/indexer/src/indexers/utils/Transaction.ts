export function parseLocation(location: string): [string, number] {
  const [txid, vout] = location.split(":");
  if (txid === undefined || vout === undefined) {
    throw new Error(`Failed to parse location ${location}`);
  }
  // eslint-disable-next-line radix
  return [txid, parseInt(vout)];
}
