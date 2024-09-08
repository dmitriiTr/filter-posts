/**
 * @typedef {Data}
 * @property {postNumber}
 * @property {forwarded}
 */

import { hidePosts4Board, hidePostsBoard, hidePostsTelegram, hideVideosYoutube } from "./contentScripts.js";

const STORAGE_KEY = "data";

const hidePostsElement = document.getElementById("hidePosts");

hidePostsElement?.addEventListener("click", () => handleClick());

hidePostsElement?.addEventListener("keydown", async (e) => {
  if (e.key === "a") {
    await handleClick();
  }
});

chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
  const tabId = tab?.id;
  if (tabId) {
    chrome.scripting.executeScript({
      target: { tabId },
      func: () =>
        document.styleSheets
          .item(1)
          ?.insertRule("[hidden] { display: none !important; }"),
    });
  }
});

chrome.storage.sync.get(STORAGE_KEY).then(({ data }) => {
  const input = document.querySelector("#postnumber");
  if (input && data) {
    input.value = data.postNumber.toString();
  }
});

const handleClick = async () => {
  const postNumber = document.querySelector("#postnumber");
  const hideForwarded = !!document.querySelector("#hide_forwarded")?.checked;

  const [[tab]] = await Promise.all([
    chrome.tabs.query({ active: true, currentWindow: true }),
    chrome.storage.sync.set({
      [STORAGE_KEY]: {
        postNumber: parseInt(postNumber?.value || "0"),
        hideForwarded,
      },
    }),
  ]);

  const tabId = tab?.id;

  if (tabId) {
    const url = (tab.url || "").split("/").at(2);
    const method = urlToMethod[url] || hidePostsBoard;

    chrome.scripting.executeScript({
      target: { tabId },
      func: method,
      args: [STORAGE_KEY],
    });
  }
};

const urlToMethod = {
  "web.telegram.org": hidePostsTelegram,
  "www.youtube.com": hideVideosYoutube,
  "zip.4channel.org": hidePosts4Board,
};
