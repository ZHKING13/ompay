// qr-code/qr-code.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { OdysseeService } from './services/odyssee.service';
import { FastPayQRService } from './services/fastpayqr.service';
import { QRCodeService } from './qrcode.service';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { PartnerServices } from './services';
import { QRCodeController } from './qrcode.controller';


@Module({
  imports: [HttpModule, ConfigModule, EventEmitterModule.forRoot()],
  providers: [
    QRCodeService,
    ...PartnerServices,
    {
      provide: 'PARTNER_SERVICES',
      useFactory: (...partners) => partners,
      inject: [...PartnerServices],
    },
  ],
  exports: [QRCodeService],
  controllers: [QRCodeController],
})
export class QRCodeModule {}
