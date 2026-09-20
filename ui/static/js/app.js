/**
 * Rezolotion Harness — Frontend
 * Session-based auth (keys stored in browser only) + WebSocket chat
 */

const HARNESS_META = {
  claude: { label: "Claude Code",   emoji: "🤖", color: "claude" },
  agy:    { label: "AntiGravity",   emoji: "✨",  color: "agy" },
  codex:  { label: "Codex",         emoji: "⚡",  color: "codex" },
  hermes: { label: "Hermes",        emoji: "🔮",  color: "hermes" },
};

// ── DOM refs ────────────────────────────────────────────────
const loginScreen = document.getElementById("login-screen");
const appScreen   = document.getElementById("app-screen");
const connectBtn  = document.getElementById("connect-btn");
const disconnBtn  = document.getElementById("btn-disconnect");
const messagesEl  = document.getElementById("messages");
const inputEl     = document.getElementById("message-input");
const sendBtn     = document.getElementById("send-btn");
const harnessList = document.getElementById("harness-list");
const clearBtn    = document.getElementById("btn-clear");
const wsStatus    = document.getElementById("ws-status");
const tokenCtr    = document.getElementById("token-counter");

let ws;
let typingEls = {};
let totalTokens = { input: 0, output: 0 };
let sessionKeys = {};

// ── LOGIN ───────────────────────────────────────────────────
connectBtn.addEventListener("click", () => {
  const claudeKey  = document.getElementById("claude-key").value.trim();
  const agyKey     = document.getElementById("agy-key").value.trim();
  const gwUrl      = document.getElementById("gateway-url").value.trim();
  const gwKey      = document.getElementById("gateway-key").value.trim();

  if (!claudeKey && !agyKey) {
    alert("Please enter at least one API key.");
    return;
  }

  sessionKeys = { claudeKey, agyKey, gwUrl, gwKey };
  sessionStorage.setItem("rh_keys", JSON.stringify(sessionKeys));

  loginScreen.classList.add("hidden");
  appScreen.classList.remove("hidden");
  startApp();
});

// Auto-restore session
(function restoreSession() {
  const saved = sessionStorage.getItem("rh_keys");
  if (saved) {
    sessionKeys = JSON.parse(saved);
    loginScreen.classList.add("hidden");
    appScreen.classList.remove("hidden");
    startApp();
  }
})();

disconnBtn.addEventListener("click", () => {
  sessionStorage.removeItem("rh_keys");
  if (ws) ws.close();
  appScreen.classList.add("hidden");
  loginScreen.classList.remove("hidden");
});

// ── START APP ───────────────────────────────────────────────
function startApp() {
  renderSidebar();
  connectWS();
}

function renderSidebar() {
  harnessList.innerHTML = "";
  for (const [id, meta] of Object.entries(HARNESS_META)) {
    const isActive =
      (id === "claude" && sessionKeys.claudeKey) ||
      (id === "agy" && sessionKeys.agyKey) ||
      (id === "codex") || (id === "hermes");
    const card = document.createElement("div");
    card.className = `harness-card ${isActive ? "active" : "inactive"}`;
    card.innerHTML = `
      <span class="h-dot"></span>
      <div class="h-info">
        <div class="h-name">${meta.emoji} ${meta.label}</div>
        <div class="h-model">${isActive ? "Ready" : "Not connected"}</div>
      </div>
    `;
    harnessList.appendChild(card);
  }
}

// ── WEBSOCKET ───────────────────────────────────────────────
function connectWS() {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  ws = new WebSocket(`${proto}://${location.host}/ws/chat`);

  ws.onopen = () => {
    wsStatus.textContent = "Connected";
    // Send session keys so backend can use them
    ws.send(JSON.stringify({ type: "auth", keys: sessionKeys }));
  };

  ws.onmessage = ({ data }) => handleEvent(JSON.parse(data));

  ws.onclose = () => {
    wsStatus.textContent = "Reconnecting…";
    setTimeout(connectWS, 2500);
  };
}

function handleEvent(ev) {
  switch (ev.event) {
    case "auth_ok":
      wsStatus.textContent = "Connected";
      break;
    case "routing":
      showRouting(ev);
      break;
    case "response":
      removeTyping(ev.harness);
      addMsg("assistant", ev.harness, ev.model, ev.content, ev.tokens);
      break;
    case "debate_round_start":
      addSystem(`🎭 Debate — Round ${ev.round}/${ev.total}`);
      break;
    case "debate_response":
      removeTyping(ev.harness);
      addMsg("assistant", ev.harness, ev.model, ev.content);
      break;
    case "debate_complete":
      addSystem(`✅ Debate complete (${ev.rounds} rounds)`);
      break;
    case "error":
      removeTyping(ev.harness);
      addError(ev.harness, ev.message);
      break;
    case "done":
      setLoading(false);
      break;
  }
}

// ── ROUTING BANNER ──────────────────────────────────────────
function showRouting(ev) {
  ev.targets.forEach(t => { if (t !== "all") showTyping(t); });
}

// ── MESSAGE BUILDERS ────────────────────────────────────────
function addMsg(role, harness, model, content, tokens) {
  const meta = HARNESS_META[harness] || { label: harness, emoji: "🤖", color: "system" };
  const isUser = role === "user";

  const wrap = document.createElement("div");
  wrap.className = `msg ${isUser ? "user" : "assistant"}`;

  let metaHTML;
  if (isUser) {
    metaHTML = `<span class="msg-tag user">You</span>`;
  } else {
    metaHTML = `<span class="msg-tag ${meta.color}">${meta.emoji} ${meta.label}</span>
                <span class="msg-model">${model || ""}</span>`;
  }

  let tokenHTML = "";
  if (tokens) {
    totalTokens.input += tokens.input;
    totalTokens.output += tokens.output;
    tokenHTML = `<span class="token-badge">↑${tokens.input} ↓${tokens.output}</span>`;
    tokenCtr.textContent = `Total: ↑${totalTokens.input.toLocaleString()} ↓${totalTokens.output.toLocaleString()}`;
  }

  wrap.innerHTML = `
    <div class="msg-meta">${metaHTML} ${tokenHTML}</div>
    <div class="msg-bubble">${formatContent(content)}</div>
  `;
  messagesEl.appendChild(wrap);
  scrollBottom();
}

function addSystem(text) {
  const el = document.createElement("div");
  el.className = "msg assistant";
  el.innerHTML = `
    <div class="msg-meta"><span class="msg-tag system">system</span></div>
    <div class="msg-bubble" style="font-size:13px;color:var(--text-3)">${esc(text)}</div>
  `;
  messagesEl.appendChild(el);
  scrollBottom();
}

function addError(harness, msg) {
  const el = document.createElement("div");
  el.className = "msg assistant";
  el.innerHTML = `
    <div class="msg-meta"><span class="msg-tag system">error</span></div>
    <div class="msg-bubble" style="color:var(--heat);font-size:13px">
      ❌ <strong>${harness}</strong>: ${esc(msg)}
    </div>
  `;
  messagesEl.appendChild(el);
  scrollBottom();
}

// ── TYPING INDICATOR ────────────────────────────────────────
function showTyping(harness) {
  if (typingEls[harness]) return;
  const meta = HARNESS_META[harness] || { label: harness, emoji: "🤖", color: "system" };
  const el = document.createElement("div");
  el.className = "msg assistant typing";
  el.innerHTML = `
    <div class="msg-meta"><span class="msg-tag ${meta.color}">${meta.emoji} ${meta.label}</span></div>
    <div class="msg-bubble"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>
  `;
  messagesEl.appendChild(el);
  typingEls[harness] = el;
  scrollBottom();
}

function removeTyping(h) {
  if (typingEls[h]) { typingEls[h].remove(); delete typingEls[h]; }
}

// ── SEND MESSAGE ────────────────────────────────────────────
function sendMessage() {
  const text = inputEl.value.trim();
  if (!text || !ws || ws.readyState !== WebSocket.OPEN) return;
  document.querySelector(".welcome-card")?.remove();
  addMsg("user", "", "", text);
  setLoading(true);
  ws.send(JSON.stringify({ type: "message", message: text }));
  inputEl.value = "";
  inputEl.style.height = "auto";
}

sendBtn.addEventListener("click", sendMessage);
inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});
inputEl.addEventListener("input", () => {
  inputEl.style.height = "auto";
  inputEl.style.height = Math.min(inputEl.scrollHeight, 160) + "px";
});

clearBtn.addEventListener("click", async () => {
  if (!confirm("Clear all chat history?")) return;
  await fetch("/api/history", { method: "DELETE" });
  messagesEl.innerHTML = "";
  totalTokens = { input: 0, output: 0 };
  tokenCtr.textContent = "";
  addSystem("History cleared.");
});

// ── HELPERS ─────────────────────────────────────────────────
function formatContent(text) {
  return esc(text)
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_, l, c) =>
      `<pre><code class="language-${l}">${c.trim()}</code></pre>`)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br>");
}
function esc(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
function scrollBottom() { messagesEl.scrollTop = messagesEl.scrollHeight; }
function setLoading(v) { sendBtn.disabled = v; inputEl.disabled = v; }
