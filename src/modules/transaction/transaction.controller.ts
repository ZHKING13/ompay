import {
  Controller,
  Post,
  Get,
  Body,
  Param,
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
import { Payment } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@ApiTags('Transaction')
@Controller('transaction')
@UseGuards(ThrottlerGuard)
@ApiBearerAuth()
export class PaymentController {
  constructor(private readonly paymentService: TransactionService) {}

  @Post()
  @HttpCode(202)
  @ApiOperation({ summary: 'Créer un nouveau paiement' })
  @ApiResponse({
    status: 202,
    description: 'Paiement accepté pour traitement',
    type: Payment,
  })
  async createPayment(@Body() createPaymentDto: CreateTransactionDto) {
    return this.paymentService.createPayment(createPaymentDto);
  }

  @Get(':id')
  @ApiOperation({ summary: "Obtenir le statut d'un paiement" })
  @ApiResponse({
    status: 200,
    description: 'Statut du paiement trouvé',
    type: Payment,
  })
  async getPaymentStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentService.getPaymentStatus(id);
  }
}
