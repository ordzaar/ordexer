import { Ordinal } from "src/providers/OrdProvider";

export const rarity = ["common", "uncommon", "rare", "epic", "legendary", "mythic"];

export const rarityMap = new Map(rarity.map((v) => [v, true]));

export type Rarity = (typeof rarity)[number];

export async function getSafeToSpendState(
  ordinals: Ordinal[],
  allowedRarity: Rarity[] = ["common", "uncommon"],
): Promise<boolean> {
  // eslint-disable-next-line no-restricted-syntax
  for (const ordinal of ordinals) {
    if (allowedRarity.includes(ordinal.rarity) === false) {
      return false;
    }
  }
  return true;
}
