const els = {
  apiKey: document.getElementById("apiKey"),
  model: document.getElementById("model"),
  systemPrompt: document.getElementById("systemPrompt"),
  messages: document.getElementById("messages"),
  prompt: document.getElementById("prompt"),
  form: document.getElementById("chatForm"),
  status: document.getElementById("statusBadge"),
  hero: document.getElementById("hero"),
  modal: document.getElementById("settingsModal"),
  chatList: document.getElementById("chatList"),
  chatTitle: document.getElementById("chatTitle")
};

let chats = JSON.parse(localStorage.getItem("neon_chats") || "[]");
let activeChatId = localStorage.getItem("neon_active_chat") || null;

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36);
}

function getSettings() {
  return {
    apiKey: localStorage.getItem("groq_api_key") || "",
    model: localStorage.getItem("groq_model") || "llama-3.3-70b-versatile",
    systemPrompt: localStorage.getItem("system_prompt") || "You are a helpful, knowledgeable, and concise assistant."
  };
}

function saveSettings() {
  localStorage.setItem("groq_api_key", els.apiKey.value.trim());
  localStorage.setItem("groq_model", els.model.value);
  localStorage.setItem("system_prompt", els.systemPrompt.value.trim());
  closeSettings();
}

function loadSettings() {
  const s = getSettings();
  els.apiKey.value = s.apiKey;
  els.model.value = s.model;
  els.systemPrompt.value = s.systemPrompt;
}

function newChat() {
  const chat = {
    id: uid(),
    title: "New Conversation",
    messages: []
  };
  chats.unshift(chat);
  activeChatId = chat.id;
  persist();
  render();
}

function activeChat() {
  if (!chats.length || !chats.find(c => c.id === activeChatId)) newChat();
  return chats.find(c => c.id === activeChatId);
}

function persist() {
  localStorage.setItem("neon_chats", JSON.stringify(chats));
  localStorage.setItem("neon_active_chat", activeChatId);
}

function renderChatList() {
  els.chatList.innerHTML = "";
  chats.forEach(chat => {
    const item = document.createElement("button");
    item.className = "chat-item" + (chat.id === activeChatId ? " active" : "");
    item.textContent = chat.title;
    item.onclick = () => {
      activeChatId = chat.id;
      persist();
      render();
    };
    els.chatList.appendChild(item);
  });
}

function addMessage(role, content, className = "") {
  const div = document.createElement("div");
  div.className = `message ${role} ${className}`;
  div.textContent = content;
  els.messages.appendChild(div);
  els.messages.scrollTop = els.messages.scrollHeight;
  return div;
}

function addTyping() {
  const div = document.createElement("div");
  div.className = "message assistant";
  div.innerHTML = `<span class="typing"><span></span><span></span><span></span></span>`;
  els.messages.appendChild(div);
  els.messages.scrollTop = els.messages.scrollHeight;
  return div;
}

function renderMessages() {
  const chat = activeChat();
  els.chatTitle.textContent = chat.title;
  els.messages.innerHTML = "";
  els.hero.classList.toggle("hidden", chat.messages.length > 0);
  chat.messages.forEach(m => addMessage(m.role, m.content));
}

function render() {
  renderChatList();
  renderMessages();
}

async function sendMessage(text) {
  const s = getSettings();

  if (!s.apiKey) {
    openSettings();
    addMessage("assistant", "Add your Groq API key first.", "error");
    return;
  }

  const chat = activeChat();

  chat.messages.push({ role: "user", content: text });
  if (chat.title === "New Conversation") chat.title = text.slice(0, 32) + (text.length > 32 ? "..." : "");

  persist();
  render();

  const typing = addTyping();
  els.status.textContent = "● Thinking...";
  els.status.style.color = "#00e0ff";

  const apiMessages = [
    { role: "system", content: s.systemPrompt },
    ...chat.messages.slice(-30)
  ];

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + s.apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: s.model,
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 2048
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "API request failed.");
    }

    const output = data.choices?.[0]?.message?.content || "No response.";
    typing.remove();

    const assistantDiv = addMessage("assistant", "");
    await typeText(assistantDiv, output);

    chat.messages.push({ role: "assistant", content: output });
    persist();
  } catch (err) {
    typing.remove();
    addMessage("assistant", "Error: " + err.message, "error");
  } finally {
    els.status.textContent = "● Ready";
    els.status.style.color = "#45ffb3";
    renderChatList();
  }
}

function typeText(element, text) {
  return new Promise(resolve => {
    let i = 0;
    const timer = setInterval(() => {
      element.textContent += text[i] || "";
      els.messages.scrollTop = els.messages.scrollHeight;
      i++;
      if (i >= text.length) {
        clearInterval(timer);
        resolve();
      }
    }, 8);
  });
}

function openSettings() {
  loadSettings();
  els.modal.classList.remove("hidden");
}

function closeSettings() {
  els.modal.classList.add("hidden");
}

function clearCurrentChat() {
  const chat = activeChat();
  chat.messages = [];
  chat.title = "New Conversation";
  persist();
  render();
}

document.getElementById("settingsBtn").onclick = openSettings;
document.getElementById("settingsBtn2").onclick = openSettings;
document.getElementById("closeSettings").onclick = closeSettings;
document.getElementById("saveSettings").onclick = saveSettings;
document.getElementById("newChatBtn").onclick = newChat;
document.getElementById("clearBtn").onclick = clearCurrentChat;

document.getElementById("toggleKey").onclick = () => {
  els.apiKey.type = els.apiKey.type === "password" ? "text" : "password";
  document.getElementById("toggleKey").textContent = els.apiKey.type === "password" ? "Show" : "Hide";
};

document.querySelectorAll("[data-prompt]").forEach(btn => {
  btn.onclick = () => {
    els.prompt.value = btn.dataset.prompt;
    els.prompt.focus();
  };
});

els.prompt.addEventListener("input", () => {
  els.prompt.style.height = "auto";
  els.prompt.style.height = Math.min(els.prompt.scrollHeight, 160) + "px";
});

els.prompt.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    els.form.requestSubmit();
  }
});

els.form.onsubmit = e => {
  e.preventDefault();
  const text = els.prompt.value.trim();
  if (!text) return;
  els.prompt.value = "";
  els.prompt.style.height = "auto";
  sendMessage(text);
};

if (!chats.length) newChat();
loadSettings();
render();
