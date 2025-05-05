// qr-code/qr-code.service.ts
import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { QRCodePartnerService } from './interfaces/qr-code-partner.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
@Injectable()
export class QRCodeService {
  constructor(
    @Inject('PARTNER_SERVICES')
    private readonly partners: QRCodePartnerService[],
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getMerchantInfo(content: string) {
    const partner = this.partners.find((p) => p.supports(content));
    if (!partner) {
      throw new BadRequestException('Aucun partenaire compatible');
    }

    const result = await partner.getMerchantInfo(content);

    this.eventEmitter.emit('qrcode.read', {
      countryCode: partner.countryCode,
      partnerId: partner.id,
      status: result.success ? 'success' : 'failed',
    });

    return result;
  }
}
