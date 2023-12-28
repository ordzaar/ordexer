import { RpcException } from "./json-rpc.exception";
import { JsonRpcErrorCodes } from "./json-rpc-error-codes";

export class RpcInvalidRequestException extends RpcException {
  constructor() {
    super("Invalid request", JsonRpcErrorCodes.INVALID_REQUEST);
  }
}
