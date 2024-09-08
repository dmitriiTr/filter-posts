export const hidePostsBoard = (storageKey) => {
  chrome.storage.sync.get(storageKey).then(({ data }) => {
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

export const hidePosts4Board = (storageKey) => {
  chrome.storage.sync.get(storageKey).then(({ data }) => {
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

export const hidePostsTelegram = (storageKey) => {
  const getReactionNumber = (text) =>
    parseFloat(text) * (text.includes("K") ? 1000 : 1);

  chrome.storage.sync.get(storageKey).then(({ data }) => {
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

      if (
        (data.hideForwarded && isForwared) ||
        reactionsCount < data.postNumber
      ) {
        element.setAttribute("hidden", "");
      } else {
        element.removeAttribute("hidden");
      }
    });
  });
};

export const hideVideosYoutube = (storageKey) => {
  chrome.storage.sync.get(storageKey).then(({ data }) => {
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
