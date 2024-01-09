import { ScriptPubKey } from "@ordzaar/bitcoin-service";
import { Rarity } from "@ordzaar/ord-service";
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Validate } from "class-validator";
import { PaginationQuery } from "src/libs/pagination/ApiQuery";
import { ArrayStringTransformer, BooleanStringTransformer } from "src/pipes/transformers";
import { IsValidRarities } from "src/validators/IsValidRarities";

export enum SpentOrder {
  SATS_ASCENDING = "SATS_ASCENDING",
  SATS_DESCENDING = "SATS_DESCENDING",
}

export class AddressParamDTO {
  @IsString()
  @IsNotEmpty()
  address: string;

  constructor(address: string) {
    this.address = address;
  }
}

export class GetSpendablesQueryDTO {
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  value: number;

  @IsBoolean()
  @IsOptional()
  @Type(() => String)
  @Transform(BooleanStringTransformer)
  safetospend?: boolean;

  @IsString({ each: true })
  @IsOptional()
  @Type(() => String)
  @Transform(ArrayStringTransformer)
  filter?: string[];

  constructor(value: number, safetospend?: boolean, filter?: string[]) {
    this.value = value;
    this.safetospend = safetospend;
    this.filter = filter;
  }
}

export type SpendableDTO = {
  id: string;
  txid: string;
  n: number;
  sats: number;
  scriptPubKey: ScriptPubKey;
};

export class GetUnspentsQueryDTO extends PaginationQuery {
  @IsString({ each: true })
  @IsOptional()
  @Type(() => String)
  @Transform(ArrayStringTransformer)
  @Validate(IsValidRarities)
  allowedRarity?: Rarity[];

  @IsBoolean()
  @IsOptional()
  @Type(() => String)
  @Transform(BooleanStringTransformer)
  safetospend?: boolean;

  @IsOptional()
  @IsEnum(SpentOrder)
  orderBy?: SpentOrder;

  constructor(allowedRarity?: Rarity[], safetospend?: boolean, orderBy?: SpentOrder) {
    super();

    this.allowedRarity = allowedRarity;
    this.safetospend = safetospend;
    this.orderBy = orderBy;
  }
}

export type UnspentDTO = {
  id: string;
  txid: string;
  n: number;
  sats: number;
  scriptPubKey: ScriptPubKey;
  txhex?: string;
  ordinals: any;
  inscriptions: any;
  safeToSpend: boolean;
  confirmations: number;
};
