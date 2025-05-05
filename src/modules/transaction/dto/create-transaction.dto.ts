import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDate,
  IsUUID,
} from 'class-validator';
import { TransactionStatus, TransactionType } from '@prisma/client';

export class CreateTransactionDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsNumber()
  amount: number;

  @IsString()
  from: string;

  @IsString()
  to: string;
  @IsEnum(TransactionStatus)
  status: TransactionStatus;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsString()
  @IsOptional()
  txnId?: string;

  @IsDate()
  date: Date;
}
