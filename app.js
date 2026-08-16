/* ==========================================================
   24/7 RIEMANN RESEARCH LAB
   FULL APP.JS
   ==========================================================

   Features
   - Supabase direct fetch
   - smart-handler research
   - evaluate
   - research result display
   - evaluation display
   - research history
   - local history fallback
   - strict mode
   - keyboard shortcut
   - connection status
   - progress
   - existing index.html UI compatibility

========================================================== */


/* ==========================================================
   SUPABASE
========================================================== */

const SUPABASE_URL =
  "https://hiefdcodifkfhnqvruzn.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_HmcPY6BGvUQTPESGHVe7Hw_W4NlTPqj";


const RESEARCH_FUNCTION =
  "smart-handler";

const EVALUATE_FUNCTION =
  "evaluate";


/* ==========================================================
   PROJECT
========================================================== */

const DEFAULT_PROJECT_ID =
  "4253800d-a89e-45e2-a36a-cc52eb6c510b";


let currentProjectId =
  localStorage.getItem(
    "research_project_id"
  );


if (!currentProjectId) {

  currentProjectId =
    DEFAULT_PROJECT_ID;

  localStorage.setItem(
    "research_project_id",
    currentProjectId
  );
}


/* ==========================================================
   STATE
========================================================== */

let currentResearch = null;

let currentResearchData = null;

let researchHistory = [];


/* ==========================================================
   DOM
========================================================== */

const questionInput =
  document.getElementById(
    "questionInput"
  );

const researchButton =
  document.getElementById(
    "researchButton"
  );

const clearButton =
  document.getElementById(
    "clearButton"
  );

const statusBox =
  document.getElementById(
    "statusBox"
  );

const connectionDot =
  document.getElementById(
    "connectionDot"
  );

const connectionText =
  document.getElementById(
    "connectionText"
  );

const progress =
  document.getElementById(
    "progress"
  );

const progressText =
  document.getElementById(
    "progressText"
  );

const progressPercent =
  document.getElementById(
    "progressPercent"
  );

const progressValue =
  document.getElementById(
    "progressValue"
  );


/* RESULT */

const latestSection =
  document.getElementById(
    "latestSection"
  );

const latestTitle =
  document.getElementById(
    "latestTitle"
  );

const latestDate =
  document.getElementById(
    "latestDate"
  );

const latestSummary =
  document.getElementById(
    "latestSummary"
  );

const latestMeta =
  document.getElementById(
    "latestMeta"
  );

const latestSymbol =
  document.getElementById(
    "latestSymbol"
  );


/* EVALUATION */

const evaluateButton =
  document.getElementById(
    "evaluateButton"
  );

const toggleDetailsButton =
  document.getElementById(
    "toggleDetailsButton"
  );

const details =
  document.getElementById(
    "details"
  );

const evaluationGrid =
  document.getElementById(
    "evaluationGrid"
  );

const detailHypothesis =
  document.getElementById(
    "detailHypothesis"
  );

const detailCalculation =
  document.getElementById(
    "detailCalculation"
  );

const detailVerification =
  document.getElementById(
    "detailVerification"
  );

const detailNextAction =
  document.getElementById(
    "detailNextAction"
  );

const detailRoute =
  document.getElementById(
    "detailRoute"
  );

const detailReason =
  document.getElementById(
    "detailReason"
  );


/* HISTORY */

const historyList =
  document.getElementById(
    "historyList"
  );

const historyCount =
  document.getElementById(
    "historyCount"
  );


/* ==========================================================
   DOM CHECK
========================================================== */

function checkDOM() {

  const required = [

    ["questionInput", questionInput],

    ["researchButton", researchButton],

    ["clearButton", clearButton],

    ["statusBox", statusBox],

    ["connectionDot", connectionDot],

    ["connectionText", connectionText],

    ["progress", progress],

    ["progressText", progressText],

    ["progressPercent", progressPercent],

    ["progressValue", progressValue]

  ];


  const missing =
    required
      .filter(
        ([name, element]) =>
          !element
      )
      .map(
        ([name]) =>
          name
      );


  if (missing.length) {

    throw new Error(
      "HTMLに必要な要素がありません: " +
      missing.join(", ")
    );
  }
}


/* ==========================================================
   STATUS
========================================================== */

function showStatus(
  message,
  type = ""
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
      type
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
   CONNECTION
========================================================== */

function setConnectionState(
  state,
  text
) {

  if (
    !connectionDot ||
    !connectionText
  ) {
    return;
  }


  connectionDot.classList.remove(
    "ok",
    "error"
  );


  if (state === "ok") {

    connectionDot.classList.add(
      "ok"
    );

  } else if (
    state === "error"
  ) {

    connectionDot.classList.add(
      "error"
    );
  }


  connectionText.textContent =
    text;
}


/* ==========================================================
   PROGRESS
========================================================== */

function setProgress(
  percent,
  text
) {

  if (
    !progress ||
    !progressValue ||
    !progressPercent ||
    !progressText
  ) {
    return;
  }


  progress.classList.remove(
    "hidden"
  );


  const safe =
    Math.max(
      0,
      Math.min(
        100,
        Number(percent) || 0
      )
    );


  progressValue.style.width =
    `${safe}%`;

  progressPercent.textContent =
    `${Math.round(safe)}%`;

  progressText.textContent =
    text;
}


/* ==========================================================
   ERROR
========================================================== */

function errorText(
  error
) {

  if (!error) {

    return "不明なエラーです。";
  }


  if (
    typeof error === "string"
  ) {

    return error;
  }


  if (error.message) {

    return String(
      error.message
    );
  }


  return String(
    error
  );
}


/* ==========================================================
   RESPONSE
========================================================== */

async function readResponse(
  response
) {

  const text =
    await response.text();


  let data = null;


  if (text) {

    try {

      data =
        JSON.parse(
          text
        );

    } catch (_) {

      data = null;
    }
  }


  return {
    text,
    data
  };
}


/* ==========================================================
   DIRECT EDGE FUNCTION
========================================================== */

async function callEdgeFunction(
  functionName,
  body
) {

  const url =
    `${SUPABASE_URL}/functions/v1/${functionName}`;


  console.log(
    "================================"
  );

  console.log(
    "EDGE FUNCTION REQUEST"
  );

  console.log(
    "Function:",
    functionName
  );

  console.log(
    "URL:",
    url
  );

  console.log(
    "Body:",
    body
  );

  console.log(
    "================================"
  );


  let response;


  try {

    response =
      await fetch(
        url,
        {

          method:
            "POST",

          headers: {

            "Content-Type":
              "application/json",

            "apikey":
              SUPABASE_PUBLISHABLE_KEY,

            "Authorization":
              `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,

            "x-client-info":
              "riemann-research-lab"

          },

          body:
            JSON.stringify(
              body
            )

        }
      );

  } catch (
    error
  ) {

    console.error(
      "FETCH ERROR:",
      error
    );


    throw new Error(
      [
        "【通信エラー】",

        "",

        "Supabase Edge Functionへ接続できませんでした。",

        "",

        `Function: ${functionName}`,

        `URL: ${url}`,

        "",

        `エラー: ${errorText(
          error
        )}`

      ].join("\n")
    );
  }


  const result =
    await readResponse(
      response
    );


  console.log(
    "HTTP:",
    response.status
  );

  console.log(
    "Response:",
    result
  );


  if (!response.ok) {

    throw new Error(
      [
        "【Edge Function HTTPエラー】",

        "",

        `HTTP Status: ${response.status}`,

        `Function: ${functionName}`,

        "",

        result.data?.error ||

        result.data?.message ||

        result.data?.detail ||

        result.text ||

        "レスポンス本文がありません。"

      ].join("\n")
    );
  }


  if (!result.data) {

    throw new Error(
      [
        "【レスポンス形式エラー】",

        "",

        "JSONを受信できませんでした。",

        "",

        result.text ||
        "(empty)"

      ].join("\n")
    );
  }


  return result.data;
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
      "error"
    );

    questionInput.focus();

    return;
  }


  researchButton.disabled =
    true;

  clearButton.disabled =
    true;


  if (evaluateButton) {

    evaluateButton.disabled =
      true;
  }


  setConnectionState(
    "",
    "Supabase 接続中..."
  );


  setProgress(
    5,
    "研究を準備しています..."
  );


  showStatus(
    "研究AIに接続しています..."
  );


  try {

    setProgress(
      20,
      "smart-handlerへ接続しています..."
    );


    const data =
      await callEdgeFunction(
        RESEARCH_FUNCTION,
        {

          message:
            message,

          project_id:
            currentProjectId

        }
      );


    currentResearchData =
      data;


    if (
      data &&
      data.ok === false
    ) {

      throw new Error(
        data.error ||
        data.detail ||
        "研究AIがエラーを返しました。"
      );
    }


    const research =
      data?.research ||
      data;


    if (!research) {

      throw new Error(
        "研究AIから結果が返ってきませんでした。"
      );
    }


    currentResearch =
      research;


    setConnectionState(
      "ok",
      "Supabase 接続済み"
    );


    setProgress(
      70,
      "研究結果を解析しています..."
    );


    displayResearch(
      research,
      data
    );


    saveHistory(
      message,
      research
    );


    renderHistory();


    setProgress(
      100,
      "研究実行完了"
    );


    showStatus(
      "研究AIとの通信に成功しました。",
      "success"
    );


    if (evaluateButton) {

      evaluateButton.disabled =
        false;
    }


  } catch (
    error
  ) {

    console.error(
      "RESEARCH ERROR:",
      error
    );


    setConnectionState(
      "error",
      "Supabase 接続エラー"
    );


    showStatus(
      [
        errorText(
          error
        ),

        "",

        "Function:",
        RESEARCH_FUNCTION,

        "",

        "Project ID:",
        currentProjectId

      ].join("\n"),
      "error"
    );


    setProgress(
      100,
      "エラーで終了"
    );


  } finally {

    researchButton.disabled =
      false;

    clearButton.disabled =
      false;
  }
}


/* ==========================================================
   DISPLAY RESEARCH
========================================================== */

function displayResearch(
  research,
  data
) {

  if (latestSection) {

    latestSection.classList.remove(
      "hidden"
    );
  }


  if (latestTitle) {

    latestTitle.textContent =
      research.title ||
      "AI研究回答";
  }


  if (latestDate) {

    latestDate.textContent =
      new Date().toLocaleString(
        "ja-JP"
      );
  }


  if (latestSummary) {

    latestSummary.textContent =
      research.summary ||

      research.description ||

      research.answer ||

      data?.answer ||

      JSON.stringify(
        research,
        null,
        2
      );
  }


  if (latestMeta) {

    latestMeta.innerHTML =
      "";

    addTag(
      research.status
    );

    if (
      research.confidence !== undefined
    ) {

      addTag(
        `信頼度 ${research.confidence}`
      );
    }

    addTag(
      research.route
    );
  }


  setText(
    detailHypothesis,
    research.hypothesis
  );

  setText(
    detailCalculation,
    research.calculation
  );

  setText(
    detailVerification,
    research.verification
  );

  setText(
    detailNextAction,
    research.next_action ||
    research.nextAction
  );

  setText(
    detailRoute,
    research.route
  );


  if (detailReason) {

    detailReason.textContent =
      research.confidence_basis ||
      "まだAI評価されていません。";
  }


  resetEvaluationUI();
}


/* ==========================================================
   EVALUATION
========================================================== */

async function runEvaluation() {

  if (!currentResearch) {

    showStatus(
      "先に研究を実行してください。",
      "error"
    );

    return;
  }


  if (evaluateButton) {

    evaluateButton.disabled =
      true;
  }


  setProgress(
    15,
    "AI評価を準備しています..."
  );


  showStatus(
    "評価AIに接続しています..."
  );


  try {

    setProgress(
      30,
      "evaluateへ接続しています..."
    );


    /*
     * 研究結果を複数の一般的なキーで渡す。
     * evaluate側がどの形式を採用していても
     * 受け取りやすい構造にしている。
     */

    const payload = {

      project_id:
        currentProjectId,

      message:
        questionInput.value.trim(),

      research:
        currentResearch,

      result:
        currentResearch,

      research_result:
        currentResearch

    };


    const data =
      await callEdgeFunction(
        EVALUATE_FUNCTION,
        payload
      );


    if (
      data &&
      data.ok === false
    ) {

      throw new Error(
        data.error ||
        data.detail ||
        "AI評価がエラーを返しました。"
      );
    }


    setProgress(
      75,
      "評価結果を表示しています..."
    );


    const evaluation =
      data?.evaluation ||

      data?.result ||

      data?.answer ||

      data;


    if (!evaluation) {

      throw new Error(
        "評価AIから評価結果が返ってきませんでした。"
      );
    }


    displayEvaluation(
      evaluation
    );


    setConnectionState(
      "ok",
      "Supabase 接続済み"
    );


    setProgress(
      100,
      "AI評価完了"
    );


    showStatus(
      "AI評価が完了しました。",
      "success"
    );


  } catch (
    error
  ) {

    console.error(
      "EVALUATION ERROR:",
      error
    );


    showStatus(
      [
        "AI評価に失敗しました。",

        "",

        errorText(
          error
        ),

        "",

        `Function: ${EVALUATE_FUNCTION}`

      ].join("\n"),
      "error"
    );


    setProgress(
      100,
      "AI評価エラー"
    );


  } finally {

    if (evaluateButton) {

      evaluateButton.disabled =
        false;
    }
  }
}


/* ==========================================================
   DISPLAY EVALUATION
========================================================== */

function displayEvaluation(
  evaluation
) {

  /*
   * JSON文字列として返ってきた場合にも対応。
   */

  if (
    typeof evaluation ===
    "string"
  ) {

    try {

      evaluation =
        JSON.parse(
          evaluation
        );

    } catch (_) {

      if (detailReason) {

        detailReason.textContent =
          evaluation;
      }

      return;
    }
  }


  if (
    evaluation?.evaluation
  ) {

    evaluation =
      evaluation.evaluation;
  }


  const overall =
    getValue(
      evaluation,
      [
        "overall",
        "total",
        "overall_score",
        "score"
      ]
    );


  const hypothesis =
    getValue(
      evaluation,
      [
        "hypothesis",
        "hypothesis_score"
      ]
    );


  const calculation =
    getValue(
      evaluation,
      [
        "calculation",
        "calculation_score"
      ]
    );


  const verification =
    getValue(
      evaluation,
      [
        "verification",
        "verification_score"
      ]
    );


  const logic =
    getValue(
      evaluation,
      [
        "logic",
        "logic_score"
      ]
    );


  setEvaluationCards(
    [
      ["総合", overall],
      ["仮説", hypothesis],
      ["計算", calculation],
      ["検証", verification],
      ["論理", logic]
    ]
  );


  setText(
    detailHypothesis,
    getValue(
      evaluation,
      [
        "hypothesis_reason",
        "hypothesis_comment",
        "hypothesis"
      ]
    )
  );


  setText(
    detailCalculation,
    getValue(
      evaluation,
      [
        "calculation_reason",
        "calculation_comment",
        "calculation"
      ]
    )
  );


  setText(
    detailVerification,
    getValue(
      evaluation,
      [
        "verification_reason",
        "verification_comment",
        "verification"
      ]
    )
  );


  setText(
    detailNextAction,
    getValue(
      evaluation,
      [
        "next_action",
        "nextAction"
      ]
    )
  );


  setText(
    detailRoute,
    getValue(
      evaluation,
      [
        "route"
      ]
    )
  );


  setText(
    detailReason,
    getValue(
      evaluation,
      [
        "reason",
        "evaluation_reason",
        "confidence_basis",
        "explanation"
      ]
    )
  );


  if (latestSymbol) {

    const status =
      getValue(
        evaluation,
        [
          "status",
          "overall_status"
        ]
      );


    latestSymbol.textContent =
      statusSymbol(
        status
      );


    latestSymbol.className =
      "symbol " +
      statusClass(
        status
      );
  }


  if (details) {

    details.classList.remove(
      "hidden"
    );
  }


  if (
    toggleDetailsButton
  ) {

    toggleDetailsButton.textContent =
      "詳細を隠す";
  }
}


/* ==========================================================
   EVALUATION UI
========================================================== */

function resetEvaluationUI() {

  if (evaluationGrid) {

    evaluationGrid.innerHTML =
      "";
  }


  if (latestSymbol) {

    latestSymbol.textContent =
      "△";

    latestSymbol.className =
      "symbol maybe";
  }


  if (details) {

    details.classList.add(
      "hidden"
    );
  }


  if (
    toggleDetailsButton
  ) {

    toggleDetailsButton.textContent =
      "詳細を表示";
  }
}


function setEvaluationCards(
  items
) {

  if (!evaluationGrid) {
    return;
  }


  evaluationGrid.innerHTML =
    "";


  items.forEach(
    ([label, value]) => {

      const item =
        document.createElement(
          "div"
        );

      item.className =
        "evaluation-item";


      const labelElement =
        document.createElement(
          "div"
        );

      labelElement.className =
        "label";

      labelElement.textContent =
        label;


      const valueElement =
        document.createElement(
          "div"
        );

      valueElement.className =
        "value";

      valueElement.textContent =
        formatEvaluation(
          value
        );


      item.appendChild(
        labelElement
      );

      item.appendChild(
        valueElement
      );


      evaluationGrid.appendChild(
        item
      );
    }
  );
}


/* ==========================================================
   VALUE HELPERS
========================================================== */

function getValue(
  object,
  keys
) {

  if (!object) {
    return null;
  }


  for (
    const key of keys
  ) {

    if (
      object[key] !== undefined &&
      object[key] !== null &&
      object[key] !== ""
    ) {

      return object[key];
    }
  }


  return null;
}


function formatEvaluation(
  value
) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {

    return "△";
  }


  if (
    typeof value === "number"
  ) {

    if (
      value >= 0 &&
      value <= 1
    ) {

      return `${Math.round(
        value * 100
      )}%`;
    }


    return String(
      value
    );
  }


  if (
    typeof value === "boolean"
  ) {

    return value
      ? "○"
      : "×";
  }


  return String(
    value
  );
}


function statusSymbol(
  status
) {

  const value =
    String(
      status ||
      ""
    ).toLowerCase();


  if (
    value.includes("good") ||
    value.includes("pass") ||
    value.includes("valid") ||
    value.includes("true")
  ) {

    return "○";
  }


  if (
    value.includes("bad") ||
    value.includes("fail") ||
    value.includes("invalid") ||
    value.includes("false")
  ) {

    return "×";
  }


  return "△";
}


function statusClass(
  status
) {

  const symbol =
    statusSymbol(
      status
    );


  if (symbol === "○") {

    return "good";
  }


  if (symbol === "×") {

    return "bad";
  }


  return "maybe";
}


/* ==========================================================
   TEXT
========================================================== */

function setText(
  element,
  value
) {

  if (!element) {
    return;
  }


  element.textContent =
    value ||
    "記録なし";
}


/* ==========================================================
   TAGS
========================================================== */

function addTag(
  value
) {

  if (
    !latestMeta ||
    value === null ||
    value === undefined ||
    value === ""
  ) {

    return;
  }


  const tag =
    document.createElement(
      "div"
    );

  tag.className =
    "tag";

  tag.textContent =
    String(
      value
    );


  latestMeta.appendChild(
    tag
  );
}


/* ==========================================================
   DETAILS
========================================================== */

function toggleDetails() {

  if (!details) {
    return;
  }


  details.classList.toggle(
    "hidden"
  );


  if (
    toggleDetailsButton
  ) {

    toggleDetailsButton.textContent =
      details.classList.contains(
        "hidden"
      )
        ? "詳細を表示"
        : "詳細を隠す";
  }
}


/* ==========================================================
   HISTORY
========================================================== */

function loadHistory() {

  try {

    const raw =
      localStorage.getItem(
        "research_history"
      );


    if (!raw) {

      researchHistory =
        [];

      return;
    }


    const parsed =
      JSON.parse(
        raw
      );


    researchHistory =
      Array.isArray(
        parsed
      )
        ? parsed
        : [];


  } catch (
    error
  ) {

    console.error(
      "History load error:",
      error
    );

    researchHistory =
      [];
  }
}


function saveHistory(
  question,
  research
) {

  const item = {

    id:
      Date.now(),

    question:
      question,

    title:
      research.title ||
      "AI研究回答",

    status:
      research.status ||
      "maybe",

    summary:
      research.summary ||
      research.description ||
      "",

    date:
      new Date().toISOString(),

    research:
      research
  };


  researchHistory.unshift(
    item
  );


  researchHistory =
    researchHistory.slice(
      0,
      50
    );


  try {

    localStorage.setItem(
      "research_history",
      JSON.stringify(
        researchHistory
      )
    );

  } catch (
    error
  ) {

    console.error(
      "History save error:",
      error
    );
  }
}


function renderHistory() {

  if (
    !historyList
  ) {
    return;
  }


  if (
    historyCount
  ) {

    historyCount.textContent =
      `${researchHistory.length}件`;
  }


  if (
    researchHistory.length ===
    0
  ) {

    historyList.innerHTML = `

      <div class="history-empty">
        研究履歴はありません。
      </div>

    `;

    return;
  }


  historyList.innerHTML =
    "";


  researchHistory.forEach(
    item => {

      const element =
        document.createElement(
          "div"
        );

      element.className =
        "history-item";


      const symbol =
        statusSymbol(
          item.status
        );


      const symbolClass =
        statusClass(
          item.status
        );


      element.innerHTML = `

        <div class="history-main">

          <div
            class="history-symbol ${symbolClass}"
          >
            ${symbol}
          </div>

          <div
            style="min-width:0"
          >

            <div class="history-title">
              ${escapeHTML(
                item.title
              )}
            </div>

            <div class="history-date">
              ${formatDate(
                item.date
              )}
            </div>

          </div>

        </div>

      `;


      element.addEventListener(
        "click",
        () => {

          loadHistoryItem(
            item
          );

        }
      );


      historyList.appendChild(
        element
      );
    }
  );
}


function loadHistoryItem(
  item
) {

  questionInput.value =
    item.question ||
    "";


  currentResearch =
    item.research ||
    null;


  currentResearchData =
    item.research ||
    null;


  if (
    currentResearch
  ) {

    displayResearch(
      currentResearch,
      currentResearch
    );


    if (latestSection) {

      latestSection.classList.remove(
        "hidden"
      );
    }


    if (evaluateButton) {

      evaluateButton.disabled =
        false;
    }


    latestSection?.scrollIntoView({
      behavior:
        "smooth",
      block:
        "start"
    });
  }
}


/* ==========================================================
   HISTORY HELPERS
========================================================== */

function formatDate(
  value
) {

  try {

    return new Date(
      value
    ).toLocaleString(
      "ja-JP"
    );

  } catch (_) {

    return "";
  }
}


function escapeHTML(
  value
) {

  return String(
    value ||
    ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}


/* ==========================================================
   CLEAR
========================================================== */

function clearResearch() {

  questionInput.value =
    "";

  currentResearch =
    null;

  currentResearchData =
    null;


  hideStatus();


  progress.classList.add(
    "hidden"
  );


  setConnectionState(
    "",
    "接続待機中"
  );


  if (latestSection) {

    latestSection.classList.add(
      "hidden"
    );
  }


  resetEvaluationUI();


  if (evaluateButton) {

    evaluateButton.disabled =
      true;
  }
}


/* ==========================================================
   STRICT MODE
========================================================== */

const strictMode =
  document.getElementById(
    "strictMode"
  );

const settingsStrictMode =
  document.getElementById(
    "settingsStrictMode"
  );


if (
  strictMode &&
  settingsStrictMode
) {

  const saved =
    localStorage.getItem(
      "research_strict_mode"
    ) === "true";


  strictMode.checked =
    saved;

  settingsStrictMode.checked =
    saved;


  function updateStrictMode(
    value
  ) {

    strictMode.checked =
      value;

    settingsStrictMode.checked =
      value;


    localStorage.setItem(
      "research_strict_mode",
      String(
        value
      )
    );
  }


  strictMode.addEventListener(
    "change",
    () => {

      updateStrictMode(
        strictMode.checked
      );
    }
  );


  settingsStrictMode.addEventListener(
    "change",
    () => {

      updateStrictMode(
        settingsStrictMode.checked
      );
    }
  );
}


/* ==========================================================
   BUTTON EVENTS
========================================================== */

researchButton.addEventListener(
  "click",
  runResearch
);


clearButton.addEventListener(
  "click",
  clearResearch
);


if (
  evaluateButton
) {

  evaluateButton.addEventListener(
    "click",
    runEvaluation
  );
}


if (
  toggleDetailsButton
) {

  toggleDetailsButton.addEventListener(
    "click",
    toggleDetails
  );
}


/* ==========================================================
   KEYBOARD
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
  }
);


/* ==========================================================
   INITIALIZE
========================================================== */

function initialize() {

  try {

    checkDOM();

    loadHistory();

    renderHistory();


    setConnectionState(
      "",
      "接続待機中"
    );


    console.log(
      "================================"
    );

    console.log(
      "24/7 Riemann Research Lab"
    );

    console.log(
      "FULL APP INITIALIZED"
    );

    console.log(
      "Research:",
      RESEARCH_FUNCTION
    );

    console.log(
      "Evaluate:",
      EVALUATE_FUNCTION
    );

    console.log(
      "Project:",
      currentProjectId
    );

    console.log(
      "Communication:",
      "DIRECT FETCH"
    );

    console.log(
      "================================"
    );


  } catch (
    error
  ) {

    console.error(
      "Initialization error:",
      error
    );


    showStatus(
      errorText(
        error
      ),
      "error"
    );
  }
}


/* ==========================================================
   START
========================================================== */

initialize();
