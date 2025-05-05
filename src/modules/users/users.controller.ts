import {
  Controller,
  Get,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { UserService } from './user.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Get('login')
  @ApiOperation({ summary: 'Get user details by MSISDN' })
  @ApiQuery({
    name: 'msisdn',
    type: String,
    description: 'MSISDN of the user',
    required: true,
  })
  @ApiQuery({
    name: 'pin',
    type: String,
    description: 'pin of the user',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'User details retrieved successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access to CoreAPI.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  async getUserDetails(@Query('msisdn') msisdn: string , @Query('pin') pin: string) {
    try {
      const user = await this.userService.getUser(msisdn, pin);
      return user;
    } catch (error) {
      if (error.message.includes('Unauthorized')) {
        throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('balance')
  @ApiOperation({ summary: 'Get user balance by MSISDN and PIN' })
  @ApiQuery({
    name: 'msisdn',
    type: String,
    description: 'MSISDN of the user',
    required: true,
  })
  @ApiQuery({
    name: 'pin',
    type: String,
    description: 'PIN for balance inquiry',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'User balance retrieved successfully.',
  })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  async getUserBalance(
    @Query('msisdn') msisdn: string,
    @Query('pin') pin: string,
  ) {
    try {
      const balance = await this.userService.getUserBalance(msisdn, pin);
      return balance;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    }
    @Get('transactions')
    @ApiOperation({ summary: 'Get user transactions by MSISDN and PIN' })
    @ApiQuery({
      name: 'msisdn',
      type: String,
      description: 'MSISDN of the user',
      required: true,
    })
    @ApiQuery({ name: 'pin', type: String, description: 'PIN for transaction inquiry', required: true })
    @ApiResponse({
      status: 200,
      description: 'User transactions retrieved successfully.',
    })
    @ApiResponse({ status: 500, description: 'Internal server error.' })
    async getUserTransactions( @Query('msisdn') msisdn: string, @Query('pin') pin: string) {
      try {
        const transactions = await this.userService.getUserTranscactions(msisdn, pin);
        return transactions;
      } catch (error) {
        throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
}
