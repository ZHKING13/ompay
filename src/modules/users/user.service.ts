import { Injectable, Logger } from '@nestjs/common';

import { CoreApiService } from '../addon/core-api/core-api.service';
import { TangoService } from '../addon/tango/tango.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);

    constructor(
        private coreApi: CoreApiService,
        private tangoService: TangoService,
        private readonly config: ConfigService,
    ) { }
    async getUser(msisdn: string, pin: string) {
        return this.tangoService.userEnquiry({
            msisdn,
            country_id: 'ci',
            pin: '1234',
        
        });
    
    }
    async getUserBalance(msisdn: string, pin: string) {
        return this.tangoService.getCustomerBalance({
            msisdn,
            pin,

            country_id: 'ci',
            addon_id:
                this.config.get<string>('addon.brokerAddonId') || '32nd5KAPPqfs49',
        });
    }
    async getUserTranscactions(msisdn: string, pin: string) {
        return this.tangoService.customerLastNTransaction({
            msisdn,
            pin,
            country_id: 'ci'
        
        });
    }
}
