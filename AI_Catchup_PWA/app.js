
/**
 * 共通JS
 * - AIサービス管理（index.html）
 * - AIニュース（news.html）
 * - 記帳ログ（log.html）
 * データはブラウザのlocalStorageに保存（端末ごとに独立 / オフライン対応）
 */

const PAGE = document.body.getAttribute("data-page");

/* ----- 共通: localStorage helpers ----- */
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
  const STORAGE_KEY = "aiCatchup_services_v1";

  // 初期データ（初回のみ）
  const defaultServices = [
    {
      name: "ChatGPT",
      provider: "OpenAI",
      categories: ["LLM", "アシスタント", "開発基盤"],
      status: "使用中",
      stars: 5,
      url: "https://chatgpt.com",
      note: "中心LLM。Apps/エージェント連携の基盤。"
    },
    {
      name: "Claude",
      provider: "Anthropic",
      categories: ["LLM", "アシスタント"],
      status: "要ウォッチ",
      stars: 4,
      url: "https://claude.ai",
      note: "安全性と長文処理で比較対象。"
    },
    {
      name: "Gemini",
      provider: "Google",
      categories: ["LLM", "検索連携"],
      status: "要ウォッチ",
      stars: 4,
      url: "https://gemini.google.com",
      note: "Googleサービス統合の動きを見る。"
    },
    {
      name: "DALL·E",
      provider: "OpenAI",
      categories: ["画像生成"],
      status: "使用中",
      stars: 4,
      url: "https://openai.com",
      note: "画像生成のベースライン。"
    },
    {
      name: "Suno",
      provider: "Suno",
      categories: ["音楽/音声"],
      status: "使用中",
      stars: 4,
      url: "https://suno.com",
      note: "AI音楽分野の代表。"
    }
  ];

  let services = loadJSON(STORAGE_KEY, null);
  if (!services || !Array.isArray(services) || services.length === 0) {
    services = defaultServices;
    saveJSON(STORAGE_KEY, services);
  }

  const cardsGrid = document.getElementById("cardsGrid");
  const searchInput = document.getElementById("searchInput");
  const minStarsSelect = document.getElementById("minStarsSelect");
  const categoryPillsContainer = document.getElementById("categoryPills");

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

        card.appendChild(title);
        card.appendChild(provider);
        card.appendChild(tags);
        if (s.stars) card.appendChild(starsEl);
        card.appendChild(note);

        cardsGrid.appendChild(card);
      });

    if (!cardsGrid.innerHTML) {
      cardsGrid.innerHTML = '<div style="font-size:10px;color:var(--muted);">条件に合うサービスがありません。</div>';
    }
  }

  // Add form
  toggleAddFormBtn.addEventListener("click", () => {
    addForm.style.display = addForm.style.display === "none" || !addForm.style.display ? "block" : "none";
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
      .split(",")
      .map(c => c.trim())
      .filter(Boolean);
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

    renderCategoryPills();
    renderCards();
  });

  searchInput.addEventListener("input", renderCards);
  minStarsSelect.addEventListener("change", renderCards);

  renderCategoryPills();
  renderCards();
}

/* ===== ② News Page ===== */
if (PAGE === "news") {
  const STATIC_NEWS = [
    {
      tag: "Model",
      title: "主要LLMベンダーが新モデルを連続発表し、推論効率とマルチモーダル性能が大幅向上",
      source: "Official Blogs",
      date: "2025-10-01",
      note: "OpenAI / Anthropic / Google 等の公式ブログで要チェック。"
    },
    {
      tag: "Safety",
      title: "各国でAI安全フレームワークの策定が進行、モデル評価指標が整備されつつある",
      source: "Policy Reports",
      date: "2025-09-15",
      note: "安全・ガバナンス動向は長期的に重要。"
    },
    {
      tag: "Biz",
      title: "大手SaaSがエージェント機能を正式実装、日常業務の自動化が本格フェーズへ",
      source: "Tech News",
      date: "2025-10-20",
      note: "自分の仕事・キャリアに直結する領域を優先ウォッチ。"
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
        <div style="font-size:8px;color:#9ca3af;">${n.note || ""}</div>
      `;
      newsList.appendChild(item);
    });

    if (!newsList.innerHTML) {
      newsList.innerHTML = '<div style="font-size:9px;color:#9ca3af;">該当ニュースがありません。</div>';
    }
  }

  renderNews();
  searchInput.addEventListener("input", renderNews);

  // 将来: /api/ai-news から取得して STATIC_NEWS を上書きする拡張が可能
}

/* ===== ③ Log Page ===== */
if (PAGE === "log") {
  const STORAGE_KEY = "aiCatchup_logs_v1";

  let logs = loadJSON(STORAGE_KEY, []);

  const dateInput = document.getElementById("logDate");
  const titleInput = document.getElementById("logTitle");
  const learningInput = document.getElementById("logLearning");
  const feelingInput = document.getElementById("logFeeling");
  const scoreInput = document.getElementById("logScore");
  const tagsInput = document.getElementById("logTags");
  const saveBtn = document.getElementById("saveLogBtn");
  const clearBtn = document.getElementById("clearTodayBtn");
  const logList = document.getElementById("logList");

  // デフォルト日付 = 今日
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  dateInput.value = `${yyyy}-${mm}-${dd}`;

  function renderLogs() {
    logList.innerHTML = "";
    if (!logs || logs.length === 0) {
      logList.innerHTML = '<div style="font-size:9px;color:#9ca3af;">まだログがありません。今日の一行から始めよう。</div>';
      return;
    }

    // 日付降順
    const sorted = logs.slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));

    sorted.forEach(entry => {
      const item = document.createElement("div");
      item.className = "log-item";

      const date = document.createElement("div");
      date.className = "log-date";
      date.textContent = entry.date || "";

      const title = document.createElement("div");
      title.className = "log-title";
      title.textContent = entry.title || "(タイトルなし)";

      const body = document.createElement("div");
      body.className = "log-body";
      body.textContent = entry.learning || "";

      const feeling = document.createElement("div");
      feeling.className = "log-body";
      if (entry.feeling) {
        feeling.textContent = "感情・メモ: " + entry.feeling;
      }

      const meta = document.createElement("div");
      meta.className = "log-metrics";
      const score = entry.score != null ? `★${entry.score}` : "";
      const tags = (entry.tags || []).length ? `タグ: ${entry.tags.join(", ")}` : "";
      meta.textContent = [score, tags].filter(Boolean).join(" / ");

      item.appendChild(date);
      item.appendChild(title);
      item.appendChild(body);
      if (entry.feeling) item.appendChild(feeling);
      if (meta.textContent) item.appendChild(meta);

      logList.appendChild(item);
    });
  }

  saveBtn.addEventListener("click", () => {
    const date = dateInput.value || "";
    const title = titleInput.value.trim();
    const learning = learningInput.value.trim();
    const feeling = feelingInput.value.trim();
    const score = scoreInput.value ? Math.max(0, Math.min(5, parseInt(scoreInput.value, 10))) : null;
    const tags = (tagsInput.value || "").split(",").map(t => t.trim()).filter(Boolean);

    if (!date && !learning && !title) return;

    logs.push({ date, title, learning, feeling, score, tags });
    saveJSON(STORAGE_KEY, logs);

    titleInput.value = "";
    learningInput.value = "";
    feelingInput.value = "";
    scoreInput.value = "";
    tagsInput.value = "";

    renderLogs();
  });

  clearBtn.addEventListener("click", () => {
    titleInput.value = "";
    learningInput.value = "";
    feelingInput.value = "";
    scoreInput.value = "";
    tagsInput.value = "";
  });

  renderLogs();
}
