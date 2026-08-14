/*
  Research AI Lab
  Frontend prototype

  IMPORTANT:
  API keys must NEVER be placed in this file.
  Supabase and AI APIs will be connected securely later.
*/

"use strict";


/* =========================================================
   Research Data
========================================================= */

const researchState = {

  project: {
    id: "project-001",
    name: "新しい数学研究",
    description:
      "仮説・計算・反証・証明を統合して探索する研究プロジェクト"
  },

  results: [

    {
      id: "result-001",
      status: "good",
      mark: "○",
      title: "不変量候補 I(x)",
      description:
        "数値実験で予想された不変量が複数条件で一致。",
      date: "2026-08-14",

      hypothesis:
        "変換 T に対して I(T(x)) = I(x) が成立する。",

      calculation:
        "100,000回の数値実験。",

      verification:
        "数値的支持あり。ただし数学的証明は未完了。",

      evidence: [
        "ランダムサンプル 100,000件",
        "境界条件 3種類",
        "数値誤差 1e-12 未満"
      ],

      next:
        "一般条件について記号的な証明を探索する。"
    },

    {
      id: "result-002",
      status: "maybe",
      mark: "△",
      title: "単調性仮説 H-002",
      description:
        "数値的には支持されているが証明されていない。",
      date: "2026-08-14",

      hypothesis:
        "条件 A のもとで f(x) は単調増加する。",

      calculation:
        "ランダム探索 500,000回。",

      verification:
        "反例は現在まで発見されていない。",

      evidence: [
        "ランダム探索",
        "局所探索",
        "境界付近の探索"
      ],

      next:
        "境界条件を変えた反例探索。"
    },

    {
      id: "result-003",
      status: "bad",
      mark: "×",
      title: "全域成立仮説 H-003",
      description:
        "反例候補が発見されたため棄却。",
      date: "2026-08-14",

      hypothesis:
        "すべての x に対して P(x) が成立する。",

      calculation:
        "50,000回の探索。",

      verification:
        "反例候補を確認。",

      evidence: [
        "x ≈ 3.72 付近",
        "複数精度で再計算",
        "同条件で再現"
      ],

      next:
        "仮説の前提条件を修正する。"
    }

  ],


  hypotheses: [

    {
      id: "H-001",
      status: "good",
      mark: "○",
      title: "不変量 I(x) が存在する",
      description:
        "特定の変換に対する保存量候補。"
    },

    {
      id: "H-002",
      status: "maybe",
      mark: "△",
      title: "f(x) の単調性",
      description:
        "数値的には支持されている。"
    },

    {
      id: "H-003",
      status: "bad",
      mark: "×",
      title: "条件なしで P(x) が成立",
      description:
        "反例候補により棄却。"
    }

  ],


  routes: [

    {
      id: "route-001",
      name: "背理法 → 極値 → 矛盾",
      attempts: 1,
      status: "active",
      description:
        "仮定の否定から極値を構成して矛盾を探す。"
    },

    {
      id: "route-002",
      name: "不変量 → 帰納的構成",
      attempts: 2,
      status: "active",
      description:
        "保存量を利用して構造を帰納的に構成する。"
    },

    {
      id: "route-003",
      name: "局所解析 → 反例探索",
      attempts: 3,
      status: "banned",
      description:
        "局所条件から全域成立を推定するルート。"
    }

  ],


  memories: [

    {
      id: "memory-001",
      type: "研究上の事実",
      title: "H-003には反例候補が存在",
      content:
        "全域成立を主張するには条件追加が必要。"
    },

    {
      id: "memory-002",
      type: "失敗した探索",
      title: "局所解析ルート",
      content:
        "3回の試行で有効な証明につながらなかったため封印。"
    },

    {
      id: "memory-003",
      type: "研究方針",
      title: "数値実験を証明とみなさない",
      content:
        "反例が見つからないことは、一般命題の証明を意味しない。"
    }

  ],


  jobs: []

};


/* =========================================================
   Navigation
========================================================= */

function setupNavigation() {

  const buttons =
    document.querySelectorAll(".nav-button");

  buttons.forEach(button => {

    button.addEventListener("click", () => {

      const page =
        button.dataset.page;

      if (!page) return;

      buttons.forEach(b =>
        b.classList.remove("active")
      );

      button.classList.add("active");

      document
        .querySelectorAll(".page")
        .forEach(section => {
          section.classList.remove("active");
        });

      const target =
        document.getElementById(`page-${page}`);

      if (target) {
        target.classList.add("active");
      }

    });

  });

}


/* =========================================================
   Result Rendering
========================================================= */

function renderResults() {

  const container =
    document.getElementById("results");

  if (!container) return;

  container.innerHTML = "";

  /*
    UIでは最新100件だけを表示する。
    研究記憶そのものはこの配列から削除しない。
  */

  const visible =
    researchState.results.slice(0, 100);

  if (visible.length === 0) {

    container.innerHTML = `
      <div class="empty">
        研究結果はまだありません。
      </div>
    `;

    return;
  }


  visible.forEach(result => {

    const row =
      document.createElement("div");

    row.className = "result";

    row.innerHTML = `

      <div class="result-mark ${result.status}">
        ${result.mark}
      </div>

      <div class="result-content">

        <div class="result-title">
          ${escapeHTML(result.title)}
        </div>

        <div class="result-description">
          ${escapeHTML(result.description)}
        </div>

      </div>

      <div class="result-date">
        ${result.date}
      </div>

      <button
        class="btn"
        data-result-id="${result.id}"
      >
        詳細
      </button>

    `;

    row
      .querySelector("button")
      .addEventListener("click", () => {

        openResult(result.id);

      });

    container.appendChild(row);

  });

}


/* =========================================================
   Result Detail
========================================================= */

function openResult(id) {

  const result =
    researchState.results.find(
      item => item.id === id
    );

  if (!result) return;

  const modal =
    document.getElementById("modal");

  const content =
    document.getElementById("modalContent");


  content.innerHTML = `

    <button
      class="close"
      id="closeModal"
    >
      ×
    </button>

    <div class="result-mark ${result.status}">
      ${result.mark}
    </div>

    <h2>
      ${escapeHTML(result.title)}
    </h2>

    <div class="detail-block">

      <div class="detail-label">
        現在の判定
      </div>

      <strong>
        ${result.mark}
      </strong>

      ${
        result.status === "good"
          ? " 現在の検証条件では支持"
          : result.status === "maybe"
          ? " 未確定"
          : " 棄却・反例あり"
      }

    </div>


    <div class="detail-block">

      <div class="detail-label">
        仮説
      </div>

      ${escapeHTML(result.hypothesis)}

    </div>


    <div class="detail-block">

      <div class="detail-label">
        計算
      </div>

      ${escapeHTML(result.calculation)}

    </div>


    <div class="detail-block">

      <div class="detail-label">
        検証
      </div>

      ${escapeHTML(result.verification)}

    </div>


    <div class="detail-block">

      <div class="detail-label">
        証拠
      </div>

      <ul>

        ${result.evidence
          .map(item =>
            `<li>${escapeHTML(item)}</li>`
          )
          .join("")}

      </ul>

    </div>


    <div class="detail-block">

      <div class="detail-label">
        次に試すこと
      </div>

      ${escapeHTML(result.next)}

    </div>

  `;


  modal.classList.add("show");


  document
    .getElementById("closeModal")
    .addEventListener(
      "click",
      closeModal
    );

}


function closeModal() {

  const modal =
    document.getElementById("modal");

  modal.classList.remove("show");

}


/* =========================================================
   Hypotheses
========================================================= */

function renderHypotheses() {

  const container =
    document.getElementById("hypotheses");

  if (!container) return;

  container.innerHTML = "";

  researchState.hypotheses
    .forEach(hypothesis => {

      const element =
        document.createElement("div");

      element.className =
        "hypothesis";

      element.innerHTML = `

        <div class="hypothesis-top">

          <div class="result-mark ${hypothesis.status}">
            ${hypothesis.mark}
          </div>

          <span class="hypothesis-id">
            ${hypothesis.id}
          </span>

          <span class="hypothesis-title">
            ${escapeHTML(hypothesis.title)}
          </span>

        </div>

        <div
          style="
            margin-left:50px;
            margin-top:8px;
            color:#8793af;
            font-size:13px;
          "
        >
          ${escapeHTML(hypothesis.description)}
        </div>

      `;

      container.appendChild(element);

    });

}


/* =========================================================
   Routes
========================================================= */

function renderRoutes() {

  const container =
    document.getElementById("routes");

  if (!container) return;

  container.innerHTML = "";

  researchState.routes
    .forEach(route => {

      const element =
        document.createElement("div");

      element.className = "route";

      const banned =
        route.attempts >= 3 ||
        route.status === "banned";

      element.innerHTML = `

        <div>

          <div class="route-name">
            ${escapeHTML(route.name)}
          </div>

          <div class="route-meta">
            ${escapeHTML(route.description)}
          </div>

          ${
            banned
              ? `
                <div
                  style="
                    margin-top:8px;
                    color:#ff8ba1;
                    font-size:12px;
                  "
                >
                  × この探索ルートは封印されています
                </div>
              `
              : ""
          }

        </div>

        <div class="route-count">

          <strong>
            ${route.attempts}
          </strong>

          <div
            style="
              color:#7d8aa8;
              font-size:11px;
            "
          >
            試行

          </div>

        </div>

      `;

      container.appendChild(element);

    });

}


/* =========================================================
   Memory
========================================================= */

function renderMemory() {

  const container =
    document.getElementById("memory");

  if (!container) return;

  container.innerHTML = "";

  researchState.memories
    .forEach(memory => {

      const element =
        document.createElement("div");

      element.className =
        "memory";

      element.innerHTML = `

        <div class="memory-type">
          ${escapeHTML(memory.type)}
        </div>

        <div class="memory-title">
          ${escapeHTML(memory.title)}
        </div>

        <div class="memory-content">
          ${escapeHTML(memory.content)}
        </div>

      `;

      container.appendChild(element);

    });

}


/* =========================================================
   Chat
========================================================= */

function addMessage(type, text) {

  const container =
    document.getElementById("chatMessages");

  if (!container) return;

  const message =
    document.createElement("div");

  message.className =
    `message ${type}`;

  message.innerHTML = `

    <div class="message-label">
      ${
        type === "ai"
          ? "研究AI"
          : "あなた"
      }
    </div>

    <div>
      ${escapeHTML(text)}
    </div>

  `;

  container.appendChild(message);

  container.scrollTop =
    container.scrollHeight;

}


function sendMessage() {

  const input =
    document.getElementById("chatInput");

  if (!input) return;

  const text =
    input.value.trim();

  if (!text) return;

  addMessage("user", text);

  input.value = "";


  /*
    本物のAI APIはまだ接続していない。
    この部分は後で安全なサーバーAPIに置き換える。
  */

  setTimeout(() => {

    addMessage(
      "ai",
      "現在は研究AIのUIプロトタイプです。次の段階で研究記憶を検索し、過去の仮説・反例・封印ルートを確認してから回答する仕組みを接続します。"
    );

  }, 350);

}


/* =========================================================
   Calculator Demo
========================================================= */

function startCalculation() {

  const job = {

    id:
      `job-${Date.now()}`,

    iterations: 1000000,

    completed: 0,

    status: "running"

  };

  researchState.jobs.unshift(job);

  renderJobs();


  const interval =
    setInterval(() => {

      job.completed +=
        Math.floor(
          Math.random() * 70000
        ) + 30000;


      if (
        job.completed >=
        job.iterations
      ) {

        job.completed =
          job.iterations;

        job.status =
          "completed";

        clearInterval(interval);

      }

      renderJobs();

    }, 300);

}


function renderJobs() {

  const container =
    document.getElementById("jobs");

  if (!container) return;

  container.innerHTML = "";


  if (researchState.jobs.length === 0) {

    container.innerHTML = `
      <div class="empty">
        計算ジョブはありません。
      </div>
    `;

    return;

  }


  researchState.jobs
    .slice(0, 20)
    .forEach(job => {

      const percent =
        Math.min(
          100,
          Math.round(
            job.completed /
            job.iterations *
            100
          )
        );


      const element =
        document.createElement("div");

      element.className = "job";

      element.innerHTML = `

        <div>

          <strong>
            ${job.id}
          </strong>

          <span
            style="
              color:#8793af;
              margin-left:8px;
              font-size:12px;
            "
          >
            ${
              job.status === "completed"
                ? "完了"
                : "計算中"
            }
          </span>

        </div>


        <div
          style="
            margin-top:7px;
            color:#8793af;
            font-size:12px;
          "
        >

          ${job.completed.toLocaleString()}
          /
          ${job.iterations.toLocaleString()}
          iterations

        </div>


        <div class="progress">

          <div
            class="progress-bar"
            style="width:${percent}%"
          ></div>

        </div>

      `;

      container.appendChild(element);

    });

}


/* =========================================================
   Dashboard Stats
========================================================= */

function updateStats() {

  const resultCount =
    document.getElementById(
      "stat-results"
    );

  const hypothesisCount =
    document.getElementById(
      "stat-hypotheses"
    );

  const bannedCount =
    document.getElementById(
      "stat-banned"
    );


  if (resultCount) {

    resultCount.textContent =
      researchState.results.length;

  }


  if (hypothesisCount) {

    hypothesisCount.textContent =
      researchState.hypotheses
        .filter(
          item =>
            item.status === "maybe"
        )
        .length;

  }


  if (bannedCount) {

    bannedCount.textContent =
      researchState.routes
        .filter(
          route =>
            route.attempts >= 3 ||
            route.status === "banned"
        )
        .length;

  }

}


/* =========================================================
   Security Helper
========================================================= */

function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* =========================================================
   Global Events
========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape"
    ) {

      closeModal();

    }

  }
);


/* =========================================================
   Initialization
========================================================= */

function initializeResearchLab() {

  setupNavigation();

  renderResults();

  renderHypotheses();

  renderRoutes();

  renderMemory();

  renderJobs();

  updateStats();

}


document.addEventListener(
  "DOMContentLoaded",
  initializeResearchLab
);
