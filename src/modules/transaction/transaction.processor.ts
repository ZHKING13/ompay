import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { TransactionService } from './transaction.service';

@Processor('transaction-processing')
export class TransactionProcessor {
  private readonly logger = new Logger(TransactionProcessor.name);

  constructor(private readonly transactionService: TransactionService) {}

  
}
