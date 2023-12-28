import { ScriptPubKey } from "@ordzaar/bitcoin-service";
import { Rarity } from "@ordzaar/ord-service";
import { Type } from "class-transformer";
import { IsBoolean, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from "class-validator";

export class GetBalanceDTO {
  @IsString()
  @IsNotEmpty()
  address: string;

  constructor(address: string) {
    this.address = address;
  }
}

export type GetSpendablesOptions = {
  address: string;
  value: number;
  safetospend?: boolean;
  filter?: string[];
};

export class GetSpendablesDTO {
  @IsString()
  @IsNotEmpty()
  address: string;

  @IsNumber()
  @IsNotEmpty()
  value: number;

  @IsBoolean()
  @IsOptional()
  safetospend?: boolean;

  @IsString({ each: true })
  @IsOptional()
  filter?: string[];

  constructor(address: string, value: number, safetospend?: boolean, filter?: string[]) {
    this.address = address;
    this.value = value;
    this.safetospend = safetospend;
    this.filter = filter;
  }
}

export type SpendableDto = {
  txid: string;
  n: number;
  sats: number;
  scriptPubKey: ScriptPubKey;
};

export type GetUnspentsOptions = {
  address: string;
  options?: {
    allowedRarity?: Rarity[];
    safetospend?: boolean;
  };
  sort?: "asc" | "desc";
};

export class GetUnspentsOptionsDTO {
  @IsString()
  @IsOptional()
  allowedRarity?: Rarity[];

  @IsBoolean()
  @IsOptional()
  safetospend?: boolean;

  constructor(allowedRarity?: Rarity[], safetospend?: boolean) {
    this.allowedRarity = allowedRarity;
    this.safetospend = safetospend;
  }
}

export class GetUnspentsDTO {
  @IsString()
  @IsNotEmpty()
  address: string;

  @IsObject()
  @ValidateNested()
  @IsOptional()
  @Type(() => GetUnspentsOptionsDTO)
  options?: GetUnspentsOptionsDTO;

  @IsOptional()
  sort?: "asc" | "desc";

  constructor(address: string, options?: { allowedRarity?: Rarity[]; safetospend?: boolean }, sort?: "asc" | "desc") {
    this.address = address;
    this.options = options;
    this.sort = sort;
  }
}

export type UnspentDto = {
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
