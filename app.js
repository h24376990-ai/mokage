/* ==========================================================
   RESEARCH AI
   STABLE VERSION
   - smart-handler : direct fetch
   - evaluate      : direct fetch
   - index.html    : 変更不要
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


/* ==========================================================
   STATE
========================================================== */

let currentResearch =
  null;


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

    ["progressValue", progressValue],

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
   RESPONSE PARSER
========================================================== */

async function readResponse(
  response
) {

  const text =
    await response.text();


  let data =
    null;


  if (text) {

    try {

      data =
        JSON.parse(
          text
        );

    } catch (_) {

      data =
        null;
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

  const functionURL =
    `${SUPABASE_URL}/functions/v1/${functionName}`;


  console.log(
    "================================"
  );

  console.log(
    "DIRECT EDGE FUNCTION REQUEST"
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
      "DIRECT FETCH ERROR:",
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

        `エラー: ${errorText(
          networkError
        )}`

      ].join("\n")
    );
  }


  console.log(
    "HTTP STATUS:",
    response.status
  );

  console.log(
    "HTTP OK:",
    response.ok
  );


  const result =
    await readResponse(
      response
    );


  console.log(
    "RESPONSE TEXT:",
    result.text
  );

  console.log(
    "RESPONSE JSON:",
    result.data
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

        "Edge FunctionからJSONを受信しましたが、",

        "JSONとして解析できませんでした。",

        "",

        "Response:",

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
      15,
      "Supabase Edge Functionへ接続しています..."
    );


    console.log(
      "=== RESEARCH START ==="
    );


    setProgress(
      25,
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


    setConnectionState(
      "ok",
      "Supabase 接続済み"
    );


    setProgress(
      70,
      "研究AIから結果を受信しました..."
    );


    console.log(
      "=== FUNCTION DATA ==="
    );

    console.log(
      data
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


    const research =
      data?.research ||
      data;


    if (!research) {

      throw new Error(
        "研究AIから研究結果が返ってきませんでした。"
      );
    }


    currentResearch =
      research;


    setProgress(
      90,
      "研究結果を表示しています..."
    );


    displayResearchResult(
      research,
      data
    );


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
  }
}


/* ==========================================================
   DISPLAY RESEARCH
========================================================== */

function displayResearchResult(
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

      "研究AIから結果を受信しました。";
  }


  if (latestMeta) {

    latestMeta.innerHTML =
      "";

    addMetaTag(
      research.status
    );

    addMetaTag(
      research.confidence !== undefined
        ? `信頼度 ${research.confidence}`
        : null
    );

    addMetaTag(
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
      research.reason ||
      "まだ評価されていません。";
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
   HELPERS
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


function addMetaTag(
  value
) {

  if (
    !latestMeta ||
    value === undefined ||
    value === null ||
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
    String(value);

  latestMeta.appendChild(
    tag
  );
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
    20,
    "AI評価を準備しています..."
  );


  showStatus(
    "評価AIに接続しています..."
  );


  try {

    setProgress(
      35,
      "evaluateへ直接接続しています..."
    );


    console.log(
      "=== EVALUATION START ==="
    );


    /*
     * 研究結果そのものを評価関数へ送る。
     */

    const data =
      await callEdgeFunction(
        EVALUATE_FUNCTION,
        {

          project_id:
            currentProjectId,

          research:
            currentResearch,

          result:
            currentResearch,

          message:
            questionInput.value.trim()

        }
      );


    console.log(
      "=== EVALUATION DATA ==="
    );

    console.log(
      data
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
      "評価結果を解析しています..."
    );


    const evaluation =
      data?.evaluation ||
      data?.result ||
      data;


    if (!evaluation) {

      throw new Error(
        "評価AIから評価結果が返ってきませんでした。"
      );
    }


    displayEvaluation(
      evaluation
    );


    setProgress(
      100,
      "AI評価完了"
    );


    setConnectionState(
      "ok",
      "Supabase 接続済み"
    );


    showStatus(
      "AI評価が完了しました。",
      "success"
    );


    console.log(
      "=== EVALUATION COMPLETE ==="
    );


  } catch (
    error
  ) {

    console.error(
      "=== EVALUATION ERROR ==="
    );

    console.error(
      error
    );


    showStatus(
      [
        errorText(
          error
        ),

        "",

        "Function:",
        EVALUATE_FUNCTION,

        "",

        "Project ID:",
        currentProjectId

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
   * APIによってキー名が違う可能性があるため
   * 複数の候補を受け取れるようにする。
   */

  const overall =
    pick(
      evaluation,
      [
        "overall",
        "total",
        "score",
        "status"
      ]
    );


  const hypothesis =
    pick(
      evaluation,
      [
        "hypothesis",
        "hypothesis_score"
      ]
    );


  const calculation =
    pick(
      evaluation,
      [
        "calculation",
        "calculation_score"
      ]
    );


  const verification =
    pick(
      evaluation,
      [
        "verification",
        "verification_score"
      ]
    );


  const logic =
    pick(
      evaluation,
      [
        "logic",
        "logic_score"
      ]
    );


  const reason =
    pick(
      evaluation,
      [
        "reason",
        "evaluation_reason",
        "confidence_basis",
        "explanation"
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


  if (detailReason) {

    detailReason.textContent =
      reason ||
      "評価結果を受信しました。";
  }


  if (details) {

    details.classList.remove(
      "hidden"
    );
  }
}


/* ==========================================================
   PICK VALUE
========================================================== */

function pick(
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


/* ==========================================================
   EVALUATION CARDS
========================================================== */

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

      const card =
        document.createElement(
          "div"
        );

      card.className =
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
        formatEvaluationValue(
          value
        );


      card.appendChild(
        labelElement
      );

      card.appendChild(
        valueElement
      );


      evaluationGrid.appendChild(
        card
      );
    }
  );
}


/* ==========================================================
   FORMAT EVALUATION
========================================================== */

function formatEvaluationValue(
  value
) {

  if (
    value === undefined ||
    value === null ||
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


  const text =
    String(value);


  if (
    text.length > 20
  ) {

    return text.slice(
      0,
      20
    );
  }


  return text;
}


/* ==========================================================
   TOGGLE DETAILS
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
   CLEAR
========================================================== */

function clearResearch() {

  questionInput.value =
    "";

  currentResearch =
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


  if (evaluationGrid) {

    evaluationGrid.innerHTML =
      "";
  }


  if (evaluateButton) {

    evaluateButton.disabled =
      true;
  }
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


if (toggleDetailsButton) {

  toggleDetailsButton.addEventListener(
    "click",
    toggleDetails
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
      "Research AI - STABLE VERSION"
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


  } catch (
    error
  ) {

    console.error(
      "Initialization error:",
      error
    );


    if (statusBox) {

      showStatus(
        errorText(
          error
        ),
        "error"
      );
    }
  }
}


/* ==========================================================
   START
========================================================== */

initialize();
