import { useEffect, useMemo, useRef, useState } from "react";
import { Transaction } from "../types";
import { useOnMessage } from "@/hooks/useChromeApi";
import "./App.css";

function initSelectedAll(length: number) {
  return new Set<number>(Array.from({ length }, (_, i) => i));
}

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
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const selectAllRef = useRef<HTMLInputElement>(null);

  useOnMessage<Transaction[]>((items) => {
    setData(items);
    setSelectedIndices(initSelectedAll(items.length));
  });

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

  const selectedRows = useMemo(
    () => rows.filter((_, i) => selectedIndices.has(i)),
    [rows, selectedIndices],
  );

  const totals = useMemo(() => {
    let debit = 0;
    let credit = 0;
    let total = 0;
    let currency: string | undefined = undefined;

    for (const r of selectedRows) {
      debit += r.debit;
      credit += r.credit;
      total += r.total;
      currency ??= "RUB";
    }

    return { debit, credit, total, currency };
  }, [selectedRows]);

  const toggleRow = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const allSelected = rows.length > 0 && selectedIndices.size === rows.length;
  const someSelected = selectedIndices.size > 0;

  useEffect(() => {
    const el = selectAllRef.current;
    if (el) el.indeterminate = someSelected && !allSelected;
  }, [allSelected, someSelected]);

  const toggleAll = () => {
    if (allSelected) setSelectedIndices(new Set());
    else setSelectedIndices(initSelectedAll(rows.length));
  };

  const handleExportCsv = () => {
    if (selectedRows.length === 0) return;

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
      ...selectedRows.map((r) =>
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
    <div className="exportPage">
      <div className="exportPage__card">
        <header className="exportPage__header">
          <h1 className="exportPage__title">Операции</h1>
          <button
            type="button"
            className="exportPage__button"
            onClick={handleExportCsv}
            disabled={selectedRows.length === 0}
          >
            Сохранить в CSV
          </button>
        </header>

        {rows.length === 0 ? (
          <p className="exportPage__empty">
            Нет данных (сначала нажмите «Открыть страницу» в popup).
          </p>
        ) : (
          <div className="exportPage__tableWrap">
            <table className="exportPage__table">
              <thead>
                <tr>
                  <th className="exportPage__cellCheckbox">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      aria-label="Выбрать все"
                    />
                  </th>
                  <th>Дата (локальная)</th>
                  <th>Название</th>
                  <th>Цель</th>
                  <th>Категория</th>
                  <th className="exportPage__cellRight">Дебит</th>
                  <th className="exportPage__cellRight">Кредит</th>
                  <th className="exportPage__cellRight">Итого</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={`${i}-${r.key}`}
                    className={selectedIndices.has(i) ? undefined : "exportPage__row_unselected"}
                  >
                    <td className="exportPage__cellCheckbox">
                      <input
                        type="checkbox"
                        checked={selectedIndices.has(i)}
                        onChange={() => toggleRow(i)}
                        aria-label={`Строка ${i + 1}`}
                      />
                    </td>
                    <td>{r.dateLocal}</td>
                    <td>{r.name}</td>
                    <td>{r.purpose}</td>
                    <td>{r.category}</td>
                    <td className="exportPage__cellRight">{r.debit}</td>
                    <td className="exportPage__cellRight">{r.credit}</td>
                    <td
                      className={`exportPage__totalCell ${r.total < 0 ? "exportPage__totalCell_negative" : "exportPage__totalCell_positive"}`}
                    >
                      {r.total}
                    </td>
                  </tr>
                ))}

                <tr className="exportPage__totalsRow">
                  <td colSpan={5}>Итого (выбрано: {selectedRows.length})</td>
                  <td className="exportPage__cellRight">{totals.debit}</td>
                  <td className="exportPage__cellRight">{totals.credit}</td>
                  <td className="exportPage__cellRight">{totals.total}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

