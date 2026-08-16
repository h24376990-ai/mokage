/* ==========================================================
   24/7 RIEMANN RESEARCH LAB
   app.js - RESTORED FULL VERSION
========================================================== */


/* ==========================================================
   SUPABASE
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
   STATE
========================================================== */

let currentResearch = null;

let currentResearchId = null;

let researchHistory = [];

let isResearching = false;

let isEvaluating = false;


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

const latestSymbol =
  document.getElementById(
    "latestSymbol"
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

const evaluationGrid =
  document.getElementById(
    "evaluationGrid"
  );


/* ==========================================================
   HISTORY DOM
========================================================== */

const historyList =
  document.getElementById(
    "historyList"
  );

const historyCount =
  document.getElementById(
    "historyCount"
  );


/* ==========================================================
   BASIC DOM CHECK
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


  progressValue.style.width =
    `${safe}%`;

  progressPercent.textContent =
    `${Math.round(safe)}%`;

  progressText.textContent =
    text;
}


/* ==========================================================
   CONNECTION
========================================================== */

function setConnectionState(
  state,
  text
) {

  connectionDot.classList.remove(
    "ok",
    "error"
  );


  if (state === "ok") {

    connectionDot.classList.add(
      "ok"
    );

  }


  if (state === "error") {

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


  if (error.message) {

    return String(
      error.message
    );
  }


  return String(error);
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
    "EDGE FUNCTION:",
    functionName
  );

  console.log(
    "URL:",
    url
  );

  console.log(
    "BODY:",
    body
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
              `Bearer ${SUPABASE_PUBLISHABLE_KEY}`

          },

          body:
            JSON.stringify(body)

        }
      );

  } catch (error) {

    console.error(
      "EDGE FETCH ERROR:",
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

        `エラー: ${errorText(error)}`

      ].join("\n")
    );
  }


  const text =
    await response.text();


  let data = null;


  if (text) {

    try {

      data =
        JSON.parse(text);

    } catch (_) {

      data = null;
    }
  }


  console.log(
    "HTTP:",
    response.status
  );

  console.log(
    "RESPONSE:",
    data || text
  );


  if (!response.ok) {

    throw new Error(
      [
        "【Edge Function HTTPエラー】",

        "",

        `HTTP Status: ${response.status}`,

        `Function: ${functionName}`,

        "",

        data?.error ||
        data?.message ||
        data?.detail ||
        text ||
        "レスポンス本文がありません。"

      ].join("\n")
    );
  }


  if (!data) {

    throw new Error(
      [
        "【レスポンス形式エラー】",

        "",

        "Edge FunctionからJSONを受信できませんでした。",

        "",

        text || "(empty)"

      ].join("\n")
    );
  }


  return data;
}


/* ==========================================================
   NORMALIZE RESEARCH RESULT
========================================================== */

function normalizeResearch(
  data
) {

  const result =
    data?.result ||
    data?.research ||
    data?.data ||
    data;


  if (
    result &&
    typeof result === "string"
  ) {

    return {

      title:
        "AI研究回答",

      summary:
        result,

      hypothesis:
        "",

      calculation:
        "",

      verification:
        "",

      next_action:
        "",

      route:
        "",

      confidence:
        null,

      raw:
        data

    };
  }


  return {

    title:
      result?.title ||
      "AI研究回答",

    summary:
      result?.summary ||
      result?.description ||
      data?.answer ||
      result?.answer ||
      "研究結果を受信しました。",

    hypothesis:
      result?.hypothesis ||
      result?.hypothesis_text ||
      "",

    calculation:
      result?.calculation ||
      result?.experiment ||
      "",

    verification:
      result?.verification ||
      result?.evidence ||
      "",

    next_action:
      result?.next_action ||
      result?.nextAction ||
      "",

    route:
      result?.route ||
      result?.research_route ||
      "",

    confidence:
      result?.confidence ??
      null,

    status:
      result?.status ||
      "",

    raw:
      result
  };
}


/* ==========================================================
   DISPLAY RESEARCH
========================================================== */

function displayResearch(
  research,
  sourceData = null
) {

  currentResearch =
    research;

  currentResearchId =
    sourceData?.id ||
    research?.id ||
    currentResearchId;


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
      sourceData?.created_at
        ? new Date(
            sourceData.created_at
          ).toLocaleString("ja-JP")
        : new Date().toLocaleString(
            "ja-JP"
          );
  }


  if (latestSummary) {

    latestSummary.textContent =
      research.summary ||
      "研究結果なし";
  }


  if (detailHypothesis) {

    detailHypothesis.textContent =
      research.hypothesis ||
      "記録なし";
  }


  if (detailCalculation) {

    detailCalculation.textContent =
      research.calculation ||
      "記録なし";
  }


  if (detailVerification) {

    detailVerification.textContent =
      research.verification ||
      "記録なし";
  }


  if (detailNextAction) {

    detailNextAction.textContent =
      research.next_action ||
      "記録なし";
  }


  if (detailRoute) {

    detailRoute.textContent =
      research.route ||
      "記録なし";
  }


  if (detailReason) {

    detailReason.textContent =
      "まだ評価されていません。";
  }


  if (latestMeta) {

    latestMeta.innerHTML = "";

    const tags = [];


    if (research.status) {

      tags.push(
        `status: ${research.status}`
      );
    }


    if (
      research.confidence !== null &&
      research.confidence !== undefined
    ) {

      tags.push(
        `confidence: ${research.confidence}`
      );
    }


    if (research.route) {

      tags.push(
        "research route"
      );
    }


    if (!tags.length) {

      tags.push(
        "AI Research"
      );
    }


    tags.forEach(
      text => {

        const tag =
          document.createElement(
            "span"
          );

        tag.className =
          "tag";

        tag.textContent =
          text;

        latestMeta.appendChild(
          tag
        );
      }
    );
  }


  if (latestSymbol) {

    latestSymbol.className =
      "symbol maybe";

    latestSymbol.textContent =
      "△";
  }


  if (evaluateButton) {

    evaluateButton.disabled =
      false;
  }


  if (evaluationGrid) {

    evaluationGrid.innerHTML =
      "";
  }


  if (details) {

    details.classList.add(
      "hidden"
    );
  }
}


/* ==========================================================
   RESEARCH REQUEST
========================================================== */

async function runResearch() {

  if (isResearching) {
    return;
  }


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


  isResearching =
    true;


  researchButton.disabled =
    true;

  clearButton.disabled =
    true;


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
      "smart-handlerを実行しています..."
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


    setConnectionState(
      "ok",
      "Supabase 接続済み"
    );


    setProgress(
      65,
      "研究結果を解析しています..."
    );


    const research =
      normalizeResearch(
        data
      );


    displayResearch(
      research,
      data
    );


    setProgress(
      80,
      "研究結果を保存しています..."
    );


    /*
     * DB保存を試行。
     *
     * 保存側のDBスキーマ差異で
     * 研究結果そのものを消さない。
     */

    try {

      const saved =
        await saveResearch(
          message,
          research,
          data
        );


      if (saved?.id) {

        currentResearchId =
          saved.id;
      }

    } catch (saveError) {

      console.warn(
        "研究結果保存失敗:",
        saveError
      );

    }


    setProgress(
      95,
      "研究履歴を更新しています..."
    );


    await loadHistory();


    setProgress(
      100,
      "研究完了"
    );


    showStatus(
      "研究AIとの通信に成功しました。",
      "success"
    );


  } catch (error) {

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
        errorText(error),

        "",

        `Function: ${RESEARCH_FUNCTION}`,

        `Project ID: ${currentProjectId}`

      ].join("\n"),
      "error"
    );


    setProgress(
      100,
      "エラーで終了"
    );

  } finally {

    isResearching =
      false;

    researchButton.disabled =
      false;

    clearButton.disabled =
      false;
  }
}


/* ==========================================================
   SAVE RESEARCH
========================================================== */

async function saveResearch(
  question,
  research,
  rawData
) {

  const url =
    `${SUPABASE_URL}/rest/v1/research_results`;


  const row = {

    project_id:
      currentProjectId,

    question:
      question,

    title:
      research.title || null,

    summary:
      research.summary || null,

    hypothesis:
      research.hypothesis || null,

    calculation:
      research.calculation || null,

    verification:
      research.verification || null,

    next_action:
      research.next_action || null,

    route:
      research.route || null,

    confidence:
      research.confidence ?? null,

    status:
      research.status || null,

    result:
      rawData

  };


  const response =
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

          "Prefer":
            "return=representation"

        },

        body:
          JSON.stringify(row)

      }
    );


  const text =
    await response.text();


  if (!response.ok) {

    throw new Error(
      `research_results保存失敗: HTTP ${response.status} ${text}`
    );
  }


  let data = null;


  try {

    data =
      JSON.parse(text);

  } catch (_) {}


  return Array.isArray(data)
    ? data[0]
    : data;
}


/* ==========================================================
   LOAD HISTORY
========================================================== */

async function loadHistory() {

  if (!historyList) {
    return;
  }


  historyList.innerHTML = `

    <div class="history-empty">
      研究履歴を読み込んでいます...
    </div>

  `;


  const url =
    `${SUPABASE_URL}/rest/v1/research_results` +
    `?project_id=eq.${encodeURIComponent(
      currentProjectId
    )}` +
    `&order=created_at.desc` +
    `&limit=100`;


  try {

    const response =
      await fetch(
        url,
        {

          method:
            "GET",

          headers: {

            "apikey":
              SUPABASE_PUBLISHABLE_KEY,

            "Authorization":
              `Bearer ${SUPABASE_PUBLISHABLE_KEY}`

          }

        }
      );


    const text =
      await response.text();


    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}: ${text}`
      );
    }


    const data =
      text
        ? JSON.parse(text)
        : [];


    researchHistory =
      Array.isArray(data)
        ? data
        : [];


    renderHistory();


  } catch (error) {

    console.error(
      "HISTORY LOAD ERROR:",
      error
    );


    /*
     * 履歴取得失敗でも
     * 現在の研究画面は壊さない。
     */

    historyList.innerHTML = `

      <div class="history-empty">
        研究履歴を読み込めませんでした。
      </div>

    `;


    if (historyCount) {

      historyCount.textContent =
        "0件";
    }
  }
}


/* ==========================================================
   RENDER HISTORY
========================================================== */

function renderHistory() {

  if (!historyList) {
    return;
  }


  if (historyCount) {

    historyCount.textContent =
      `${researchHistory.length}件`;
  }


  if (!researchHistory.length) {

    historyList.innerHTML = `

      <div class="history-empty">
        研究履歴はまだありません。
      </div>

    `;

    return;
  }


  historyList.innerHTML =
    "";


  researchHistory.forEach(
    (item, index) => {

      const element =
        document.createElement(
          "div"
        );


      element.className =
        "history-item";


      const result =
        item.result ||
        item.research ||
        item;


      const title =
        item.title ||
        result?.title ||
        "AI研究回答";


      const date =
        item.created_at
          ? new Date(
              item.created_at
            ).toLocaleString("ja-JP")
          : "";


      let symbol =
        "△";


      let symbolClass =
        "maybe";


      if (
        item.evaluation_status ===
        "good"
      ) {

        symbol =
          "○";

        symbolClass =
          "good";
      }


      if (
        item.evaluation_status ===
        "bad"
      ) {

        symbol =
          "×";

        symbolClass =
          "bad";
      }


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
              ${escapeHTML(title)}
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

          openHistoryItem(
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

function openHistoryItem(
  item
) {

  let result =
    item.result ||
    item.research ||
    item;


  if (
    typeof result ===
    "string"
  ) {

    try {

      result =
        JSON.parse(result);

    } catch (_) {

      result = {

        summary:
          result

      };
    }
  }


  const research =
    normalizeResearch(
      result
    );


  displayResearch(
    research,
    item
  );


  if (
    item.evaluation ||
    item.evaluation_result
  ) {

    const evaluation =
      item.evaluation ||
      item.evaluation_result;


    displayEvaluation(
      evaluation
    );
  }


  latestSection?.scrollIntoView({
    behavior:
      "smooth",
    block:
      "start"
  });
}


/* ==========================================================
   ESCAPE HTML
========================================================== */

function escapeHTML(
  value
) {

  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}


/* ==========================================================
   EVALUATE
========================================================== */

async function runEvaluation() {

  if (
    isEvaluating ||
    !currentResearch
  ) {

    return;
  }


  isEvaluating =
    true;


  if (evaluateButton) {

    evaluateButton.disabled =
      true;

    evaluateButton.textContent =
      "AI評価中...";
  }


  showStatus(
    "AIが研究結果を評価しています..."
  );


  try {

    const payload = {

      project_id:
        currentProjectId,

      research_id:
        currentResearchId,

      research:
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
        "AI評価に失敗しました。"
      );
    }


    const evaluation =
      data?.evaluation ||
      data?.result ||
      data;


    displayEvaluation(
      evaluation
    );


    await saveEvaluation(
      evaluation
    );


    showStatus(
      "AI評価が完了しました。",
      "success"
    );


  } catch (error) {

    console.error(
      "EVALUATE ERROR:",
      error
    );


    showStatus(
      [
        "AI評価に失敗しました。",

        "",

        errorText(error),

        "",

        `Function: ${EVALUATE_FUNCTION}`,

        `Project ID: ${currentProjectId}`

      ].join("\n"),
      "error"
    );


  } finally {

    isEvaluating =
      false;


    if (evaluateButton) {

      evaluateButton.disabled =
        false;

      evaluateButton.textContent =
        "AI評価";
    }
  }
}


/* ==========================================================
   DISPLAY EVALUATION
========================================================== */

function displayEvaluation(
  evaluation
) {

  if (!evaluation) {
    return;
  }


  const overall =
    evaluation.overall ||
    evaluation.total ||
    evaluation.status ||
    "△";


  const hypothesis =
    evaluation.hypothesis ||
    "△";


  const calculation =
    evaluation.calculation ||
    evaluation.experiment ||
    "△";


  const verification =
    evaluation.verification ||
    "△";


  const logic =
    evaluation.logic ||
    evaluation.logical ||
    "△";


  if (evaluationGrid) {

    evaluationGrid.innerHTML = "";


    const values = [

      ["総合", overall],

      ["仮説", hypothesis],

      ["計算", calculation],

      ["検証", verification],

      ["論理", logic]

    ];


    values.forEach(
      ([label, value]) => {

        const item =
          document.createElement(
            "div"
          );

        item.className =
          "evaluation-item";


        item.innerHTML = `

          <div class="label">
            ${escapeHTML(label)}
          </div>

          <div class="value">
            ${escapeHTML(value)}
          </div>

        `;


        evaluationGrid.appendChild(
          item
        );
      }
    );
  }


  if (latestSymbol) {

    const status =
      String(overall)
        .toLowerCase();


    latestSymbol.className =
      "symbol";


    if (
      status.includes("good") ||
      status.includes("○") ||
      status.includes("good")
    ) {

      latestSymbol.classList.add(
        "good"
      );

      latestSymbol.textContent =
        "○";

    } else if (
      status.includes("bad") ||
      status.includes("×")
    ) {

      latestSymbol.classList.add(
        "bad"
      );

      latestSymbol.textContent =
        "×";

    } else {

      latestSymbol.classList.add(
        "maybe"
      );

      latestSymbol.textContent =
        "△";
    }
  }


  if (detailReason) {

    detailReason.textContent =
      evaluation.reason ||
      evaluation.explanation ||
      evaluation.confidence_basis ||
      "評価理由が返されていません。";
  }
}


/* ==========================================================
   SAVE EVALUATION
========================================================== */

async function saveEvaluation(
  evaluation
) {

  if (!currentResearchId) {

    console.warn(
      "research_idがないため評価保存をスキップ"
    );

    return;
  }


  /*
   * 既存DB構造が異なる場合でも
   * 研究本体を壊さない。
   *
   * PATCHが失敗しても
   * 評価結果表示自体は維持する。
   */

  const url =
    `${SUPABASE_URL}/rest/v1/research_results` +
    `?id=eq.${encodeURIComponent(
      currentResearchId
    )}`;


  const response =
    await fetch(
      url,
      {

        method:
          "PATCH",

        headers: {

          "Content-Type":
            "application/json",

          "apikey":
            SUPABASE_PUBLISHABLE_KEY,

          "Authorization":
            `Bearer ${SUPABASE_PUBLISHABLE_KEY}`

        },

        body:
          JSON.stringify({

            evaluation:
              evaluation

          })

      }
    );


  if (!response.ok) {

    console.warn(
      "評価保存失敗:",
      await response.text()
    );
  }
}


/* ==========================================================
   CLEAR
========================================================== */

function clearResearch() {

  questionInput.value =
    "";

  hideStatus();


  progress.classList.add(
    "hidden"
  );


  setConnectionState(
    "",
    "接続待機中"
  );


  currentResearch =
    null;

  currentResearchId =
    null;


  if (latestSection) {

    latestSection.classList.add(
      "hidden"
    );
  }


  if (evaluateButton) {

    evaluateButton.disabled =
      true;
  }
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


      details.classList.toggle(
        "hidden"
      );


      toggleDetailsButton.textContent =
        details.classList.contains(
          "hidden"
        )
          ? "詳細を表示"
          : "詳細を閉じる";
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


if (evaluateButton) {

  evaluateButton.addEventListener(
    "click",
    runEvaluation
  );
}


/* ==========================================================
   COMMAND / CTRL + ENTER
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

async function initialize() {

  try {

    checkDOM();


    console.log(
      "================================"
    );

    console.log(
      "24/7 Riemann Research Lab"
    );

    console.log(
      "FULL RESTORED APP"
    );

    console.log(
      "Supabase:",
      SUPABASE_URL
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
      "================================"
    );


    setConnectionState(
      "",
      "接続待機中"
    );


    /*
     * 起動時にEdge Functionを叩かない。
     *
     * 研究開始時にsmart-handlerを呼ぶ。
     */

    await loadHistory();


  } catch (error) {

    console.error(
      "INITIALIZE ERROR:",
      error
    );


    showStatus(
      errorText(error),
      "error"
    );
  }
}


/* ==========================================================
   START
========================================================== */

initialize();
