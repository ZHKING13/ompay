export interface FastPayResponse {
  error: boolean;
  code: string;
  message: string;
  messageCode: string;
  data: FastPayMerchantData;
}

export interface FastPayMerchantData {
  merchantId: number;
  merchantName: string;
  merchantMsisdn: string;
  merchantSecret: string;
  merchantAgentCode: string;
  merchantOrganizationId: number;
  merchantPostbackUrl: string;
}
