/**
 * Rezolotion Harness — Frontend Chat Logic
 * WebSocket-based real-time chat with multi-harness support.
 */

const HARNESS_LABELS = {
  claude: "Claude Code",
  agy:    "AntiGravity",
  codex:  "Codex",
  hermes: "Hermes",
};

const HARNESS_EMOJIS = {
  claude: "🤖",
  agy:    "✨",
  codex:  "⚡",
  hermes: "🔮",
};

// ── DOM refs ────────────────────────────────────────────────────────────────
const messagesEl  = document.getElementById("messages");
const form        = document.getElementById("chat-form");
const input       = document.getElementById("message-input");
const sendBtn     = document.getElementById("send-btn");
const harnessList = document.getElementById("harness-list");
const clearBtn    = document.getElementById("btn-clear");

// ── WebSocket ───────────────────────────────────────────────────────────────
let ws;
let typingBubbles = {}; // harness_id → DOM element

function connectWS() {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  ws = new WebSocket(`${proto}://${location.host}/ws/chat`);

  ws.onopen = () => console.log("[WS] connected");

  ws.onmessage = ({ data }) => {
    const event = JSON.parse(data);
    handleEvent(event);
  };

  ws.onclose = () => {
    setTimeout(connectWS, 2000); // auto-reconnect
  };
}

function handleEvent(ev) {
  switch (ev.event) {
    case "routing":
      showRouting(ev);
      break;

    case "response":
      removeTyping(ev.harness);
      appendAssistantMessage(ev.harness, ev.model, ev.content, ev.tokens);
      break;

    case "debate_round_start":
      appendSystemMessage(`🎭 Debate — Round ${ev.round} / ${ev.total}`);
      break;

    case "debate_response":
      removeTyping(ev.harness);
      appendAssistantMessage(ev.harness, ev.model, ev.content, null, true);
      break;

    case "debate_complete":
      appendSystemMessage(`✅ Debate complete after ${ev.rounds} rounds`);
      break;

    case "error":
      removeTyping(ev.harness);
      appendErrorMessage(ev.harness, ev.message);
      break;

    case "done":
      setLoading(false);
      break;
  }
}

// ── Routing banner ──────────────────────────────────────────────────────────
function showRouting(ev) {
  const targets = ev.targets.map(t => HARNESS_LABELS[t] || t).join(" + ");
  const label = ev.is_debate ? `🎭 Debate: ${targets}` : `→ ${targets}`;
  appendSystemMessage(label, "routing");

  // Show typing indicators for each target
  ev.targets.forEach(t => {
    if (t !== "all") showTyping(t);
  });
}

// ── Message builders ────────────────────────────────────────────────────────
function appendUserMessage(text) {
  const wrap = document.createElement("div");
  wrap.className = "msg user";
  wrap.innerHTML = `
    <div class="msg-meta">
      <span class="harness-tag user">You</span>
    </div>
    <div class="msg-bubble">${escHtml(text)}</div>
  `;
  messagesEl.appendChild(wrap);
  scrollBottom();
}

function appendAssistantMessage(harness, model, content, tokens, isDebate = false) {
  const label = HARNESS_LABELS[harness] || harness;
  const emoji = HARNESS_EMOJIS[harness] || "🤖";
  const tokenInfo = tokens
    ? `<span class="token-badge">↑${tokens.input} ↓${tokens.output}</span>`
    : "";
  const debateClass = isDebate ? "debate-response" : "";

  const wrap = document.createElement("div");
  wrap.className = `msg assistant ${debateClass}`;
  wrap.innerHTML = `
    <div class="msg-meta">
      <span class="harness-tag ${harness}">${emoji} ${label}</span>
      <span style="color:var(--text-muted);font-size:.7rem">${model}</span>
      ${tokenInfo}
    </div>
    <div class="msg-bubble">${formatContent(content)}</div>
  `;
  messagesEl.appendChild(wrap);
  scrollBottom();
}

function appendSystemMessage(text, cls = "") {
  const el = document.createElement("div");
  el.className = `msg assistant system-msg ${cls}`;
  el.innerHTML = `
    <div class="msg-meta"><span class="harness-tag system">system</span></div>
    <div class="msg-bubble" style="font-size:.8rem;color:var(--text-muted)">${escHtml(text)}</div>
  `;
  messagesEl.appendChild(el);
  scrollBottom();
}

function appendErrorMessage(harness, msg) {
  const el = document.createElement("div");
  el.className = "msg assistant";
  el.innerHTML = `
    <div class="msg-meta"><span class="harness-tag system">error</span></div>
    <div class="msg-bubble" style="color:#f85149;font-size:.83rem">
      ❌ <strong>${harness}</strong>: ${escHtml(msg)}
    </div>
  `;
  messagesEl.appendChild(el);
  scrollBottom();
}

// ── Typing indicator ─────────────────────────────────────────────────────────
function showTyping(harness) {
  if (typingBubbles[harness]) return;
  const label = HARNESS_LABELS[harness] || harness;
  const emoji = HARNESS_EMOJIS[harness] || "🤖";

  const el = document.createElement("div");
  el.className = "msg assistant typing-indicator";
  el.dataset.harness = harness;
  el.innerHTML = `
    <div class="msg-meta">
      <span class="harness-tag ${harness}">${emoji} ${label}</span>
    </div>
    <div class="msg-bubble">
      <span class="dot"></span><span class="dot"></span><span class="dot"></span>
    </div>
  `;
  messagesEl.appendChild(el);
  typingBubbles[harness] = el;
  scrollBottom();
}

function removeTyping(harness) {
  const el = typingBubbles[harness];
  if (el) { el.remove(); delete typingBubbles[harness]; }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatContent(text) {
  // Simple markdown: code blocks and inline code
  return escHtml(text)
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
      `<pre><code class="language-${lang}">${code.trim()}</code></pre>`)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br>");
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function scrollBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function setLoading(val) {
  sendBtn.disabled = val;
  input.disabled = val;
}

// ── Health / Sidebar ─────────────────────────────────────────────────────────
async function loadHealth() {
  try {
    const res = await fetch("/api/health");
    const data = await res.json();
    harnessList.innerHTML = "";

    for (const [id, info] of Object.entries(data.harnesses)) {
      const card = document.createElement("div");
      card.className = `harness-card ${info.configured ? "active" : "inactive"}`;
      card.dataset.id = id;
      card.innerHTML = `
        <div class="harness-name">
          <span class="dot"></span>
          ${HARNESS_EMOJIS[id] || "🤖"} ${info.display_name}
        </div>
        <div class="harness-model">${info.model}</div>
      `;
      harnessList.appendChild(card);
    }
  } catch (e) {
    console.error("Health check failed", e);
  }
}

// ── Send message ─────────────────────────────────────────────────────────────
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text || !ws || ws.readyState !== WebSocket.OPEN) return;

  // Remove welcome message on first send
  document.querySelector(".welcome-msg")?.remove();

  appendUserMessage(text);
  setLoading(true);
  ws.send(JSON.stringify({ message: text }));
  input.value = "";
  input.style.height = "auto";
});

// Allow Shift+Enter for newlines, Enter to send
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});

// Auto-resize textarea
input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 160) + "px";
});

// Clear history
clearBtn.addEventListener("click", async () => {
  if (!confirm("Clear all chat history?")) return;
  await fetch("/api/history", { method: "DELETE" });
  messagesEl.innerHTML = "";
  appendSystemMessage("History cleared.");
});

// ── Init ─────────────────────────────────────────────────────────────────────
connectWS();
loadHealth();
setInterval(loadHealth, 15000); // refresh harness status every 15s
