import { rarityMap } from "@ordzaar/ord-service";
import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";

@ValidatorConstraint({ name: "IsValidRarities", async: false })
export class IsValidRarities implements ValidatorConstraintInterface {
  validate(value: string[], _: ValidationArguments) {
    return value.every((rarity) => {
      if (!rarityMap.get(rarity)) {
        return false;
      }
      return true;
    });
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.value} must be a valid rarities`;
  }
}
