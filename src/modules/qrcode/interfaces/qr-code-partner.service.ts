export interface QRCodePartnerService {
  id: string;
  countryCode: string;
  userType: "MERCHANT" | "CUSTOMER"; 
  supports(content: string): boolean;
  getMerchantInfo(content: string): Promise<MerchantInfo>;
}

export interface MerchantInfo {
  merchantName: string;
  phoneNumber?: string;
  merchantAgentCode?: string;
  type: 'MERCHANT' | 'CUSTOMER';
  
}
