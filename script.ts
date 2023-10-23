type Data = {
  data: {
    postNumber: number
    forwarded: boolean
  }
};

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
      target: { tabId }, func: () => document.styleSheets.item(1)?.
        insertRule('[hidden] { display: none !important; }')
    });
  }
});

chrome.storage.sync.get('data').then(({ data }: Data) => {
  const input = document.querySelector<HTMLInputElement>('#postnumber');
  if (input) {
    input.value = data.postNumber.toString();
  }
});

const handleEvent = async () => {
  const postNumber = document.querySelector<HTMLInputElement>('#postnumber');
  const forwarded =
    !!document.querySelector<HTMLInputElement>('#hide_forwarded')?.checked;
  chrome.storage.sync.set({
    postNumber: parseInt(postNumber?.value || '0'), forwarded
  });
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
  chrome.storage.sync.get('data').then(({ data }: Data) => {
    document.querySelectorAll('div.post').forEach(element => {

      const repliesSection = element.getElementsByClassName('post__refmap')[0];
      const replies = repliesSection?.getElementsByClassName('post-reply-link');
      const hiddenClass = 'post_type_hidden';

      if (data.postNumber <= (replies?.length || 0)) {
        element.classList.remove(hiddenClass);
      } else {
        element.classList.add(hiddenClass);
      }
    });
  });
};

const hidePosts4Board = () => {
  chrome.storage.sync.get('data').then(({ data }: Data) => {
    document.querySelectorAll('div.postContainer').forEach(element => {

      const repliesSection = element.getElementsByClassName('backlink')[0];
      const replies = repliesSection?.getElementsByClassName('quotelink');
      const hiddenClass = 'post-hidden';

      if (data.postNumber <= (replies?.length || 0)) {
        element.classList.remove(hiddenClass);
      } else {
        element.classList.add(hiddenClass);
      }
    });
  });
};

const hidePostsTelegram = () => {
  chrome.storage.sync.get('data').then(({ data }: Data) => {
    document.querySelectorAll('div.channel-post').forEach(element => {
      const isForwared = !!element.getElementsByClassName('peer-title').length;
      const getReactionNumber = (text: string) => parseFloat(text) *
        (text.includes('K') ? 1000 : 1);

      const reactionsAll = element.getElementsByClassName('reaction-counter');
      const count = Array.prototype.reduce.call(reactionsAll,
        (sum: number, reaction: Element) =>
          sum += getReactionNumber(reaction.textContent || '0'),
        0
      );

      if ((data.forwarded && isForwared) || count < data.postNumber) {
        element.setAttribute('hidden', '');
      } else {
        element.removeAttribute('hidden');
      }
    });
  });
};

const hideVideosYoutube = () => {
  chrome.storage.sync.get('data').then(({ data }: Data) => {
    document.querySelectorAll('div.ytd-rich-item-renderer').forEach(element => {
      const viewCountData =
        element.querySelectorAll('span.ytd-video-meta-block')[0]?.
          textContent?.split('\xa0');

      if (viewCountData) {
        const viewNumber = parseInt(viewCountData[0] || '0');
        const order = viewCountData[1]?.includes('.')
          ? 10 ** 3 : viewCountData[1]?.includes(' ')
            ? 10 ** 6 : 1; // looking for thousands and millions
        if (viewNumber * order < data.postNumber) {
          element.setAttribute('hidden', '');
        } else {
          element.removeAttribute('hidden');
        }
      }
    });
  });
};