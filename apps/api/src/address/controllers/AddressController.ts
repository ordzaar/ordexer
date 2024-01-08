import { Controller, Get, Param, Query, UsePipes, ValidationPipe } from "@nestjs/common";

import { AddressParamDTO, GetUnspentsQueryDTO } from "../models/Address";
import { AddressService } from "../services/AddressService";

@Controller("addresses")
export class AddressController {
  constructor(private addressService: AddressService) {}

  @Get(":address/balance")
  async getBalance(@Param() params: AddressParamDTO) {
    const balance = await this.addressService.getBalance(params.address);
    return { balance };
  }

  @Get(":address/spendables")
  @UsePipes(new ValidationPipe({ transform: true }))
  async getSpendables(
    @Param("address")
    params: AddressParamDTO,
    @Query()
    query: GetSpendablesQueryDTO,
  ) {
    const spendables = await this.addressService.getSpendables(params.address, query);
    return { spendables };
  }

  @Get(":address/unspents")
  @UsePipes(new ValidationPipe({ transform: true }))
  async getUnspents(@Param() params: AddressParamDTO, @Query() query: GetUnspentsQueryDTO) {
    const unspents = await this.addressService.getUnspents(params.address, query);
    return { unspents };
  }
}
