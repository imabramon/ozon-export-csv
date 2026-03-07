import {
  useOpenNewTab,
  useInjectFetch,
  useInjectFunction,
} from "@/hooks/useChromeApi";
import { useEffectEvent, useState } from "react";
import type {
  FetchCursorResult,
  OperationItem,
  OperationV3Request,
  OperationV3Response,
} from "./types";

const OperationV3_URL =
  "https://finance.ozon.ru/apps/pfm/api/operations/groupOperationsV3";

const getItemAmount = (item: OperationItem) => {
  const sign = item.accountAmount.sign === "NEGATIVE" ? -1 : 1;
  return sign * (item.accountAmount.amountAbs.cents / 100);
};

export default function App() {
  const openInNewTab = useOpenNewTab();
  const log = useInjectFunction((...args: Parameters<typeof console.log>) => {
    console.log(...args);
  });

  const injectFecth = useInjectFetch();

  const [startDateStr, setStartDateStr] = useState("2026-02-28");
  const [endDateStr, setEndDateStr] = useState("2026-02-28");

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  const fetchOperationsByCursor = useEffectEvent(
    async (cursor: string | null = null): Promise<FetchCursorResult> => {
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
    openInNewTab("page", items);
  });

  return (
    <div>
      <h1>Выписка из Ozon банка</h1>
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
      <button onClick={onClick}>Экспортировать</button>
    </div>
  );
}
