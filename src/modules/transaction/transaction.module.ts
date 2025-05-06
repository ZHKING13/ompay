import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import {
  makeCounterProvider,
  makeHistogramProvider,
} from '@willsoto/nestjs-prometheus';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { Payment } from './entities/transaction.entity';
import { PrismaModule } from '../prisma/prisma.module';
import { TangoModule } from '../addon/tango/tango.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'transaction-processing',
    }),
    PrismaModule,
    TangoModule
  ],
  controllers: [TransactionController],
  providers: [
    TransactionService,
    makeCounterProvider({
      name: 'transaction_requests_total',
      help: 'Nombre total de requêtes de paiement',
      labelNames: ['status'],
    }),
    makeHistogramProvider({
      name: 'transaction_processing_duration',
      help: 'Durée de traitement des paiements en millisecondes',
      buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000],
    }),
  ],
  exports: [TransactionService],
})
export class TransactionModule {}
