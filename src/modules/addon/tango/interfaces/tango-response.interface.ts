export interface TangoResponse {
  response: {
    broker_response: {
      broker_code: string;
      broker_msg: string;
      session_id: string;
    };
    mapping_response: {
      mapping_code: string;
    };
    wallet_response: {
      type: string;
      txnid: string;
      txnstatus: string;
      balance: string;
      message: string;
      frbalance: string;
      trid: string;
      txnmode: string;
    };
  };
}

export interface TangoBalanceResponse {
  sessionId: string;
  status: {
    code: string;
    message: string;
  };
  balance: {
    available: number;
    frozen: number;
  };
  transaction: {
    id: string;
    type: string;
    reference: string;
  };
  fees?: {
    serviceCharge: number;
    commission: number;
  };
}
