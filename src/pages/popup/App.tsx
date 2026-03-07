import {
  useChromeApi,
  useInjectFetch,
  useInjectFunction,
} from "@/hooks/useChromeApi";
import { useEffectEvent } from "react";

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

export default function App() {
  const { openInNewTab } = useChromeApi();
  const log = useInjectFunction((...args: Parameters<typeof console.log>) => {
    console.log(...args);
  });

  const injectFecth = useInjectFetch();

  const onClick = useEffectEvent(async () => {
    const res = await injectFecth<OperationV3, any>(
      OperationV3_URL,
      {
        cursorPagination: { cursor: null, perPage: 100 },
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
    log("calll", res);
  });

  return (
    <div>
      <h1>HelloWorld1</h1>
      <button onClick={() => openInNewTab("page")}>Открыть страницу</button>
      <button onClick={onClick}>Calll</button>
    </div>
  );
}
