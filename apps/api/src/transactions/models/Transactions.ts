import { RawTransaction, Vout } from "@ordzaar/bitcoin-service";
import { Type } from "class-transformer";
import { IsBoolean, IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested } from "class-validator";

export class GetTransactionOptionsDTO {
  @IsBoolean()
  @IsOptional()
  ord?: boolean;

  @IsBoolean()
  @IsOptional()
  hex?: boolean;

  @IsBoolean()
  @IsOptional()
  witness?: boolean;

  // TODO: Pagination

  constructor(ord?: boolean, hex?: boolean, witness?: boolean) {
    this.ord = ord;
    this.hex = hex;
    this.witness = witness;
  }
}

export class GetTransactionDTO {
  @IsString()
  @IsNotEmpty()
  txid: string;

  @IsObject()
  @ValidateNested()
  @IsOptional()
  @Type(() => GetTransactionOptionsDTO)
  options?: GetTransactionOptionsDTO;

  @IsOptional()
  sort?: "asc" | "desc";

  constructor(txid: string, options?: { ord?: boolean; hex?: boolean; witness?: boolean }) {
    this.txid = txid;
    this.options = options ? new GetTransactionOptionsDTO(options.ord, options.hex, options.witness) : undefined;
  }
}

export type ExpandedTransaction = RawTransaction & {
  vout: (Vout & {
    ordinals: any[];
    inscriptions: any[];
    spent: string | false;
  })[];
  fee: number;
  blockheight: number;
};
