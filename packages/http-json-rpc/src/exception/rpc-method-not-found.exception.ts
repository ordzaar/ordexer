import { RpcException } from "./json-rpc.exception";
import { JsonRpcErrorCodes } from "./json-rpc-error-codes";

export class RpcMethodNotFoundException extends RpcException {
  constructor() {
    super("Method not found", JsonRpcErrorCodes.METHOD_NOT_FOUND);
  }
}
