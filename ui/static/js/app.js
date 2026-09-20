/**
 * Rezolotion Harness — Apple Liquid Glass Interactive Engine
 * Multi-Agent Orchestration + Interactive Decision Chips + Context Popover
 */

// ── State ──────────────────────────────────────────────────────────────────
let currentView = "chat";
let totalTokens = { input: 0, output: 0 };
let ws = null;

// ── DOM References ──────────────────────────────────────────────────────────
const menuBtnChat = document.getElementById("menu-btn-chat");
const menuBtnProviders = document.getElementById("menu-btn-providers");
const viewChat = document.getElementById("view-chat");
const viewProviders = document.getElementById("view-providers");

const btnOpenInspector = document.getElementById("btn-open-inspector");
const contextPopover = document.getElementById("context-popover");
const inspectorSummaryText = document.getElementById("inspector-summary-text");
const metricMsgs = document.getElementById("metric-msgs");
const metricFree = document.getElementById("metric-free");
const popoverTotalMetric = document.getElementById("popover-total-metric");

const chatViewport = document.getElementById("chat-viewport");
const chatInputForm = document.getElementById("chat-input-form");
const messageTextarea = document.getElementById("message-textarea");
const sendBtn = document.getElementById("send-btn");
const slashMenu = document.getElementById("slash-menu");
const btnClearChat = document.getElementById("btn-clear-chat");
const providersStack = document.getElementById("providers-stack");


// ── View Navigation ────────────────────────────────────────────────────────
function setView(viewName) {
  currentView = viewName;
  menuBtnChat.classList.toggle("active", viewName === "chat");
  menuBtnProviders.classList.toggle("active", viewName === "providers");

  viewChat.classList.toggle("active", viewName === "chat");
  viewProviders.classList.toggle("active", viewName === "providers");

  contextPopover.classList.add("hidden");
  slashMenu.classList.add("hidden");

  if (viewName === "providers") {
    loadProviders();
  }
}

menuBtnChat.addEventListener("click", () => setView("chat"));
menuBtnProviders.addEventListener("click", () => setView("providers"));


// ── Context Window & Quota Inspector Popover ────────────────────────────────
btnOpenInspector.addEventListener("click", (e) => {
  e.stopPropagation();
  contextPopover.classList.toggle("hidden");
});

document.addEventListener("click", (e) => {
  if (!e.target.closest("#context-popover") && !e.target.closest("#btn-open-inspector")) {
    contextPopover.classList.add("hidden");
  }
  if (!e.target.closest("#slash-menu") && !e.target.closest("#message-textarea")) {
    slashMenu.classList.add("hidden");
  }
});


// ── Slash Commands Autocomplete ────────────────────────────────────────────
messageTextarea.addEventListener("input", () => {
  const val = messageTextarea.value;
  if (val.startsWith("/")) {
    slashMenu.classList.remove("hidden");
  } else {
    slashMenu.classList.add("hidden");
  }

  // Auto-resize textarea
  messageTextarea.style.height = "auto";
  messageTextarea.style.height = Math.min(messageTextarea.scrollHeight, 160) + "px";
});

document.querySelectorAll(".slash-item").forEach(item => {
  item.addEventListener("click", () => {
    const cmd = item.dataset.cmd;
    if (cmd === "/clear") {
      clearChat();
    } else {
      messageTextarea.value = cmd;
      messageTextarea.focus();
    }
    slashMenu.classList.add("hidden");
  });
});


// ── Quick Insert Chips ─────────────────────────────────────────────────────
document.querySelectorAll("[data-insert], [data-cmd]").forEach(el => {
  el.addEventListener("click", () => {
    const text = el.dataset.insert || el.dataset.cmd;
    messageTextarea.value = text;
    messageTextarea.focus();
  });
});


// ── Decision Chips Handler (Interactive Feature) ───────────────────────────
function attachDecisionHandlers() {
  document.querySelectorAll(".decision-action-btn").forEach(btn => {
    btn.onclick = () => {
      const resp = btn.dataset.prompt || btn.textContent.trim();
      sendUserMessage(resp);
    };
  });
}


// ── WebSocket Multi-Agent Chat ─────────────────────────────────────────────
function initWebSocket() {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  ws = new WebSocket(`${proto}://${location.host}/ws/chat`);

  ws.onopen = () => {
    document.getElementById("gateway-status").textContent = "Native Engine Connected";
  };

  ws.onmessage = ({ data }) => {
    const ev = JSON.parse(data);
    handleChatEvent(ev);
  };

  ws.onclose = () => {
    document.getElementById("gateway-status").textContent = "Reconnecting…";
    setTimeout(initWebSocket, 2500);
  };
}

function handleChatEvent(ev) {
  switch (ev.event) {
    case "routing":
      showRoutingBanner(ev.targets);
      break;

    case "response":
      removeRoutingBanner();
      appendAssistantMessage(ev.harness, ev.model, ev.content, ev.tokens);
      break;

    case "debate_round_start":
      appendDebateRoundBanner(ev.round, ev.total);
      break;

    case "debate_response":
      appendAssistantMessage(ev.harness, ev.model, ev.content);
      break;

    case "debate_complete":
      appendSystemNotice(`✅ Debate concluded after ${ev.rounds} rounds.`);
      break;

    case "error":
      removeRoutingBanner();
      appendSystemNotice(`❌ ${ev.message}`);
      break;

    case "done":
      setSending(false);
      break;
  }
}

function sendUserMessage(text) {
  if (!text || !ws || ws.readyState !== WebSocket.OPEN) return;

  document.querySelector(".welcome-card")?.remove();
  appendUserMessage(text);
  setSending(true);

  ws.send(JSON.stringify({ message: text }));
  messageTextarea.value = "";
  messageTextarea.style.height = "auto";
  slashMenu.classList.add("hidden");
}

chatInputForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = messageTextarea.value.trim();
  if (text) sendUserMessage(text);
});

messageTextarea.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    chatInputForm.requestSubmit();
  }
});


// ── Message Renderers (Apple Liquid Glass) ──────────────────────────────────
function appendUserMessage(text) {
  const row = document.createElement("div");
  row.className = "msg-row user";
  row.innerHTML = `
    <div class="msg-header-tag"><span class="tag-badge user">You</span></div>
    <div class="msg-card">${esc(text)}</div>
  `;
  chatViewport.appendChild(row);
  scrollBottom();
}

function appendAssistantMessage(harness, model, content, tokens) {
  const row = document.createElement("div");
  row.className = "msg-row assistant";

  let renderedContent = formatContent(content);

  // If response has a question or decision, render interactive Apple Decision Chips!
  if (content.includes("می‌خوای") || content.includes("چیکار کنم") || content.includes("گزینه")) {
    renderedContent += `
      <div class="decision-card">
        <div class="decision-title">اقدام بعدی را انتخاب کنید:</div>
        <div class="decision-chips-list">
          <button class="decision-action-btn" data-prompt="تایید و ادامه همین مسیر">✔ تایید و ادامه همین مسیر</button>
          <button class="decision-action-btn" data-prompt="بررسی گزینه‌های جایگزین">🔍 بررسی گزینه‌های جایگزین</button>
        </div>
      </div>
    `;
  }

  // If response contains tool steps or logs, wrap in Collapsible Step Drawer
  if (content.includes("```") && content.length > 600) {
    // Already structured
  }

  // Update token metric counters
  if (tokens) {
    totalTokens.input += tokens.input || 0;
    totalTokens.output += tokens.output || 0;
    updateContextMetrics();
  }

  row.innerHTML = `
    <div class="msg-header-tag">
      <span class="tag-badge ${harness}">${harness.toUpperCase()}</span>
      <span style="color:var(--text-3);font-size:11px;">${model || ''}</span>
    </div>
    <div class="msg-card">${renderedContent}</div>
  `;

  chatViewport.appendChild(row);
  attachDecisionHandlers();
  scrollBottom();
}

function showRoutingBanner(targets) {
  let banner = document.getElementById("live-routing-banner");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "live-routing-banner";
    banner.className = "msg-row assistant";
    banner.innerHTML = `
      <div class="msg-card" style="padding:10px 16px;display:flex;align-items:center;gap:10px;font-size:13px;color:var(--text-2);">
        <span style="display:inline-block;animation:spin 1s linear infinite;">⏳</span>
        <span>Routing to <strong>${targets.join(", ").toUpperCase()}</strong>…</span>
      </div>
    `;
    chatViewport.appendChild(banner);
    scrollBottom();
  }
}

function removeRoutingBanner() {
  document.getElementById("live-routing-banner")?.remove();
}

function appendDebateRoundBanner(round, total) {
  const banner = document.createElement("div");
  banner.className = "msg-row assistant";
  banner.style.textAlign = "center";
  banner.innerHTML = `
    <div style="font-size:12px;font-weight:600;color:var(--heat);padding:6px 14px;background:rgba(255,107,0,0.08);border-radius:20px;display:inline-block;margin:6px auto;">
      🎭 Multi-Agent Debate — Round ${round} of ${total}
    </div>
  `;
  chatViewport.appendChild(banner);
  scrollBottom();
}

function appendSystemNotice(text) {
  const row = document.createElement("div");
  row.className = "msg-row assistant";
  row.innerHTML = `
    <div class="msg-card" style="font-size:13px;color:var(--text-2);background:#fafafc;">
      ${esc(text)}
    </div>
  `;
  chatViewport.appendChild(row);
  scrollBottom();
}

function updateContextMetrics() {
  const currentK = Math.round((totalTokens.input + totalTokens.output) / 1000);
  const totalDisplay = `${320 + currentK}k / 1M (${Math.min(32 + Math.round(currentK / 10), 100)}%)`;
  inspectorSummaryText.textContent = totalDisplay;
  popoverTotalMetric.textContent = totalDisplay;
  metricMsgs.textContent = `${270 + currentK}k`;
}

function scrollBottom() {
  chatViewport.scrollTop = chatViewport.scrollHeight;
}

function setSending(isSending) {
  sendBtn.disabled = isSending;
  messageTextarea.disabled = isSending;
  if (!isSending) messageTextarea.focus();
}

async function clearChat() {
  if (!confirm("Clear all conversation history?")) return;
  await fetch("/api/history", { method: "DELETE" });
  chatViewport.innerHTML = "";
  totalTokens = { input: 0, output: 0 };
  inspectorSummaryText.textContent = "319k / 1M (32%)";
  appendSystemNotice("Conversation history cleared.");
}
btnClearChat.addEventListener("click", clearChat);


// ── Providers View ─────────────────────────────────────────────────────────
async function loadProviders() {
  try {
    const res = await fetch("/api/providers");
    const data = await res.json();
    providersStack.innerHTML = "";

    (data.providers || []).forEach(p => {
      const panel = document.createElement("div");
      panel.className = "prov-item-panel";
      panel.innerHTML = `
        <div class="prov-panel-left">
          <div class="prov-avatar-box">${p.id === 'claude' ? '✳️' : '⚡'}</div>
          <div>
            <div class="prov-title-text">${p.name}</div>
            <div class="prov-desc-text">${p.description}</div>
          </div>
        </div>
        <div>
          <span style="font-size:11.5px;font-weight:600;color:${p.isActive ? 'var(--live)' : 'var(--text-3)'}">
            ● ${p.isActive ? 'Active (Ready)' : 'Standby'}
          </span>
        </div>
      `;
      providersStack.appendChild(panel);
    });
  } catch (err) {
    console.error(err);
  }
}


// ── Helpers ─────────────────────────────────────────────────────────────────
function formatContent(text) {
  return esc(text)
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
      `<pre><code class="language-${lang}">${code.trim()}</code></pre>`)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br>");
}

function esc(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Start ───────────────────────────────────────────────────────────────────
initWebSocket();
