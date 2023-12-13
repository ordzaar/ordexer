import { script } from "bitcoinjs-lib";


const hasValidOip2Keys = makeObjectKeyChecker(["p", "v", "ty", "col", "iid", "publ", "nonce", "sig"]);

export function makeObjectKeyChecker(keys: string[]): (obj: AnyObject) => boolean {
  return (obj: AnyObject) => keys.every((key) => obj[key] !== undefined);
}

type AnyObject = {
  [key: string]: any;
};

/**
 * Get OIP meta data from witness.
 *
 * Check if the witness contains hash for application/json;charset=utf-8
 * hash 6170706c69636174696f6e2f6a736f6e3b636861727365743d7574662d38
 *
 * @param txinwitness - Witness to get meta data from.
 */
export function getMetaFromWitness(txinwitness: string[]): Object | undefined {
  const jsonHash = "6170706c69636174696f6e2f6a736f6e3b636861727365743d7574662d38";

  const witness = txinwitness.find((witnessItem) => witnessItem.includes(jsonHash));
  if (witness === undefined) {
    return undefined;
  }

  const data = script.decompile(Buffer.from(witness, "hex"));
  if (data === null) {
    return undefined;
  }

  const chunks = data.map((chunk) => chunk.toString());

  let startIndex = -1;
  let endIndex = -1;

  for (let i = 0; i < chunks.length; i++) {
    if (chunks[i] === "application/json;charset=utf-8") {
      startIndex = i + 2; // skip the OP pushes after metadata mime-type itself
    } else if (chunks[i] === "104") {
      endIndex = i;
    }
  }

  if (startIndex === -1 || endIndex === -1) {
    return undefined;
  }

  try {
    return JSON.parse(
      chunks
        .slice(startIndex, endIndex)
        .filter((chunk) => chunk.includes("\x00") === false)
        .join(""),
    );
  } catch (error) {
		// TODO: Logging
    // console.log("Error parsing json from witness", {
    //   error,
    //   chunks,
    //   startIndex,
    //   endIndex,
    //   meta: chunks.slice(startIndex, endIndex).join(""),
    // });
    return undefined;
  }
}
