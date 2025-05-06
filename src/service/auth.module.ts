import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ApiAuthService } from './auth.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [
   ApiAuthService,
  ],
  exports: [ApiAuthService],
})
export class AuthModule {}
