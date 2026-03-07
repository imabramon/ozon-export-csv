import {
  useChromeApi,
  useInjectFetch,
  useInjectFunction,
} from "@/hooks/useChromeApi";
import { useEffectEvent, useState } from "react";

const OperationV3_URL =
  "https://finance.ozon.ru/apps/pfm/api/operations/groupOperationsV3";

interface OperationV3 {
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

interface MoneyAmount {
  cents: number;
  currencyName: string;
}

interface AmountWithSign {
  amountAbs: MoneyAmount;
  sign: string;
}

interface MerchantInfo {
  logoUrlDark: string;
  logoUrlLight: string;
  name: string;
}

interface OperationMeta {
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

interface OperationV3Response {
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

type FetchCursorResult = [string | null, OperationItem[]];

const getItemAmount = (item: OperationItem) => {
  const sign = item.accountAmount.sign === "NEGATIVE" ? -1 : 1;
  return sign * (item.accountAmount.amountAbs.cents / 100);
};

export default function App() {
  const { openInNewTab } = useChromeApi();
  const log = useInjectFunction((...args: Parameters<typeof console.log>) => {
    console.log(...args);
  });

  const injectFecth = useInjectFetch();

  const [startDateStr, setStartDateStr] = useState("2026-02-28");
  const [endDateStr, setEndDateStr] = useState("2026-02-28");

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  log("calll dates", startDate.toDateString(), endDate.toDateString());

  const fetchOperationsByCursor = useEffectEvent(
    async (cursor: string | null = null): Promise<FetchCursorResult> => {
      try {
        const res = await injectFecth<OperationV3, OperationV3Response>(
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
    },
  );

  const fetchOperationByDates = useEffectEvent(
    async (startDate: Date, endDate: Date) => {
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

      return result;
    },
  );

  const onClick = useEffectEvent(async () => {
    const items = await fetchOperationByDates(startDate, endDate);
    log("calll result", items);
  });

  return (
    <div>
      <h1>HelloWorld1</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
        <label>
          Дата начала:
          <input
            type="date"
            value={startDateStr}
            onChange={(e) => setStartDateStr(e.target.value)}
            style={{ marginLeft: 8 }}
          />
        </label>
        <label>
          Дата окончания:
          <input
            type="date"
            value={endDateStr}
            onChange={(e) => setEndDateStr(e.target.value)}
            style={{ marginLeft: 8 }}
          />
        </label>
      </div>
      <button onClick={() => openInNewTab("page")}>Открыть страницу</button>
      <button onClick={onClick}>Calll</button>
    </div>
  );
}
