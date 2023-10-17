const hidePostsElement = document.getElementById('hidePosts');

hidePostsElement?.addEventListener('click', async () => await handleEvent());

hidePostsElement?.addEventListener('keydown', async e => {
  if (e.key === 'a') {
    await handleEvent();
  }
});

chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
  const tabId = tab?.id;
  if (tabId) {
    chrome.scripting.executeScript({
      target: { tabId }, func: () => document.styleSheets.item(0)?.
        insertRule('[hidden] { display: none !important; }')
    });
  }
});

const handleEvent = async () => {
  const postNumber = document.querySelector<HTMLInputElement>('#postnumber');
  chrome.storage.sync.set({ postNumber: parseInt(postNumber?.value || '0') });
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const tabId = tab?.id;

  if (tabId) {
    const url = tab.url || '';
    const method = url.includes('web.telegram.org')
      ? hidePostsTelegram : url.includes('youtube')
        ? hideVideosYoutube : url.includes('4channel')
          ? hidePosts4Board : hidePostsBoard;

    chrome.scripting.executeScript({ target: { tabId }, func: method, });
  }
};

const hidePostsBoard = () => {
  chrome.storage.sync.get('postNumber').then(({ postNumber }) => {
    document.querySelectorAll('div.post').forEach(element => {

      const repliesSection = element.getElementsByClassName('post__refmap')[0];
      const replies = repliesSection?.getElementsByClassName('post-reply-link');
      const hiddenClass = 'post_type_hidden';

      if (postNumber <= (replies?.length || 0)) {
        element.classList.remove(hiddenClass);
      } else {
        element.classList.add(hiddenClass);
      }
    });
  });
};

const hidePosts4Board = () => {
  chrome.storage.sync.get('postNumber').then(({ postNumber }) => {
    document.querySelectorAll('div.postContainer').forEach(element => {

      const repliesSection = element.getElementsByClassName('backlink')[0];
      const replies = repliesSection?.getElementsByClassName('quotelink');
      const hiddenClass = 'post-hidden';

      if (postNumber <= (replies?.length || 0)) {
        element.classList.remove(hiddenClass);
      } else {
        element.classList.add(hiddenClass);
      }
    });
  });
};

const hidePostsTelegram = () => {
  chrome.storage.sync.get('postNumber').then(({ postNumber }) => {
    document.querySelectorAll('div.channel-post').forEach(element => {
      const getReactionNumber = (text: string) => parseFloat(text) *
        (text.includes('K') ? 1000 : 1);

      const reactionsAll = element.getElementsByClassName('reaction-counter');
      const count = Array.prototype.reduce.call(reactionsAll,
        (sum: number, reaction: Element) =>
          sum += getReactionNumber(reaction.textContent || '0'),
        0
      );

      if (count < postNumber) {
        element.setAttribute('hidden', '');
      } else {
        element.removeAttribute('hidden');
      }
    });
  });
};

const hideVideosYoutube = () => {
  chrome.storage.sync.get('postNumber').then(({ postNumber }) => {
    document.querySelectorAll('div.ytd-rich-item-renderer').forEach(element => {
      const viewCountData =
        element.querySelectorAll('span.ytd-video-meta-block')[0]?.
          textContent?.split('\xa0');

      if (viewCountData) {
        const viewNumber = parseInt(viewCountData[0] || '0');
        const order = viewCountData[1]?.includes('.')
          ? 10 ** 3 : viewCountData[1]?.includes(' ')
            ? 10 ** 6 : 1; // looking for thousands and millions
        if (viewNumber * order < postNumber) {
          element.setAttribute('hidden', '');
        } else {
          element.removeAttribute('hidden');
        }
      }
    });
  });
};