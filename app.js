
/**
 * 共通JS
 * - AIサービス管理（お気に入り/分野ベスト設定）
 * - AIニュース（簡易フィルタ）
 * - 記帳ログ（シンプル一行ログ）
 * データは localStorage に保存（端末ごと / オフライン可）
 */

const PAGE = document.body.getAttribute("data-page");

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error("loadJSON error", key, e);
    return fallback;
  }
}
function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("saveJSON error", key, e);
  }
}

/* ===== ① Services Page ===== */
if (PAGE === "services") {
  const STORAGE_KEY = "aiCatchup_services_v2";
  const BEST_KEY = "aiCatchup_bestByCategory_v1";

  const defaultServices = [
    {
      name: "ChatGPT",
      provider: "OpenAI",
      categories: ["LLM", "アシスタント", "開発基盤"],
      status: "使用中",
      stars: 5,
      url: "https://chatgpt.com",
      note: "中核LLM。Apps/エージェント連携の中心。"
    },
    {
      name: "Claude",
      provider: "Anthropic",
      categories: ["LLM", "アシスタント"],
      status: "要ウォッチ",
      stars: 4,
      url: "https://claude.ai",
      note: "安全性・長文処理の比較対象。"
    },
    {
      name: "Gemini",
      provider: "Google",
      categories: ["LLM", "検索連携"],
      status: "要ウォッチ",
      stars: 4,
      url: "https://gemini.google.com",
      note: "Google連携の基準としてチェック。"
    },
    {
      name: "DALL·E",
      provider: "OpenAI",
      categories: ["画像生成"],
      status: "使用中",
      stars: 4,
      url: "https://openai.com",
      note: "画像生成の基準。"
    },
    {
      name: "Suno",
      provider: "Suno",
      categories: ["音楽/音声"],
      status: "使用中",
      stars: 4,
      url: "https://suno.com",
      note: "AI音楽の代表例として記録。"
    }
  ];

  let services = loadJSON(STORAGE_KEY, null);
  if (!services || !Array.isArray(services) || services.length === 0) {
    services = defaultServices;
    saveJSON(STORAGE_KEY, services);
  }
  let bestByCategory = loadJSON(BEST_KEY, {});

  const cardsGrid = document.getElementById("cardsGrid");
  const searchInput = document.getElementById("searchInput");
  const minStarsSelect = document.getElementById("minStarsSelect");
  const categoryPillsContainer = document.getElementById("categoryPills");
  const bestSummary = document.getElementById("bestSummary");

  const toggleAddFormBtn = document.getElementById("toggleAddFormBtn");
  const addForm = document.getElementById("addForm");
  const cancelAddFormBtn = document.getElementById("cancelAddFormBtn");
  const saveServiceBtn = document.getElementById("saveServiceBtn");

  let activeCategory = null;

  function getAllCategories() {
    const set = new Set();
    services.forEach(s => (s.categories || []).forEach(c => set.add(c)));
    return Array.from(set).sort();
  }

  function renderBestSummary() {
    bestSummary.innerHTML = "";
    const entries = Object.entries(bestByCategory);
    if (!entries.length) {
      bestSummary.innerHTML = '<span class="note-small">まだ「分野ベスト」が設定されていません。カード内の「分野ベストに設定」から登録できます。</span>';
      return;
    }
    entries.forEach(([cat, name]) => {
      const pill = document.createElement("div");
      pill.className = "best-pill";
      pill.textContent = `${cat}: ${name}`;
      bestSummary.appendChild(pill);
    });
  }

  function renderCategoryPills() {
    categoryPillsContainer.innerHTML = "";
    const allBtn = document.createElement("div");
    allBtn.textContent = "All";
    allBtn.className = "category-pill" + (activeCategory ? "" : " active");
    allBtn.onclick = () => {
      activeCategory = null;
      renderCategoryPills();
      renderCards();
    };
    categoryPillsContainer.appendChild(allBtn);

    getAllCategories().forEach(cat => {
      const pill = document.createElement("div");
      pill.textContent = cat;
      pill.className = "category-pill" + (activeCategory === cat ? " active" : "");
      pill.onclick = () => {
        activeCategory = (activeCategory === cat) ? null : cat;
        renderCategoryPills();
        renderCards();
      };
      categoryPillsContainer.appendChild(pill);
    });
  }

  function isBestForAnyCategory(service) {
    const names = new Set(Object.values(bestByCategory));
    return names.has(service.name);
  }

  function setBestForCategories(service) {
    (service.categories || []).forEach(cat => {
      if (cat) {
        bestByCategory[cat] = service.name;
      }
    });
    saveJSON(BEST_KEY, bestByCategory);
    renderBestSummary();
    renderCards();
  }

  function renderCards() {
    const q = (searchInput.value || "").trim().toLowerCase();
    const minStars = parseInt(minStarsSelect.value || "0", 10);
    cardsGrid.innerHTML = "";

    services
      .slice()
      .sort((a, b) => (b.stars || 0) - (a.stars || 0))
      .filter(s => {
        if (minStars && (s.stars || 0) < minStars) return false;
        if (activeCategory && !(s.categories || []).includes(activeCategory)) return false;
        if (!q) return true;
        const text = [
          s.name,
          s.provider,
          (s.categories || []).join(" "),
          s.status,
          s.note || ""
        ].join(" ").toLowerCase();
        return text.includes(q);
      })
      .forEach((s, index) => {
        const card = document.createElement("div");
        card.className = "card";

        const title = document.createElement("div");
        title.className = "card-title";
        const nameSpan = document.createElement("span");
        nameSpan.textContent = s.name;
        const statusSpan = document.createElement("span");
        statusSpan.className = "card-status";
        statusSpan.textContent = s.status || "";
        title.appendChild(nameSpan);
        title.appendChild(statusSpan);

        const provider = document.createElement("div");
        provider.className = "card-provider";
        provider.textContent = s.provider || "";

        const tags = document.createElement("div");
        tags.className = "card-tags";
        (s.categories || []).forEach(c => {
          const tag = document.createElement("span");
          tag.className = "card-tag";
          tag.textContent = c;
          tags.appendChild(tag);
        });

        const starsEl = document.createElement("div");
        starsEl.className = "card-stars";
        if (s.stars && s.stars > 0) {
          starsEl.textContent = "★".repeat(s.stars);
        }

        const note = document.createElement("div");
        note.className = "card-note";
        note.textContent = s.note || "";

        if (isBestForAnyCategory(s)) {
          const bestEl = document.createElement("div");
          bestEl.className = "card-best";
          bestEl.textContent = "分野ベストに選出中";
          note.appendChild(document.createElement("br"));
          note.appendChild(bestEl);
        }

        if (s.url) {
          const link = document.createElement("a");
          link.href = s.url;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.textContent = "公式サイト";
          link.className = "card-link";
          note.appendChild(document.createElement("br"));
          note.appendChild(link);
        }

        // ベスト設定ボタン
        const bestBtn = document.createElement("button");
        bestBtn.className = "btn btn-xs";
        bestBtn.style.marginTop = "4px";
        bestBtn.textContent = "分野ベストに設定";
        bestBtn.addEventListener("click", () => setBestForCategories(s));

        card.appendChild(title);
        card.appendChild(provider);
        card.appendChild(tags);
        if (s.stars) card.appendChild(starsEl);
        card.appendChild(note);
        card.appendChild(bestBtn);

        cardsGrid.appendChild(card);
      });

    if (!cardsGrid.innerHTML) {
      cardsGrid.innerHTML = '<div style="font-size:10px;color:#6b7280;">条件に合うサービスがありません。</div>';
    }
  }

  // イベント
  toggleAddFormBtn.addEventListener("click", () => {
    const visible = addForm.style.display === "block";
    addForm.style.display = visible ? "none" : "block";
  });
  if (cancelAddFormBtn) {
    cancelAddFormBtn.addEventListener("click", () => {
      addForm.style.display = "none";
    });
  }
  saveServiceBtn.addEventListener("click", () => {
    const name = document.getElementById("addName").value.trim();
    if (!name) return;
    const provider = document.getElementById("addProvider").value.trim();
    const categories = (document.getElementById("addCategories").value || "")
      .split(",").map(c => c.trim()).filter(Boolean);
    const status = document.getElementById("addStatus").value.trim() || "情報だけ";
    const url = document.getElementById("addUrl").value.trim();
    const stars = parseInt(document.getElementById("addStars").value || "0", 10) || 0;
    const note = document.getElementById("addNote").value.trim();

    services.push({ name, provider, categories, status, url, stars, note });
    saveJSON(STORAGE_KEY, services);

    document.getElementById("addName").value = "";
    document.getElementById("addProvider").value = "";
    document.getElementById("addCategories").value = "";
    document.getElementById("addStatus").value = "";
    document.getElementById("addUrl").value = "";
    document.getElementById("addStars").value = "";
    document.getElementById("addNote").value = "";

    addForm.style.display = "none";
    renderCategoryPills();
    renderCards();
  });

  searchInput.addEventListener("input", renderCards);
  minStarsSelect.addEventListener("change", renderCards);

  renderCategoryPills();
  renderBestSummary();
  renderCards();
}

/* ===== ② News Page ===== */
if (PAGE === "news") {
  const STATIC_NEWS = [
    {
      tag: "Model",
      title: "主要LLMベンダーが新モデルを相次いで発表し、推論効率とマルチモーダル性能が向上",
      source: "Official Blogs",
      date: "2025-10-01",
      note: "OpenAI / Anthropic / Google などの動向を追う。"
    },
    {
      tag: "Safety",
      title: "各国でAI安全フレームワーク議論が進行し、評価指標が整備されつつある",
      source: "Policy Reports",
      date: "2025-09-15",
      note: "長期的なルール形成に関わるニュース。"
    },
    {
      tag: "Biz",
      title: "大手SaaSがAIエージェント機能を実装し、日常業務の自動化が本格フェーズへ",
      source: "Tech News",
      date: "2025-10-20",
      note: "自分の仕事に直結しそうかを意識して読む。"
    }
  ];

  const newsList = document.getElementById("newsList");
  const searchInput = document.getElementById("newsSearchInput");

  function renderNews() {
    const q = (searchInput.value || "").trim().toLowerCase();
    newsList.innerHTML = "";

    STATIC_NEWS.filter(n => {
      if (!q) return true;
      const text = (n.tag + " " + n.title + " " + n.source + " " + (n.note || "")).toLowerCase();
      return text.includes(q);
    }).forEach(n => {
      const item = document.createElement("div");
      item.className = "news-item";
      item.innerHTML = `
        <div class="news-tag">#${n.tag}</div>
        <div class="news-title">${n.title}</div>
        <div class="news-meta">${n.source}｜${n.date}</div>
        <div style="font-size:8px;color:#6b7280;">${n.note || ""}</div>
      `;
      newsList.appendChild(item);
    });

    if (!newsList.innerHTML) {
      newsList.innerHTML = '<div style="font-size:9px;color:#6b7280;">該当ニュースがありません。</div>';
    }
  }

  renderNews();
  searchInput.addEventListener("input", renderNews);

  // 将来: /api/ai-news から取得して STATIC_NEWS を置き換える処理をここに追加可能
}

/* ===== ③ Log Page (simple) ===== */
if (PAGE === "log") {
  const STORAGE_KEY = "aiCatchup_logs_simple_v1";

  let logs = loadJSON(STORAGE_KEY, []);

  const dateInput = document.getElementById("logDate");
  const textInput = document.getElementById("logText");
  const scoreInput = document.getElementById("logScore");
  const saveBtn = document.getElementById("saveLogBtn");
  const clearBtn = document.getElementById("clearTodayBtn");
  const logList = document.getElementById("logList");

  // 今日の日付をセット
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  if (!dateInput.value) {
    dateInput.value = `${yyyy}-${mm}-${dd}`;
  }

  function renderLogs() {
    logList.innerHTML = "";
    if (!logs || logs.length === 0) {
      logList.innerHTML = '<div style="font-size:9px;color:#6b7280;">まだログがありません。短く一行から始めよう。</div>';
      return;
    }

    const sorted = logs.slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));

    sorted.forEach(entry => {
      const item = document.createElement("div");
      item.className = "log-item";

      const dateEl = document.createElement("div");
      dateEl.className = "log-date";
      dateEl.textContent = entry.date || "";

      const titleEl = document.createElement("div");
      titleEl.className = "log-title";
      titleEl.textContent = entry.text || "";

      const metaEl = document.createElement("div");
      metaEl.className = "log-metrics";
      metaEl.textContent = entry.score != null ? `★${entry.score}` : "";
      if (!metaEl.textContent) metaEl.style.display = "none";

      item.appendChild(dateEl);
      item.appendChild(titleEl);
      if (metaEl.textContent) item.appendChild(metaEl);

      logList.appendChild(item);
    });
  }

  saveBtn.addEventListener("click", () => {
    const date = dateInput.value || "";
    const text = textInput.value.trim();
    const score = scoreInput.value ? Math.max(0, Math.min(5, parseInt(scoreInput.value, 10))) : null;
    if (!date && !text) return;
    if (!text) return; // 一行ログ前提

    logs.push({ date, text, score });
    saveJSON(STORAGE_KEY, logs);

    textInput.value = "";
    scoreInput.value = "";

    renderLogs();
  });

  clearBtn.addEventListener("click", () => {
    textInput.value = "";
    scoreInput.value = "";
  });

  renderLogs();
}
