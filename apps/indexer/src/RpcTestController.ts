import { Controller, Get, Param } from "@nestjs/common";

import { RpcProvider } from "./bitcoinrpc/providers/RpcProvider";


@Controller("rpctest")
export class RpcTestController {
  constructor(private rpc: RpcProvider) {}

  @Get("blockhash/:height")
  async getBlockHash(@Param("height") height: number) {
    return this.rpc.getBlockHash(Number(height));
  }

  @Get("rawtx/:txid")
  async getRawTransaction(@Param("txid") txid: string) {
    return this.rpc.getRawTransaction(txid, true);
  }
}
