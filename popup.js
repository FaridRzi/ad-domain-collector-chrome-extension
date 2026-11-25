const LIST_URL = "https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const $ = (id) => document.getElementById(id);
const selected = new Set();
const seen = new Set();

async function loadBlocklist(force = false) {
  const { list, fetched } = await chrome.storage.local.get(["list", "fetched"]);
  if (!force && list && Date.now() - fetched < MAX_AGE_MS) return new Set(list);
  try {
    const res = await fetch(LIST_URL, { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const domains = [];
    for (const line of (await res.text()).split("\n")) {
      const m = line.match(/^0\.0\.0\.0\s+([^\s#]+)/);
      if (m && m[1] !== "0.0.0.0") domains.push(m[1].toLowerCase());
    }
    if (!domains.length) throw new Error("empty list");
    await chrome.storage.local.set({ list: domains, fetched: Date.now() });
    return new Set(domains);
  } catch (err) {
    $("status").textContent = `Blocklist download failed (${err.message}).`;
    return new Set(list || []);
  }
}

function updateOutput() {
  $("output").value = [...selected].sort().join(" ");
}

function render(listId, entries, checkedByDefault) {
  $(listId).replaceChildren(...entries.map(([host, count]) => {
    if (!seen.has(host)) {
      seen.add(host);
      if (checkedByDefault) selected.add(host);
    }
    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = selected.has(host);
    box.onchange = () => {
      box.checked ? selected.add(host) : selected.delete(host);
      updateOutput();
    };
    const num = document.createElement("small");
    num.textContent = `×${count}`;
    const label = document.createElement("label");
    label.append(box, host, num);
    const li = document.createElement("li");
    li.append(label);
    return li;
  }));
  $(`${listId}Count`).textContent = entries.length;
}

// Rough "same site" test: compares the last two labels of each hostname.
const site = (host) => host.split(".").slice(-2).join(".");

async function show(force) {
  const blocklist = await loadBlocklist(force);
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const k = `tab:${tab.id}`;
  const data = (await chrome.storage.session.get(k))[k];
  if (!data) {
    $("status").textContent = "Nothing captured yet. Reload the page, wait, then reopen this.";
    return;
  }
  const entries = Object.entries(data.hosts).sort(([a], [b]) => a.localeCompare(b));
  const known = entries.filter(([h]) => blocklist.has(h));
  const other = entries.filter(([h]) => !blocklist.has(h) && (!data.page || site(h) !== site(data.page)));
  render("known", known, true);
  render("other", other, false);
  updateOutput();
  if (blocklist.size) {
    $("status").textContent = `${data.page || "This tab"}: ${entries.length} domains contacted.`;
  }
}

$("copy").onclick = async () => {
  await navigator.clipboard.writeText($("output").value);
  $("copy").textContent = `Copied ${selected.size}`;
};
$("refresh").onclick = () => show(true);
show(false);
