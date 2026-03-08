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

  const [startDateStr, setStartDateStr] = useState("2026-02-28");
  const [endDateStr, setEndDateStr] = useState("2026-02-28");

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

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
              onChange={(e) => setEndDateStr(e.target.value)}
              className="operationsPage__input"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={onClick}
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
