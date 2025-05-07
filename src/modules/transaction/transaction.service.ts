import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TangoService } from '../addon/tango/tango.service';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('transaction-processing')
    private configService: ConfigService,
    @InjectMetric('transaction_requests_total')
    private paymentRequestsCounter: Counter,
    @InjectMetric('transaction_processing_duration')
    private paymentDurationHistogram: Histogram,
    private readonly tango: TangoService,
  ) {}

  async createPayment(data: CreateTransactionDto) {
    const startTime = Date.now();
    this.logger.log('Debut de creation du paiement...', {
      data: { ...data, amount: data.amount.toString() },
    });

    try {
      // Création de la transaction en base
      let body = {
        type: data.type,
        from: data.from,
        to: data.to,
        amount: data.amount,
      };

      const payment = await this.prisma.transaction.create({
        data: {
          ...body,
          status: 'Pending',
          date: new Date(),
         
        },
      });

      this.logger.log('Transaction enregistrée en base', {
        transactionId: payment.id,
        status: payment.status,
      });

      this.paymentRequestsCounter.inc({ status: 'created' });
      this.paymentDurationHistogram.observe(Date.now() - startTime);
      let amountToString = data.amount.toString();
      let result;
      if (data.type === 'MPay') {
        result = this.tango.p2pInit({
          amount: amountToString,
          msisdn: data.from,
          msisdn2: data.to,
          pin: data.pin,
          blocksms: 'NONE',
          country_id: 'ci',
        });
      } else {
        result = this.tango.merchantPaymentOneStep({
          amount: amountToString,
          mercode: data.to,
          msisdn2: data.from,
          pin2: data.pin,
          blocksms: 'NONE',
          country_id: 'ci',
        });
      }
this.logger.log(`resultats de la requete tango ${result}`)
      return result
    } catch (error) {
      this.logger.error('Erreur lors de la création du paiement', {
        error: error.message,
        stack: error.stack,
        data: { ...data, amount: data.amount.toString() },
      });
      this.paymentRequestsCounter.inc({ status: 'error' });
      throw error;
    }
  }

  async getPaymentStatus(id: string) {
    this.logger.log('Récupération du statut du paiement', {
      transactionId: id,
    });
    try {
      const payment = await this.prisma.transaction.findMany({
      
      });

      if (!payment) {
        this.logger.warn('Aucune transaction trouvée', {
          transactionId: id,
        });
        throw new Error('Transaction non trouvée');
      }

      return payment;
    } catch (error) {
      this.logger.error('Erreur lors de la récupération du statut', {
        error: error.message,
        transactionId: id,
      });
      throw error;
    }
  }
}
