import { useEffectEvent, useLayoutEffect, useState } from "react";

export const useOpenNewTab = () => {
  const openInNewTab = useEffectEvent((pageName: string, data?: any) => {
    const url = chrome.runtime.getURL(`src/pages/${pageName}/index.html`);
    chrome.tabs.create({ url, active: false }, (tab) => {
      if (tab.id === undefined || data === undefined) return;

      setTimeout(() => {
        chrome.tabs.sendMessage(tab.id!, data, () => {
          chrome.tabs.update(tab.id, { active: true });
        });
      }, 500);
    });
  });

  return openInNewTab;
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

export const useOnMessage = <T>(callback: (message: T) => void) => {
  const fn = useEffectEvent(callback);

  useLayoutEffect(() => {
    const onMessage: (
      message: any,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void,
    ) => void = (message, _, sendResponse) => {
      fn(message);
      sendResponse("OK");
    };

    chrome.runtime.onMessage.addListener(onMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(onMessage);
    };
  }, []);
};

export const useGetActiveTab = () => {
  const getActiveTab = useEffectEvent(() => {
    return new Promise<chrome.tabs.Tab>((res) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        res(tabs[0]);
      });
    });
  });

  return getActiveTab;
};

export const useActiveTab = (fn: (currentTab: chrome.tabs.Tab) => void) => {
  const [isLoading, setIsLoading] = useState(true);
  const getActiveTab = useGetActiveTab();

  useLayoutEffect(() => {
    getActiveTab().then((tab) => {
      fn(tab);
      setIsLoading(false);
    });
  }, []);

  return isLoading;
};

export const useLog = () => {
  const log = useInjectFunction((...args: Parameters<typeof console.log>) => {
    console.log(...args);
  });

  return log;
};
