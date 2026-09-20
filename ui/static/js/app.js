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
const themeIconWrap = document.getElementById("theme-icon-wrap");

// ── Vector Brand Badge & Icon Library (Studio Grade) ─────────────────────────
function getMcpBadge(mcp) {
  const id = ((mcp && mcp.id) || "").toLowerCase();
  if (id.includes("github")) {
    return `<div class="cust-item-icon mcp-brand-github" title="GitHub"><img src="/static/github.svg" alt="GitHub" /></div>`;
  }
  if (id.includes("postgres")) {
    return `<div class="cust-item-icon mcp-brand-postgres" title="PostgreSQL"><img src="/static/postgres.svg" alt="PostgreSQL" /></div>`;
  }
  if (id.includes("brave") || id.includes("search")) {
    return `<div class="cust-item-icon mcp-brand-brave" title="Brave Search"><img src="/static/brave.svg" alt="Brave" /></div>`;
  }
  if (id.includes("filesystem") || id.includes("file")) {
    return `<div class="cust-item-icon mcp-brand-filesystem" title="Local Filesystem"><img src="/static/filesystem.svg" alt="Filesystem" /></div>`;
  }
  if (id.includes("memory")) {
    return `<div class="cust-item-icon mcp-brand-memory" title="Knowledge Memory"><img src="/static/memory.svg" alt="Memory" /></div>`;
  }
  if (id.includes("sqlite")) {
    return `<div class="cust-item-icon mcp-brand-sqlite" title="SQLite"><img src="/static/sqlite.svg" alt="SQLite" /></div>`;
  }
  if (id.includes("docker")) {
    return `<div class="cust-item-icon mcp-brand-docker" title="Docker Engine"><img src="/static/docker.svg" alt="Docker" /></div>`;
  }
  if (id.includes("puppeteer")) {
    return `<div class="cust-item-icon mcp-brand-puppeteer" title="Puppeteer Browser"><img src="/static/puppeteer.svg" alt="Puppeteer" /></div>`;
  }
  return `<div class="cust-item-icon mcp-brand-filesystem"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 8 3 3-3 3"/><line x1="15" x2="15.01" y1="14" y2="14"/></svg></div>`;
}

function getSkillBadge(skill) {
  const id = ((skill && skill.id) || "").toLowerCase();
  let badgeClass = "skill-badge-code";
  let svgContent = "";

  if (id.includes("art") || id.includes("paint") || id.includes("algorithmic") || id.includes("design") || id.includes("canvas")) {
    badgeClass = "skill-badge-design";
    svgContent = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".7" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".7" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".7" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".7" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.84-.44-1.13-.29-.29-.44-.65-.44-1.13 0-.92.75-1.67 1.67-1.67h2c3.05 0 5.56-2.5 5.56-5.55C22 6.01 17.46 2 12 2z"/></svg>`;
  } else if (id.includes("doc") || id.includes("author") || id.includes("write") || id.includes("comms")) {
    badgeClass = "skill-badge-docs";
    svgContent = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;
  } else if (id.includes("learn") || id.includes("analysis") || id.includes("trend") || id.includes("metric")) {
    badgeClass = "skill-badge-analysis";
    svgContent = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`;
  } else if (id.includes("mcp") || id.includes("builder") || id.includes("server")) {
    badgeClass = "skill-badge-mcp";
    svgContent = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="8" x="2" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>`;
  } else {
    badgeClass = "skill-badge-code";
    svgContent = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`;
  }

  return `<div class="cust-item-icon ${badgeClass}">${svgContent}</div>`;
}

function getProviderBadge(providerId) {
  const pid = (providerId || "").toLowerCase();
  if (pid.includes("claude")) {
    return `<div class="prov-avatar-box claude-avatar" title="Anthropic Claude"><img src="/static/claude.svg" alt="Claude" /></div>`;
  }
  if (pid.includes("deepseek")) {
    return `<div class="prov-avatar-box deepseek-avatar" title="DeepSeek AI"><img src="/static/deepseek-icon.svg" alt="DeepSeek" /></div>`;
  }
  if (pid.includes("chatgpt") || pid.includes("openai")) {
    return `<div class="prov-avatar-box chatgpt-avatar" title="OpenAI ChatGPT"><img src="/static/chatgpt.svg" alt="ChatGPT" style="filter:invert(1);" /></div>`;
  }
  if (pid.includes("antigravity") || pid.includes("gemini")) {
    return `<div class="prov-avatar-box agy-avatar" title="Google AntiGravity"><img src="/static/gemini-sparkle.svg" alt="AntiGravity" /></div>`;
  }
  if (pid.includes("codex")) {
    return `<div class="prov-avatar-box codex-avatar" title="OpenAI Codex"><img src="/static/claude.svg" alt="Codex" /></div>`;
  }
  return `<div class="prov-avatar-box" style="background:var(--surface);"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg></div>`;
}

function getHarnessHeaderBadge(harness) {
  const h = (harness || "claude").toLowerCase();
  if (h === "claude") {
    return `<span class="msg-avatar-tag claude"><img src="/static/claude.svg" width="13" height="13" alt="Claude" /> Claude Code</span>`;
  }
  if (h === "deepseek") {
    return `<span class="msg-avatar-tag deepseek"><img src="/static/deepseek-icon.svg" width="13" height="13" alt="DeepSeek" /> DeepSeek R1</span>`;
  }
  if (h === "chatgpt") {
    return `<span class="msg-avatar-tag chatgpt"><img src="/static/chatgpt.svg" width="13" height="13" alt="ChatGPT" style="filter:invert(1);" /> ChatGPT</span>`;
  }
  if (h.includes("antigravity") || h === "agy") {
    return `<span class="msg-avatar-tag agy"><img src="/static/gemini-sparkle.svg" width="13" height="13" alt="AntiGravity" /> AntiGravity Pro</span>`;
  }
  if (h === "debate") {
    return `<span class="msg-avatar-tag debate"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ff6b00" stroke-width="2"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg> Multi-Model Debate</span>`;
  }
  return `<span class="msg-avatar-tag user">${esc(h.toUpperCase())}</span>`;
}

// ── 1. Theme Management (Obsidian Dark vs Apple Light) ──────────────────────
function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("rezolotion-theme", theme);

  if (theme === "dark") {
    if (themeIconWrap) {
      themeIconWrap.innerHTML = `
        <svg id="theme-icon-svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
        </svg>
      `;
    }
    themeText.textContent = "Dark Mode";
  } else {
    if (themeIconWrap) {
      themeIconWrap.innerHTML = `
        <svg id="theme-icon-svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2"/><path d="M12 20v2"/>
          <path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/>
          <path d="M2 12h2"/><path d="M20 12h2"/>
          <path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
        </svg>
      `;
    }
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

const activeModelIcon = document.getElementById("active-model-icon");

document.querySelectorAll(".picker-option").forEach(opt => {
  opt.addEventListener("click", () => {
    document.querySelectorAll(".picker-option").forEach(o => o.classList.remove("active"));
    opt.classList.add("active");
    selectedModel = opt.dataset.model;
    selectedHarness = opt.dataset.harness || "claude";
    activeModelName.textContent = selectedModel;
    if (activeModelIcon) {
      const logoImg = opt.querySelector(".picker-opt-logo img");
      const logoSvg = opt.querySelector(".picker-opt-logo svg");
      if (logoImg) {
        activeModelIcon.innerHTML = `<img src="${logoImg.src}" width="13" height="13" style="${logoImg.style.cssText}" alt="${selectedHarness}" />`;
      } else if (logoSvg) {
        activeModelIcon.innerHTML = logoSvg.outerHTML;
      }
    }
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
      appendSystemNotice(`Debate concluded after ${ev.rounds} rounds.`, "success");
      break;

    case "error":
      removeRoutingBanner();
      appendSystemNotice(ev.message, "error");
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
          <button class="decision-action-btn" data-prompt="تایید و ادامه همین مسیر">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:-1px;margin-right:4px;"><polyline points="20 6 9 17 4 12"/></svg> تایید و ادامه همین مسیر
          </button>
          <button class="decision-action-btn" data-prompt="بررسی گزینه‌های جایگزین">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px;margin-right:4px;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> بررسی گزینه‌های جایگزین
          </button>
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
      ${getHarnessHeaderBadge(harness)}
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
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
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
    <div style="font-size:12px;font-weight:600;color:var(--heat);padding:6px 14px;background:rgba(255,107,0,0.12);border-radius:20px;display:inline-flex;align-items:center;gap:6px;margin:6px auto;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>
      Multi-Agent Debate — Round ${round} of ${total}
    </div>
  `;
  chatViewport.appendChild(banner);
  scrollBottom();
}

function appendSystemNotice(text, type = "info") {
  const row = document.createElement("div");
  row.className = "msg-row assistant";
  const icon = type === "error"
    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff453a" stroke-width="2" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`
    : (type === "success"
      ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#30d158" stroke-width="2" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`
      : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`);

  row.innerHTML = `
    <div class="msg-card" style="font-size:13px;color:var(--text-2);background:var(--surface-hover);display:flex;align-items:center;gap:8px;">
      ${icon}
      <span>${esc(text)}</span>
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
          ${getMcpBadge(mcp)}
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
          ${getSkillBadge(skill)}
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
          <div class="cust-item-icon skill-badge-design">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 4V2a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v2a3 3 0 0 0-3 3H4a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h2a3 3 0 0 1 3 3v2a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-2a3 3 0 0 1 3-3h2a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-2a3 3 0 0 0-3-3Z"/>
            </svg>
          </div>
          <div class="cust-item-meta">
            <div class="cust-item-title">Apple Liquid Glass UI Plugin</div>
            <div class="cust-item-sub">by Rezolotion · Provides high-grade frosted glass design tokens and dark mode styling.</div>
          </div>
        </div>
        <div><button class="cust-action-btn installed">Active</button></div>
      </div>
      <div class="cust-item-row">
        <div class="cust-item-left">
          <div class="cust-item-icon skill-badge-mcp">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
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
          ${getProviderBadge(p.id)}
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
