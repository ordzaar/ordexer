import { RpcException } from "./json-rpc.exception";
import { JSON_RPC_ERROR_CODES } from "./json-rpc-error-codes";

export class RpcInvalidParamsException extends RpcException {
  constructor() {
    super("Invalid params", JSON_RPC_ERROR_CODES.INVALID_PARAMS);
  }
}
