export interface OperationV3Request {
  cursorPagination: {
    cursor: string | null;
    perPage: number;
  };
  filter: {
    categories: unknown[];
    effect: string;
    pfmTags: unknown[];
    accountTokens: unknown[];
    timeZone: string;
  };
}

export interface MoneyAmount {
  cents: number;
  currencyName: string;
}

export interface AmountWithSign {
  amountAbs: MoneyAmount;
  sign: string;
}

export interface MerchantInfo {
  logoUrlDark: string;
  logoUrlLight: string;
  name: string;
}

export interface OperationMeta {
  __typename: string;
  truncatedPan: string;
}

export interface OperationItem {
  accountAmount: AmountWithSign;
  accountCustomName: string | null;
  accountProductType: string;
  accountToken: string;
  cardMerchant: MerchantInfo;
  cashbackDelayDays: number | null;
  cashbackStatus: string;
  categoryGroupName: string;
  clientAccountsTransferMeta: unknown | null;
  comment: string | null;
  coopMemberInfo: unknown | null;
  counterpartyName: string;
  groupID: string;
  groupOperationType: string;
  isMkkMarked: boolean;
  isSuitableForMkk: boolean;
  lastOperationId: string;
  lastOperationTime: string;
  merchant: MerchantInfo;
  merchantCategoryCode: string;
  merchantCategoryType: string;
  meta: OperationMeta;
  originalAmount: AmountWithSign;
  ozonOrderNumber: string | null;
  parentOperationId: string | null;
  points: unknown | null;
  purpose: string;
  scheduleId: string | null;
  scheduleType: string | null;
  starsPoints: unknown | null;
  status: string;
  templateId: string | null;
  time: string;
}

export interface OperationV3Response {
  data: {
    me: {
      client: {
        groupOperationsV3: {
          cursors: {
            next: string | null;
            prev: string | null;
          };
          items: OperationItem[];
        };
      };
    };
  };
}
