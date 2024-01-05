import { Body, Controller, Post } from "@nestjs/common";

import { GetBalanceDTO, GetSpendablesDTO, GetUnspentsDTO } from "../models/Address";
import { AddressService } from "../services/AddressService";

@Controller("address")
export class AddressController {
  constructor(private addressService: AddressService) {}

  @Post("getBalance/")
  async getBalance(@Body() getBalanceOptions: GetBalanceDTO) {
    const balance = await this.addressService.getBalance(getBalanceOptions);
    return { balance };
  }

  @Post("getSpendables/")
  async getSpendables(@Body() getSpendablesOptions: GetSpendablesDTO) {
    const spendables = await this.addressService.getSpendables(getSpendablesOptions);
    return { spendables };
  }

  @Post("getUnspents/")
  async getUnspents(@Body() getUnspentsOptions: GetUnspentsDTO) {
    const unspents = await this.addressService.getUnspents(getUnspentsOptions);
    return { unspents };
  }
}
