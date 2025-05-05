import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TangoService } from './tango.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [TangoService],
  exports: [TangoService],
})
export class TangoModule {}
