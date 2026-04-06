const sendBtn = document.getElementById("sendBtn");
const msgInput = document.getElementById("msgInput");
const demoStatus = document.getElementById("demoStatus");
const ctaStart = document.getElementById("ctaStart");

function sendDemoMessage() {
  const text = msgInput.value.trim();
  if (!text) {
    demoStatus.textContent = "Введите текст сообщения.";
    return;
  }

  demoStatus.textContent = "Отправка...";
  setTimeout(() => {
    demoStatus.textContent = `Доставлено: «${text}»`;
    msgInput.value = "";
  }, 450); // имитация быстрой отправки
}

sendBtn?.addEventListener("click", sendDemoMessage);
msgInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendDemoMessage();
});

ctaStart?.addEventListener("click", () => {
  document.getElementById("how")?.scrollIntoView({ behavior: "smooth" });
});
