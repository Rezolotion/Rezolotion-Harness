/**
 * Claude Code Studio — Frontend Interactive Engine
 * Handles 3-column layout, popovers, model switcher, context inspector,
 * interactive choice chips, skills store, and WebSocket multi-agent chat.
 */

// ── Application State ──────────────────────────────────────────────────────
const state = {
  currentView: "chat", // "chat" | "customize"
  activeModel: "Opus 5",
  isFastMode: false,
  isThinkingAuto: true,
  rightSidebarOpen: true,
  contextUsage: {
    total: 319600,
    max: 1000000,
    messages: 269200,
    skills: 9900,
    systemTools: 9200,
    mcpTools: 7800,
    systemPrompt: 3500,
    free: 650400,
  },
  skillsCatalog: [
    { id: "algorithmic-art", name: "algorithmic-art", author: "by Anthropic", desc: "Creating algorithmic art using p5.js with seeded randomness and interactive parameter exploration." },
    { id: "brand-guidelines", name: "brand-guidelines", author: "by Anthropic", desc: "Applies Anthropic's official brand colors and typography to any sort of artifact that may benefit..." },
    { id: "canvas-design", name: "canvas-design", author: "by Anthropic", desc: "Create beautiful visual art in .png and .pdf documents using design philosophy. You should us..." },
    { id: "dcc-coauthoring", name: "dcc-coauthoring", author: "by Anthropic", desc: "Guide users through a structured workflow for co-authoring documentation. Use when user ..." },
    { id: "internal-comms", name: "internal-comms", author: "by Anthropic", desc: "A set of resources to help me write all kinds of internal communications, using the formats th..." },
    { id: "learn", name: "learn", author: "by Anthropic", desc: "Use this skill when the user wants intellectual understanding — learning how or why somethi..." },
    { id: "mcp-builder", name: "mcp-builder", author: "by Anthropic", desc: "Guide for creating high-quality MCP (Model Context Protocol) servers that enable LLMs to i..." },
    { id: "slack-gif-creator", name: "slack-gif-creator", author: "by Anthropic", desc: "Knowledge and utilities for creating animated GIFs optimized for Slack. Provides constraints, ..." },
    { id: "theme-factory", name: "theme-factory", author: "by Anthropic", desc: "Toolkit for styling artifacts with a theme. These artifacts can be slides, docs, reportings, HTM..." },
    { id: "web-artifacts-builder", name: "web-artifacts-builder", author: "by Anthropic", desc: "Suite of tools for creating elaborate, multi-component claude.ai HTML artifacts using modern..." }
  ],
  addedSkills: new Set(["canvas-design", "learn"])
};

// ── DOM Elements ───────────────────────────────────────────────────────────
const leftSidebar = document.getElementById("left-sidebar");
const rightSidebar = document.getElementById("right-sidebar");
const studioChatView = document.getElementById("studio-chat-view");
const studioCustomizeView = document.getElementById("studio-customize-view");

const navBtnNewChat = document.getElementById("nav-btn-new-chat");
const navBtnCustomize = document.getElementById("nav-btn-customize");
const btnToggleRightSidebar = document.getElementById("btn-toggle-right-sidebar");
const btnCloseRightSidebar = document.getElementById("btn-close-right-sidebar");

// Popovers
const modelPopover = document.getElementById("model-popover");
const btnModelPicker = document.getElementById("btn-model-picker");
const currentActiveModelLabel = document.getElementById("current-active-model-label");
const moreModelsTrigger = document.getElementById("more-models-trigger");
const moreModelsSubmenu = document.getElementById("more-models-submenu");
const fastModeToggle = document.getElementById("fast-mode-toggle");

const contextPopover = document.getElementById("context-popover");
const btnContextInspector = document.getElementById("btn-context-inspector");

const filterPopover = document.getElementById("filter-popover");
const btnProjectFilter = document.getElementById("btn-project-filter");

// Chat & Inputs
const messagesContainer = document.getElementById("messages-container");
const studioChatForm = document.getElementById("studio-chat-form");
const studioTextarea = document.getElementById("studio-textarea");
const studioSubmitBtn = document.getElementById("studio-submit-btn");
const thinkingText = document.getElementById("thinking-text");

// Skills Store
const skillsCatalogList = document.getElementById("skills-catalog-list");
const skillsSearchInput = document.getElementById("skills-search-input");


// ── View Switching ─────────────────────────────────────────────────────────
function setView(viewName) {
  state.currentView = viewName;

  navBtnNewChat.classList.toggle("active", viewName === "chat");
  navBtnCustomize.classList.toggle("active", viewName === "customize");

  studioChatView.classList.toggle("active", viewName === "chat");
  studioCustomizeView.classList.toggle("active", viewName === "customize");

  closeAllPopovers();

  if (viewName === "customize") {
    renderSkillsCatalog();
  }
}

navBtnNewChat.addEventListener("click", () => setView("chat"));
navBtnCustomize.addEventListener("click", () => setView("customize"));


// ── Right Sidebar Toggle (Background tasks) ────────────────────────────────
function toggleRightSidebar() {
  state.rightSidebarOpen = !state.rightSidebarOpen;
  rightSidebar.classList.toggle("collapsed", !state.rightSidebarOpen);
}
btnToggleRightSidebar.addEventListener("click", toggleRightSidebar);
btnCloseRightSidebar.addEventListener("click", toggleRightSidebar);


// ── Popovers Management ────────────────────────────────────────────────────
function closeAllPopovers() {
  modelPopover.classList.add("hidden");
  contextPopover.classList.add("hidden");
  filterPopover.classList.add("hidden");
  moreModelsSubmenu.classList.add("hidden");
}

document.addEventListener("click", (e) => {
  if (
    !e.target.closest(".studio-popover") &&
    !e.target.closest(".model-picker-trigger") &&
    !e.target.closest(".token-meter-trigger") &&
    !e.target.closest("#btn-project-filter")
  ) {
    closeAllPopovers();
  }
});

// 1. Model Picker Popover (Image 2)
btnModelPicker.addEventListener("click", (e) => {
  e.stopPropagation();
  const isOpen = !modelPopover.classList.contains("hidden");
  closeAllPopovers();
  if (!isOpen) {
    modelPopover.classList.remove("hidden");
  }
});

moreModelsTrigger.addEventListener("mouseenter", () => {
  moreModelsSubmenu.classList.remove("hidden");
});

document.querySelectorAll(".popover-item[data-model]").forEach((item) => {
  item.addEventListener("click", () => {
    const model = item.dataset.model;
    const name = item.querySelector(".item-name").textContent.split("<")[0].trim();
    state.activeModel = name;
    currentActiveModelLabel.textContent = name;
    closeAllPopovers();
    updateThinkingBanner(`Ready with ${name}`);
  });
});

fastModeToggle.addEventListener("change", (e) => {
  state.isFastMode = e.target.checked;
});

// 2. Context Window & Quota Popover (Image 3)
btnContextInspector.addEventListener("click", (e) => {
  e.stopPropagation();
  const isOpen = !contextPopover.classList.contains("hidden");
  closeAllPopovers();
  if (!isOpen) {
    contextPopover.classList.remove("hidden");
  }
});

// 3. Project Filter Popover (Image 4)
btnProjectFilter.addEventListener("click", (e) => {
  e.stopPropagation();
  const isOpen = !filterPopover.classList.contains("hidden");
  closeAllPopovers();
  if (!isOpen) {
    const rect = btnProjectFilter.getBoundingClientRect();
    filterPopover.style.top = `${rect.bottom + 6}px`;
    filterPopover.style.left = `${rect.left}px`;
    filterPopover.classList.remove("hidden");
  }
});


// ── Skills Store Catalog (Image 5) ─────────────────────────────────────────
function renderSkillsCatalog(filterText = "") {
  skillsCatalogList.innerHTML = "";
  const query = filterText.toLowerCase();

  const filtered = state.skillsCatalog.filter(s =>
    s.name.toLowerCase().includes(query) || s.desc.toLowerCase().includes(query)
  );

  filtered.forEach(skill => {
    const isAdded = state.addedSkills.has(skill.id);
    const card = document.createElement("div");
    card.className = "skill-card-item";
    card.innerHTML = `
      <div class="skill-card-left">
        <div class="skill-icon-wrap">📄</div>
        <div class="skill-info">
          <div class="skill-title-row">
            <span class="skill-name">${skill.name}</span>
            <span class="skill-author">${skill.author}</span>
          </div>
          <div class="skill-desc">${skill.desc}</div>
        </div>
      </div>
      <button class="btn-add-skill ${isAdded ? 'added' : ''}" data-id="${skill.id}">
        ${isAdded ? '✔ Added' : 'Add'}
      </button>
    `;

    card.querySelector(".btn-add-skill").addEventListener("click", function() {
      if (state.addedSkills.has(skill.id)) {
        state.addedSkills.delete(skill.id);
        this.classList.remove("added");
        this.textContent = "Add";
      } else {
        state.addedSkills.add(skill.id);
        this.classList.add("added");
        this.textContent = "✔ Added";
      }
    });

    skillsCatalogList.appendChild(card);
  });
}

skillsSearchInput?.addEventListener("input", (e) => {
  renderSkillsCatalog(e.target.value);
});


// ── Interactive Decision Chips Handler (Image 1) ───────────────────────────
function setupDecisionChips() {
  document.querySelectorAll(".decision-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const responseText = chip.dataset.response || chip.textContent.trim();
      sendUserMessage(responseText);
    });
  });
}
setupDecisionChips();


// ── WebSocket Multi-Agent Chat ─────────────────────────────────────────────
let ws = null;

function initWebSocket() {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  ws = new WebSocket(`${proto}://${location.host}/ws/chat`);

  ws.onopen = () => {
    updateThinkingBanner("Connected & Ready");
  };

  ws.onmessage = ({ data }) => {
    const ev = JSON.parse(data);
    handleChatEvent(ev);
  };

  ws.onclose = () => {
    updateThinkingBanner("Reconnecting…");
    setTimeout(initWebSocket, 2500);
  };
}

function handleChatEvent(ev) {
  switch (ev.event) {
    case "routing":
      updateThinkingBanner(`Routing to ${ev.targets.join(", ")}…`);
      showLiveThinkingIndicator(ev.targets[0]);
      break;

    case "response":
      removeLiveThinkingIndicator();
      appendAssistantMessage(ev.harness, ev.model, ev.content);
      updateThinkingBanner(`Ready · Last response: ${ev.tokens?.output || 0} tokens`);
      break;

    case "debate_round_start":
      updateThinkingBanner(`🎭 Debate Round ${ev.round} of ${ev.total}…`);
      break;

    case "debate_response":
      appendAssistantMessage(ev.harness, ev.model, ev.content);
      break;

    case "debate_complete":
      updateThinkingBanner(`✅ Debate complete (${ev.rounds} rounds)`);
      break;

    case "error":
      removeLiveThinkingIndicator();
      appendAssistantMessage("error", "system", `❌ ${ev.message}`);
      updateThinkingBanner("Error occurred");
      break;

    case "done":
      setSubmitting(false);
      break;
  }
}

function sendUserMessage(text) {
  if (!text || !ws || ws.readyState !== WebSocket.OPEN) return;

  // Append user message
  appendUserMessage(text);
  setSubmitting(true);
  updateThinkingBanner("Thinking… ⏱️");

  ws.send(JSON.stringify({ message: text }));
}

function appendUserMessage(text) {
  const wrap = document.createElement("div");
  wrap.className = "agent-msg-bubble user-bubble";
  wrap.innerHTML = `
    <div style="background:rgba(255,255,255,0.06);padding:12px 18px;border-radius:12px;border:1px solid rgba(255,255,255,0.1);align-self:flex-end;color:#fff;">
      ${escHtml(text)}
    </div>
  `;
  wrap.style.alignItems = "flex-end";
  messagesContainer.appendChild(wrap);
  scrollChatBottom();
}

function appendAssistantMessage(harness, model, content) {
  const bubble = document.createElement("div");
  bubble.className = "agent-msg-bubble";

  let renderedContent = formatMarkdown(content);

  // If content contains a decision prompt question, automatically inject clickable decision chips!
  if (content.includes("می‌خوای") || content.includes("چیکار کنم") || content.includes("کدوم مسیر")) {
    renderedContent += `
      <div class="interactive-decision-box">
        <div class="decision-prompt-title">می‌خوای چیکار کنم؟</div>
        <div class="decision-options-group">
          <button class="decision-chip" data-response="تایید و اجرای این مسیر"><span class="chip-text">✔ بله، همین مسیر رو ادامه بده</span></button>
          <button class="decision-chip" data-response="بررسی گزینه‌های جایگزین"><span class="chip-text">🔍 گزینه‌های جایگزین رو بررسی کن</span></button>
        </div>
      </div>
    `;
  }

  bubble.innerHTML = `
    <div class="agent-content-area">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:11.5px;color:var(--text-muted);">
        <span style="color:var(--claude-accent);font-weight:600;">${harness.toUpperCase()}</span>
        <span>&bull;</span>
        <span>${model || 'Claude Code Studio'}</span>
      </div>
      ${renderedContent}
    </div>
  `;

  messagesContainer.appendChild(bubble);
  setupDecisionChips();
  scrollChatBottom();
}

function showLiveThinkingIndicator(target) {
  let indicator = document.getElementById("live-stream-indicator");
  if (!indicator) {
    indicator = document.createElement("div");
    indicator.id = "live-stream-indicator";
    indicator.className = "agent-msg-bubble";
    indicator.innerHTML = `
      <div class="tool-execution-drawer" style="padding:10px 14px;display:flex;align-items:center;gap:10px;">
        <span class="spark-icon">✨</span>
        <span style="font-size:12.5px;color:var(--text-sub);">Thinking with ${target}…</span>
      </div>
    `;
    messagesContainer.appendChild(indicator);
    scrollChatBottom();
  }
}

function removeLiveThinkingIndicator() {
  document.getElementById("live-stream-indicator")?.remove();
}

function updateThinkingBanner(text) {
  if (thinkingText) {
    thinkingText.textContent = text;
  }
}

function scrollChatBottom() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function setSubmitting(isSubmitting) {
  studioSubmitBtn.disabled = isSubmitting;
  studioTextarea.disabled = isSubmitting;
  if (!isSubmitting) studioTextarea.focus();
}

// ── Submit Input Form ──────────────────────────────────────────────────────
studioChatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = studioTextarea.value.trim();
  if (!text) return;

  sendUserMessage(text);
  studioTextarea.value = "";
  studioTextarea.style.height = "auto";
});

studioTextarea.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    studioChatForm.requestSubmit();
  }
});

studioTextarea.addEventListener("input", () => {
  studioTextarea.style.height = "auto";
  studioTextarea.style.height = Math.min(studioTextarea.scrollHeight, 180) + "px";
});


// ── Markdown Formatter ─────────────────────────────────────────────────────
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


// ── Initialize ─────────────────────────────────────────────────────────────
initWebSocket();
