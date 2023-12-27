import { RpcException } from "./json-rpc.exception";
import { JSON_RPC_ERROR_CODES } from "./json-rpc-error-codes";

export class RpcMethodNotFoundException extends RpcException {
  constructor() {
    super("Method not found", JSON_RPC_ERROR_CODES.METHOD_NOT_FOUND);
  }
}
