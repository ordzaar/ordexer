import { address as addr, networks, payments } from "bitcoinjs-lib";

export function extractAddress(script: Buffer, network: networks.Network) {
  try {
    const address = addr.fromOutputScript(script, network);
    if (address) {
      return address;
    }
  } catch {
    // ignore
  }

  try {
    const { address } = payments.p2pkh({ output: script, network });
    if (address) {
      return address;
    }
  } catch {
    // ignore
  }

  try {
    const { address } = payments.p2sh({ output: script, network });
    if (address) {
      return address;
    }
  } catch {
    // ignore
  }

  try {
    const { address } = payments.p2wpkh({ output: script, network });
    if (address) {
      return address;
    }
  } catch {
    // ignore
  }

  try {
    const { address } = payments.p2wsh({ output: script, network });
    if (address) {
      return address;
    }
  } catch {
    // ignore
  }

  return undefined;
}
