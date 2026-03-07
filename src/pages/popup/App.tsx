import { useChromeApi, useInjectFunction } from "@/hooks/useChromeApi";

export default function App() {
  const { openInNewTab } = useChromeApi();
  const log = useInjectFunction(() => {
    console.log('calll');
  });
  return (
    <div>
      <h1>HelloWorld1</h1>
      <button onClick={() => openInNewTab("page")}>Открыть страницу</button>
      <button onClick={() => log()}>Calll</button>
    </div>
  );
}
