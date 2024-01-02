import { ValidationPipe } from "@nestjs/common";
import { RpcHandler, RpcMethodHandler, RpcPayload } from "@ordzaar/http-json-rpc";

import { GetTransactionDTO } from "../models/Transactions";
import { TransactionsService } from "../services/TransactionsService";

@RpcHandler({ method: "Transactions" })
export class TransactionsRpcHandler {
  constructor(private transactionsService: TransactionsService) {}

  @RpcMethodHandler("GetTransaction")
  public getTransaction(
    @RpcPayload(new ValidationPipe({ transform: true, whitelist: true, validateCustomDecorators: true }))
    payload: GetTransactionDTO,
  ): Promise<any> {
    const transaction = this.transactionsService.getTransaction(payload);
    return transaction;
  }

  @RpcMethodHandler("Relay")
  public Relay(): Promise<any> {
    const transactions = this.transactionsService.relay();
    return transactions;
  }
}
