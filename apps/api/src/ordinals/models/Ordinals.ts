import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested } from "class-validator";

export class GetInscriptionsParamsDTO {
  @IsString()
  @IsOptional()
  creator?: string;

  @IsString()
  @IsOptional()
  owner?: string;

  @IsString()
  @IsOptional()
  mimeType?: string;

  @IsString()
  @IsOptional()
  mimeSubtype?: string;

  @IsString()
  @IsOptional()
  outpoint?: string;

  constructor(creator?: string, owner?: string, mimeType?: string, mimeSubtype?: string, outpoint?: string) {
    this.creator = creator;
    this.owner = owner;
    this.mimeType = mimeType;
    this.mimeSubtype = mimeSubtype;
    this.outpoint = outpoint;
  }
}

export class GetInscriptionsSortDTO {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  order: "asc" | "desc";

  constructor(key: string, order: "asc" | "desc") {
    this.key = key;
    this.order = order;
  }
}

export class GetInscriptionsDTO {
  @IsObject()
  @ValidateNested()
  @Type(() => GetInscriptionsParamsDTO)
  params?: GetInscriptionsParamsDTO;

  @IsOptional()
  @ValidateNested()
  @Type(() => GetInscriptionsSortDTO)
  sort?: GetInscriptionsSortDTO;

  @IsArray()
  @IsOptional()
  include?: string[];

  // TODO: Pagination

  constructor(params?: GetInscriptionsParamsDTO, sort?: GetInscriptionsSortDTO, include?: string[]) {
    this.params = params;
    this.sort = sort;
    this.include = include;
  }
}
