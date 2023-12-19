import { Controller, Get, Param } from "@nestjs/common";

import { AddressService } from "./AddressService";

@Controller("address")
export class AddressController {
  constructor(private addressService: AddressService) {}

  @Get("getBalance/:address")
  async getBalance(@Param("address") address: string) {
    const balance = await this.addressService.getBalance(address);
    return { balance };
  }

  @Get("getSpendables/:address")
  async getSpendables(@Param("address") address: string) {
    const spendables = await this.addressService.getSpendables(address);
    return { spendables };
  }

  @Get("getUnspents/:address")
  async getUnspents(@Param("address") address: string) {
    const unspents = await this.addressService.getUnspents(address);
    return { unspents };
  }
}
