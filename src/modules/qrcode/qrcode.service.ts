// qr-code/qr-code.service.ts
import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { QRCodePartnerService } from './interfaces/qr-code-partner.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TransactionService } from '../transaction/transaction.service';
import { Logger } from 'nestjs-pino';
import { PayByQRCodeDto } from './dto/read-qr-code.dto';
@Injectable()
export class QRCodeService {
  constructor(
    @Inject('PARTNER_SERVICES')
    private readonly partners: QRCodePartnerService[],
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: Logger,
    private readonly TransctionsService: TransactionService,
  ) {}

  async getMerchantInfo(content: string) {
    const partner = this.partners.find((p) => p.supports(content));
    if (!partner) {
      throw new BadRequestException('Aucun partenaire compatible');
    }

    const result = await partner.getMerchantInfo(content);
    if (!result.merchantAgentCode) {
      throw new BadRequestException('Aucune information trouvée');
    }
  }
  async payMarchant(body: PayByQRCodeDto) {
    const { content, amount, from, to } = body;
    if (content === undefined || content === null) {
   return   await this.TransctionsService.createPayment({
        type: 'MPay',
        from: from,
        to: to,
        amount: parseFloat(amount),
        pin: body.pin,
      });
    }
    const partner = this.partners.find((p) => p.supports(content));
    if (!partner) {
      throw new BadRequestException('Aucun partenaire compatible');
    }

    const result = await partner.getMerchantInfo(content);
    if (!result.merchantAgentCode) {
      throw new BadRequestException('Aucune information trouvée');
    }
    await this.TransctionsService.createPayment({
      type: result.type == 'MERCHANT' ? 'MPay' : 'P2P',
      from: partner.id,
      to: result.merchantAgentCode,
      amount: parseFloat(amount),
      pin: body.pin,
    });
  }
}
