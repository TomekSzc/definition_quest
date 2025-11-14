export class HttpError extends Error {
  constructor(
    public message: string,
    public status: number,
    public response?: unknown
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export class ValidationError extends HttpError {
  constructor(message: string, details: unknown) {
    super(message, 400, { error: message, details });
    this.name = "ValidationError";
  }
}
