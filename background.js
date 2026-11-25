// Records the hostnames each tab contacts. Nothing is sent anywhere.
const key = (tabId) => `tab:${tabId}`;
let queue = Promise.resolve(); // serialises storage updates

function enqueue(fn) {
  queue = queue.then(fn).catch(console.error);
}

chrome.webRequest.onBeforeRequest.addListener(
  ({ tabId, url, type }) => {
    if (tabId < 0) return;
    const { protocol, hostname } = new URL(url);
    if (!/^(https?|wss?):$/.test(protocol)) return;

    enqueue(async () => {
      const k = key(tabId);
      let data = (await chrome.storage.session.get(k))[k];
      // A new top-level navigation starts a fresh list.
      if (type === "main_frame" || !data) {
        data = { page: type === "main_frame" ? hostname : "", hosts: {} };
      }
      data.hosts[hostname] = (data.hosts[hostname] || 0) + 1;
      await chrome.storage.session.set({ [k]: data });
    });
  },
  { urls: ["<all_urls>"] }
);

chrome.tabs.onRemoved.addListener((tabId) => {
  enqueue(() => chrome.storage.session.remove(key(tabId)));
});
