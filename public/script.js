/**
 * @typedef {Data}
 * @property {postNumber}
 * @property {forwarded}
 */

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

chrome.storage.sync.get("data").then(({ data }) => {
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
      data: {
        postNumber: parseInt(postNumber?.value || "0"),
        hideForwarded,
      },
    }),
  ]);

  const tabId = tab?.id;

  if (tabId) {
    const url = (tab.url || "").split("/").at(2);
    const method = urlToMethod[url] || hidePostsBoard;

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
  const getReactionNumber = (text) =>
    parseFloat(text) * (text.includes("K") ? 1000 : 1);

  chrome.storage.sync.get("data").then(({ data }) => {
    document.querySelectorAll("div.Message").forEach((element) => {
      const isForwared =
        !!element.getElementsByClassName("is-forwarded").length;

      const reactionsElements = element.querySelectorAll("button");
      const reactionsCount = Array.prototype.reduce.call(
        reactionsElements,
        (sum, reaction) =>
          (sum += getReactionNumber(reaction.textContent || "0")),
        0
      );

      if ((data.hideForwarded && isForwared) || reactionsCount < data.postNumber) {
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

const urlToMethod = {
  "web.telegram.org": hidePostsTelegram,
  "youtube.com": hideVideosYoutube,
  "zip.4channel.org": hidePosts4Board,
};
