import { RpcException } from "./json-rpc.exception";
import { JsonRpcErrorCodes } from "./json-rpc-error-codes";

export class RpcInternalException extends RpcException {
  constructor() {
    super("Internal error", JsonRpcErrorCodes.INTERNAL_ERROR);
  }
}
