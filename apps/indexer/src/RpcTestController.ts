import { Controller, Get, Param } from "@nestjs/common";

import { BitcoinService } from "./bitcoin/BitcoinService";


@Controller("rpctest")
export class RpcTestController {
  constructor(private bitcoinSvc: BitcoinService) {}

  @Get("blockhash/:height")
  async getBlockHash(@Param("height") height: number) {
    return this.bitcoinSvc.getBlockHash(Number(height));
  }

  @Get("rawtx/:txid")
  async getRawTransaction(@Param("txid") txid: string) {
    return this.bitcoinSvc.getRawTransaction(txid, true);
  }
}
