const SUPABASE_URL =
  "https://hiefdcodifkfhnqvruzn.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_HmcPY6BGvUQTPESGHVe7Hw_W4NlTPqj";

/*
 * 研究Function
 *
 * Supabase側に存在するFunctionは
 * research-ai
 * smart-handler
 *
 * 現在、動作確認できているルートに合わせて
 * smart-handlerを使用する。
 */
const RESEARCH_FUNCTION = "smart-handler";

const EVALUATE_FUNCTION = "evaluate";

const DEFAULT_PROJECT_ID =
  "4253800d-a89e-45e2-a36a-cc52eb6c510b";


const supabase =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
  );


let currentProjectId =
  localStorage.getItem(
    "research_project_id",
  );

if (!currentProjectId) {
  currentProjectId =
    DEFAULT_PROJECT_ID;

  localStorage.setItem(
    "research_project_id",
    currentProjectId,
  );
}


let latestResult = null;


/* ==========================================================
   DOM
========================================================== */

const questionInput =
  document.getElementById(
    "questionInput",
  );

const researchButton =
  document.getElementById(
    "researchButton",
  );

const clearButton =
  document.getElementById(
    "clearButton",
  );

const statusBox =
  document.getElementById(
    "statusBox",
  );

const connectionDot =
  document.getElementById(
    "connectionDot",
  );

const connectionText =
  document.getElementById(
    "connectionText",
  );

const progress =
  document.getElementById(
    "progress",
  );

const progressText =
  document.getElementById(
    "progressText",
  );

const progressPercent =
  document.getElementById(
    "progressPercent",
  );

const progressValue =
  document.getElementById(
    "progressValue",
  );

const latestSection =
  document.getElementById(
    "latestSection",
  );

const latestTitle =
  document.getElementById(
    "latestTitle",
  );

const latestDate =
  document.getElementById(
    "latestDate",
  );

const latestSymbol =
  document.getElementById(
    "latestSymbol",
  );

const latestSummary =
  document.getElementById(
    "latestSummary",
  );

const latestMeta =
  document.getElementById(
    "latestMeta",
  );

const evaluateButton =
  document.getElementById(
    "evaluateButton",
  );

const toggleDetailsButton =
  document.getElementById(
    "toggleDetailsButton",
  );

const details =
  document.getElementById(
    "details",
  );

const historyList =
  document.getElementById(
    "historyList",
  );

const historyCount =
  document.getElementById(
    "historyCount",
  );


/* ==========================================================
   CONNECTION
========================================================== */

async function checkConnection() {

  try {

    const {
      error,
    } =
      await supabase
        .from("research_results")
        .select(
          "id",
          {
            count:
              "exact",

            head:
              true,
          },
        )
        .eq(
          "project_id",
          currentProjectId,
        );


    if (error) {
      throw error;
    }


    connectionDot
      .classList
      .remove("error");

    connectionDot
      .classList
      .add("ok");

    connectionText.textContent =
      "Supabase 接続済み";


    return true;

  } catch (error) {

    console.error(
      "Supabase connection error:",
      error,
    );


    connectionDot
      .classList
      .remove("ok");

    connectionDot
      .classList
      .add("error");

    connectionText.textContent =
      "Supabase 接続エラー";


    return false;
  }
}


/* ==========================================================
   STATUS
========================================================== */

function showStatus(
  message,
  type = "",
) {

  statusBox.textContent =
    message;

  statusBox.className =
    "status-box show";

  if (type) {
    statusBox.classList.add(type);
  }
}


function hideStatus() {

  statusBox.className =
    "status-box";
}


/* ==========================================================
   PROGRESS
========================================================== */

function setProgress(
  percent,
  text,
) {

  progress.classList.remove(
    "hidden",
  );


  const safe =
    Math.max(
      0,
      Math.min(
        100,
        percent,
      ),
    );


  progressValue.style.width =
    `${safe}%`;

  progressPercent.textContent =
    `${Math.round(safe)}%`;

  progressText.textContent =
    text;
}


/* ==========================================================
   RESEARCH
========================================================== */

async function runResearch() {

  const message =
    questionInput.value.trim();


  if (!message) {

    showStatus(
      "研究したい数学的な問題を入力してください。",
      "error",
    );

    questionInput.focus();

    return;
  }


  researchButton.disabled =
    true;

  clearButton.disabled =
    true;

  evaluateButton.disabled =
    true;


  setProgress(
    5,
    "研究を準備しています...",
  );


  showStatus(
    "研究AIに接続しています...",
  );


  try {

    setProgress(
      15,
      "過去の研究履歴を確認しています...",
    );


    console.log(
      "Calling research function:",
      RESEARCH_FUNCTION,
    );

    console.log(
      "Current project ID:",
      currentProjectId,
    );


    const response =
      await supabase.functions.invoke(
        RESEARCH_FUNCTION,
        {
          body: {

            message:
              message,

            project_id:
              currentProjectId,

          },
        },
      );


    console.log(
      "research response:",
      response,
    );


    if (response.error) {

      throw new Error(
        response.error.message ||
        "Edge Functionの呼び出しに失敗しました。",
      );
    }


    const data =
      response.data;


    if (!data) {

      throw new Error(
        "AIからデータが返ってきませんでした。",
      );
    }


    if (!data.ok) {

      throw new Error(
        data.error ||
        data.detail ||
        "研究AIでエラーが発生しました。",
      );
    }


    setProgress(
      70,
      "研究結果を受け取りました...",
    );


    /* ======================================================
       ROUTE BLOCK
    ====================================================== */

    if (data.blocked) {

      setProgress(
        100,
        "既使用ルートを検出しました。",
      );


      showStatus(
        [
          "この研究ルートは3回以上使用されています。",
          "",
          data.answer || "",
          "",
          "別のアプローチを探します。",
        ].join("\n"),
        "success",
      );


      await loadHistory();

      return;
    }


    /* ======================================================
       RESULT
    ====================================================== */

    latestResult = {

      id:
        data.result_id,

      title:
        data.research?.title ||
        "AI研究回答",

      description:
        data.research?.summary ||
        data.research?.description ||
        "",

      status:
        data.research?.status ||
        "maybe",

      hypothesis:
        data.research?.hypothesis ||
        "",

      calculation:
        data.research?.calculation ||
        "",

      verification:
        data.research?.verification ||
        "",

      next_action:
        data.research?.next_action ||
        "",

      evidence: {

        route:
          data.research?.route ||
          "",

        route_key:
          data.research?.route_key ||
          "",

        route_count:
          data.research?.route_count ||
          1,

        confidence:
          Number(
            data.research?.confidence ||
            0,
          ),

        confidence_basis:
          data.research?.confidence_basis ||
          "",

        items:
          data.research?.evidence ||
          [],

      },

      created_at:
        new Date().toISOString(),
    };


    renderLatestResult(
      latestResult,
    );


    setProgress(
      85,
      "研究結果を保存しました...",
    );


    showStatus(
      "研究結果を保存しました。必要なら「この結果を評価」で○△×判定できます。",
      "success",
    );


    await loadHistory();


    setProgress(
      100,
      "研究完了",
    );


  } catch (error) {

    console.error(
      "Research error:",
      error,
    );


    showStatus(
      formatError(error),
      "error",
    );


    setProgress(
      100,
      "エラーで終了",
    );


  } finally {

    researchButton.disabled =
      false;

    clearButton.disabled =
      false;

    evaluateButton.disabled =
      !latestResult;
  }
}


/* ==========================================================
   EVALUATE
========================================================== */

async function evaluateLatest() {

  if (!latestResult?.id) {

    showStatus(
      "評価する研究結果がありません。",
      "error",
    );

    return;
  }


  evaluateButton.disabled =
    true;

  researchButton.disabled =
    true;


  setProgress(
    50,
    "研究結果を検証しています...",
  );


  showStatus(
    "評価AIが研究結果を確認しています...",
  );


  try {

    const response =
      await supabase.functions.invoke(
        EVALUATE_FUNCTION,
        {
          body: {

            project_id:
              currentProjectId,

            result_id:
              latestResult.id,

          },
        },
      );


    if (response.error) {

      throw new Error(
        response.error.message ||
        "評価Functionの呼び出しに失敗しました。",
      );
    }


    const data =
      response.data;


    if (!data) {

      throw new Error(
        "評価AIからデータが返ってきませんでした。",
      );
    }


    if (!data.ok) {

      throw new Error(
        data.error ||
        data.detail ||
        "評価AIでエラーが発生しました。",
      );
    }


    const evaluation =
      data.evaluation;


    latestResult.evidence =
      latestResult.evidence ||
      {};

    latestResult.evidence.evaluation =
      evaluation;


    renderLatestResult(
      latestResult,
    );


    setProgress(
      100,
      "評価完了",
    );


    showStatus(
      [
        `評価完了：${
          evaluation?.overall_symbol ||
          "△"
        }`,
        "",
        evaluation?.reason ||
        "",
      ].join("\n"),
      "success",
    );


    await loadHistory();


    details.classList.remove(
      "hidden",
    );

    toggleDetailsButton.textContent =
      "詳細を閉じる";


  } catch (error) {

    console.error(
      "Evaluation error:",
      error,
    );


    showStatus(
      formatError(error),
      "error",
    );


    setProgress(
      100,
      "評価エラー",
    );


  } finally {

    evaluateButton.disabled =
      false;

    researchButton.disabled =
      false;
  }
}


/* ==========================================================
   HISTORY
========================================================== */

async function loadHistory() {

  try {

    const {
      data,
      error,
    } =
      await supabase
        .from("research_results")
        .select(`
          id,
          project_id,
          hypothesis_id,
          title,
          description,
          status,
          hypothesis,
          calculation,
          verification,
          next_action,
          evidence,
          created_at
        `)
        .eq(
          "project_id",
          currentProjectId,
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          },
        )
        .limit(100);


    if (error) {
      throw error;
    }


    renderHistory(
      data || [],
    );


  } catch (error) {

    console.error(
      "History error:",
      error,
    );


    historyList.innerHTML = `
      <div class="history-empty">
        履歴を読み込めませんでした。
      </div>
    `;
  }
}


/* ==========================================================
   HISTORY RENDER
========================================================== */

function renderHistory(
  results,
) {

  historyCount.textContent =
    `${results.length}件`;


  if (!results.length) {

    historyList.innerHTML = `
      <div class="history-empty">
        まだ研究結果がありません。
      </div>
    `;

    return;
  }


  historyList.innerHTML =
    results
      .map(
        result =>
          createHistoryItem(
            result,
          ),
      )
      .join("");


  historyList
    .querySelectorAll(
      "[data-result-id]",
    )
    .forEach(
      element => {

        element.addEventListener(
          "click",
          () => {

            const id =
              element.dataset.resultId;


            const result =
              results.find(
                item =>
                  item.id === id,
              );


            if (result) {

              latestResult =
                result;

              renderLatestResult(
                result,
              );

              window.scrollTo({
                top: 0,
                behavior:
                  "smooth",
              });
            }

          },
        );

      },
    );
}


function createHistoryItem(
  result,
) {

  const evaluation =
    result?.evidence?.evaluation;


  const status =
    evaluation?.overall ||
    result.status ||
    "maybe";


  const symbol =
    evaluation?.overall_symbol ||
    statusToSymbol(
      status,
    );


  const title =
    escapeHtml(
      result.title ||
      "無題の研究",
    );


  const date =
    formatDate(
      result.created_at,
    );


  return `
    <div
      class="history-item"
      data-result-id="${escapeHtml(result.id)}"
    >

      <div class="history-main">

        <div
          class="history-symbol ${statusClass(status)}"
        >
          ${escapeHtml(symbol)}
        </div>

        <div style="min-width:0">

          <div class="history-title">
            ${title}
          </div>

          <div class="history-date">
            ${date}
          </div>

        </div>

      </div>

    </div>
  `;
}


/* ==========================================================
   LATEST RESULT
========================================================== */

function renderLatestResult(
  result,
) {

  latestSection.classList.remove(
    "hidden",
  );


  latestTitle.textContent =
    result.title ||
    "AI研究回答";


  latestDate.textContent =
    formatDate(
      result.created_at,
    );


  const evaluation =
    result?.evidence?.evaluation;


  const status =
    evaluation?.overall ||
    result.status ||
    "maybe";


  const symbol =
    evaluation?.overall_symbol ||
    statusToSymbol(
      status,
    );


  latestSymbol.textContent =
    symbol;


  latestSymbol.className =
    `symbol ${statusClass(status)}`;


  latestSummary.textContent =
    result.description ||
    "研究結果が保存されています。";


  latestMeta.innerHTML =
    "";


  addTag(
    latestMeta,
    `状態: ${statusLabel(status)}`,
  );


  if (
    result?.evidence?.route
  ) {

    addTag(
      latestMeta,
      `ルート: ${result.evidence.route}`,
    );
  }


  if (
    result?.evidence?.route_count
  ) {

    addTag(
      latestMeta,
      `使用回数: ${result.evidence.route_count}`,
    );
  }


  if (
    typeof result?.evidence?.confidence ===
    "number"
  ) {

    addTag(
      latestMeta,
      `信頼度: ${Math.round(
        result.evidence.confidence * 100,
      )}%`,
    );
  }


  document.getElementById(
    "detailHypothesis",
  ).textContent =
    result.hypothesis ||
    "記録なし";


  document.getElementById(
    "detailCalculation",
  ).textContent =
    result.calculation ||
    "記録なし";


  document.getElementById(
    "detailVerification",
  ).textContent =
    result.verification ||
    "記録なし";


  document.getElementById(
    "detailNextAction",
  ).textContent =
    result.next_action ||
    "記録なし";


  document.getElementById(
    "detailRoute",
  ).textContent =
    result?.evidence?.route ||
    "記録なし";


  document.getElementById(
    "detailReason",
  ).textContent =
    evaluation?.reason ||
    "まだ評価されていません。";


  renderEvaluationGrid(
    evaluation,
  );


  evaluateButton.disabled =
    !result.id;
}


/* ==========================================================
   EVALUATION GRID
========================================================== */

function renderEvaluationGrid(
  evaluation,
) {

  const grid =
    document.getElementById(
      "evaluationGrid",
    );


  if (!evaluation) {

    grid.innerHTML = `
      <div class="evaluation-item">

        <div class="label">
          評価
        </div>

        <div class="value">
          未評価
        </div>

      </div>
    `;

    return;
  }


  const items = [

    [
      "総合",
      evaluation.overall_symbol ||
      "△",
    ],

    [
      "仮説",
      evaluation.hypothesis_symbol ||
      "△",
    ],

    [
      "計算",
      evaluation.calculation_symbol ||
      "△",
    ],

    [
      "検証",
      evaluation.verification_symbol ||
      "△",
    ],

    [
      "論理",
      evaluation.logic_symbol ||
      "△",
    ],

  ];


  grid.innerHTML =
    items
      .map(
        ([label, value]) => `
          <div class="evaluation-item">

            <div class="label">
              ${escapeHtml(label)}
            </div>

            <div class="value">
              ${escapeHtml(value)}
            </div>

          </div>
        `,
      )
      .join("");
}


/* ==========================================================
   DETAILS
========================================================== */

toggleDetailsButton.addEventListener(
  "click",
  () => {

    const hidden =
      details.classList.contains(
        "hidden",
      );


    details.classList.toggle(
      "hidden",
    );


    toggleDetailsButton.textContent =
      hidden
        ? "詳細を閉じる"
        : "詳細を表示";

  },
);


/* ==========================================================
   BUTTONS
========================================================== */

researchButton.addEventListener(
  "click",
  runResearch,
);


evaluateButton.addEventListener(
  "click",
  evaluateLatest,
);


clearButton.addEventListener(
  "click",
  () => {

    questionInput.value =
      "";

    hideStatus();

    progress.classList.add(
      "hidden",
    );

  },
);


/* ==========================================================
   COMMAND + ENTER
========================================================== */

questionInput.addEventListener(
  "keydown",
  event => {

    if (
      (event.metaKey ||
        event.ctrlKey) &&
      event.key === "Enter"
    ) {

      event.preventDefault();

      runResearch();
    }

  },
);


/* ==========================================================
   HELPERS
========================================================== */

function statusToSymbol(
  status,
) {

  if (status === "good") {
    return "○";
  }

  if (status === "bad") {
    return "×";
  }

  return "△";
}


function statusClass(
  status,
) {

  if (status === "good") {
    return "good";
  }

  if (status === "bad") {
    return "bad";
  }

  if (status === "maybe") {
    return "maybe";
  }

  return "unknown";
}


function statusLabel(
  status,
) {

  if (status === "good") {
    return "良";
  }

  if (status === "bad") {
    return "不成立・問題あり";
  }

  return "要検証";
}


function formatDate(
  date,
) {

  if (!date) {
    return "";
  }


  const value =
    new Date(date);


  if (
    Number.isNaN(
      value.getTime(),
    )
  ) {

    return "";
  }


  return value.toLocaleString(
    "ja-JP",
    {
      year:
        "numeric",

      month:
        "2-digit",

      day:
        "2-digit",

      hour:
        "2-digit",

      minute:
        "2-digit",
    },
  );
}


function escapeHtml(
  value,
) {

  return String(
    value ?? "",
  )
    .replace(
      /&/g,
      "&amp;",
    )
    .replace(
      /</g,
      "&lt;",
    )
    .replace(
      />/g,
      "&gt;",
    )
    .replace(
      /"/g,
      "&quot;",
    )
    .replace(
      /'/g,
      "&#039;",
    );
}


function addTag(
  container,
  text,
) {

  const element =
    document.createElement(
      "span",
    );


  element.className =
    "tag";


  element.textContent =
    text;


  container.appendChild(
    element,
  );
}


/* ==========================================================
   ERROR
========================================================== */

function formatError(
  error,
) {

  if (!error) {
    return "不明なエラーです。";
  }


  const message =
    error.message ||
    String(error);


  if (
    message.includes(
      "Failed to send a request to the Edge Function",
    )
  ) {

    return [
      "Edge Functionへの接続に失敗しました。",
      "",
      "SupabaseのEdge Functionsで",
      "smart-handler FunctionがDeploy済みか確認してください。",
    ].join("\n");
  }


  return message;
}


/* ==========================================================
   INITIALIZE
========================================================== */

async function initialize() {

  await checkConnection();

  await loadHistory();
}


/* ==========================================================
   START
========================================================== */

initialize();
