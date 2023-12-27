import { RpcException } from "./json-rpc.exception";
import { JsonRpcErrorCodes } from "./json-rpc-error-codes";

export class RpcParseException extends RpcException {
  constructor() {
    super("Parse error", JsonRpcErrorCodes.PARSE_ERROR);
  }
}
