export interface TangoError {
  code: string;
  message: string;
}

export enum TangoMappingCode {
  PIN_INCORRECT_1 = 'PIN_INCORRECT_1',
  SUCCESS = 'SUCCESS',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  INVALID_MSISDN = 'INVALID_MSISDN',
  ACCOUNT_NOT_FOUND = 'ACCOUNT_NOT_FOUND',
  ACCOUNT_BLOCKED = 'ACCOUNT_BLOCKED',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  TIMEOUT = 'TIMEOUT',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

export enum TangoTxnStatus {
  SUCCESS = '200',
  PIN_INCORRECT = '00068',
  INSUFFICIENT_BALANCE = '00071',
  INVALID_MSISDN = '00072',
  ACCOUNT_NOT_FOUND = '00073',
  ACCOUNT_BLOCKED = '00074',
  SYSTEM_ERROR = '00099',
  TIMEOUT = '00098',
  SERVICE_UNAVAILABLE = '00097',
}

export class TangoApiError extends Error {
  constructor(
    public readonly mappingCode: string,
    public readonly txnStatus: string,
    public readonly message: string,
    public readonly sessionId: string,
  ) {
    super(message);
    this.name = 'TangoApiError';
  }
}
