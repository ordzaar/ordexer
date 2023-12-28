import { RpcException } from "./json-rpc.exception";
import { JsonRpcErrorCodes } from "./json-rpc-error-codes";

export class RpcInvalidParamsException extends RpcException {
  constructor() {
    super("Invalid params", JsonRpcErrorCodes.INVALID_PARAMS);
  }
}
