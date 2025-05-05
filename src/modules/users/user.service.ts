import { Injectable, Logger } from '@nestjs/common';

import { CoreApiService } from '../addon/core-api/core-api.service';
import { TangoService } from '../addon/tango/tango.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private coreApi: CoreApiService,
    private  tangoService: TangoService,
  ) {}
  async getUser(msisdn: string) {
    return this.coreApi
      .getUserDetails(msisdn)
      .then((res) => {
        if (res.status === 200) {
          return res.data;
        } else if (res.status === 401) {
          this.logger.error('Unauthorized access to CoreAPI');
          throw new Error('Unauthorized access to CoreAPI');
        } else {
          this.logger.error(`Error fetching user: ${res.statusText}`);
          throw new Error(`Error fetching user: ${res.statusText}`);
        }
      })
      .catch((err) => {
        this.logger.error(`Error fetching user: ${err.message}`);
        throw new Error(`Error fetching user: ${err.message}`);
      });
    }
    async getUserBalance(msisdn: string, pin: string) {
      return this.tangoService.getCustomerBalance({
    msisdn,
    pin,
    provider: "101",
    payid: "12",
    blocksms: "BOTH",
    country_id: "ci",
    addon_id: "okay",
  })
        
    }
}
