const authView = document.getElementById("authView");
const clientView = document.getElementById("clientView");

const registerForm = document.getElementById("registerForm");
const nameInput = document.getElementById("nameInput");
const emailInput = document.getElementById("emailInput");

const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const logoutBtn = document.getElementById("logoutBtn");

const contactsList = document.getElementById("contactsList");
const chatTitle = document.getElementById("chatTitle");
const chatSubtitle = document.getElementById("chatSubtitle");
const chatMessages = document.getElementById("chatMessages");
const searchInput = document.getElementById("searchInput");

const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");

const STORAGE_USER = "strelocnyUser";
const STORAGE_CHATS = "strelocnyChats";
const STORAGE_ACTIVE = "strelocnyActiveChat";

let state = {
  activeChatId: "bot",
  chats: {
    bot: { id: "bot", name: "Бот Стрелочный", subtitle: "Автоответчик MVP", messages: [] },
    support: { id: "support", name: "Поддержка", subtitle: "Служебный канал", messages: [] },
    team: { id: "team", name: "Команда", subtitle: "Внутренний контур", messages: [] }
  }
};

function nowTime() {
  return new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function saveChats() {
  localStorage.setItem(STORAGE_CHATS, JSON.stringify(state.chats));
  localStorage.setItem(STORAGE_ACTIVE, state.activeChatId);
}

function loadChats() {
  const savedChats = localStorage.getItem(STORAGE_CHATS);
  const savedActive = localStorage.getItem(STORAGE_ACTIVE);

  if (savedChats) {
    try { state.chats = JSON.parse(savedChats); } catch {}
  }
  if (savedActive && state.chats[savedActive]) {
    state.activeChatId = savedActive;
  }

  // seed initial messages if empty
  if (!state.chats.bot.messages.length) {
    state.chats.bot.messages.push({
      id: crypto.randomUUID(),
      sender: "bot",
      text: "Привет! Я демо-бот. Проверим скорость связи?",
      time: nowTime(),
      status: "delivered"
    });
  }
  if (!state.chats.support.messages.length) {
    state.chats.support.messages.push({
      id: crypto.randomUUID(),
      sender: "contact",
      text: "Поддержка на связи. Опишите задачу одним сообщением.",
      time: nowTime(),
      status: "delivered"
    });
  }
  if (!state.chats.team.messages.length) {
    state.chats.team.messages.push({
      id: crypto.randomUUID(),
      sender: "contact",
      text: "Команда: сегодня фокус на MVP и скорости доставки.",
      time: nowTime(),
      status: "delivered"
    });
  }
}

function renderContacts() {
  contactsList.innerHTML = "";
  Object.values(state.chats).forEach(chat => {
    const last = chat.messages[chat.messages.length - 1];
    const item = document.createElement("li");
    item.className = `contact-item ${chat.id === state.activeChatId ? "active" : ""}`;
    item.innerHTML = `
      <p class="contact-name">${chat.name}</p>
      <p class="contact-last">${last ? last.text.slice(0, 45) : "Нет сообщений"}</p>
    `;
    item.addEventListener("click", () => {
      state.activeChatId = chat.id;
      saveChats();
      renderAll();
    });
    contactsList.appendChild(item);
  });
}

function createMsgNode(m) {
  const wrap = document.createElement("div");
  wrap.className = `msg ${m.sender}`;

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = m.text;

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = m.sender === "user"
    ? `${m.time} • ${m.status === "sent" ? "отправлено" : "доставлено"}`
    : `${m.time}`;

  wrap.appendChild(bubble);
  wrap.appendChild(meta);
  return wrap;
}

function renderMessages() {
  const chat = state.chats[state.activeChatId];
  const query = searchInput.value.trim().toLowerCase();

  chatTitle.textContent = chat.name;
  chatSubtitle.textContent = chat.subtitle;

  chatMessages.innerHTML = "";

  const filtered = chat.messages.filter(m =>
    !query || m.text.toLowerCase().includes(query)
  );

  filtered.forEach(m => chatMessages.appendChild(createMsgNode(m)));
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function renderAll() {
  renderContacts();
  renderMessages();
}

function addMessage(chatId, sender, text, status = "delivered") {
  state.chats[chatId].messages.push({
    id: crypto.randomUUID(),
    sender,
    text,
    time: nowTime(),
    status
  });
  saveChats();
  renderAll();
}

function botReply(text) {
  const t = text.toLowerCase();
  if (t.includes("привет")) return "Привет. Канал связи активен.";
  if (t.includes("скор")) return "Скорость — ключевая ценность Стрелочного.";
  if (t.includes("функц")) return "Основа: быстрая отправка сообщений между клиентами.";
  return [
    "Принято. Двигаемся по короткому контуру связи.",
    "Сообщение доставлено. Минимум шума, максимум смысла.",
    "Отлично. Зафиксировал и готов к следующему сообщению."
  ][Math.floor(Math.random() * 3)];
}

function sendFlow(text) {
  const chatId = state.activeChatId;
  addMessage(chatId, "user", text, "sent");

  // имитация доставки
  const last = state.chats[chatId].messages[state.chats[chatId].messages.length - 1];
  setTimeout(() => {
    last.status = "delivered";
    saveChats();
    renderMessages();
  }, 500);

  // автоответы для демо
  setTimeout(() => {
    if (chatId === "bot") addMessage(chatId, "bot", botReply(text));
    if (chatId === "support") addMessage(chatId, "contact", "Поддержка: запрос принят, вернемся с решением.");
    if (chatId === "team") addMessage(chatId, "contact", "Команда: принято, добавили в текущий спринт.");
  }, 700);
}

function autoResizeTextarea(el) {
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 120) + "px";
}

function showClient(user) {
  profileName.textContent = user.name || "Пользователь";
  profileEmail.textContent = user.email || "email@example.com";
  authView.classList.remove("active");
  clientView.classList.add("active");
  renderAll();
}

function showAuth() {
  clientView.classList.remove("active");
  authView.classList.add("active");
}

registerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const user = { name: nameInput.value.trim(), email: emailInput.value.trim() };
  localStorage.setItem(STORAGE_USER, JSON.stringify(user));
  loadChats();
  showClient(user);
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_USER);
  showAuth();
});

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  sendFlow(text);
  chatInput.value = "";
  autoResizeTextarea(chatInput);
});

chatInput.addEventListener("input", () => autoResizeTextarea(chatInput));
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    chatForm.requestSubmit();
  }
});

searchInput.addEventListener("input", renderMessages);

(function init() {
  const savedUser = localStorage.getItem(STORAGE_USER);
  loadChats();

  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      showClient(user);
    } catch {
      localStorage.removeItem(STORAGE_USER);
      showAuth();
    }
  } else {
    showAuth();
  }
})();
