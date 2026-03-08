import { FC } from "react";
import { createFetchOperationByDates } from "@/utils/createFetchOperationByDates";
import OperationsPage from "./OperationPage";

import "./App.css";

export const App: FC = () => {
  return (
    <OperationsPage
      title="Выписка из Ozon банка"
      subtitle="Выберите период, и мы откроем новую вкладку с операциями за выбранные даты."
      createFetchOperation={createFetchOperationByDates}
    />
  );
};