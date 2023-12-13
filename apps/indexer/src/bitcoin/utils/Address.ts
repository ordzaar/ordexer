import { address as addr, networks, payments } from "bitcoinjs-lib";

export function extractAddress(script: Buffer, network: "mainnet" | "testnet" | "regtest") {
  const networkLib = network === "mainnet" ? networks.bitcoin : networks[network];
  if (network === undefined) {
    throw new Error("invalid network", network);
  }

  try {
    const address = addr.fromOutputScript(script, networkLib);
    if (address) {
      return address;
    }
  } catch {
    // ignore
  }

  try {
    const { address } = payments.p2pkh({ output: script, network: networkLib });
    if (address) {
      return address;
    }
  } catch {
    // ignore
  }

  try {
    const { address } = payments.p2sh({ output: script, network: networkLib });
    if (address) {
      return address;
    }
  } catch {
    // ignore
  }

  try {
    const { address } = payments.p2wpkh({ output: script, network: networkLib });
    if (address) {
      return address;
    }
  } catch {
    // ignore
  }

  try {
    const { address } = payments.p2wsh({ output: script, network: networkLib });
    if (address) {
      return address;
    }
  } catch {
    // ignore
  }

  return undefined;
}
