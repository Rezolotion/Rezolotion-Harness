/**
 * Rezolotion Harness — Frontend Application Logic
 * Implements 9Router Provider & OAuth Management + Unified Multi-Agent Chat
 */

// ── State ──────────────────────────────────────────────────────────────────
let currentView = "chat";
let currentProviderId = null;
let currentOAuthData = null;
let oauthPollingTimer = null;
let ws = null;
let totalTokens = { input: 0, output: 0 };
let typingIndicators = {};

// ── DOM References ──────────────────────────────────────────────────────────
const navChat = document.getElementById("nav-chat");
const navProviders = document.getElementById("nav-providers");
const viewChat = document.getElementById("view-chat");
const viewProviders = document.getElementById("view-providers");

const providersListView = document.getElementById("providers-list-view");
const providerDetailView = document.getElementById("provider-detail-view");
const providersGrid = document.getElementById("providers-grid");
const btnBackToProviders = document.getElementById("btn-back-to-providers");
const activeConnsBadge = document.getElementById("active-conns-badge");
const sidebarHarnessList = document.getElementById("sidebar-harness-list");

// Detail view refs
const detailAvatar = document.getElementById("detail-avatar");
const detailTitle = document.getElementById("detail-title");
const detailConnsCount = document.getElementById("detail-connections-count");
const detailRiskNotice = document.getElementById("detail-risk-notice");
const detailRiskText = document.getElementById("detail-risk-text");
const connectionsContainer = document.getElementById("connections-container");
const modelsGrid = document.getElementById("models-grid");
const btnOpenAddConnection = document.getElementById("btn-open-add-connection");

// Modal refs
const oauthModal = document.getElementById("oauth-modal");
const modalProviderTitle = document.getElementById("modal-provider-title");
const modalCloseBtn = document.getElementById("modal-close-btn");
const modalAuthUrl = document.getElementById("modal-auth-url");
const btnCopyAuthUrl = document.getElementById("btn-copy-auth-url");
const modalCallbackInput = document.getElementById("modal-callback-input");
const btnConnectOAuth = document.getElementById("btn-connect-oauth");
const btnCancelOAuth = document.getElementById("btn-cancel-oauth");
const popupStatusText = document.getElementById("popup-status-text");

// Chat refs
const chatMessages = document.getElementById("chat-messages");
const chatForm = document.getElementById("chat-form");
const chatTextarea = document.getElementById("chat-textarea");
const chatSendBtn = document.getElementById("chat-send-btn");
const tokenSummary = document.getElementById("token-summary");
const btnClearHistory = document.getElementById("btn-clear-history");


// ── Navigation ─────────────────────────────────────────────────────────────
function switchView(viewName) {
  currentView = viewName;
  navChat.classList.toggle("active", viewName === "chat");
  navProviders.classList.toggle("active", viewName === "providers");

  viewChat.classList.toggle("active", viewName === "chat");
  viewProviders.classList.toggle("active", viewName === "providers");

  if (viewName === "providers") {
    loadProviders();
  }
}

navChat.addEventListener("click", () => switchView("chat"));
navProviders.addEventListener("click", () => switchView("providers"));

btnBackToProviders.addEventListener("click", () => {
  providerDetailView.classList.add("hidden");
  providersListView.classList.remove("hidden");
  loadProviders();
});


// ── Providers Management ───────────────────────────────────────────────────
async function loadProviders() {
  try {
    const res = await fetch("/api/providers");
    const data = await res.json();
    const providers = data.providers || [];

    // Update active badge in sidebar
    const activeCount = providers.filter(p => p.isActive).length;
    activeConnsBadge.textContent = activeCount;

    // Render sidebar harness list
    renderSidebarHarnesses(providers);

    // Render providers grid
    renderProvidersGrid(providers);
  } catch (err) {
    console.error("Failed to load providers:", err);
  }
}

function renderSidebarHarnesses(providers) {
  sidebarHarnessList.innerHTML = "";
  providers.forEach(p => {
    const chip = document.createElement("div");
    chip.className = "harness-nav-chip";
    chip.innerHTML = `
      <span class="status-dot-sm ${p.isActive ? "active" : "inactive"}"></span>
      <span>${p.name}</span>
    `;
    chip.style.cursor = "pointer";
    chip.addEventListener("click", () => {
      switchView("providers");
      openProviderDetail(p.id);
    });
    sidebarHarnessList.appendChild(chip);
  });
}

function renderProvidersGrid(providers) {
  providersGrid.innerHTML = "";
  providers.forEach(p => {
    const card = document.createElement("div");
    card.className = "provider-card";
    const iconChar = p.name.charAt(0);

    card.innerHTML = `
      <div class="prov-card-header">
        <div class="prov-card-icon" style="color:${p.color}">${getProviderIcon(p.id)}</div>
        <div>
          <div class="prov-card-title">${p.name}</div>
          <div class="prov-card-conns">${p.connectionsCount} connection${p.connectionsCount === 1 ? "" : "s"}</div>
        </div>
      </div>
      <div class="prov-card-desc">${p.description}</div>
      <div class="prov-card-footer">
        <span class="prov-status-pill ${p.isActive ? "active" : "inactive"}">
          ● ${p.isActive ? "Active" : "Not connected"}
        </span>
        <button class="btn-ghost-sm">Manage →</button>
      </div>
    `;

    card.addEventListener("click", () => openProviderDetail(p.id));
    providersGrid.appendChild(card);
  });
}

function getProviderIcon(id) {
  const icons = {
    claude: "✳️",
    antigravity: "⚡",
    codex: "🔮",
    kiro: "🚀",
    ollama: "🦙",
  };
  return icons[id] || "🤖";
}


// ── Provider Detail View ───────────────────────────────────────────────────
async function openProviderDetail(providerId) {
  currentProviderId = providerId;
  providersListView.classList.add("hidden");
  providerDetailView.classList.remove("hidden");

  try {
    const res = await fetch(`/api/providers/${providerId}`);
    const data = await res.json();

    detailTitle.textContent = data.name;
    detailAvatar.textContent = getProviderIcon(data.id);
    detailAvatar.style.color = data.color;
    detailConnsCount.textContent = `${data.connectionsCount} connection${data.connectionsCount === 1 ? "" : "s"}`;

    // Risk Notice
    if (data.riskNotice) {
      detailRiskNotice.style.display = "flex";
      detailRiskText.textContent = data.riskNotice;
    } else {
      detailRiskNotice.style.display = "none";
    }

    // Connections List
    renderConnections(data.connections);

    // Available Models
    renderModels(data.models || []);

  } catch (err) {
    console.error("Failed to load provider detail:", err);
  }
}

function renderConnections(connections) {
  connectionsContainer.innerHTML = "";

  if (!connections || connections.length === 0) {
    connectionsContainer.innerHTML = `
      <div class="empty-conns-state">
        <div class="lock-icon">🔒</div>
        <span>No connections yet</span>
      </div>
    `;
    return;
  }

  connections.forEach(conn => {
    const row = document.createElement("div");
    row.className = "connection-item-row";
    row.innerHTML = `
      <div class="conn-left">
        <span class="status-dot-sm ${conn.isActive ? "active" : "inactive"}"></span>
        <div>
          <div class="conn-name">${escHtml(conn.name || "OAuth Account")} ${conn.email ? `(${escHtml(conn.email)})` : ""}</div>
          <div class="conn-priority">Priority: ${conn.priority || 1} &bull; ${conn.authType || "oauth"}</div>
        </div>
      </div>
      <button class="btn-delete-conn" data-id="${conn.id}">Delete</button>
    `;

    row.querySelector(".btn-delete-conn").addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!confirm("Are you sure you want to disconnect this account?")) return;
      await fetch(`/api/connections/${conn.id}`, { method: "DELETE" });
      openProviderDetail(currentProviderId);
    });

    connectionsContainer.appendChild(row);
  });
}

function renderModels(models) {
  modelsGrid.innerHTML = "";

  if (!models || models.length === 0) {
    modelsGrid.innerHTML = `
      <div style="font-size:13px;color:var(--text-muted);grid-column:1/-1;padding:12px;">
        Connect an account to discover available models for this provider.
      </div>
    `;
    return;
  }

  models.forEach(m => {
    const card = document.createElement("div");
    card.className = "model-card";
    card.innerHTML = `
      <div class="model-card-left">
        <span class="model-card-icon">🤖</span>
        <span class="model-card-id" title="${m.id}">${m.id}</span>
      </div>
      <button class="copy-model-btn" title="Copy Model ID" data-id="${m.id}">📋</button>
    `;

    card.querySelector(".copy-model-btn").addEventListener("click", () => {
      navigator.clipboard.writeText(m.id);
      alert(`Copied model ID: ${m.id}`);
    });

    modelsGrid.appendChild(card);
  });
}


// ── OAuth Connection Modal Flow (Matching Screenshot 1) ─────────────────────
btnOpenAddConnection.addEventListener("click", async () => {
  if (!currentProviderId) return;

  modalProviderTitle.textContent = `Connect ${detailTitle.textContent}`;
  oauthModal.classList.remove("hidden");
  popupStatusText.textContent = "Waiting for popup authorization...";
  modalCallbackInput.value = "";
  btnConnectOAuth.disabled = true;

  try {
    // 1. Fetch OAuth URL & PKCE credentials
    const res = await fetch(`/api/oauth/${currentProviderId}/authorize`);
    const data = await res.json();
    currentOAuthData = data;

    modalAuthUrl.value = data.authUrl || "";

    // 2. Open authorization popup
    if (data.authUrl) {
      window.open(data.authUrl, "oauthPopup", "width=600,height=750,menubar=no,toolbar=no");
    }

    // 3. Start polling to see if the callback was captured automatically
    startOAuthPolling();

  } catch (err) {
    popupStatusText.textContent = "Failed to initiate OAuth flow: " + err.message;
  }
});

function startOAuthPolling() {
  if (oauthPollingTimer) clearInterval(oauthPollingTimer);

  oauthPollingTimer = setInterval(async () => {
    try {
      const res = await fetch(`/api/providers/${currentProviderId}`);
      const data = await res.json();
      if (data.connectionsCount > 0) {
        clearInterval(oauthPollingTimer);
        closeOAuthModal();
        openProviderDetail(currentProviderId);
      }
    } catch {}
  }, 2000);
}

function closeOAuthModal() {
  oauthModal.classList.add("hidden");
  if (oauthPollingTimer) clearInterval(oauthPollingTimer);
  currentOAuthData = null;
}

modalCloseBtn.addEventListener("click", closeOAuthModal);
btnCancelOAuth.addEventListener("click", closeOAuthModal);

btnCopyAuthUrl.addEventListener("click", () => {
  if (modalAuthUrl.value) {
    navigator.clipboard.writeText(modalAuthUrl.value);
    btnCopyAuthUrl.textContent = "Copied!";
    setTimeout(() => { btnCopyAuthUrl.textContent = "Copy"; }, 1800);
  }
});

// Enable connect button when callback URL is pasted
modalCallbackInput.addEventListener("input", () => {
  const val = modalCallbackInput.value.trim();
  btnConnectOAuth.disabled = !val.includes("code=");
});

btnConnectOAuth.addEventListener("click", async () => {
  const callbackVal = modalCallbackInput.value.trim();
  if (!callbackVal || !currentOAuthData) return;

  try {
    const url = new URL(callbackVal);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state") || currentOAuthData.state;

    if (!code) {
      alert("No authorization code found in the callback URL.");
      return;
    }

    btnConnectOAuth.disabled = true;
    btnConnectOAuth.textContent = "Connecting...";

    const res = await fetch(`/api/oauth/${currentProviderId}/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: code,
        codeVerifier: currentOAuthData.codeVerifier,
        state: state,
        redirectUri: currentOAuthData.redirectUri || "http://localhost:20128/callback",
      }),
    });

    const result = await res.json();
    if (result.success || res.ok) {
      closeOAuthModal();
      openProviderDetail(currentProviderId);
      loadProviders();
    } else {
      alert("Token exchange failed: " + (result.detail || result.error || "Unknown error"));
      btnConnectOAuth.disabled = false;
      btnConnectOAuth.textContent = "Connect";
    }
  } catch (err) {
    alert("Invalid callback URL format: " + err.message);
    btnConnectOAuth.disabled = false;
    btnConnectOAuth.textContent = "Connect";
  }
});


// ── WebSocket Multi-Agent Chat ─────────────────────────────────────────────
function initWebSocket() {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  ws = new WebSocket(`${proto}://${location.host}/ws/chat`);

  ws.onopen = () => {
    document.getElementById("gateway-status-text").textContent = "Router: Connected";
  };

  ws.onmessage = ({ data }) => {
    const ev = JSON.parse(data);
    handleChatEvent(ev);
  };

  ws.onclose = () => {
    document.getElementById("gateway-status-text").textContent = "Router: Reconnecting…";
    setTimeout(initWebSocket, 2500);
  };
}

function handleChatEvent(ev) {
  switch (ev.event) {
    case "routing":
      showRoutingIndicator(ev);
      break;

    case "response":
      removeTypingIndicator(ev.harness);
      appendChatMessage("assistant", ev.harness, ev.model, ev.content, ev.tokens);
      break;

    case "debate_round_start":
      appendSystemBanner(`🎭 Debate — Round ${ev.round} of ${ev.total}`);
      break;

    case "debate_response":
      removeTypingIndicator(ev.harness);
      appendChatMessage("assistant", ev.harness, ev.model, ev.content);
      break;

    case "debate_complete":
      appendSystemBanner(`✅ Debate concluded after ${ev.rounds} rounds`);
      break;

    case "error":
      removeTypingIndicator(ev.harness);
      appendErrorBanner(ev.harness, ev.message);
      break;

    case "done":
      setChatLoading(false);
      break;
  }
}

function showRoutingIndicator(ev) {
  ev.targets.forEach(t => {
    if (t !== "all") showTypingIndicator(t);
  });
}

function appendChatMessage(role, harness, model, content, tokens) {
  const isUser = role === "user";
  const wrap = document.createElement("div");
  wrap.className = `chat-msg ${isUser ? "user" : "assistant"}`;

  let tagHTML = "";
  if (isUser) {
    tagHTML = `<span class="agent-tag user">You</span>`;
  } else {
    tagHTML = `
      <span class="agent-tag ${harness}">${harness.toUpperCase()}</span>
      <span class="agent-model-name">${model || ""}</span>
    `;
  }

  let tokenHTML = "";
  if (tokens) {
    totalTokens.input += tokens.input;
    totalTokens.output += tokens.output;
    tokenSummary.textContent = `Tokens: ↑${totalTokens.input.toLocaleString()} ↓${totalTokens.output.toLocaleString()}`;
  }

  wrap.innerHTML = `
    <div class="msg-tag-row">${tagHTML}</div>
    <div class="chat-bubble">${formatMarkdown(content)}</div>
  `;

  chatMessages.appendChild(wrap);
  scrollChatBottom();
}

function appendSystemBanner(text) {
  const banner = document.createElement("div");
  banner.className = "chat-msg assistant";
  banner.innerHTML = `
    <div class="msg-tag-row"><span class="agent-tag system">SYSTEM</span></div>
    <div class="chat-bubble" style="font-size:12.5px;color:var(--text-muted);">${escHtml(text)}</div>
  `;
  chatMessages.appendChild(banner);
  scrollChatBottom();
}

function appendErrorBanner(harness, msg) {
  const banner = document.createElement("div");
  banner.className = "chat-msg assistant";
  banner.innerHTML = `
    <div class="msg-tag-row"><span class="agent-tag system">ERROR</span></div>
    <div class="chat-bubble" style="color:#d32f2f;font-size:13px;">
      ❌ <strong>${harness}</strong>: ${escHtml(msg)}
    </div>
  `;
  chatMessages.appendChild(banner);
  scrollChatBottom();
}

function showTypingIndicator(harness) {
  if (typingIndicators[harness]) return;

  const el = document.createElement("div");
  el.className = "chat-msg assistant typing-bubble";
  el.innerHTML = `
    <div class="msg-tag-row"><span class="agent-tag ${harness}">${harness.toUpperCase()}</span></div>
    <div class="chat-bubble">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>
  `;

  chatMessages.appendChild(el);
  typingIndicators[harness] = el;
  scrollChatBottom();
}

function removeTypingIndicator(harness) {
  if (typingIndicators[harness]) {
    typingIndicators[harness].remove();
    delete typingIndicators[harness];
  }
}

function scrollChatBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function setChatLoading(loading) {
  chatSendBtn.disabled = loading;
  chatTextarea.disabled = loading;
  if (!loading) chatTextarea.focus();
}

// ── Submit Chat ────────────────────────────────────────────────────────────
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = chatTextarea.value.trim();
  if (!text || !ws || ws.readyState !== WebSocket.OPEN) return;

  // Remove welcome banner on first chat
  document.querySelector(".welcome-banner")?.remove();

  appendChatMessage("user", "", "", text);
  setChatLoading(true);

  ws.send(JSON.stringify({ message: text }));
  chatTextarea.value = "";
  chatTextarea.style.height = "auto";
});

// Shift+Enter newline, Enter send
chatTextarea.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    chatForm.requestSubmit();
  }
});

// Auto-expand textarea
chatTextarea.addEventListener("input", () => {
  chatTextarea.style.height = "auto";
  chatTextarea.style.height = Math.min(chatTextarea.scrollHeight, 160) + "px";
});

// Clickable chip shortcuts
document.querySelectorAll(".cmd-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    chatTextarea.value = chip.dataset.cmd;
    chatTextarea.focus();
  });
});

// Clear history
btnClearHistory.addEventListener("click", async () => {
  if (!confirm("Are you sure you want to clear all conversation history?")) return;
  await fetch("/api/history", { method: "DELETE" });
  chatMessages.innerHTML = "";
  totalTokens = { input: 0, output: 0 };
  tokenSummary.textContent = "";
  appendSystemBanner("Conversation history cleared.");
});


// ── Helpers ─────────────────────────────────────────────────────────────────
function formatMarkdown(text) {
  return escHtml(text)
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
      `<pre><code class="language-${lang}">${code.trim()}</code></pre>`)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br>");
}

function escHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}


// ── Initialization ──────────────────────────────────────────────────────────
initWebSocket();
loadProviders();
