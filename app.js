const authView = document.getElementById("authView");
const clientView = document.getElementById("clientView");

const registerForm = document.getElementById("registerForm");
const nameInput = document.getElementById("nameInput");
const phoneInput = document.getElementById("phoneInput");
const emailInput = document.getElementById("emailInput");

const profileName = document.getElementById("profileName");
const profilePhone = document.getElementById("profilePhone");
const logoutBtn = document.getElementById("logoutBtn");
const themeToggleBtn = document.getElementById("themeToggleBtn");

const addContactForm = document.getElementById("addContactForm");
const contactNameInput = document.getElementById("contactNameInput");
const contactCodeInput = document.getElementById("contactCodeInput");
const addContactStatus = document.getElementById("addContactStatus");

const myInviteCode = document.getElementById("myInviteCode");
const copyInviteBtn = document.getElementById("copyInviteBtn");
const genInviteLinkBtn = document.getElementById("genInviteLinkBtn");
const inviteLinkStatus = document.getElementById("inviteLinkStatus");

const contactSearchInput = document.getElementById("contactSearchInput");
const contactsList = document.getElementById("contactsList");

const chatTitle = document.getElementById("chatTitle");
const chatSubtitle = document.getElementById("chatSubtitle");
const msgSearchInput = document.getElementById("msgSearchInput");
const chatMessages = document.getElementById("chatMessages");
const chatSkeleton = document.getElementById("chatSkeleton");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");

const STORAGE_USER = "strel_user_v22";
const STORAGE_STATE = "strel_state_v22";
const STORAGE_THEME = "strel_theme_v22";

const MOCK_DIRECTORY = [
  { code: "STR-1001", name: "Алексей", phone: "+79991112233" },
  { code: "STR-1002", name: "Марина", phone: "+79992223344" },
  { code: "STR-1003", name: "Никита", phone: "+79993334455" }
];

function now() {
  return new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}
function makeMsg(sender, text, status = "delivered") {
  return { id: crypto.randomUUID(), sender, text, time: now(), status };
}
function normalizePhone(v) { return v.replace(/[^\d+]/g, ""); }
function validPhone(v) { return normalizePhone(v).length >= 10; }

function codeFromPhone(phone) {
  const digits = normalizePhone(phone).replace(/\D/g, "");
  return `STR-${digits.slice(-4).padStart(4, "0")}`;
}

const baseChats = {
  bot: {
    id: "bot",
    type: "bot",
    name: "Демо-бот",
    code: "SERVICE-BOT",
    subtitle: "автоответчик",
    unread: 0,
    messages: [makeMsg("bot", "Привет. Напишите сообщение.")]
  },
  support: {
    id: "support",
    type: "support",
    name: "Техподдержка",
    code: "SERVICE-SUPPORT",
    subtitle: "онлайн",
    unread: 1,
    messages: [makeMsg("contact", "Поддержка на связи.")]
  }
};

let state = { activeChatId: "bot", chats: structuredClone(baseChats) };

/* storage */
function saveState() {
  localStorage.setItem(STORAGE_STATE, JSON.stringify(state));
}
function loadState() {
  const raw = localStorage.getItem(STORAGE_STATE);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.chats && parsed?.activeChatId) state = parsed;
  } catch {}
}

/* theme */
function applyTheme(theme) {
  document.body.setAttribute("data-theme", theme);
}
function initTheme() {
  const saved = localStorage.getItem(STORAGE_THEME) || "dark";
  applyTheme(saved);
}
function toggleTheme() {
  const current = document.body.getAttribute("data-theme") || "dark";
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  localStorage.setItem(STORAGE_THEME, next);
}

/* ui state */
function showAuth() {
  clientView.classList.remove("active");
  authView.classList.add("active");
}
function showClient(user) {
  profileName.textContent = user.name;
  profilePhone.textContent = user.phone;
  myInviteCode.value = user.inviteCode || "";
  authView.classList.remove("active");
  clientView.classList.add("active");
  renderAll();
}
function setStatus(el, text, type = "") {
  el.textContent = text;
  el.className = "mini-status";
  if (type) el.classList.add(type);
}
function toggleSkeleton(show) {
  chatSkeleton.classList.toggle("hidden", !show);
  chatMessages.classList.toggle("hidden", show);
}

/* render */
function renderContacts() {
  const q = contactSearchInput.value.trim().toLowerCase();
  contactsList.innerHTML = "";

  const list = Object.values(state.chats).filter(c => {
    const hay = `${c.name} ${c.code || ""}`.toLowerCase();
    return !q || hay.includes(q);
  });

  for (const chat of list) {
    const li = document.createElement("li");
    li.className = `contact-item ${chat.id === state.activeChatId ? "active" : ""}`;
    li.innerHTML = `
      <div class="contact-top">
        <p class="contact-name">${chat.name}</p>
        ${chat.unread ? `<span class="badge">${chat.unread}</span>` : ""}
      </div>
      <p class="contact-phone">${chat.code || "—"}</p>
    `;
    li.addEventListener("click", () => switchChat(chat.id));
    contactsList.appendChild(li);
  }
}

function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function messageNode(m) {
  const wrap = document.createElement("div");
  wrap.className = `msg ${m.sender}`;
  wrap.innerHTML = `
    <div class="bubble">${escapeHtml(m.text)}</div>
    <div class="meta">${
      m.sender === "user"
        ? `${m.time} • ${m.status === "sent" ? "отправлено" : "доставлено"}`
        : m.time
    }</div>
  `;
  return wrap;
}

function renderMessages() {
  const chat = state.chats[state.activeChatId];
  if (!chat) return;

  chatTitle.textContent = chat.name;
  chatSubtitle.textContent = chat.subtitle;

  const q = msgSearchInput.value.trim().toLowerCase();
  const filtered = chat.messages.filter(m => !q || m.text.toLowerCase().includes(q));

  chatMessages.innerHTML = "";
  const frag = document.createDocumentFragment();
  filtered.forEach(m => frag.appendChild(messageNode(m)));
  chatMessages.appendChild(frag);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function renderAll() {
  renderContacts();
  renderMessages();
}

/* chat logic */
function switchChat(chatId) {
  if (!state.chats[chatId]) return;
  state.activeChatId = chatId;
  state.chats[chatId].unread = 0;
  saveState();

  toggleSkeleton(true);
  setTimeout(() => {
    toggleSkeleton(false);
    renderAll();
  }, 240);
}

function addMessage(chatId, sender, text, status = "delivered") {
  const chat = state.chats[chatId];
  if (!chat) return;
  chat.messages.push(makeMsg(sender, text, status));
  saveState();
}
function botReply(text) {
  const t = text.toLowerCase();
  if (t.includes("привет")) return "Привет.";
  if (t.includes("помощь")) return "Опишите задачу коротко.";
  return ["Принято.", "Доставлено.", "Ок.", "Понял."][Math.floor(Math.random() * 4)];
}
function supportReply() {
  return ["Запрос принят.", "Проверяем.", "Ответим в этом чате."][Math.floor(Math.random() * 3)];
}

function simulateReply(chatId, userText) {
  setTimeout(() => {
    const chat = state.chats[chatId];
    if (!chat) return;

    const text = chat.type === "bot" ? botReply(userText) : supportReply();
    const sender = chat.type === "bot" ? "bot" : "contact";
    addMessage(chatId, sender, text);

    if (state.activeChatId !== chatId) chat.unread = (chat.unread || 0) + 1;
    saveState();
    renderAll();
  }, 520);
}

function sendMessage(text) {
  const chatId = state.activeChatId;
  addMessage(chatId, "user", text, "sent");
  renderAll();

  const arr = state.chats[chatId].messages;
  const last = arr[arr.length - 1];
  setTimeout(() => {
    last.status = "delivered";
    saveState();
    renderMessages();
  }, 320);

  simulateReply(chatId, text);
}

function autoResize(el) {
  el.style.height = "auto";
  el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
}

/* contacts via code/link */
function extractInviteCode(raw) {
  const v = raw.trim();
  if (!v) return "";

  // Если вставили ссылку, пробуем вытащить ?invite=CODE
  try {
    const u = new URL(v);
    return (u.searchParams.get("invite") || "").trim().toUpperCase();
  } catch {
    return v.toUpperCase();
  }
}

function resolveContactByCode(code) {
  // 1) mock directory
  const fromMock = MOCK_DIRECTORY.find(p => p.code === code);
  if (fromMock) return fromMock;

  // 2) проверим, не свой ли это код (или локально существующий)
  const allLocal = Object.values(state.chats).find(c => c.code === code);
  if (allLocal) return { code: allLocal.code, name: allLocal.name, phone: allLocal.phone || "+70000000000" };

  return null;
}

function addContactFromCode(inputCode, preferredName = "") {
  const code = extractInviteCode(inputCode);
  if (!code) {
    setStatus(addContactStatus, "Введите код или ссылку.", "warn");
    return;
  }

  const found = resolveContactByCode(code);
  if (!found) {
    setStatus(addContactStatus, "Контакт не найден.", "err");
    return;
  }

  const duplicate = Object.values(state.chats).find(c => c.code === found.code);
  if (duplicate) {
    setStatus(addContactStatus, "Контакт найден и уже добавлен.", "ok");
    switchChat(duplicate.id);
    return;
  }

  const id = `u_${Date.now()}`;
  state.chats[id] = {
    id,
    type: "user",
    name: preferredName.trim() || found.name || "Контакт",
    phone: found.phone || "",
    code: found.code,
    subtitle: "доступен",
    unread: 0,
    messages: [makeMsg("contact", "Контакт добавлен.")]
  };
  state.activeChatId = id;
  saveState();
  renderAll();
  setStatus(addContactStatus, "Контакт найден и добавлен.", "ok");
}

/* invite actions */
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/* events */
registerForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const user = {
    name: nameInput.value.trim(),
    phone: normalizePhone(phoneInput.value),
    email: emailInput.value.trim()
  };
  if (!user.name) return;
  if (!validPhone(user.phone)) return alert("Введите корректный номер телефона.");

  user.inviteCode = codeFromPhone(user.phone);

  localStorage.setItem(STORAGE_USER, JSON.stringify(user));
  loadState();
  showClient(user);
});

themeToggleBtn.addEventListener("click", toggleTheme);

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_USER);
  showAuth();
});

addContactForm.addEventListener("submit", (e) => {
  e.preventDefault();
  addContactFromCode(contactCodeInput.value, contactNameInput.value);
  addContactForm.reset();
});

copyInviteBtn.addEventListener("click", async () => {
  const ok = await copyText(myInviteCode.value || "");
  setStatus(inviteLinkStatus, ok ? "Код скопирован." : "Не удалось скопировать.", ok ? "ok" : "err");
});

genInviteLinkBtn.addEventListener("click", async () => {
  const code = myInviteCode.value || "";
  const link = `${location.origin}${location.pathname}?invite=${encodeURIComponent(code)}`;
  const ok = await copyText(link);
  setStatus(inviteLinkStatus, ok ? "Ссылка скопирована." : "Скопируйте ссылку вручную.", ok ? "ok" : "warn");
});

contactSearchInput.addEventListener("input", renderContacts);
msgSearchInput.addEventListener("input", renderMessages);

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  sendMessage(text);
  chatInput.value = "";
  autoResize(chatInput);
});

chatInput.addEventListener("input", () => autoResize(chatInput));
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    chatForm.requestSubmit();
  }
});

/* init */
(function init() {
  initTheme();
  loadState();

  if (!Object.keys(state.chats).length) {
    state = { activeChatId: "bot", chats: structuredClone(baseChats) };
  }

  const userRaw = localStorage.getItem(STORAGE_USER);
  if (!userRaw) return showAuth();

  try {
    const user = JSON.parse(userRaw);
    showClient(user);

    // Автоподхват invite-кода из URL
    const params = new URLSearchParams(location.search);
    const inviteFromUrl = params.get("invite");
    if (inviteFromUrl) {
      addContactFromCode(inviteFromUrl);
      history.replaceState({}, "", location.pathname);
    }
  } catch {
    localStorage.removeItem(STORAGE_USER);
    showAuth();
  }
})();
