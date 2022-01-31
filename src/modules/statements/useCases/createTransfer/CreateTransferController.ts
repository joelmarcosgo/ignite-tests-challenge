import { CreateTransferUseCase } from './CreateTransferUseCase';
import { Request, Response } from 'express';
import { container } from 'tsyringe';

export class CreateTransferController {
  async execute(request: Request, response: Response) {
    const { receiverUserID } = request.params;
    const { id: senderUserID } = request.user;
    const {amount, description} = request.body;

    const createTransferUseCase = container.resolve(CreateTransferUseCase);

    await createTransferUseCase.execute({
      senderUserID,
      receiverUserID,
      amount,
      description
    });

    return response.status(201).send();
  }
}
