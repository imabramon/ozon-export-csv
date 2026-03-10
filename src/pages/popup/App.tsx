import { FC, useState } from "react";
import { createFetchOperationByDates } from "@/utils/createFetchOperationByDates";
import OperationsPage from "./OperationPage";
import Loading from "./Loading";
import WelcomePage from "./WelcomePage";

import "./App.css";
import { useActiveTab, useLog } from "@/hooks/useChromeApi";

const OZON_URL = "https://finance.ozon.ru/lk";

export const App: FC = () => {
  const [url, setUrl] = useState("");
  const isLoading = useActiveTab((tab) => {
    setUrl(tab.url ?? "");
  });

  if (isLoading) return <Loading />;

  if (!url.startsWith(OZON_URL)) return <WelcomePage url={OZON_URL} />;

  return (
    <OperationsPage
      title="Выписка из Ozon банка"
      subtitle="Выберите период, и мы откроем новую вкладку с операциями за выбранные даты."
      createFetchOperation={createFetchOperationByDates}
    />
  );
};
