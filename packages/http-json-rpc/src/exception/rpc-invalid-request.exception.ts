import { RpcException } from "./json-rpc.exception";
import { JSON_RPC_ERROR_CODES } from "./json-rpc-error-codes";

export class RpcInvalidRequestException extends RpcException {
  constructor() {
    super("Invalid request", JSON_RPC_ERROR_CODES.INVALID_REQUEST);
  }
}
