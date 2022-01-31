import { ICreateTransferDTO } from './ICreateTransferDTO';
import { inject, injectable } from "tsyringe";


import { CreateTransferError } from './CreateTransferError';
import { OperationType } from '@modules/statements/entities/Statement';
import { IUsersRepository } from '../../../users/repositories/IUsersRepository';
import { IStatementsRepository } from '../../../statements/repositories/IStatementsRepository';

@injectable()
export class CreateTransferUseCase {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
    @inject('StatementsRepository')
    private statementsRepository: IStatementsRepository
  ) {}

  async execute({amount, description, senderUserID, receiverUserID}: ICreateTransferDTO) {
    const receiverUserExists = await this.usersRepository.findById(receiverUserID)
    if(!receiverUserExists) throw new CreateTransferError.ReceiverUserNotFound()

    const senderUserBalance = await this.statementsRepository.getUserBalance({user_id: senderUserID})

    if(amount > senderUserBalance.balance) throw new CreateTransferError.InsufficientFunds()

    await this.statementsRepository.create({
      user_id: receiverUserID,
      sender_id: senderUserID,
      amount,
      description,
      type: 'transfer' as OperationType
    });
  }
}

