(function () {
  const box = document.getElementById("connectionText");
  const dot = document.getElementById("connectionDot");

  if (box) {
    box.textContent = "app.js 読み込み成功";
  }

  if (dot) {
    dot.classList.remove("error");
    dot.classList.add("ok");
  }
})();

/* ==========================================================
   RESEARCH AI - STEP 1
   通信確認用・最小安定版
========================================================== */


/* ==========================================================
   SUPABASE CONFIG
========================================================== */

const SUPABASE_URL =
  "https://hiefdcodifkfhnqvruzn.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_HmcPY6BGvUQTPESGHVe7Hw_W4NlTPqj";


/* ==========================================================
   EDGE FUNCTION
========================================================== */

const RESEARCH_FUNCTION =
  "smart-handler";


/* ==========================================================
   PROJECT
========================================================== */

const DEFAULT_PROJECT_ID =
  "4253800d-a89e-45e2-a36a-cc52eb6c510b";


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
          !element,
      )
      .map(
        ([name]) =>
          name,
      );


  if (missing.length) {

    throw new Error(
      "HTMLに必要な要素がありません: " +
      missing.join(", "),
    );
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

    statusBox.classList.add(
      type,
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


  progressValue.style.width =
    `${safe}%`;


  progressPercent.textContent =
    `${Math.round(safe)}%`;


  progressText.textContent =
    text;
}


/* ==========================================================
   CONNECTION UI
========================================================== */

function setConnectionState(
  state,
  text,
) {

  connectionDot.classList.remove(
    "ok",
    "error",
  );


  if (state === "ok") {

    connectionDot.classList.add(
      "ok",
    );

  } else if (
    state === "error"
  ) {

    connectionDot.classList.add(
      "error",
    );
  }


  connectionText.textContent =
    text;
}


/* ==========================================================
   ERROR TEXT
========================================================== */

function errorText(
  error,
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
      error.message,
    );
  }


  return String(
    error,
  );
}


/* ==========================================================
   RESPONSE PARSER
========================================================== */

async function readResponse(
  response,
) {

  const text =
    await response.text();


  let data = null;


  if (text) {

    try {

      data =
        JSON.parse(
          text,
        );

    } catch (_) {

      data =
        null;
    }
  }


  return {
    text,
    data,
  };
}


/* ==========================================================
   DIRECT EDGE FUNCTION REQUEST
========================================================== */

/*
 * 重要:
 *
 * ここでは
 *
 * supabase.functions.invoke()
 *
 * を使用しない。
 *
 * ブラウザの fetch() から
 * Edge Function URLへ直接送信する。
 *
 * 以前の Load failed 問題を
 * 再発させないための第1段階。
 */

async function callResearchFunction(
  message,
) {

  const functionURL =
    `${SUPABASE_URL}/functions/v1/${RESEARCH_FUNCTION}`;


  console.log(
    "================================",
  );

  console.log(
    "DIRECT EDGE FUNCTION REQUEST",
  );

  console.log(
    "URL:",
    functionURL,
  );

  console.log(
    "Project ID:",
    currentProjectId,
  );

  console.log(
    "Message:",
    message,
  );

  console.log(
    "================================",
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
              `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,

          },

          body:
            JSON.stringify(
              {

                message:
                  message,

                project_id:
                  currentProjectId,

              },
            ),

        },
      );

  } catch (
    networkError
  ) {

    console.error(
      "DIRECT FETCH ERROR:",
      networkError,
    );


    throw new Error(
      [
        "【通信エラー】",

        "",

        "Supabase Edge Functionへ接続できませんでした。",

        "",

        `Function: ${RESEARCH_FUNCTION}`,

        `URL: ${functionURL}`,

        "",

        `エラー: ${errorText(
          networkError,
        )}`,

        "",

        "ここではまだAI処理やDB処理を疑いません。",

        "まずブラウザからEdge Functionへ到達できるかを確認します。",

      ].join("\n"),
    );
  }


  console.log(
    "HTTP STATUS:",
    response.status,
  );

  console.log(
    "HTTP OK:",
    response.ok,
  );


  const result =
    await readResponse(
      response,
    );


  console.log(
    "RESPONSE TEXT:",
    result.text,
  );

  console.log(
    "RESPONSE JSON:",
    result.data,
  );


  if (!response.ok) {

    throw new Error(
      [
        "【Edge Function HTTPエラー】",

        "",

        `HTTP Status: ${response.status}`,

        `Function: ${RESEARCH_FUNCTION}`,

        "",

        result.data?.error ||
        result.data?.message ||
        result.text ||
        "レスポンス本文がありません。",

      ].join("\n"),
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
        "(empty)",

      ].join("\n"),
    );
  }


  return result.data;
}


/* ==========================================================
   CONNECTION TEST
========================================================== */

/*
 * 起動時にresearch_resultsへ問い合わせない。
 *
 * これが重要。
 *
 * DBの接続確認で画面全体が
 * 「接続中」のまま止まる構造を避ける。
 *
 * 実際のsmart-handlerへの通信を
 * 必要になったときに確認する。
 */

function initializeConnectionUI() {

  setConnectionState(
    "",
    "接続待機中",
  );
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


  setConnectionState(
    "",
    "Supabase 接続中...",
  );


  setProgress(
    5,
    "研究を準備しています...",
  );


  showStatus(
    "研究AIに接続しています...",
  );


  try {

    /* ------------------------------------------------------
       STEP 1
    ------------------------------------------------------ */

    setProgress(
      15,
      "Supabase Edge Functionへ接続しています...",
    );


    console.log(
      "=== RESEARCH START ===",
    );


    /* ------------------------------------------------------
       STEP 2
    ------------------------------------------------------ */

    setProgress(
      25,
      "smart-handlerを実行しています...",
    );


    const data =
      await callResearchFunction(
        message,
      );


    /* ------------------------------------------------------
       STEP 3
    ------------------------------------------------------ */

    setConnectionState(
      "ok",
      "Supabase 接続済み",
    );


    setProgress(
      70,
      "研究AIから結果を受信しました...",
    );


    console.log(
      "=== FUNCTION DATA ===",
    );

    console.log(
      data,
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
        "研究AIがエラーを返しました。",
      );
    }


    /* ------------------------------------------------------
       STEP 5
    ------------------------------------------------------ */

    const research =
      data?.research ||
      data;


    if (!research) {

      throw new Error(
        "研究AIから研究結果が返ってきませんでした。",
      );
    }


    /* ------------------------------------------------------
       STEP 6
    ------------------------------------------------------ */

    setProgress(
      90,
      "研究結果を表示しています...",
    );


    /*
     * 第1段階では、
     * まず通信成功を確認することを優先。
     *
     * 既存HTMLに結果表示欄がある場合だけ
     * 可能な範囲で表示する。
     */

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

    const latestSummary =
      document.getElementById(
        "latestSummary",
      );


    if (
      latestSection
    ) {

      latestSection.classList.remove(
        "hidden",
      );
    }


    if (
      latestTitle
    ) {

      latestTitle.textContent =
        research.title ||
        "AI研究回答";
    }


    if (
      latestDate
    ) {

      latestDate.textContent =
        new Date().toLocaleString(
          "ja-JP",
        );
    }


    if (
      latestSummary
    ) {

      latestSummary.textContent =
        research.summary ||
        research.description ||
        data.answer ||
        "研究AIから結果を受信しました。";
    }


    /* ------------------------------------------------------
       STEP 7
    ------------------------------------------------------ */

    setProgress(
      100,
      "通信テスト・研究実行完了",
    );


    showStatus(
      "研究AIとの通信に成功しました。",
      "success",
    );


    console.log(
      "=== RESEARCH COMPLETE ===",
    );


  } catch (
    error
  ) {

    console.error(
      "=== RESEARCH ERROR ===",
    );

    console.error(
      error,
    );


    setConnectionState(
      "error",
      "Supabase 接続エラー",
    );


    showStatus(
      [
        errorText(
          error,
        ),

        "",

        "Function:",
        RESEARCH_FUNCTION,

        "",

        "Project ID:",
        currentProjectId,

      ].join("\n"),
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
    "hidden",
  );

  setConnectionState(
    "",
    "接続待機中",
  );
}


/* ==========================================================
   BUTTON EVENTS
========================================================== */

researchButton.addEventListener(
  "click",
  runResearch,
);


clearButton.addEventListener(
  "click",
  clearResearch,
);


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
  },
);


/* ==========================================================
   INITIALIZE
========================================================== */

function initialize() {

  try {

    checkDOM();


    console.log(
      "================================",
    );

    console.log(
      "Research AI - STEP 1",
    );

    console.log(
      "Initialized",
    );

    console.log(
      "Supabase:",
      SUPABASE_URL,
    );

    console.log(
      "Function:",
      RESEARCH_FUNCTION,
    );

    console.log(
      "Project ID:",
      currentProjectId,
    );

    console.log(
      "Communication:",
      "DIRECT FETCH",
    );

    console.log(
      "================================",
    );


    initializeConnectionUI();


  } catch (
    error
  ) {

    console.error(
      "Initialization error:",
      error,
    );


    if (
      statusBox
    ) {

      showStatus(
        errorText(
          error,
        ),
        "error",
      );
    }
  }
}


/* ==========================================================
   START
========================================================== */

initialize();
