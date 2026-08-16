/* ==========================================================
   24/7 RIEMANN RESEARCH LAB
   APP.JS - FUNCTION RESTORE VERSION
========================================================== */


/* ==========================================================
   SUPABASE CONFIG
========================================================== */

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
   LOCAL HISTORY
========================================================== */

const HISTORY_KEY =
  "riemann_research_history_v1";


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


/* ==========================================================
   RESULT DOM
========================================================== */

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

const evaluationGrid =
  document.getElementById(
    "evaluationGrid"
  );

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

const latestSymbol =
  document.getElementById(
    "latestSymbol"
  );

const historyList =
  document.getElementById(
    "historyList"
  );

const historyCount =
  document.getElementById(
    "historyCount"
  );


/* ==========================================================
   STATE
========================================================== */

let currentResearch =
  null;

let currentQuestion =
  "";

let currentRawResponse =
  null;


/* ==========================================================
   BASIC CHECK
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
        ([, element]) =>
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
   PROGRESS
========================================================== */

function setProgress(
  percent,
  text
) {

  if (!progress) {
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
      text;
  }
}


/* ==========================================================
   CONNECTION
========================================================== */

function setConnectionState(
  state,
  text
) {

  if (!connectionDot ||
      !connectionText) {

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
   ERROR
========================================================== */

function errorText(
  error
) {

  if (!error) {

    return "不明なエラーです。";
  }


  if (
    typeof error ===
    "string"
  ) {

    return error;
  }


  if (
    error.message
  ) {

    return String(
      error.message
    );
  }


  return String(
    error
  );
}


/* ==========================================================
   SAFE TEXT
========================================================== */

function textValue(
  value,
  fallback = "記録なし"
) {

  if (
    value === null ||
    value === undefined
  ) {

    return fallback;
  }


  if (
    typeof value === "string"
  ) {

    return value.trim() ||
      fallback;
  }


  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {

    return String(value);
  }


  try {

    return JSON.stringify(
      value,
      null,
      2
    );

  } catch (_) {

    return fallback;
  }
}


/* ==========================================================
   RESPONSE PARSER
========================================================== */

function parsePossibleJSON(
  value
) {

  if (
    typeof value !==
    "string"
  ) {

    return value;
  }


  const trimmed =
    value.trim();


  if (!trimmed) {

    return value;
  }


  try {

    return JSON.parse(
      trimmed
    );

  } catch (_) {

    return value;
  }
}


/* ==========================================================
   NORMALIZE AI RESPONSE
========================================================== */

function normalizeResearch(
  data,
  question
) {

  let answer =
    data?.answer;


  answer =
    parsePossibleJSON(
      answer
    );


  let source =
    data?.research ||
    data?.result ||
    data?.data ||
    answer ||
    data;


  source =
    parsePossibleJSON(
      source
    );


  if (
    typeof source ===
    "string"
  ) {

    return {

      title:
        "AI研究回答",

      summary:
        source,

      hypothesis:
        "記録なし",

      calculation:
        "記録なし",

      verification:
        "記録なし",

      nextAction:
        "AIの回答をもとに次の研究方針を設定してください。",

      route:
        "Research → Hypothesis → Experiment → Red Team",

      reason:
        "まだ詳細評価されていません。",

      status:
        "maybe",

      confidence:
        null,

      scores:
        {},

      question:
        question,

      raw:
        data
    };
  }


  if (
    !source ||
    typeof source !== "object"
  ) {

    source = {};
  }


  const summary =
    source.summary ??
    source.description ??
    source.answer ??
    data?.answer ??
    source.conclusion ??
    source.result ??
    "研究AIから結果を受信しました。";


  const hypothesis =
    source.hypothesis ??
    source.hypotheses ??
    source.hypothesis_text ??
    source.idea ??
    source.claim;


  const calculation =
    source.calculation ??
    source.calculations ??
    source.experiment ??
    source.computation ??
    source.numeric_result;


  const verification =
    source.verification ??
    source.verify ??
    source.validation ??
    source.evidence ??
    source.proof_status;


  const nextAction =
    source.next_action ??
    source.nextAction ??
    source.next_step ??
    source.next ??
    source.recommendation;


  const route =
    source.route ??
    source.research_route ??
    source.researchRoute ??
    source.strategy;


  const reason =
    source.confidence_basis ??
    source.reason ??
    source.evaluation_reason ??
    source.evaluationReason;


  const status =
    source.status ??
    source.verdict ??
    source.result_status ??
    "maybe";


  const confidence =
    source.confidence ??
    source.score ??
    null;


  const scores =
    source.scores ??
    source.evaluation ??
    source.evaluations ??
    {};


  return {

    title:
      textValue(
        source.title,
        "AI研究回答"
      ),

    summary:
      textValue(
        summary,
        "研究AIから結果を受信しました。"
      ),

    hypothesis:
      textValue(
        hypothesis
      ),

    calculation:
      textValue(
        calculation
      ),

    verification:
      textValue(
        verification
      ),

    nextAction:
      textValue(
        nextAction
      ),

    route:
      textValue(
        route
      ),

    reason:
      textValue(
        reason,
        "まだ詳細評価されていません。"
      ),

    status:
      String(status),

    confidence:
      confidence,

    scores:
      scores,

    question:
      question,

    raw:
      data
  };
}


/* ==========================================================
   EDGE FUNCTION REQUEST
========================================================== */

async function callFunction(
  functionName,
  body
) {

  const functionURL =
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
    functionURL
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
        functionURL,
        {

          method:
            "POST",

          headers: {

            "Content-Type":
              "application/json",

            "apikey":
              SUPABASE_PUBLISHABLE_KEY,

            "Authorization":
              `Bearer ${SUPABASE_PUBLISHABLE_KEY}`

          },

          body:
            JSON.stringify(
              body
            )
        }
      );

  } catch (
    networkError
  ) {

    console.error(
      "FETCH ERROR:",
      networkError
    );


    throw new Error(
      [
        "【通信エラー】",
        "",
        "Supabase Edge Functionへ接続できませんでした。",
        "",
        `Function: ${functionName}`,
        `URL: ${functionURL}`,
        "",
        `エラー: ${errorText(networkError)}`
      ].join("\n")
    );
  }


  const responseText =
    await response.text();


  let responseData =
    null;


  if (responseText) {

    try {

      responseData =
        JSON.parse(
          responseText
        );

    } catch (_) {

      responseData =
        null;
    }
  }


  console.log(
    "HTTP STATUS:",
    response.status
  );

  console.log(
    "RESPONSE:",
    responseData ??
    responseText
  );


  if (!response.ok) {

    throw new Error(
      [
        "【Edge Function HTTPエラー】",
        "",
        `HTTP Status: ${response.status}`,
        `Function: ${functionName}`,
        "",
        responseData?.error ||
        responseData?.message ||
        responseText ||
        "レスポンス本文がありません。"
      ].join("\n")
    );
  }


  return responseData ??
    responseText;
}


/* ==========================================================
   RESEARCH FUNCTION
========================================================== */

async function callResearchFunction(
  message
) {

  return callFunction(
    RESEARCH_FUNCTION,
    {

      message:
        message,

      project_id:
        currentProjectId

    }
  );
}


/* ==========================================================
   RENDER RESULT
========================================================== */

function renderResearch(
  research
) {

  currentResearch =
    research;


  if (latestSection) {

    latestSection.classList.remove(
      "hidden"
    );
  }


  if (latestTitle) {

    latestTitle.textContent =
      research.title;
  }


  if (latestDate) {

    latestDate.textContent =
      new Date().toLocaleString(
        "ja-JP"
      );
  }


  if (latestSummary) {

    latestSummary.textContent =
      research.summary;
  }


  /* --------------------------------------------------------
     DETAILS
  -------------------------------------------------------- */

  if (detailHypothesis) {

    detailHypothesis.textContent =
      research.hypothesis;
  }


  if (detailCalculation) {

    detailCalculation.textContent =
      research.calculation;
  }


  if (detailVerification) {

    detailVerification.textContent =
      research.verification;
  }


  if (detailNextAction) {

    detailNextAction.textContent =
      research.nextAction;
  }


  if (detailRoute) {

    detailRoute.textContent =
      research.route;
  }


  if (detailReason) {

    detailReason.textContent =
      research.reason;
  }


  /* --------------------------------------------------------
     SYMBOL
  -------------------------------------------------------- */

  renderSymbol(
    research.status
  );


  /* --------------------------------------------------------
     META
  -------------------------------------------------------- */

  if (latestMeta) {

    latestMeta.innerHTML =
      "";

    addTag(
      latestMeta,
      "Research"
    );

    addTag(
      latestMeta,
      `Project: ${currentProjectId.slice(0, 8)}`
    );

    if (
      research.confidence !==
      null &&
      research.confidence !==
      undefined
    ) {

      addTag(
        latestMeta,
        `Confidence: ${research.confidence}`
      );
    }

    if (
      research.status
    ) {

      addTag(
        latestMeta,
        `Status: ${research.status}`
      );
    }
  }


  /* --------------------------------------------------------
     EVALUATION
  -------------------------------------------------------- */

  renderEvaluation(
    research
  );


  if (evaluateButton) {

    evaluateButton.disabled =
      false;
  }
}


/* ==========================================================
   SYMBOL
========================================================== */

function renderSymbol(
  status
) {

  if (!latestSymbol) {
    return;
  }


  latestSymbol.classList.remove(
    "good",
    "bad",
    "maybe"
  );


  const normalized =
    String(
      status ||
      "maybe"
    ).toLowerCase();


  if (
    normalized === "good" ||
    normalized === "true" ||
    normalized === "proved" ||
    normalized === "confirmed"
  ) {

    latestSymbol.classList.add(
      "good"
    );

    latestSymbol.textContent =
      "✓";

    return;
  }


  if (
    normalized === "bad" ||
    normalized === "false" ||
    normalized === "refuted" ||
    normalized === "rejected"
  ) {

    latestSymbol.classList.add(
      "bad"
    );

    latestSymbol.textContent =
      "×";

    return;
  }


  latestSymbol.classList.add(
    "maybe"
  );

  latestSymbol.textContent =
    "△";
}


/* ==========================================================
   TAG
========================================================== */

function addTag(
  container,
  text
) {

  const tag =
    document.createElement(
      "span"
    );

  tag.className =
    "tag";

  tag.textContent =
    text;

  container.appendChild(
    tag
  );
}


/* ==========================================================
   SCORE NORMALIZATION
========================================================== */

function findScore(
  scores,
  keys
) {

  if (
    !scores ||
    typeof scores !==
    "object"
  ) {

    return "△";
  }


  for (
    const key of keys
  ) {

    if (
      scores[key] !==
      undefined &&
      scores[key] !==
      null
    ) {

      const value =
        scores[key];


      if (
        typeof value ===
        "number"
      ) {

        return String(
          Math.round(
            value
          )
        );
      }


      return String(
        value
      );
    }
  }


  return "△";
}


/* ==========================================================
   EVALUATION
========================================================== */

function renderEvaluation(
  research
) {

  const scores =
    research.scores ||
    {};


  const values = [

    findScore(
      scores,
      [
        "overall",
        "total",
        "総合"
      ]
    ),

    findScore(
      scores,
      [
        "hypothesis",
        "hypotheses",
        "仮説"
      ]
    ),

    findScore(
      scores,
      [
        "calculation",
        "experiment",
        "計算"
      ]
    ),

    findScore(
      scores,
      [
        "verification",
        "検証"
      ]
    ),

    findScore(
      scores,
      [
        "logic",
        "logical",
        "論理"
      ]
    )

  ];


  /*
   * index.htmlには最初から
   * △ △ △ △ △ の表示がある。
   *
   * その5個を更新する。
   */

  const staticItems =
    document.querySelectorAll(
      ".latest-section .evaluation-grid:first-of-type .evaluation-item .value"
    );


  staticItems.forEach(
    (
      element,
      index
    ) => {

      if (
        values[index]
      ) {

        element.textContent =
          values[index];
      }
    }
  );


  /*
   * 追加評価が存在する場合は
   * 下側のevaluationGridにも表示。
   */

  if (evaluationGrid) {

    evaluationGrid.innerHTML =
      "";


    const labels = [
      "総合",
      "仮説",
      "計算",
      "検証",
      "論理"
    ];


    values.forEach(
      (
        value,
        index
      ) => {

        const item =
          document.createElement(
            "div"
          );

        item.className =
          "evaluation-item";


        item.innerHTML = `
          <div class="label">
            ${labels[index]}
          </div>

          <div class="value">
            ${value}
          </div>
        `;


        evaluationGrid.appendChild(
          item
        );
      }
    );
  }
}


/* ==========================================================
   HISTORY LOAD
========================================================== */

function loadHistory() {

  try {

    const raw =
      localStorage.getItem(
        HISTORY_KEY
      );


    if (!raw) {
      return [];
    }


    const parsed =
      JSON.parse(
        raw
      );


    if (
      !Array.isArray(
        parsed
      )
    ) {

      return [];
    }


    return parsed;

  } catch (error) {

    console.error(
      "History load error:",
      error
    );

    return [];
  }
}


/* ==========================================================
   HISTORY SAVE
========================================================== */

function saveHistory(
  research
) {

  try {

    let history =
      loadHistory();


    const item = {

      id:
        crypto?.randomUUID ?
        crypto.randomUUID() :
        String(
          Date.now()
        ),

      created_at:
        new Date().toISOString(),

      question:
        research.question,

      title:
        research.title,

      summary:
        research.summary,

      hypothesis:
        research.hypothesis,

      calculation:
        research.calculation,

      verification:
        research.verification,

      nextAction:
        research.nextAction,

      route:
        research.route,

      reason:
        research.reason,

      status:
        research.status,

      confidence:
        research.confidence,

      scores:
        research.scores
    };


    history.unshift(
      item
    );


    history =
      history.slice(
        0,
        50
      );


    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(
        history
      )
    );


    renderHistory();

  } catch (error) {

    console.error(
      "History save error:",
      error
    );
  }
}


/* ==========================================================
   HISTORY RENDER
========================================================== */

function renderHistory() {

  if (!historyList) {
    return;
  }


  const history =
    loadHistory();


  if (historyCount) {

    historyCount.textContent =
      `${history.length}件`;
  }


  historyList.innerHTML =
    "";


  if (!history.length) {

    historyList.innerHTML = `
      <div class="history-empty">
        研究履歴はまだありません。
      </div>
    `;

    return;
  }


  history.forEach(
    item => {

      const element =
        document.createElement(
          "div"
        );

      element.className =
        "history-item";


      const status =
        String(
          item.status ||
          "maybe"
        ).toLowerCase();


      let symbol =
        "△";

      if (
        status === "good" ||
        status === "proved" ||
        status === "confirmed"
      ) {

        symbol =
          "✓";

      } else if (
        status === "bad" ||
        status === "refuted" ||
        status === "rejected"
      ) {

        symbol =
          "×";
      }


      const date =
        item.created_at
          ? new Date(
              item.created_at
            ).toLocaleString(
              "ja-JP"
            )
          : "";


      element.innerHTML = `

        <div class="history-main">

          <div class="history-symbol ${status}">
            ${symbol}
          </div>

          <div style="min-width:0">

            <div class="history-title">
              ${escapeHTML(
                item.title ||
                "AI研究回答"
              )}
            </div>

            <div class="history-date">
              ${escapeHTML(date)}
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


/* ==========================================================
   HISTORY ITEM
========================================================== */

function loadHistoryItem(
  item
) {

  const research = {

    title:
      item.title,

    summary:
      item.summary,

    hypothesis:
      item.hypothesis,

    calculation:
      item.calculation,

    verification:
      item.verification,

    nextAction:
      item.nextAction,

    route:
      item.route,

    reason:
      item.reason,

    status:
      item.status,

    confidence:
      item.confidence,

    scores:
      item.scores,

    question:
      item.question
  };


  currentResearch =
    research;


  if (questionInput) {

    questionInput.value =
      item.question ||
      "";
  }


  renderResearch(
    research
  );


  if (latestSection) {

    latestSection.scrollIntoView({
      behavior:
        "smooth",
      block:
        "start"
    });
  }


  showStatus(
    "研究履歴を表示しました。",
    "success"
  );
}


/* ==========================================================
   ESCAPE HTML
========================================================== */

function escapeHTML(
  value
) {

  return String(
    value ??
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
   EVALUATE
========================================================== */

async function evaluateCurrentResearch() {

  if (
    !currentResearch
  ) {

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
    "研究結果をAI評価しています..."
  );


  showStatus(
    "AI評価を実行しています..."
  );


  try {

    const result =
      await callFunction(
        EVALUATE_FUNCTION,
        {

          project_id:
            currentProjectId,

          question:
            currentResearch.question,

          research:
            currentResearch.raw ??
            currentResearch,

          answer:
            currentResearch.summary

        }
      );


    let evaluation =
      parsePossibleJSON(
        result?.answer ??
        result?.evaluation ??
        result
      );


    if (
      typeof evaluation ===
      "string"
    ) {

      evaluation = {

        reason:
          evaluation
      };
    }


    if (
      evaluation &&
      typeof evaluation ===
      "object"
    ) {

      currentResearch.scores =
        evaluation.scores ??
        evaluation.evaluation ??
        currentResearch.scores ??
        {};


      currentResearch.reason =
        evaluation.reason ??
        evaluation.confidence_basis ??
        evaluation.evaluation_reason ??
        currentResearch.reason;


      currentResearch.status =
        evaluation.status ??
        evaluation.verdict ??
        currentResearch.status;


      currentResearch.confidence =
        evaluation.confidence ??
        currentResearch.confidence;
    }


    renderResearch(
      currentResearch
    );


    updateHistoryCurrent();


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
      "Evaluation error:",
      error
    );


    showStatus(
      [
        "AI評価に失敗しました。",
        "",
        errorText(error)
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
   UPDATE CURRENT HISTORY
========================================================== */

function updateHistoryCurrent() {

  if (
    !currentResearch
  ) {

    return;
  }


  const history =
    loadHistory();


  if (!history.length) {

    saveHistory(
      currentResearch
    );

    return;
  }


  const first =
    history[0];


  first.title =
    currentResearch.title;

  first.summary =
    currentResearch.summary;

  first.hypothesis =
    currentResearch.hypothesis;

  first.calculation =
    currentResearch.calculation;

  first.verification =
    currentResearch.verification;

  first.nextAction =
    currentResearch.nextAction;

  first.route =
    currentResearch.route;

  first.reason =
    currentResearch.reason;

  first.status =
    currentResearch.status;

  first.confidence =
    currentResearch.confidence;

  first.scores =
    currentResearch.scores;


  localStorage.setItem(
    HISTORY_KEY,
    JSON.stringify(
      history
    )
  );


  renderHistory();
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


  currentQuestion =
    message;


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

    /* ------------------------------------------------------
       STEP 1
    ------------------------------------------------------ */

    setProgress(
      20,
      "Supabase Edge Functionへ接続しています..."
    );


    /* ------------------------------------------------------
       STEP 2
    ------------------------------------------------------ */

    setProgress(
      35,
      "smart-handlerを実行しています..."
    );


    const data =
      await callResearchFunction(
        message
      );


    currentRawResponse =
      data;


    /* ------------------------------------------------------
       STEP 3
    ------------------------------------------------------ */

    setConnectionState(
      "ok",
      "Supabase 接続済み"
    );


    setProgress(
      65,
      "研究AIから結果を受信しました..."
    );


    console.log(
      "=== RESEARCH RESPONSE ==="
    );

    console.log(
      data
    );


    /* ------------------------------------------------------
       STEP 4
    ------------------------------------------------------ */

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


    /* ------------------------------------------------------
       STEP 5
    ------------------------------------------------------ */

    const research =
      normalizeResearch(
        data,
        message
      );


    /* ------------------------------------------------------
       STEP 6
    ------------------------------------------------------ */

    setProgress(
      82,
      "研究結果を整理しています..."
    );


    renderResearch(
      research
    );


    /* ------------------------------------------------------
       STEP 7
    ------------------------------------------------------ */

    saveHistory(
      research
    );


    /* ------------------------------------------------------
       STEP 8
    ------------------------------------------------------ */

    setProgress(
      100,
      "研究実行完了"
    );


    showStatus(
      "研究AIとの通信に成功しました。",
      "success"
    );


    console.log(
      "=== RESEARCH COMPLETE ==="
    );

  } catch (
    error
  ) {

    console.error(
      "=== RESEARCH ERROR ==="
    );

    console.error(
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


    if (
      evaluateButton &&
      currentResearch
    ) {

      evaluateButton.disabled =
        false;
    }
  }
}


/* ==========================================================
   CLEAR
========================================================== */

function clearResearch() {

  questionInput.value =
    "";

  currentResearch =
    null;

  currentRawResponse =
    null;

  hideStatus();


  if (progress) {

    progress.classList.add(
      "hidden"
    );
  }


  setConnectionState(
    "",
    "接続待機中"
  );


  if (latestSection) {

    latestSection.classList.add(
      "hidden"
    );
  }


  if (evaluateButton) {

    evaluateButton.disabled =
      true;
  }


  if (details) {

    details.classList.add(
      "hidden"
    );
  }


  if (toggleDetailsButton) {

    toggleDetailsButton.textContent =
      "詳細を表示";
  }
}


/* ==========================================================
   DETAILS TOGGLE
========================================================== */

function toggleDetails() {

  if (!details) {
    return;
  }


  const hidden =
    details.classList.contains(
      "hidden"
    );


  if (hidden) {

    details.classList.remove(
      "hidden"
    );

    if (toggleDetailsButton) {

      toggleDetailsButton.textContent =
        "詳細を閉じる";
    }

  } else {

    details.classList.add(
      "hidden"
    );

    if (toggleDetailsButton) {

      toggleDetailsButton.textContent =
        "詳細を表示";
    }
  }
}


/* ==========================================================
   BUTTON EVENTS
========================================================== */

if (researchButton) {

  researchButton.addEventListener(
    "click",
    runResearch
  );
}


if (clearButton) {

  clearButton.addEventListener(
    "click",
    clearResearch
  );
}


if (evaluateButton) {

  evaluateButton.addEventListener(
    "click",
    evaluateCurrentResearch
  );
}


if (toggleDetailsButton) {

  toggleDetailsButton.addEventListener(
    "click",
    toggleDetails
  );
}


/* ==========================================================
   COMMAND / CTRL + ENTER
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
    }
  );
}


/* ==========================================================
   INITIALIZE CONNECTION UI
========================================================== */

function initializeConnectionUI() {

  setConnectionState(
    "",
    "接続待機中"
  );
}


/* ==========================================================
   INITIALIZE
========================================================== */

function initialize() {

  try {

    checkDOM();


    console.log(
      "================================"
    );

    console.log(
      "24/7 Riemann Research Lab"
    );

    console.log(
      "FUNCTION RESTORE VERSION"
    );

    console.log(
      "Initialized"
    );

    console.log(
      "Supabase:",
      SUPABASE_URL
    );

    console.log(
      "Research Function:",
      RESEARCH_FUNCTION
    );

    console.log(
      "Evaluate Function:",
      EVALUATE_FUNCTION
    );

    console.log(
      "Project ID:",
      currentProjectId
    );

    console.log(
      "Communication:",
      "DIRECT FETCH"
    );

    console.log(
      "================================"
    );


    initializeConnectionUI();


    renderHistory();

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
