import { RpcException } from "./json-rpc.exception";
import { JSON_RPC_ERROR_CODES } from "./json-rpc-error-codes";

export class RpcParseException extends RpcException {
  constructor() {
    super("Parse error", JSON_RPC_ERROR_CODES.PARSE_ERROR);
  }
}
