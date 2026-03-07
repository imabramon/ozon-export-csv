import { useEffectEvent } from "react";

export const useChromeApi = () => {
  const openInNewTab = useEffectEvent((pageName: string) => {
    const url = chrome.runtime.getURL(`src/pages/${pageName}/index.html`)
    chrome.tabs.create({ url })
  });

  return {openInNewTab}
};
