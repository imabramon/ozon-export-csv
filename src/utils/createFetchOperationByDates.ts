import type {
  OperationItem,
  OperationV3Request,
  OperationV3Response,
  Transaction,
} from "@/pages/types";

type InjectFetchFn = <B extends object, R extends any>(
  url: string,
  body: B,
  options?: Omit<RequestInit, "headers" | "body" | "credentials">,
) => R;

type LogFn = (...args: Parameters<typeof console.log>) => void;

const OperationV3_URL =
  "https://finance.ozon.ru/apps/pfm/api/operations/groupOperationsV3";

const createFetchOperationsByCursor =
  (injectFecth: InjectFetchFn, log: LogFn) =>
  async (
    cursor: string | null = null,
  ): Promise<[cursor: string | null, items: OperationItem[]]> => {
    try {
      const res = await injectFecth<OperationV3Request, OperationV3Response>(
        OperationV3_URL,
        {
          cursorPagination: { cursor, perPage: 100 },
          filter: {
            categories: [],
            effect: "EFFECT_UNKNOWN",
            pfmTags: [],
            accountTokens: [],
            timeZone: "Europe/Moscow",
          },
        },
        {
          method: "POST",
        },
      );
      return [
        res.data.me.client.groupOperationsV3.cursors.next,
        res.data.me.client.groupOperationsV3.items,
      ];
    } catch (e) {
      // @ts-expect-error
      log("error while fetch", e?.message);
      return [null, []];
    }
  };

function operationItemToTransaction(value: OperationItem): Transaction {
  const cents = value.accountAmount.amountAbs.cents ?? 0;
  const baseAmount = cents / 100;

  const sign = (value.accountAmount.sign || "").toUpperCase();
  const isNegative =
    sign.includes("NEG") ||
    sign.includes("MINUS") ||
    sign === "-" ||
    sign === "SIGN_MINUS";

  const amount = isNegative ? -baseAmount : baseAmount;

  const debit = isNegative ? 0 : baseAmount;
  const credit = isNegative ? baseAmount : 0;

  const name =
    value.merchant?.name ||
    value.cardMerchant?.name ||
    value.counterpartyName ||
    value.purpose ||
    value.categoryGroupName;

  return {
    time: value.time,
    name,
    category: value.categoryGroupName,
    purpose: value.purpose,
    debit,
    credit,
    amount,
  };
}

export const createFetchOperationByDates =
  (injectFecth: InjectFetchFn, log: LogFn) =>
  async (startDate: Date, endDate: Date) => {
    const fetchOperationsByCursor = createFetchOperationsByCursor(
      injectFecth,
      log,
    );

    const toUtc0 = (date: Date) =>
      new Date(date.getTime() + date.getTimezoneOffset() * 60000);

    const startLocal = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate(),
      0,
      0,
      0,
      0,
    );
    const endLocal = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate(),
      23,
      59,
      59,
      999,
    );

    const startUtc = toUtc0(startLocal);
    const endUtc = toUtc0(endLocal);

    let cursor: string | null = null;
    const result: OperationItem[] = [];

    while (true) {
      const [nextCursor, items] = await fetchOperationsByCursor(cursor);

      if (!items || items.length === 0) {
        break;
      }

      for (const item of items) {
        const itemDate = new Date(item.time);

        if (itemDate >= startUtc && itemDate <= endUtc) {
          result.push(item);
        }
      }

      const lastItem = items[items.length - 1];
      const lastDate = new Date(lastItem.time);

      if (lastDate < startUtc) {
        break;
      }

      if (!nextCursor) {
        break;
      }

      cursor = nextCursor;
    }

    return result.map(operationItemToTransaction);
  };

