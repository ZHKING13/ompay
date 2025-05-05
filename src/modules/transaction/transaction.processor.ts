import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { TransactionService } from './transaction.service';

@Processor('transaction-processing')
export class PaymentProcessor {
  constructor(private paymentService: TransactionService) {}

  @Process('process-transaction')
  async handlePayment(job: Job<{ paymentId: string }>) {
    await this.paymentService.processPayment(job.data.paymentId);
  }
}


