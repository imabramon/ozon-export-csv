import { useMemo, useState } from "react";
import { Transaction } from "../types";
import { useOnMessage } from "@/hooks/useChromeApi";
import "./App.css";

const parseUtc0ToDate = (value: string) => {
  // API time is UTC+0; if timezone is missing, treat as UTC by appending "Z".
  const hasTz =
    /z$/i.test(value) ||
    /[+-]\d{2}:\d{2}$/.test(value) ||
    /[+-]\d{4}$/.test(value);
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

const escapeCsvCell = (value: unknown) => {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[;"\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

export default function App() {
  const [data, setData] = useState<Transaction[]>([]);

  useOnMessage<Transaction[]>((items) => setData(items));

  const rows = useMemo(() => {
    return data.map((item) => {
      return {
        key: item.time,
        dateLocal: formatLocalDateTime(item.time),
        name: item.name,
        purpose: item.purpose,
        category: item.category,
        debit: item.debit,
        credit: item.credit,
        total: item.amount,
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
      currency ??= "RUB";
    }

    return { debit, credit, total, currency };
  }, [rows]);

  const handleExportCsv = () => {
    if (rows.length === 0) return;

    const header = [
      "Дата (локальная)",
      "Название",
      "Цель",
      "Категория",
      "Дебит",
      "Кредит",
      "Итого",
    ];

    const lines = [
      header.join(";"),
      ...rows.map((r) =>
        [
          r.dateLocal,
          r.name,
          r.purpose,
          r.category,
          r.debit ? r.debit.toFixed(2) : "",
          r.credit ? r.credit.toFixed(2) : "",
          r.total.toFixed(2),
        ]
          .map(escapeCsvCell)
          .join(";"),
      ),
    ];

    const blob = new Blob([lines.join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "operations.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page">
      <div className="header">
        <h1 className="pageTitle">Операции</h1>
        <button
          type="button"
          className="btnExport"
          onClick={handleExportCsv}
          disabled={rows.length === 0}
        >
          Сохранить в CSV
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="emptyMessage">
          Нет данных (сначала нажмите «Открыть страницу» в popup).
        </div>
      ) : (
        <div className="tableWrap">
          <table className="operationsTable">
            <thead>
              <tr>
                <th>Дата (локальная)</th>
                <th>Название</th>
                <th>Цель</th>
                <th>Категория</th>
                <th className="textRight">Дебит</th>
                <th className="textRight">Кредит</th>
                <th className="textRight">Итого</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key}>
                  <td>{r.dateLocal}</td>
                  <td>{r.name}</td>
                  <td>{r.purpose}</td>
                  <td>{r.category}</td>
                  <td className="textRight">{r.debit}</td>
                  <td className="textRight">{r.credit}</td>
                  <td
                    className={`totalCell ${r.total < 0 ? "negative" : "positive"}`}
                  >
                    {r.total}
                  </td>
                </tr>
              ))}

              <tr className="totalsRow">
                <td colSpan={4}>Итого</td>
                <td className="textRight">{totals.debit}</td>
                <td className="textRight">{totals.credit}</td>
                <td className="textRight">{totals.total}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

