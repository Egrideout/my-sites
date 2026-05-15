const STORAGE_KEY = "tool-hub-links-v2";
const THEME_KEY = "tool-hub-theme";

const seedLinks = [
  {
    id: createId(),
    name: "Remodel Room",
    url: "https://remodel-room.web.app",
    category: "Home",
    note: "Room remodeling and planning site",
  },
  {
    id: createId(),
    name: "10 Finger Music",
    url: "https://10-finger-music.vercel.app/",
    category: "Music",
    note: "Music learning tool",
  },
  {
    id: createId(),
    name: "Piano App",
    url: "https://piano-app-theta.vercel.app/",
    category: "Music",
    note: "Piano practice app",
  },
  {
    id: createId(),
    name: "Metronome",
    url: "https://egrideout.github.io/metronome/",
    category: "Music",
    note: "Simple browser metronome",
  },
  {
    id: createId(),
    name: "STL Coffee Work Spots",
    url: "https://egrideout.github.io/stl-coffee-work-spots/",
    category: "Local",
    note: "Coffee shops for working around St. Louis",
  },
];

let links = loadLinks();
let activeCategory = "All";

const categoryTabs = document.querySelector("#categoryTabs");
const linkGrid = document.querySelector("#linkGrid");
const searchInput = document.querySelector("#searchInput");
const addLinkButton = document.querySelector("#addLinkButton");
const linkDialog = document.querySelector("#linkDialog");
const linkForm = document.querySelector("#linkForm");
const dialogTitle = document.querySelector("#dialogTitle");
const deleteButton = document.querySelector("#deleteButton");
const importInput = document.querySelector("#importInput");

document.querySelector("#dateLine").textContent = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "short",
  day: "numeric",
}).format(new Date());

applyTheme(localStorage.getItem(THEME_KEY) || "light");
render();

searchInput.addEventListener("input", render);
addLinkButton.addEventListener("click", () => openDialog());
document.querySelector("#themeToggle").addEventListener("click", toggleTheme);
document.querySelector("#exportButton").addEventListener("click", exportLinks);
document.querySelector("#resetButton").addEventListener("click", resetLinks);
importInput.addEventListener("change", importLinks);
deleteButton.addEventListener("click", deleteCurrentLink);

linkForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveFromForm();
});

function loadLinks() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(stored) && stored.length) {
      return stored;
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return seedLinks;
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
}

function categories() {
  return ["All", ...Array.from(new Set(links.map((link) => link.category))).sort()];
}

function render() {
  renderSummary();
  renderTabs();
  renderLinks();
}

function renderSummary() {
  document.querySelector("#siteCount").textContent = String(links.length);
  document.querySelector("#platformSummary").textContent = Array.from(new Set(links.map((link) => platformName(link.url)))).join(", ");
}

function renderTabs() {
  categoryTabs.replaceChildren();
  for (const category of categories()) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = category;
    button.setAttribute("aria-selected", String(category === activeCategory));
    button.addEventListener("click", () => {
      activeCategory = category;
      render();
    });
    categoryTabs.append(button);
  }
}

function renderLinks() {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = links.filter((link) => {
    const inCategory = activeCategory === "All" || link.category === activeCategory;
    const searchable = `${link.name} ${link.url} ${link.category} ${link.note}`.toLowerCase();
    return inCategory && searchable.includes(query);
  });

  linkGrid.replaceChildren();

  if (!filtered.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No links match this view.";
    linkGrid.append(empty);
    return;
  }

  const template = document.querySelector("#linkCardTemplate");
  for (const link of filtered) {
    const card = template.content.firstElementChild.cloneNode(true);
    const anchor = card.querySelector("a");
    const siteMark = card.querySelector(".site-mark");
    const kicker = card.querySelector(".card-kicker");
    const title = card.querySelector("strong");
    const note = card.querySelector("small");
    const domain = card.querySelector(".domain");
    const editButton = card.querySelector(".edit-button");
    const platform = platformName(link.url);

    anchor.href = normalizeUrl(link.url);
    card.dataset.category = link.category.toLowerCase();
    siteMark.textContent = initials(link.name);
    kicker.textContent = `${link.category} / ${platform}`;
    title.textContent = link.name;
    note.textContent = link.note || link.url;
    domain.textContent = hostname(link.url);
    editButton.addEventListener("click", () => openDialog(link));
    linkGrid.append(card);
  }
}

function openDialog(link = null) {
  dialogTitle.textContent = link ? "Edit Link" : "Add Link";
  deleteButton.hidden = !link;
  document.querySelector("#linkId").value = link?.id || "";
  document.querySelector("#nameInput").value = link?.name || "";
  document.querySelector("#urlInput").value = link?.url || "";
  document.querySelector("#categoryInput").value = link?.category || (activeCategory === "All" ? "" : activeCategory);
  document.querySelector("#noteInput").value = link?.note || "";
  linkDialog.showModal();
}

function saveFromForm() {
  const id = document.querySelector("#linkId").value || createId();
  const nextLink = {
    id,
    name: document.querySelector("#nameInput").value.trim(),
    url: normalizeUrl(document.querySelector("#urlInput").value.trim()),
    category: document.querySelector("#categoryInput").value.trim(),
    note: document.querySelector("#noteInput").value.trim(),
  };

  links = links.some((link) => link.id === id)
    ? links.map((link) => (link.id === id ? nextLink : link))
    : [nextLink, ...links];

  activeCategory = nextLink.category;
  persist();
  linkDialog.close();
  render();
}

function deleteCurrentLink() {
  const id = document.querySelector("#linkId").value;
  links = links.filter((link) => link.id !== id);
  activeCategory = "All";
  persist();
  linkDialog.close();
  render();
}

function normalizeUrl(value) {
  if (!value) return "";
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function hostname(value) {
  try {
    return new URL(normalizeUrl(value)).hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
}

function platformName(value) {
  const host = hostname(value);
  if (host.includes("vercel.app")) return "Vercel";
  if (host.includes("github.io")) return "GitHub Pages";
  if (host.includes("web.app")) return "Firebase";
  return "Web";
}

function initials(name) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function exportLinks() {
  const data = JSON.stringify(links, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `tool-hub-links-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function importLinks(event) {
  const [file] = event.target.files;
  if (!file) return;
  const text = await file.text();
  const imported = JSON.parse(text);
  if (!Array.isArray(imported)) return;
  links = imported
    .filter((link) => link.name && link.url && link.category)
    .map((link) => ({ id: link.id || createId(), ...link }));
  activeCategory = "All";
  persist();
  render();
  importInput.value = "";
}

function resetLinks() {
  links = seedLinks.map((link) => ({ ...link, id: createId() }));
  activeCategory = "All";
  persist();
  render();
}

function toggleTheme() {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
}

function createId() {
  return `link-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}
