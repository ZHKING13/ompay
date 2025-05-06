import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Logger,
  UseGuards,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@ApiTags('Transactions')
@Controller('transactions')
@UseGuards(ThrottlerGuard)
@ApiBearerAuth()
export class TransactionController {
  private readonly logger = new Logger(TransactionController.name);

  constructor(private readonly transactionService: TransactionService) {}

 
  

  // @Get(':id')
  // @ApiOperation({ summary: "Obtenir le statut d'une transaction" })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Statut de la transaction trouvé',
  // })
  // async getTransactionStatus(@Param('id', ParseUUIDPipe) id: string) {
  //   this.logger.log("Réception d'une requête de statut", { transactionId: id });

  //   const transaction = await this.transactionService.getPaymentStatus(id);

  //   return {
  //     success: true,
  //     data: {
  //       transactionId: transaction.id,
  //       status: transaction.status,
  //       amount: transaction.amount,
  //       date: transaction.date,
  //     },
  //   };
  // }
}
