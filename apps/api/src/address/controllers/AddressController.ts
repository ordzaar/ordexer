import { Body, Controller, Get, Param } from "@nestjs/common";

import { GetSpendablesOptions, GetUnspentsOptions } from "../models/Address";
import { AddressService } from "../services/AddressService";

@Controller("address")
export class AddressController {
  constructor(private addressService: AddressService) {}

  @Get("getBalance/:address")
  async getBalance(@Param("address") address: string) {
    const balance = await this.addressService.getBalance(address);
    return { balance };
  }

  @Get("getSpendables/:address")
  async getSpendables(@Body() getSpendablesOptions: GetSpendablesOptions) {
    const spendables = await this.addressService.getSpendables(getSpendablesOptions);
    return { spendables };
  }

  @Get("getUnspents/:address")
  async getUnspents(@Param("address") getUnspentsOptions: GetUnspentsOptions) {
    const unspents = await this.addressService.getUnspents(getUnspentsOptions);
    return { unspents };
  }
}
