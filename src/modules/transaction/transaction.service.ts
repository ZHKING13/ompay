import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('transaction-processing')
    private paymentQueue: Queue,
    private configService: ConfigService,
    @InjectMetric('transaction_requests_total')
    private paymentRequestsCounter: Counter,
    @InjectMetric('transaction_processing_duration')
    private paymentDurationHistogram: Histogram,
  ) {}

  async createPayment(createPaymentDto: CreateTransactionDto) {
    const startTime = Date.now();

    try {
      const payment = await this.prisma.transaction.create({
        data: {
          ...createPaymentDto,
          status: 'Pending',
          from: 'user',
          to: 'aggregator',
          amount: 100,
          type: 'MPay',
          date: new Date(),
        },
      });

      await this.paymentQueue.add(
        'process-payment',
        {
          paymentId: payment.id,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      );

      this.paymentRequestsCounter.inc({ status: 'created' });
      this.paymentDurationHistogram.observe(Date.now() - startTime);

      return payment;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la création du paiement: ${error.message}`,
        error.stack,
      );
      this.paymentRequestsCounter.inc({ status: 'error' });
      throw error;
    }
  }

  async getPaymentStatus(id: string) {
    return this.prisma.transaction.findUniqueOrThrow({ where: { id } });
  }

  async processPayment(paymentId: string): Promise<void> {
    const startTime = Date.now();
    const payment = await this.prisma.transaction.findUniqueOrThrow({
      where: { id: paymentId },
    });

    try {
      await this.prisma.transaction.update({
        where: { id: paymentId },
        data: { status: 'Completed' },
      });

      // TODO: appel à l'agrégateur ici

      const processingTime = Date.now() - startTime;

      await this.prisma.transaction.update({
        where: { id: paymentId },
        data: {
          status: 'Completed',
          date: new Date(),
        },
      });

      this.paymentRequestsCounter.inc({ status: 'completed' });
      this.paymentDurationHistogram.observe(processingTime);
    } catch (error) {
      await this.prisma.transaction.update({
        where: { id: paymentId },
        data: {
          status: 'Failed',
        },
      });

      this.paymentRequestsCounter.inc({ status: 'failed' });
      this.logger.error(
        `Erreur lors du traitement du paiement ${paymentId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
