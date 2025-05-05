export function buildMerchantPaymentParams(params: {
  amount: string;
  mercode: string;
  pin2: string;
  msisdn2: string;
  provider?: string;
  provider2?: string;
  country_id: string;
  msisdn?: string;
  payid?: string;
  payid2?: string;
  blocksms?: 'PAYER' | 'BOTH' | 'PAYEE' | 'NONE';
  txnmode?: 'P2P' | 'B2B' | 'C2B';
  service_id?: string;
}) {
  return {
    ...params,
    msisdn: params.msisdn ?? '',
    payid: params.payid ?? '12',
    payid2: params.payid2 ?? '12',
    blocksms: params.blocksms ?? 'NONE',
  };
}
export function buildP2PInitParams(params: {
  amount: string;
  msisdn: string;
  msisdn2: string;
  pin: string;
  em?: string;
  provider?: string;
  provider2?: string;
  payid?: string;
  payid2?: string;
  blocksms: 'PAYER' | 'BOTH' | 'PAYEE' | 'NONE';
  txnmode: 'P2P';
  country_id: string;
}) {
  return {
    ...params,
    payid: params.payid ?? '12',
    payid2: params.payid2 ?? '12',
    blocksms: params.blocksms ?? 'NONE',
    provider: params.provider ?? '101',
    provider2: params.provider2 ?? '101',
  };
}
export function buildGetFeesParams(params: {
  amount: string;
  service_type: string;
  payer_user_type: 'CHANNEL' | 'SUBSCRIBER' | 'MERCHANT' | 'OPERATOR';
  payer_account_id: string;
  payer_provider_id?: string;
  payer_pay_id?: string;
  payee_user_type: 'CHANNEL' | 'SUBSCRIBER' | 'MERCHANT' | 'OPERATOR';
  payee_account_id: string;
  payee_provider_id?: string;
  payee_pay_id?: string;
  country_id: string;
  addon_id: string;
}) {
  return {
    ...params,
    payer_pay_id: params.payer_pay_id ?? '12',
    payee_pay_id: params.payee_pay_id ?? '12',
    payer_provider_id: params.payer_provider_id ?? '101',
    payee_provider_id: params.payee_provider_id ?? '101',
  };
}
