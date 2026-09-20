/**
 * Rezolotion Harness — Studio Edition Interactive Engine
 * Full Multi-Agent Orchestration + Customize + MCP Marketplace + Artifacts + Dual Theme
 */

// ── State ──────────────────────────────────────────────────────────────────
let currentView = "chat";
let currentTheme = localStorage.getItem("rezolotion-theme") || "dark";
let selectedModel = "Opus 5";
let selectedHarness = "claude";
let selectedThinking = "auto";
let totalTokens = { input: 0, output: 0 };
let ws = null;

// Customize state
let custCategory = "skills"; // "skills" | "connectors" | "plugins"
let custScope = "discover";   // "yours" | "discover"
let skillsData = [];
let mcpData = [];

// Artifacts state
let artifactsData = [];
let artifactFilter = "all"; // "all" | "yours" | "shared"
let currentActiveArtifact = null;

// ── DOM References ──────────────────────────────────────────────────────────
// Sidebar Navigation
const menuBtnChat = document.getElementById("menu-btn-chat");
const menuBtnArtifacts = document.getElementById("menu-btn-artifacts");
const menuBtnCustomize = document.getElementById("menu-btn-customize");
const menuBtnProviders = document.getElementById("menu-btn-providers");

const viewChat = document.getElementById("view-chat");
const viewArtifacts = document.getElementById("view-artifacts");
const viewCustomize = document.getElementById("view-customize");
const viewProviders = document.getElementById("view-providers");

// Theme Switcher
const themeToggleBtn = document.getElementById("theme-toggle-btn");
const themeIcon = document.getElementById("theme-icon");
const themeText = document.getElementById("theme-text");

// Chat Input & Toolbars
const chatViewport = document.getElementById("chat-viewport");
const chatInputForm = document.getElementById("chat-input-form");
const messageTextarea = document.getElementById("message-textarea");
const sendBtn = document.getElementById("send-btn");
const slashMenu = document.getElementById("slash-menu");
const statusRing = document.getElementById("status-ring");

// Model & Thinking Popovers
const btnModelPill = document.getElementById("btn-model-pill");
const activeModelName = document.getElementById("active-model-name");
const modelPickerMenu = document.getElementById("model-picker-menu");

const btnThinkingToggle = document.getElementById("btn-thinking-toggle");
const thinkingModeLabel = document.getElementById("thinking-mode-label");
const thinkingPickerMenu = document.getElementById("thinking-picker-menu");

const btnAttach = document.getElementById("btn-attach");
const btnMic = document.getElementById("btn-mic");
const btnClearChat = document.getElementById("btn-clear-chat");

// Inspector
const btnOpenInspector = document.getElementById("btn-open-inspector");
const contextPopover = document.getElementById("context-popover");
const inspectorSummaryText = document.getElementById("inspector-summary-text");
const metricMsgs = document.getElementById("metric-msgs");
const metricFree = document.getElementById("metric-free");
const popoverTotalMetric = document.getElementById("popover-total-metric");

// Customize elements
const customizeList = document.getElementById("customize-list");
const customizeSearch = document.getElementById("customize-search");
const mcpBanner = document.getElementById("mcp-banner");
const btnAddCustomMcp = document.getElementById("btn-add-custom-mcp");

// Artifacts elements
const artifactsGrid = document.getElementById("artifacts-grid");
const artifactsSearch = document.getElementById("artifacts-search");
const artifactModal = document.getElementById("artifact-modal");
const btnCloseModal = document.getElementById("btn-close-modal");
const modalBackdrop = document.getElementById("modal-backdrop");
const modalArtTitle = document.getElementById("modal-art-title");
const modalArtBadge = document.getElementById("modal-art-badge");
const modalPreviewPane = document.getElementById("modal-preview-pane");
const modalCodePane = document.getElementById("modal-code-pane");
const modalCodeContent = document.getElementById("modal-code-content");
const btnCopyArtCode = document.getElementById("btn-copy-art-code");

// MCP Modal
const mcpConnectModal = document.getElementById("mcp-connect-modal");
const btnCloseMcpModal = document.getElementById("btn-close-mcp-modal");
const mcpModalBackdrop = document.getElementById("mcp-modal-backdrop");
const btnCancelMcp = document.getElementById("btn-cancel-mcp");
const btnSaveMcp = document.getElementById("btn-save-mcp");

// Providers
const providersStack = document.getElementById("providers-stack");


// ── 1. Theme Management (Obsidian Dark vs Apple Light) ──────────────────────
function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("rezolotion-theme", theme);

  if (theme === "dark") {
    themeIcon.textContent = "🌙";
    themeText.textContent = "Dark Mode";
  } else {
    themeIcon.textContent = "☀️";
    themeText.textContent = "Light Mode";
  }
}

themeToggleBtn.addEventListener("click", () => {
  applyTheme(currentTheme === "dark" ? "light" : "dark");
});
applyTheme(currentTheme);


// ── 2. View Navigation ──────────────────────────────────────────────────────
function setView(viewName) {
  currentView = viewName;
  menuBtnChat.classList.toggle("active", viewName === "chat");
  menuBtnArtifacts.classList.toggle("active", viewName === "artifacts");
  menuBtnCustomize.classList.toggle("active", viewName === "customize");
  menuBtnProviders.classList.toggle("active", viewName === "providers");

  viewChat.classList.toggle("active", viewName === "chat");
  viewArtifacts.classList.toggle("active", viewName === "artifacts");
  viewCustomize.classList.toggle("active", viewName === "customize");
  viewProviders.classList.toggle("active", viewName === "providers");

  closeAllPopovers();

  if (viewName === "artifacts") {
    loadArtifacts();
  } else if (viewName === "customize") {
    loadCustomize();
  } else if (viewName === "providers") {
    loadProviders();
  }
}

menuBtnChat.addEventListener("click", () => setView("chat"));
menuBtnArtifacts.addEventListener("click", () => setView("artifacts"));
menuBtnCustomize.addEventListener("click", () => setView("customize"));
menuBtnProviders.addEventListener("click", () => setView("providers"));


function closeAllPopovers() {
  contextPopover.classList.add("hidden");
  slashMenu.classList.add("hidden");
  modelPickerMenu.classList.add("hidden");
  thinkingPickerMenu.classList.add("hidden");
}

document.addEventListener("click", (e) => {
  if (!e.target.closest("#context-popover") && !e.target.closest("#btn-open-inspector")) {
    contextPopover.classList.add("hidden");
  }
  if (!e.target.closest("#slash-menu") && !e.target.closest("#message-textarea")) {
    slashMenu.classList.add("hidden");
  }
  if (!e.target.closest("#model-picker-menu") && !e.target.closest("#btn-model-pill")) {
    modelPickerMenu.classList.add("hidden");
  }
  if (!e.target.closest("#thinking-picker-menu") && !e.target.closest("#btn-thinking-toggle")) {
    thinkingPickerMenu.classList.add("hidden");
  }
});


// ── 3. Model & Extended Thinking Selectors ───────────────────────────────────
btnModelPill.addEventListener("click", (e) => {
  e.stopPropagation();
  thinkingPickerMenu.classList.add("hidden");
  modelPickerMenu.classList.toggle("hidden");
});

document.querySelectorAll(".picker-option").forEach(opt => {
  opt.addEventListener("click", () => {
    document.querySelectorAll(".picker-option").forEach(o => o.classList.remove("active"));
    opt.classList.add("active");
    selectedModel = opt.dataset.model;
    selectedHarness = opt.dataset.harness || "claude";
    activeModelName.textContent = selectedModel;
    modelPickerMenu.classList.add("hidden");
  });
});

btnThinkingToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  modelPickerMenu.classList.add("hidden");
  thinkingPickerMenu.classList.toggle("hidden");
});

document.querySelectorAll(".thinking-option").forEach(opt => {
  opt.addEventListener("click", () => {
    document.querySelectorAll(".thinking-option").forEach(o => o.classList.remove("active"));
    opt.classList.add("active");
    selectedThinking = opt.dataset.thinking;
    const label = selectedThinking === "off" ? "Off" : (selectedThinking === "auto" ? "Auto" : selectedThinking.toUpperCase());
    thinkingModeLabel.textContent = label;
    thinkingPickerMenu.classList.add("hidden");
  });
});

btnAttach.addEventListener("click", () => {
  const input = document.createElement("input");
  input.type = "file";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      messageTextarea.value = `[Attached file: ${file.name}] ` + messageTextarea.value;
      messageTextarea.focus();
    }
  };
  input.click();
});

btnMic.addEventListener("click", () => {
  alert("Voice Dictation: Speak clearly into your microphone (Browser Speech Recognition activated).");
});


// ── 4. Slash Commands & Autocomplete ────────────────────────────────────────
messageTextarea.addEventListener("input", () => {
  const val = messageTextarea.value;
  if (val.startsWith("/")) {
    slashMenu.classList.remove("hidden");
  } else {
    slashMenu.classList.add("hidden");
  }

  // Auto-resize
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

document.querySelectorAll("[data-insert], [data-cmd]").forEach(el => {
  el.addEventListener("click", () => {
    const text = el.dataset.insert || el.dataset.cmd;
    messageTextarea.value = text;
    messageTextarea.focus();
  });
});


// ── 5. Context Inspector Popover ───────────────────────────────────────────
btnOpenInspector.addEventListener("click", (e) => {
  e.stopPropagation();
  contextPopover.classList.toggle("hidden");
});


// ── 6. WebSocket Chat ───────────────────────────────────────────────────────
function initWebSocket() {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  ws = new WebSocket(`${proto}://${location.host}/ws/chat`);

  ws.onopen = () => {
    document.getElementById("gateway-status").textContent = "Local Engine Connected";
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

  ws.send(JSON.stringify({
    message: text,
    model: selectedModel,
    thinking: selectedThinking,
  }));

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

  // If response has interactive decisions
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

function attachDecisionHandlers() {
  document.querySelectorAll(".decision-action-btn").forEach(btn => {
    btn.onclick = () => {
      const resp = btn.dataset.prompt || btn.textContent.trim();
      sendUserMessage(resp);
    };
  });
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
    <div style="font-size:12px;font-weight:600;color:var(--heat);padding:6px 14px;background:rgba(255,107,0,0.12);border-radius:20px;display:inline-block;margin:6px auto;">
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
    <div class="msg-card" style="font-size:13px;color:var(--text-2);background:var(--surface-hover);">
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
  statusRing.querySelector(".ring-spinner").style.borderColor = isSending ? "#ff9f0a" : "rgba(0,113,227,0.25)";
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


// ── 7. Customize View & MCP Marketplace (Image 2) ───────────────────────────
document.querySelectorAll("[data-cust-category]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-cust-category]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    custCategory = btn.dataset.custCategory;
    renderCustomizeList();
  });
});

document.querySelectorAll("[data-cust-scope]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-cust-scope]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    custScope = btn.dataset.custScope;
    renderCustomizeList();
  });
});

customizeSearch.addEventListener("input", renderCustomizeList);

async function loadCustomize() {
  try {
    const [skillsRes, mcpRes] = await Promise.all([
      fetch("/api/skills"),
      fetch("/api/mcp"),
    ]);
    const sData = await skillsRes.json();
    const mData = await mcpRes.json();
    skillsData = sData.skills || [];
    mcpData = mData.connectors || [];
    renderCustomizeList();
  } catch (err) {
    console.error("Error loading customize data:", err);
  }
}

function renderCustomizeList() {
  const query = (customizeSearch.value || "").toLowerCase().trim();
  customizeList.innerHTML = "";

  if (custCategory === "connectors") {
    mcpBanner.classList.remove("hidden");
    let items = mcpData;
    if (custScope === "yours") {
      items = items.filter(m => m.isConnected);
    }
    if (query) {
      items = items.filter(m => m.name.toLowerCase().includes(query) || m.description.toLowerCase().includes(query));
    }

    if (items.length === 0) {
      customizeList.innerHTML = `<div style="text-align:center;padding:32px;color:var(--text-3);">No connectors found in this view.</div>`;
      return;
    }

    items.forEach(mcp => {
      const row = document.createElement("div");
      row.className = "cust-item-row";
      row.innerHTML = `
        <div class="cust-item-left">
          <div class="cust-item-icon">${mcp.icon || '🔌'}</div>
          <div class="cust-item-meta">
            <div class="cust-item-title">${esc(mcp.name)} <span style="font-size:11px;color:var(--text-3);font-weight:normal;">(${mcp.toolsCount || 0} tools)</span></div>
            <div class="cust-item-sub">
              <span class="cust-author">by ${esc(mcp.author)}</span> · ${esc(mcp.description)}
            </div>
          </div>
        </div>
        <div>
          <button class="cust-action-btn ${mcp.isConnected ? 'installed' : ''}" data-mcp-id="${mcp.id}">
            ${mcp.isConnected ? 'Connected' : 'Connect'}
          </button>
        </div>
      `;

      row.querySelector(".cust-action-btn").addEventListener("click", async (e) => {
        e.stopPropagation();
        await toggleMcpConnection(mcp.id);
      });

      customizeList.appendChild(row);
    });

  } else if (custCategory === "skills") {
    mcpBanner.classList.add("hidden");
    let items = skillsData;
    if (custScope === "yours") {
      items = items.filter(s => s.isInstalled);
    }
    if (query) {
      items = items.filter(s => s.title.toLowerCase().includes(query) || s.description.toLowerCase().includes(query));
    }

    if (items.length === 0) {
      customizeList.innerHTML = `<div style="text-align:center;padding:32px;color:var(--text-3);">No skills found.</div>`;
      return;
    }

    items.forEach(skill => {
      const row = document.createElement("div");
      row.className = "cust-item-row";
      row.innerHTML = `
        <div class="cust-item-left">
          <div class="cust-item-icon">${skill.icon || '📜'}</div>
          <div class="cust-item-meta">
            <div class="cust-item-title">${esc(skill.title)}</div>
            <div class="cust-item-sub">
              <span class="cust-author">by ${esc(skill.author)}</span> · ${esc(skill.description)}
            </div>
          </div>
        </div>
        <div>
          <button class="cust-action-btn ${skill.isInstalled ? 'installed' : ''}" data-skill-id="${skill.id}">
            ${skill.isInstalled ? 'Installed' : 'Add'}
          </button>
        </div>
      `;

      row.querySelector(".cust-action-btn").addEventListener("click", async (e) => {
        e.stopPropagation();
        await toggleSkillInstallation(skill.id);
      });

      customizeList.appendChild(row);
    });

  } else {
    // Plugins
    mcpBanner.classList.add("hidden");
    customizeList.innerHTML = `
      <div class="cust-item-row">
        <div class="cust-item-left">
          <div class="cust-item-icon">🧩</div>
          <div class="cust-item-meta">
            <div class="cust-item-title">Apple Liquid Glass UI Plugin</div>
            <div class="cust-item-sub">by Rezolotion · Provides high-grade frosted glass design tokens and dark mode styling.</div>
          </div>
        </div>
        <div><button class="cust-action-btn installed">Active</button></div>
      </div>
      <div class="cust-item-row">
        <div class="cust-item-left">
          <div class="cust-item-icon">🛡️</div>
          <div class="cust-item-meta">
            <div class="cust-item-title">Zero-Ban Native Subprocess Bridge</div>
            <div class="cust-item-sub">by Rezolotion · Executes official installed binaries with zero telemetry manipulation.</div>
          </div>
        </div>
        <div><button class="cust-action-btn installed">Active</button></div>
      </div>
    `;
  }
}

async function toggleMcpConnection(id) {
  try {
    const res = await fetch(`/api/mcp/${id}/toggle`, { method: "POST" });
    const data = await res.json();
    const item = mcpData.find(m => m.id === id);
    if (item) item.isConnected = data.isConnected;
    renderCustomizeList();
  } catch (err) {
    console.error(err);
  }
}

async function toggleSkillInstallation(id) {
  try {
    const res = await fetch(`/api/skills/${id}/toggle`, { method: "POST" });
    const data = await res.json();
    const item = skillsData.find(s => s.id === id);
    if (item) item.isInstalled = data.isInstalled;
    renderCustomizeList();
  } catch (err) {
    console.error(err);
  }
}

// Connect Custom MCP Dialog
btnAddCustomMcp.addEventListener("click", () => {
  mcpConnectModal.classList.remove("hidden");
});
btnCloseMcpModal.addEventListener("click", () => mcpConnectModal.classList.add("hidden"));
mcpModalBackdrop.addEventListener("click", () => mcpConnectModal.classList.add("hidden"));
btnCancelMcp.addEventListener("click", () => mcpConnectModal.classList.add("hidden"));

btnSaveMcp.addEventListener("click", async () => {
  const name = document.getElementById("mcp-input-name").value.trim();
  const command = document.getElementById("mcp-input-command").value.trim();
  const description = document.getElementById("mcp-input-desc").value.trim();

  if (!name || !command) {
    alert("Please enter a valid server name and command.");
    return;
  }

  try {
    await fetch("/api/mcp/custom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, command, description }),
    });
    mcpConnectModal.classList.add("hidden");
    document.getElementById("mcp-input-name").value = "";
    document.getElementById("mcp-input-command").value = "";
    document.getElementById("mcp-input-desc").value = "";
    await loadCustomize();
  } catch (err) {
    console.error(err);
  }
});


// ── 8. Artifacts Studio (Image 3) ───────────────────────────────────────────
document.querySelectorAll("[data-artifact-filter]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-artifact-filter]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    artifactFilter = btn.dataset.artifactFilter;
    renderArtifactsGrid();
  });
});

artifactsSearch.addEventListener("input", renderArtifactsGrid);

async function loadArtifacts() {
  try {
    const res = await fetch("/api/artifacts");
    const data = await res.json();
    artifactsData = data.artifacts || [];
    renderArtifactsGrid();
  } catch (err) {
    console.error("Error loading artifacts:", err);
  }
}

function renderArtifactsGrid() {
  const query = (artifactsSearch.value || "").toLowerCase().trim();
  artifactsGrid.innerHTML = "";

  let items = artifactsData;
  if (query) {
    items = items.filter(a => a.title.toLowerCase().includes(query) || (a.summary || '').toLowerCase().includes(query));
  }

  if (items.length === 0) {
    artifactsGrid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 32px; color: var(--text-3);">No artifacts created yet. Click one of the cards above to make something new!</div>`;
    return;
  }

  items.forEach(art => {
    const tile = document.createElement("div");
    tile.className = "artifact-tile";
    tile.innerHTML = `
      <div class="tile-head">
        <span class="tile-title">${esc(art.title)}</span>
        <span class="tile-badge">${esc(art.badge || art.type)}</span>
      </div>
      <div class="tile-summary">${esc(art.summary || 'Click to view artifact contents and live preview.')}</div>
      <div class="tile-footer">
        <span>by ${esc(art.author || 'User')}</span>
        <span>${formatDate(art.createdAt)}</span>
      </div>
    `;
    tile.addEventListener("click", () => openArtifactInspector(art));
    artifactsGrid.appendChild(tile);
  });
}

// "Make something new" card actions (Image 3)
document.querySelectorAll(".creation-card").forEach(card => {
  card.addEventListener("click", () => {
    const action = card.dataset.action;
    let initialType = "docs";
    let initialTitle = "New Document";
    let initialContent = "# New Document\n\nStart writing your document here...";

    if (action === "new-slide") {
      initialType = "slides";
      initialTitle = "New Keynote Presentation";
      initialContent = "# Slide 1: Welcome\n- Key takeaway 1\n- Key takeaway 2\n\n---\n\n# Slide 2: Details\n- More details...";
    } else if (action === "new-design") {
      initialType = "design";
      initialTitle = "New Mobile UI Design";
      initialContent = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { background: #141416; color: #fff; font-family: -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .card { background: #1f1f23; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; width: 300px; }
  </style>
</head>
<body>
  <div class="card">
    <h3>Liquid Glass Card</h3>
    <p>Interactive mockup ready for review.</p>
  </div>
</body>
</html>`;
    }

    const titlePrompt = prompt("Enter title for the new artifact:", initialTitle);
    if (titlePrompt) {
      createAndOpenArtifact({
        title: titlePrompt,
        type: initialType,
        content: initialContent,
        summary: `Created via ${initialType.toUpperCase()} Beta template.`,
      });
    }
  });
});

async function createAndOpenArtifact(data) {
  try {
    const res = await fetch("/api/artifacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.success && result.artifact) {
      artifactsData.unshift(result.artifact);
      renderArtifactsGrid();
      openArtifactInspector(result.artifact);
    }
  } catch (err) {
    console.error(err);
  }
}

// Artifact Live Inspector Modal
function openArtifactInspector(art) {
  currentActiveArtifact = art;
  modalArtTitle.textContent = art.title;
  modalArtBadge.textContent = art.badge || art.type;
  modalCodeContent.textContent = art.content;

  // Render preview
  if (art.type === "design" || art.content.includes("<!DOCTYPE html>") || art.content.includes("<html")) {
    modalPreviewPane.innerHTML = `<iframe style="width:100%;height:450px;border:none;border-radius:8px;background:#fff;" srcdoc="${escAttr(art.content)}"></iframe>`;
  } else {
    modalPreviewPane.innerHTML = `<div class="msg-card" style="font-size:14px;line-height:1.6;">${formatContent(art.content)}</div>`;
  }

  // Reset tab to preview
  setModalTab("preview");
  artifactModal.classList.remove("hidden");
}

function setModalTab(tabName) {
  document.querySelectorAll(".m-tab").forEach(t => t.classList.toggle("active", t.dataset.tab === tabName));
  modalPreviewPane.classList.toggle("active", tabName === "preview");
  modalCodePane.classList.toggle("active", tabName === "code");
}

document.querySelectorAll(".m-tab").forEach(tab => {
  tab.addEventListener("click", () => setModalTab(tab.dataset.tab));
});

btnCloseModal.addEventListener("click", () => artifactModal.classList.add("hidden"));
modalBackdrop.addEventListener("click", () => artifactModal.classList.add("hidden"));

btnCopyArtCode.addEventListener("click", () => {
  if (!currentActiveArtifact) return;
  navigator.clipboard.writeText(currentActiveArtifact.content).then(() => {
    const orig = btnCopyArtCode.textContent;
    btnCopyArtCode.textContent = "Copied!";
    setTimeout(() => { btnCopyArtCode.textContent = orig; }, 1800);
  });
});


// ── 9. Providers View ───────────────────────────────────────────────────────
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
          <div class="prov-avatar-box">${p.id === 'claude' ? '✳️' : (p.id === 'antigravity' ? '🟢' : '⚡')}</div>
          <div>
            <div class="prov-title-text">${esc(p.name)}</div>
            <div class="prov-desc-text">${esc(p.description)}</div>
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


// ── 10. Helpers ─────────────────────────────────────────────────────────────
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

function escAttr(str) {
  return String(str || "")
    .replace(/"/g, "&quot;");
}

function formatDate(isoStr) {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

// ── Initialize ──────────────────────────────────────────────────────────────
initWebSocket();
