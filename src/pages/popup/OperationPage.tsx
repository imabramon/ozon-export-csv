import {
  useOpenNewTab,
  useInjectFetch,
  useInjectFunction,
} from "@/hooks/useChromeApi";
import { useEffectEvent, useState } from "react";
import type { Transaction } from "../types";

import "./OperationPage.css";

type InjectFetchFn = ReturnType<typeof useInjectFetch>;
type LogFn = (...args: Parameters<typeof console.log>) => void;

interface OperationPageProps {
  title: string;
  subtitle: string;
  createFetchOperation: (
    injectFecth: InjectFetchFn,
    log: LogFn,
  ) => (startDate: Date, endDate: Date) => Promise<Transaction[]>;
}

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const MONTH_NAMES = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

export default function OperationsPage({
  title,
  subtitle,
  createFetchOperation,
}: OperationPageProps) {
  const openInNewTab = useOpenNewTab();
  const log = useInjectFunction((...args: Parameters<typeof console.log>) => {
    console.log(...args);
  });

  const injectFecth = useInjectFetch();

  const now = new Date();
  const [viewYear, setViewYear] = useState(() => now.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => now.getMonth());

  const [startDateStr, setStartDateStr] = useState(() => {
    const d = new Date();
    return toYMD(new Date(d.getFullYear(), d.getMonth(), 1));
  });
  const [endDateStr, setEndDateStr] = useState(() => toYMD(new Date()));

  const todayStr = toYMD(new Date());

  const setMonthFromView = (year: number, month: number) => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const today = new Date();
    const isCurrentMonth =
      year === today.getFullYear() && month === today.getMonth();
    setStartDateStr(toYMD(first));
    setEndDateStr(toYMD(isCurrentMonth && last > today ? today : last));
  };

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      const newYear = viewYear - 1;
      setViewMonth(11);
      setViewYear(newYear);
      setMonthFromView(newYear, 11);
    } else {
      const newMonth = viewMonth - 1;
      setViewMonth(newMonth);
      setMonthFromView(viewYear, newMonth);
    }
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      const newYear = viewYear + 1;
      setViewMonth(0);
      setViewYear(newYear);
      setMonthFromView(newYear, 0);
    } else {
      const newMonth = viewMonth + 1;
      setViewMonth(newMonth);
      setMonthFromView(viewYear, newMonth);
    }
  };

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  const isExportDisabled =
    endDateStr > todayStr || startDateStr > endDateStr;

  const isNextMonthDisabled =
    viewYear > now.getFullYear() ||
    (viewYear === now.getFullYear() && viewMonth >= now.getMonth());

  const fetchOperationByDates = useEffectEvent(
    createFetchOperation(injectFecth, log),
  );

  const onClick = useEffectEvent(async () => {
    const items = await fetchOperationByDates(startDate, endDate);
    openInNewTab("page", items);
  });

  return (
    <div className="operationsPage">
      <div className="operationsPage__card">
        <header className="operationsPage__header">
          <div>
            <h1 className="operationsPage__title">{title}</h1>
            <p className="operationsPage__subtitle">{subtitle}</p>
          </div>
        </header>

        <div className="operationsPage__monthSwitch">
          <button
            type="button"
            onClick={goPrevMonth}
            className="operationsPage__monthSwitchArrow"
            aria-label="Предыдущий месяц"
          >
            ‹
          </button>
          <span className="operationsPage__monthSwitchLabel">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button
            type="button"
            onClick={goNextMonth}
            disabled={isNextMonthDisabled}
            className="operationsPage__monthSwitchArrow"
            aria-label="Следующий месяц"
          >
            ›
          </button>
        </div>

        <div className="operationsPage__fields">
          <label className="operationsPage__field">
            <span className="operationsPage__label">Дата начала</span>
            <input
              type="date"
              value={startDateStr}
              onChange={(e) => setStartDateStr(e.target.value)}
              className="operationsPage__input"
            />
          </label>

          <label className="operationsPage__field">
            <span className="operationsPage__label">Дата окончания</span>
            <input
              type="date"
              value={endDateStr}
              min={startDateStr}
              max={todayStr}
              onChange={(e) => setEndDateStr(e.target.value)}
              className="operationsPage__input"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={onClick}
          disabled={isExportDisabled}
          className="operationsPage__button"
        >
          Экспортировать операции
        </button>

        <p className="operationsPage__helper">
          В новой вкладке можно будет сохранить данные в CSV и проанализировать
          операции подробнее.
        </p>
      </div>
    </div>
  );
}
