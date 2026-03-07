import {
  useOpenNewTab,
  useInjectFetch,
  useInjectFunction,
} from "@/hooks/useChromeApi";
import { useEffectEvent, useState } from "react";
import type { OperationItem, OperationV3Request, OperationV3Response } from "./types";

const OperationV3_URL =
  "https://finance.ozon.ru/apps/pfm/api/operations/groupOperationsV3";

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
    <div style={popupRootStyle}>
      <div style={cardStyle}>
        <header style={headerStyle}>
          <div>
            <h1 style={titleStyle}>Выписка из Ozon банка</h1>
            <p style={subtitleStyle}>
              Выберите период, и мы откроем новую вкладку с операциями за выбранные даты.
            </p>
          </div>
        </header>

        <div style={fieldsColumnStyle}>
          <label style={fieldStyle}>
            <span style={labelTextStyle}>Дата начала</span>
            <input
              type="date"
              value={startDateStr}
              onChange={(e) => setStartDateStr(e.target.value)}
              style={inputStyle}
            />
          </label>

          <label style={fieldStyle}>
            <span style={labelTextStyle}>Дата окончания</span>
            <input
              type="date"
              value={endDateStr}
              onChange={(e) => setEndDateStr(e.target.value)}
              style={inputStyle}
            />
          </label>
        </div>

        <button type="button" onClick={onClick} style={primaryButtonStyle}>
          Экспортировать операции
        </button>

        <p style={helperTextStyle}>
          В новой вкладке можно будет сохранить данные в CSV и проанализировать операции подробнее.
        </p>
      </div>
    </div>
  );
}

const popupRootStyle: React.CSSProperties = {
  minWidth: 360,
  maxWidth: 420,
  padding: 12,
  background:
    "linear-gradient(135deg, rgba(15,23,42,1) 0%, rgba(30,64,175,1) 45%, rgba(15,23,42,1) 100%)",
  fontFamily:
    "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
  boxSizing: "border-box",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: 16,
  padding: 16,
  boxShadow: "0 18px 40px rgba(15,23,42,0.45)",
  border: "1px solid rgba(148,163,184,0.45)",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 12,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 700,
  color: "#0f172a",
};

const subtitleStyle: React.CSSProperties = {
  margin: "4px 0 0 0",
  fontSize: 12,
  lineHeight: 1.5,
  color: "#64748b",
};

const fieldsColumnStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  marginBottom: 14,
};

const fieldStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const labelTextStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "#0f172a",
};

const inputStyle: React.CSSProperties = {
  padding: "6px 8px",
  borderRadius: 8,
  border: "1px solid #cbd5f5",
  fontSize: 13,
  outline: "none",
  backgroundColor: "#f8fafc",
  color: "#0f172a",
  boxShadow: "0 0 0 1px rgba(148,163,184,0.15)",
};

const primaryButtonStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 2,
  padding: "8px 12px",
  borderRadius: 999,
  border: "none",
  background:
    "linear-gradient(135deg, rgba(37,99,235,1) 0%, rgba(30,64,175,1) 50%, rgba(59,130,246,1) 100%)",
  color: "#ffffff",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  boxShadow: "0 10px 25px rgba(37,99,235,0.55)",
};

const helperTextStyle: React.CSSProperties = {
  marginTop: 10,
  marginBottom: 0,
  fontSize: 11,
  lineHeight: 1.5,
  color: "#94a3b8",
};

