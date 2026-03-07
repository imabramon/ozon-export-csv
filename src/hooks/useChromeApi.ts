import { useEffectEvent } from "react";

export const useChromeApi = () => {
  const openInNewTab = useEffectEvent((pageName: string) => {
    const url = chrome.runtime.getURL(`src/pages/${pageName}/index.html`);
    chrome.tabs.create({ url });
  });

  return { openInNewTab };
};

export const useInjectFunction = <F extends (...args: any[]) => any>(
  func: F,
) => {
  return (...args: Parameters<F>): Promise<ReturnType<F> | undefined> => {
    return new Promise<ReturnType<F> | undefined>((res, rej) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (!tab?.id) {
          rej(new Error("No active tab"));
          return;
        }

        chrome.scripting
          .executeScript({
            target: { tabId: tab.id },
            func,
            args,
          })
          .then(
            (results) => {
              const result = results[0]?.result as ReturnType<F> | undefined;
              res(result);
            },
            rej,
          );
      });
    });
  };
};
