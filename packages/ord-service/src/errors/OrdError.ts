export class OrdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrdError";
  }
}
