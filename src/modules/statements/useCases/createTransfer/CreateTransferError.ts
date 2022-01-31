import { AppError } from "../../../../shared/errors/AppError";

export namespace CreateTransferError {
  export class ReceiverUserNotFound extends AppError {
    constructor() {
      super('Receiver User not found', 404);
    }
  }

  export class InsufficientFunds extends AppError {
    constructor() {
      super('Insufficient funds', 400);
    }
  }
}
