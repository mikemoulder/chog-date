// An error whose message is written for the person using the app, with its HTTP status.
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
