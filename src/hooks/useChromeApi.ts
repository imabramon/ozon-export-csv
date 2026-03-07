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
          .then((results) => {
            const result = results[0]?.result as ReturnType<F> | undefined;
            res(result);
          }, rej);
      });
    });
  };
};

type InjectFetchOptions = Omit<RequestInit, "headers" | "body" | "credentials">;

const injectFetch = async <B extends object, R extends any>(
  url: string,
  body: B,
  options?: InjectFetchOptions,
) => {
  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("Accept", "application/json");
  const response = await fetch(url, {
    ...(options ?? {}),
    headers,
    body: JSON.stringify(body),
    credentials: "include",
  });
  if (response.status !== 200) {
    throw new Error("Запрос не успешен");
  }

  return response.json() as R;
};

export const useInjectFetch = () => {
  return useInjectFunction(injectFetch) as <B extends object, R extends any>(
    url: string,
    body: B,
    options?: InjectFetchOptions, 
  ) => R;
};
