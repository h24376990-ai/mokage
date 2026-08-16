const SUPABASE_URL =
  "https://hiefdcodifkfhnqvruzn.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_HmcPY6BGvUQTPESGHVe7Hw_W4NlTPqj";


/* ==========================================================
   EDGE FUNCTIONS
========================================================== */

const RESEARCH_FUNCTION =
  "smart-handler";

const EVALUATE_FUNCTION =
  "evaluate";


/* ==========================================================
   DEFAULT PROJECT
========================================================== */

const DEFAULT_PROJECT_ID =
  "4253800d-a89e-45e2-a36a-cc52eb6c510b";


/* ==========================================================
   SUPABASE
========================================================== */

const supabase =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
  );


/* ==========================================================
   PROJECT ID
========================================================== */

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


/* ==========================================================
   STATE
========================================================== */

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
   BASIC DOM CHECK
========================================================== */

console.log(
  "[Research AI] app.js loaded",
);

console.log(
  "[Research AI] project_id:",
  currentProjectId,
);

console.log(
  "[Research AI] research function:",
  RESEARCH_FUNCTION,
);


/* ==========================================================
   CONNECTION
========================================================== */

async function checkConnection() {

  console.log(
    "[Research AI] checking Supabase connection...",
  );

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


    if (connectionDot) {

      connectionDot
        .classList
        .remove(
          "error",
        );

      connectionDot
        .classList
        .add(
          "ok",
        );
    }


    if (connectionText) {

      connectionText.textContent =
        "Supabase 接続済み";
    }


    console.log(
      "[Research AI] Supabase connection OK",
    );


    return true;


  } catch (error) {

    console.error(
      "[Research AI] Supabase connection error:",
      error,
    );


    if (connectionDot) {

      connectionDot
        .classList
        .remove(
          "ok",
        );

      connectionDot
        .classList
        .add(
          "error",
        );
    }


    if (connectionText) {

      connectionText.textContent =
        "Supabase 接続エラー";
    }


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

  if (!statusBox) {
    return;
  }


  statusBox.textContent =
    message;


  statusBox.className =
    "status-box show";


  if (type) {

    statusBox.classList.add(
      type,
    );
  }
}


function hideStatus() {

  if (!statusBox) {
    return;
  }


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

  if (!progress) {
    return;
  }


  progress.classList.remove(
    "hidden",
  );


  const safe =
    Math.max(
      0,
      Math.min(
        100,
        Number(percent) || 0,
      ),
    );


  if (progressValue) {

    progressValue.style.width =
      `${safe}%`;
  }


  if (progressPercent) {

    progressPercent.textContent =
      `${Math.round(safe)}%`;
  }


  if (progressText) {

    progressText.textContent =
      text || "";
  }
}


/* ==========================================================
   RESEARCH
========================================================== */

async function runResearch() {

  console.log(
    "[Research AI] runResearch started",
  );


  const message =
    questionInput?.value?.trim() ||
    "";


  console.log(
    "[Research AI] message:",
    message,
  );


  console.log(
    "[Research AI] project_id:",
    currentProjectId,
  );


  console.log(
    "[Research AI] function:",
    RESEARCH_FUNCTION,
  );


  if (!message) {

    showStatus(
      "研究したい数学的な問題を入力してください。",
      "error",
    );


    questionInput?.focus();

    return;
  }


  if (!currentProjectId) {

    showStatus(
      "project_id が設定されていません。",
      "error",
    );

    return;
  }


  if (researchButton) {

    researchButton.disabled =
      true;
  }


  if (clearButton) {

    clearButton.disabled =
      true;
  }


  if (evaluateButton) {

    evaluateButton.disabled =
      true;
  }


  latestResult = null;


  setProgress(
    5,
    "研究を準備しています...",
  );


  showStatus(
    "研究AIに接続しています...",
  );


  try {

    /* ------------------------------------------------------
       1. Function呼び出し開始
    ------------------------------------------------------ */

    setProgress(
      15,
      "研究AIを呼び出しています...",
    );


    console.log(
      "[Research AI] invoking Edge Function...",
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
      "[Research AI] raw function response:",
      response,
    );


    /* ------------------------------------------------------
       2. invoke error
    ------------------------------------------------------ */

    if (response?.error) {

      console.error(
        "[Research AI] function invoke error:",
        response.error,
      );


      const errorMessage =
        getSupabaseFunctionError(
          response.error,
        );


      throw new Error(
        errorMessage,
      );
    }


    /* ------------------------------------------------------
       3. data
    ------------------------------------------------------ */

    const data =
      response?.data;


    console.log(
      "[Research AI] function data:",
      data,
    );


    if (!data) {

      throw new Error(
        "Supabase Edge Functionからデータが返ってきませんでした。",
      );
    }


    /* ------------------------------------------------------
       4. backend error
    ------------------------------------------------------ */

    if (data.ok === false) {

      throw new Error(
        data.error ||
        data.detail ||
        "研究AI側でエラーが発生しました。",
      );
    }


    /* ------------------------------------------------------
       5. success
    ------------------------------------------------------ */

    setProgress(
      70,
      "研究結果を受け取りました...",
    );


    /* ------------------------------------------------------
       6. blocked
    ------------------------------------------------------ */

    if (data.blocked === true) {

      console.log(
        "[Research AI] research route blocked",
      );


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
          "別の研究アプローチを探してください。",
        ].join("\n"),
        "success",
      );


      await loadHistory();

      return;
    }


    /* ------------------------------------------------------
       7. research result existence
    ------------------------------------------------------ */

    if (
      !data.research ||
      typeof data.research !== "object"
    ) {

      console.error(
        "[Research AI] invalid research object:",
        data,
      );


      throw new Error(
        "研究結果データが見つかりませんでした。",
      );
    }


    /* ------------------------------------------------------
       8. latest result
    ------------------------------------------------------ */

    latestResult = {

      id:
        data.result_id ||
        data.research?.id ||
        null,


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
          Number(
            data.research?.route_count ||
            1,
          ),


        confidence:
          Number(
            data.research?.confidence ||
            0,
          ),


        confidence_basis:
          data.research?.confidence_basis ||
          "",


        items:
          Array.isArray(
            data.research?.evidence,
          )
            ? data.research.evidence
            : [],

      },


      created_at:
        data.research?.created_at ||
        new Date().toISOString(),
    };


    console.log(
      "[Research AI] normalized result:",
      latestResult,
    );


    /* ------------------------------------------------------
       9. render
    ------------------------------------------------------ */

    renderLatestResult(
      latestResult,
    );


    setProgress(
      85,
      "研究結果を表示しています...",
    );


    showStatus(
      "研究結果を保存しました。",
      "success",
    );


    /* ------------------------------------------------------
       10. history
    ------------------------------------------------------ */

    await loadHistory();


    setProgress(
      100,
      "研究完了",
    );


    console.log(
      "[Research AI] research completed successfully",
    );


  } catch (error) {

    console.error(
      "[Research AI] Research error:",
      error,
    );


    const formatted =
      formatError(
        error,
      );


    console.error(
      "[Research AI] formatted error:",
      formatted,
    );


    showStatus(
      formatted,
      "error",
    );


    setProgress(
      100,
      "エラーで終了",
    );


  } finally {

    if (researchButton) {

      researchButton.disabled =
        false;
    }


    if (clearButton) {

      clearButton.disabled =
        false;
    }


    if (evaluateButton) {

      evaluateButton.disabled =
        !latestResult?.id;
    }
  }
}


/* ==========================================================
   EVALUATE
========================================================== */

async function evaluateLatest() {

  console.log(
    "[Research AI] evaluate started",
  );


  if (!latestResult?.id) {

    showStatus(
      "評価する研究結果がありません。",
      "error",
    );

    return;
  }


  if (evaluateButton) {

    evaluateButton.disabled =
      true;
  }


  if (researchButton) {

    researchButton.disabled =
      true;
  }


  setProgress(
    50,
    "研究結果を検証しています...",
  );


  showStatus(
    "評価AIが研究結果を確認しています...",
  );


  try {

    console.log(
      "[Research AI] invoking evaluate:",
      {
        project_id:
          currentProjectId,

        result_id:
          latestResult.id,
      },
    );


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


    console.log(
      "[Research AI] evaluate response:",
      response,
    );


    if (response?.error) {

      throw new Error(
        getSupabaseFunctionError(
          response.error,
        ),
      );
    }


    const data =
      response?.data;


    if (!data) {

      throw new Error(
        "評価AIからデータが返ってきませんでした。",
      );
    }


    if (data.ok === false) {

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


    if (details) {

      details.classList.remove(
        "hidden",
      );
    }


    if (toggleDetailsButton) {

      toggleDetailsButton.textContent =
        "詳細を閉じる";
    }


  } catch (error) {

    console.error(
      "[Research AI] Evaluation error:",
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

    if (evaluateButton) {

      evaluateButton.disabled =
        false;
    }


    if (researchButton) {

      researchButton.disabled =
        false;
    }
  }
}


/* ==========================================================
   HISTORY
========================================================== */

async function loadHistory() {

  console.log(
    "[Research AI] loading history...",
  );


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


    console.log(
      "[Research AI] history loaded:",
      data,
    );


    renderHistory(
      data || [],
    );


  } catch (error) {

    console.error(
      "[Research AI] History error:",
      error,
    );


    if (historyList) {

      historyList.innerHTML = `
        <div class="history-empty">
          履歴を読み込めませんでした。
        </div>
      `;
    }
  }
}


/* ==========================================================
   HISTORY RENDER
========================================================== */

function renderHistory(
  results,
) {

  if (!historyCount ||
      !historyList) {

    return;
  }


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


            if (!result) {
              return;
            }


            latestResult =
              normalizeHistoryResult(
                result,
              );


            renderLatestResult(
              latestResult,
            );


            window.scrollTo({
              top: 0,
              behavior:
                "smooth",
            });
          },
        );
      },
    );
}


/* ==========================================================
   HISTORY NORMALIZATION
========================================================== */

function normalizeHistoryResult(
  result,
) {

  const evidence =
    result?.evidence &&
    typeof result.evidence === "object"
      ? result.evidence
      : {};


  return {

    ...result,

    evidence: {

      ...evidence,

      route:
        evidence.route ||
        "",


      route_key:
        evidence.route_key ||
        "",


      route_count:
        Number(
          evidence.route_count ||
          1,
        ),


      confidence:
        Number(
          evidence.confidence ||
          0,
        ),


      confidence_basis:
        evidence.confidence_basis ||
        "",


      items:
        Array.isArray(
          evidence.items,
        )
          ? evidence.items
          : [],

    },
  };
}


/* ==========================================================
   HISTORY ITEM
========================================================== */

function createHistoryItem(
  result,
) {

  const evidence =
    result?.evidence &&
    typeof result.evidence === "object"
      ? result.evidence
      : {};


  const evaluation =
    evidence?.evaluation;


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

  if (!result) {
    return;
  }


  if (latestSection) {

    latestSection.classList.remove(
      "hidden",
    );
  }


  if (latestTitle) {

    latestTitle.textContent =
      result.title ||
      "AI研究回答";
  }


  if (latestDate) {

    latestDate.textContent =
      formatDate(
        result.created_at,
      );
  }


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


  if (latestSymbol) {

    latestSymbol.textContent =
      symbol;


    latestSymbol.className =
      `symbol ${statusClass(status)}`;
  }


  if (latestSummary) {

    latestSummary.textContent =
      result.description ||
      result.summary ||
      "研究結果が保存されています。";
  }


  if (latestMeta) {

    latestMeta.innerHTML =
      "";
  }


  if (latestMeta) {

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
  }


  const detailHypothesis =
    document.getElementById(
      "detailHypothesis",
    );


  if (detailHypothesis) {

    detailHypothesis.textContent =
      result.hypothesis ||
      "記録なし";
  }


  const detailCalculation =
    document.getElementById(
      "detailCalculation",
    );


  if (detailCalculation) {

    detailCalculation.textContent =
      result.calculation ||
      "記録なし";
  }


  const detailVerification =
    document.getElementById(
      "detailVerification",
    );


  if (detailVerification) {

    detailVerification.textContent =
      result.verification ||
      "記録なし";
  }


  const detailNextAction =
    document.getElementById(
      "detailNextAction",
    );


  if (detailNextAction) {

    detailNextAction.textContent =
      result.next_action ||
      "記録なし";
  }


  const detailRoute =
    document.getElementById(
      "detailRoute",
    );


  if (detailRoute) {

    detailRoute.textContent =
      result?.evidence?.route ||
      "記録なし";
  }


  const detailReason =
    document.getElementById(
      "detailReason",
    );


  if (detailReason) {

    detailReason.textContent =
      evaluation?.reason ||
      "まだ評価されていません。";
  }


  renderEvaluationGrid(
    evaluation,
  );


  if (evaluateButton) {

    evaluateButton.disabled =
      !result.id;
  }
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


  if (!grid) {
    return;
  }


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

if (toggleDetailsButton) {

  toggleDetailsButton.addEventListener(
    "click",
    () => {

      if (!details) {
        return;
      }


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
}


/* ==========================================================
   BUTTONS
========================================================== */

if (researchButton) {

  researchButton.addEventListener(
    "click",
    runResearch,
  );
}


if (evaluateButton) {

  evaluateButton.addEventListener(
    "click",
    evaluateLatest,
  );
}


if (clearButton) {

  clearButton.addEventListener(
    "click",
    () => {

      if (questionInput) {

        questionInput.value =
          "";
      }


      hideStatus();


      if (progress) {

        progress.classList.add(
          "hidden",
        );
      }
    },
  );
}


/* ==========================================================
   COMMAND + ENTER
========================================================== */

if (questionInput) {

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
}


/* ==========================================================
   STATUS HELPERS
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


/* ==========================================================
   DATE
========================================================== */

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


/* ==========================================================
   HTML ESCAPE
========================================================== */

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


/* ==========================================================
   TAG
========================================================== */

function addTag(
  container,
  text,
) {

  if (!container) {
    return;
  }


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
   SUPABASE FUNCTION ERROR
========================================================== */

function getSupabaseFunctionError(
  error,
) {

  console.error(
    "[Research AI] raw Supabase error:",
    error,
  );


  if (!error) {

    return "Supabase Edge Functionで不明なエラーが発生しました。";
  }


  let message =
    error.message ||
    String(error);


  /*
   * FunctionsHttpErrorの場合、
   * contextにResponseが入る場合がある
   */

  if (
    error.context &&
    typeof error.context === "object"
  ) {

    try {

      if (
        error.context.status
      ) {

        message +=
          `\nHTTP Status: ${error.context.status}`;
      }


      if (
        error.context.statusText
      ) {

        message +=
          `\n${error.context.statusText}`;
      }

    } catch {
      // ignore
    }
  }


  return [
    "Supabase Edge Functionの呼び出しに失敗しました。",
    "",
    message,
    "",
    `Function: ${RESEARCH_FUNCTION}`,
    `Project ID: ${currentProjectId}`,
  ].join("\n");
}


/* ==========================================================
   ERROR
========================================================== */

function formatError(
  error,
) {

  console.error(
    "[Research AI] formatError input:",
    error,
  );


  if (!error) {

    return [
      "不明なエラーです。",
      "",
      "ブラウザのConsoleを確認してください。",
    ].join("\n");
  }


  const message =
    error.message ||
    String(error);


  /*
   * Load failed対策
   */

  if (
    message === "Load failed" ||
    message.includes("Load failed")
  ) {

    return [
      "Load failed",
      "",
      "Edge Functionへの通信に失敗しました。",
      "",
      `Function: ${RESEARCH_FUNCTION}`,
      `Project ID: ${currentProjectId}`,
      "",
      "Supabase側のFunctionが正常でも、ブラウザからの通信・CORS・Function URL・GitHub側のキャッシュなどで発生する場合があります。",
    ].join("\n");
  }


  if (
    message.includes(
      "Failed to send a request to the Edge Function",
    )
  ) {

    return [
      "Edge Functionへの接続に失敗しました。",
      "",
      `Function: ${RESEARCH_FUNCTION}`,
      `Project ID: ${currentProjectId}`,
      "",
      "Supabase Edge FunctionsでFunctionがDeploy済みか確認してください。",
      "",
      `詳細: ${message}`,
    ].join("\n");
  }


  return [
    message,
    "",
    `Function: ${RESEARCH_FUNCTION}`,
    `Project ID: ${currentProjectId}`,
  ].join("\n");
}


/* ==========================================================
   INITIALIZE
========================================================== */

async function initialize() {

  console.log(
    "[Research AI] initialize",
  );


  console.log(
    "[Research AI] SUPABASE_URL:",
    SUPABASE_URL,
  );


  console.log(
    "[Research AI] RESEARCH_FUNCTION:",
    RESEARCH_FUNCTION,
  );


  console.log(
    "[Research AI] currentProjectId:",
    currentProjectId,
  );


  await checkConnection();

  await loadHistory();
}


/* ==========================================================
   START
========================================================== */

initialize();
