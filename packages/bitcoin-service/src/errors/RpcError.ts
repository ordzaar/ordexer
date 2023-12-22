export class BitcoinRpcError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BitcoinRpcError";
  }
}
