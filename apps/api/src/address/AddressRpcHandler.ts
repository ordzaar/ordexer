import { ValidationPipe } from "@nestjs/common";
import { RpcHandler, RpcMethodHandler, RpcPayload } from "@ordzaar/http-json-rpc";
import { IsNotEmpty, IsString } from "class-validator";

export class GetTransactionDTO {
  @IsString()
  @IsNotEmpty()
  address: string;

  constructor(address: string) {
    this.address = address;
  }
}

@RpcHandler({ method: "Address" })
export class AddressRpcHandler {
  @RpcMethodHandler("GetTransactions")
  public getTransactions(
    @RpcPayload(new ValidationPipe({ transform: true, whitelist: true, validateCustomDecorators: true }))
    payload: GetTransactionDTO,
  ) {
    // eslint-disable-next-line no-console
    console.log(payload);
    return payload;
  }
}
