/**
 * @typedef {Data}
 * @property {postNumber}
 * @property {forwarded}
 */

const hidePostsElement = document.getElementById("hidePosts");

hidePostsElement?.addEventListener("click", async () => await handleEvent());

hidePostsElement?.addEventListener("keydown", async (e) => {
  if (e.key === "a") {
    await handleEvent();
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

chrome.storage.sync.get("data").then(({ data }) => {
  const input = document.querySelector("#postnumber");
  if (input && data) {
    input.value = data.postNumber.toString();
  }
});

const handleEvent = async () => {
  const postNumber = document.querySelector("#postnumber");
  const forwarded = !!document.querySelector("#hide_forwarded")?.checked;

  await chrome.storage.sync.set({
    data: {
      postNumber: parseInt(postNumber?.value || "0"),
      forwarded,
    },
  });
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const tabId = tab?.id;

  if (tabId) {
    const url = tab.url || "";
    const method = url.includes("web.telegram.org")
      ? hidePostsTelegram
      : url.includes("youtube")
      ? hideVideosYoutube
      : url.includes("4channel")
      ? hidePosts4Board
      : hidePostsBoard;

    console.log(parseInt(postNumber?.value || "0"), forwarded);

    chrome.scripting.executeScript({ target: { tabId }, func: method });
  }
};

const hidePostsBoard = () => {
  chrome.storage.sync.get("data").then(({ data }) => {
    document.querySelectorAll("div.post").forEach((element) => {
      const repliesSection = element.getElementsByClassName("post__refmap")[0];
      const replies = repliesSection?.getElementsByClassName("post-reply-link");
      const hiddenClass = "post_type_hidden";

      if (data.postNumber <= (replies?.length || 0)) {
        element.classList.remove(hiddenClass);
      } else {
        element.classList.add(hiddenClass);
      }
    });
  });
};

const hidePosts4Board = () => {
  chrome.storage.sync.get("data").then(({ data }) => {
    document.querySelectorAll("div.postContainer").forEach((element) => {
      const repliesSection = element.getElementsByClassName("backlink")[0];
      const replies = repliesSection?.getElementsByClassName("quotelink");
      const hiddenClass = "post-hidden";

      if (data.postNumber <= (replies?.length || 0)) {
        element.classList.remove(hiddenClass);
      } else {
        element.classList.add(hiddenClass);
      }
    });
  });
};

const hidePostsTelegram = () => {
  chrome.storage.sync.get("data").then(({ data }) => {
    document.querySelectorAll("div.Message").forEach((element) => {
      const isForwared = !!element.getElementsByClassName("peer-title").length;
      const getReactionNumber = (text) =>
        parseFloat(text) * (text.includes("K") ? 1000 : 1);

      const reactionsAll = element.querySelectorAll("button");
      console.log(reactionsAll[0]);
      const count = Array.prototype.reduce.call(
        reactionsAll,
        (sum, reaction) =>
          (sum += getReactionNumber(reaction.textContent || "0")),
        0
      );

      console.log(reactionsAll[0], count);

      if ((data.forwarded && isForwared) || count < data.postNumber) {
        element.setAttribute("hidden", "");
      } else {
        element.removeAttribute("hidden");
      }
    });
  });
};

const hideVideosYoutube = () => {
  chrome.storage.sync.get("data").then(({ data }) => {
    document
      .querySelectorAll("div.ytd-rich-item-renderer")
      .forEach((element) => {
        const viewCountData = element
          .querySelectorAll("span.ytd-video-meta-block")[0]
          ?.textContent?.split("\xa0");

        if (viewCountData) {
          const viewNumber = parseInt(viewCountData[0] || "0");
          const order = viewCountData[1]?.includes(".")
            ? 10 ** 3
            : viewCountData[1]?.includes(" ")
            ? 10 ** 6
            : 1; // looking for thousands and millions
          if (viewNumber * order < data.postNumber) {
            element.setAttribute("hidden", "");
          } else {
            element.removeAttribute("hidden");
          }
        }
      });
  });
};
