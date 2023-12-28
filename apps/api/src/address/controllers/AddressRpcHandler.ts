import { ValidationPipe } from "@nestjs/common";
import { RpcHandler, RpcMethodHandler, RpcPayload } from "@ordzaar/http-json-rpc";

import { GetBalanceDTO, GetSpendablesDTO, GetUnspentsDTO, SpendableDto, UnspentDto } from "../models/Address";
import { AddressService } from "../services/AddressService";

@RpcHandler({ method: "Address" })
export class AddressRpcHandler {
  constructor(private addressService: AddressService) {}

  @RpcMethodHandler("GetBalance")
  public async getBalance(
    @RpcPayload(new ValidationPipe({ transform: true, whitelist: true, validateCustomDecorators: true }))
    payload: GetBalanceDTO,
  ): Promise<number> {
    const balance = await this.addressService.getBalance(payload);
    return balance;
  }

  @RpcMethodHandler("GetSpendables")
  public async getSpendables(
    @RpcPayload(new ValidationPipe({ transform: true, whitelist: true, validateCustomDecorators: true }))
    payload: GetSpendablesDTO,
  ): Promise<SpendableDto[]> {
    const spendables = await this.addressService.getSpendables(payload);
    return spendables;
  }

  @RpcMethodHandler("GetUnspents")
  public async getUnspents(
    @RpcPayload(new ValidationPipe({ transform: true, whitelist: true, validateCustomDecorators: true }))
    payload: GetUnspentsDTO,
  ): Promise<UnspentDto[]> {
    const unspents = await this.addressService.getUnspents(payload);
    return unspents;
  }
}
