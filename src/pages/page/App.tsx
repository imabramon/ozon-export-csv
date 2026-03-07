import { useMemo, useState } from "react";
import { OperationItem } from "../popup/types";
import { useOnMessage } from "@/hooks/useChromeApi";

const parseUtc0ToDate = (value: string) => {
  // API time is UTC+0; if timezone is missing, treat as UTC by appending "Z".
  const hasTz =
    /z$/i.test(value) || /[+-]\d{2}:\d{2}$/.test(value) || /[+-]\d{4}$/.test(value);
  return new Date(hasTz ? value : `${value}Z`);
};

const formatLocalDateTime = (value: string) => {
  const d = parseUtc0ToDate(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const getItemAmountSigned = (item: OperationItem) => {
  const sign = item.accountAmount.sign === "NEGATIVE" ? -1 : 1;
  return sign * (item.accountAmount.amountAbs.cents / 100);
};

const formatMoney = (value: number, currency?: string) => {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  const formatted = abs.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}${formatted}${currency ? ` ${currency}` : ""}`;
};

export default function App() {
  const [data, setData] = useState<OperationItem[]>([]);

  useOnMessage<OperationItem[]>((items) => setData(items));

  const rows = useMemo(() => {
    return data.map((item) => {
      const total = getItemAmountSigned(item);
      const debit = total < 0 ? -total : 0;
      const credit = total > 0 ? total : 0;

      return {
        key: item.lastOperationId ?? `${item.groupID}-${item.time}`,
        dateLocal: formatLocalDateTime(item.time),
        name: item.merchant?.name || item.cardMerchant?.name || item.counterpartyName || "-",
        purpose: item.purpose || "-",
        category: item.categoryGroupName || "-",
        debit,
        credit,
        total,
        currency: item.accountAmount.amountAbs.currencyName,
      };
    });
  }, [data]);

  const totals = useMemo(() => {
    let debit = 0;
    let credit = 0;
    let total = 0;
    let currency: string | undefined = undefined;

    for (const r of rows) {
      debit += r.debit;
      credit += r.credit;
      total += r.total;
      currency ??= r.currency;
    }

    return { debit, credit, total, currency };
  }, [rows]);

  return (
    <div style={{ padding: 16, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial" }}>
      <h1 style={{ margin: "0 0 12px" }}>Операции</h1>

      {rows.length === 0 ? (
        <div style={{ color: "#666" }}>Нет данных (сначала нажмите «Открыть страницу» в popup).</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              borderCollapse: "collapse",
              width: "100%",
              minWidth: 980,
              background: "#fff",
            }}
          >
            <thead>
              <tr>
                <th style={thStyle}>Дата (локальная)</th>
                <th style={thStyle}>Название</th>
                <th style={thStyle}>Цель</th>
                <th style={thStyle}>Категория</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Дебит</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Кредит</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Итого</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key}>
                  <td style={tdStyle}>{r.dateLocal}</td>
                  <td style={tdStyle}>{r.name}</td>
                  <td style={tdStyle}>{r.purpose}</td>
                  <td style={tdStyle}>{r.category}</td>
                  <td style={{ ...tdStyle, textAlign: "right", whiteSpace: "nowrap" }}>
                    {r.debit ? formatMoney(r.debit, r.currency) : ""}
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right", whiteSpace: "nowrap" }}>
                    {r.credit ? formatMoney(r.credit, r.currency) : ""}
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      textAlign: "right",
                      whiteSpace: "nowrap",
                      color: r.total < 0 ? "#b00020" : "#0a7a0a",
                    }}
                  >
                    {formatMoney(r.total, r.currency)}
                  </td>
                </tr>
              ))}

              <tr>
                <td style={{ ...tdStyle, fontWeight: 700 }} colSpan={4}>
                  Итого
                </td>
                <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, whiteSpace: "nowrap" }}>
                  {formatMoney(totals.debit, totals.currency)}
                </td>
                <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, whiteSpace: "nowrap" }}>
                  {formatMoney(totals.credit, totals.currency)}
                </td>
                <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, whiteSpace: "nowrap" }}>
                  {formatMoney(totals.total, totals.currency)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  borderBottom: "1px solid #ddd",
  padding: "10px 8px",
  textAlign: "left",
  fontSize: 13,
  color: "#222",
  background: "#fafafa",
  position: "sticky",
  top: 0,
  zIndex: 1,
};

const tdStyle: React.CSSProperties = {
  borderBottom: "1px solid #eee",
  padding: "8px 8px",
  fontSize: 13,
  verticalAlign: "top",
};
