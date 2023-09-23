const hidePostsElement = document.getElementById('hidePosts');

hidePostsElement?.addEventListener('click', async () => {
  const postNumber = document.querySelector<HTMLInputElement>('#postnumber');
  chrome.storage.sync.set({ postNumber: postNumber?.value || 1 });
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const tabId = tab?.id;

  if (tabId) {
    chrome.scripting.executeScript({
      target: { tabId },
      func: hidePosts,
    });
  }
});

const hidePosts = () => {
  chrome.storage.sync.get('postNumber').then(({ postNumber }) => {
    document.querySelectorAll('div.post').forEach(element => {
      const childNodes = element.childNodes;

      if (childNodes.length > 0) {
        const replies = element.getElementsByClassName('post__refmap')[0];
        const filterValue = Math.floor(parseInt(postNumber) * 2);
        const hiddenClass = 'post_type_hidden';

        if (replies && filterValue > replies.childNodes.length) {
          element.classList.add(hiddenClass);
        } else {
          element.classList.remove(hiddenClass);
        }
      }
    });
  });
};