import { useChromeApi } from "@/hooks/useChromeApi";

export default function App() {
  const { openInNewTab } = useChromeApi();
  return (
    <div>
      <h1>HelloWorld1</h1>
      <button onClick={() => openInNewTab("page")}>Открыть страницу</button>
    </div>
  );
}
