# Rezolotion Harness — Conversation Archive & Architectural History

> **Source Conversation ID:** [`8587c021-1389-4afd-87d3-91f8d5ad42d0`](conversation://8587c021-1389-4afd-87d3-91f8d5ad42d0)  
> **Topic:** Top AI Agent Harnesses & Rezolotion Meta-Harness Studio  
> **Repository:** [Rezolotion-Harness on GitHub](https://github.com/Rezolotion/Rezolotion-Harness.git)

---

## ۱. پیش‌زمینه و انگیزه شکل‌گیری (Background & Genesis)

کاربر دارای اشتراک‌های فعال **Claude Pro (Anthropic)** و **Gemini Pro / AntiGravity (Google)** بود و به دنبال راهکاری یکپارچه برای مدیریت تیم‌های ایجنتی می‌گشت، بدون اینکه نیاز باشد مداوم بین CLIها و محیط‌های مختلف جابجا شود. 

### چالش‌های اساسی:
1. **پراکندگی ابزارها:** چت کردن مداوم در ترمینال Claude Code از یک سو و در IDE یا واسط AntiGravity از سوی دیگر.
2. **از دست رفتن کانتکست (Context Loss):** هنگام سوییچ از یک مدل به مدل دیگر، مدل دوم هیچ درکی از اتفاقات قبلی ندارد و کیفیت افت می‌کند.
3. **ریسک بن شدن حساب‌ها (Ban Risk):** استفاده از اسکریپت‌ها یا واسطه‌های غیررسمی ممکن است باعث تشخیص رفتار مشکوک و مسدود شدن اشتراک‌های Pro شود. بنابراین رویکرد **اجرای بومی و نیتیو (Native Official CLI execution)** بدون دستکاری سشن الزامی بود.
4. **مناظره هم‌زمان (Multi-Model Debate):** نیاز به حالتی که چند مدل مطرح همزمان وارد گفتگو و دیبیت شوند و کاربر مثل یک گروه مشترک با آن‌ها تعامل کند.

---

## ۲. بررسی جامع برترین هارنس‌های ایجنتی (AI Agent Harnesses Benchmark)

در جریان مکالمه مبدا، تمامی هارنس‌ها و فریم‌ورک‌های برتر دنیا دسته‌بندی و ارزیابی شدند:

| نام هارنس | نوع معماری | نقاط قوت کلیدی | وضعیت در Rezolotion Harness |
| :--- | :--- | :--- | :--- |
| **Claude Code** | Official CLI (Anthropic) | سرعت فوق‌العاده، درک عمیق گیت و فایل‌ها، کامپکت‌سازی کانتکست | آداپتور بومی نیتیو (`adapters/claude_code.py`) |
| **Google AntiGravity (AGY)** | Official Agent Platform | کانتکست ۲ میلیون توکن، سیستم Subagents و Planning Mode | آداپتور اختصاصی بومی (`adapters/antigravity.py`) |
| **OpenAI Codex / ChatGPT** | CLI / Assistants | معماری استاندارد توابع و Tool Calling | آداپتور نیتیو (`adapters/codex.py`) |
| **Nous Hermes / Ollama** | Open Weights Local | حریم خصوصی ۱۰۰٪، اجرای لوکال بدون هزینه توکن | آداپتور لوکال (`adapters/hermes.py`) |
| **DeepSeek R1 & V3** | Open Weights / API | قدرت استدلال ریاضی و کدنویسی عمیق (671B MoE) | ادغام شده در سلکتور مدل و دیبیت |
| **OpenHands (All-Hands)** | Sandbox / Docker Platform | محیط کامل مرورگر و ترمینال داکر | الهام‌بخش استودیوی دسکتاپ |
| **SWE-agent** | Academic / Princeton | معماری ACI برای رفع خودکار باگ‌های مهندسی | الگوبرداری از ساختار حل مسئله |
| **LangGraph / Dify** | Orchestration Platforms | مدیریت جریان‌های گراف‌محور و لو-کد | الگوبرداری برای تب Connectors و مارکت‌پلیس |

---

## ۳. معماری فنی هسته Rezolotion Harness

```
                             ┌───────────────────────────────────────┐
                             │       Rezolotion Studio Web UI        │
                             │ (Liquid Glass / Obsidian Dark Theme)  │
                             └───────────────────┬───────────────────┘
                                                 │ WebSocket / HTTP
                                                 ▼
                             ┌───────────────────────────────────────┐
                             │        FastAPI Async Backend          │
                             │            (app.py :8000)             │
                             └──────┬────────────────────┬───────────┘
                                    │                    │
              ┌─────────────────────┼────────────────────┼─────────────────────┐
              ▼                     ▼                    ▼                     ▼
     ┌─────────────────┐   ┌─────────────────┐  ┌─────────────────┐   ┌─────────────────┐
     │ Claude Code CLI │   │ AntiGravity CLI │  │ DeepSeek / R1   │   │ OpenAI / Codex  │
     │ (Official Auth) │   │ (Native Google) │  │  (High Reason)  │   │  (GPT-4o/o3)    │
     └────────┬────────┘   └────────┬────────┘  └────────┬────────┘   └────────┬────────┘
              │                     │                    │                     │
              └─────────────────────┴──────────┬─────────┴─────────────────────┘
                                               ▼
                             ┌───────────────────────────────────┐
                             │    Context Synchronizer Engine    │
                             │        (SQLite Persistence)       │
                             └───────────────────────────────────┘
```

1. **Context Synchronizer (`core/context_sync.py`):**  
   تمامی رفت و برگشت‌های هر سشن در پایگاه‌داده محلی SQLite ذخیره شده و قبل از ارسال پرامپت به هر مدلی، تاریخچه و کانتکست به صورت تمیز تزریق می‌شود تا هیچ مدلی بی‌خبر نماند.

2. **Native Execution Strategy:**  
   بدون دستکاری کلاینت‌ها یا تزریق کدهای ناامن، از سشن‌های رسمی ورود کاربر (OAuth / CLI Auth) استفاده شده تا ریسک بن به صفر درصد برسد.

3. **Multi-Model Debate (`core/debate.py`):**  
   امکان اجرای زنجیره‌ای و تعاملی بین Claude، AntiGravity، DeepSeek و GPT برای دستیابی به اجماع یا نقد کدهای یکدیگر.

---

## ۴. تاریخچه توسعه استودیو و بازطراحی بصری (Studio Edition Evolution)

### فاز ۱: راه‌اندازی هسته و بک‌اند
- پیاده‌سازی `app.py`، آداپتورهای مدل، پایگاه داده `data/history.db`، و CLI اولیه.

### فاز ۲: استودیو و تم Apple Liquid Glass + Obsidian Dark
- طراحی سایدبار شیشه‌ای، بخش سفارشی‌سازی (`Customize`) با دسته‌های Skills، Connectors، Plugins.
- مارکت‌پلیس کانکتورهای MCP (GitHub, PostgreSQL, Brave Search, Filesystem, SQLite, Memory, Docker, Puppeteer).
- بخش Artifacts استودیو (`Docs Beta`, `Slides Beta`, `Design Beta`, `Code`) به همراه دراور پیش‌نمایش زنده.

### فاز ۳: حذف ایموجی‌ها و تجهیز به وکتورهای رسمی برندها
- حل باگ هم‌پوشانی متنی (Text-overlap) با کارت‌های اسکوئیرکل ۴۴x۴۴ پیکسل (مشابه App Store و Raycast).
- تعبیه وکتورهای SVG رسمی برندها:
  - Claude خورشیدی با رنگ خاکی Terracotta (`#e57c5c`) و بج `Official CLI`.
  - دلفین دیپ‌سیک (`#0e74db`) با بج `Open Weights`.
  - گل ورتکس اوپن‌ای‌آی (`#10a37f`).
  - اسپارکل ۴-رنگ جمنای و آنتی‌گرویتی با بج `Google`.
- سلکتور مدل بازطراحی‌شده با پاپ‌اور تعاملی و برچسب‌های رنگی فرامین روتینگ (`@claude`, `@deepseek`, `@chatgpt`, `@agy`, `@debate`).

---

## ۵. وضعیت مخزن و استقرار
- **ورک‌اسپیس رسمی:** `/home/rezolotion/Documents/agentic-projects/rezolotion-harness`
- **ریپازیتوری گیت‌هاب:** [https://github.com/Rezolotion/Rezolotion-Harness.git](https://github.com/Rezolotion/Rezolotion-Harness.git)
- **لینک مستقیم به مکالمه مبدا:** [Top AI Agent Harnesses](conversation://8587c021-1389-4afd-87d3-91f8d5ad42d0)
