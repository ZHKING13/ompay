export interface QRCodePartnerService {
  id: string; 
  countryCode: string; 
  supports(content: string): boolean;
  getMerchantInfo(content: string): Promise<{ success: boolean; data?: any }>;
}
