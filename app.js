/* ==========================================================
   RESEARCH AI - app.js
   ==========================================================
   目的:
   - Supabase接続確認が永久に「確認中」で止まらない
   - GitHub Pages → Supabase → Edge Function の通信を診断
   - "Load failed" を詳細に切り分ける
   - smart-handler による研究
   - evaluate による評価
   - 研究履歴
   - ○ / △ / × 表示
   - 研究ルート・使用回数・信頼度
   - 詳細表示
   - 既存 project_id の維持
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
   DEFAULT PROJECT
========================================================== */

const DEFAULT_PROJECT_ID =
  "4253800d-a89e-45e2-a36a-cc52eb6c510b";


/* ==========================================================
   TIMEOUT
========================================================== */

/*
 * 重要:
 *
 * 以前の問題では
 *
 *   「Supabase 接続確認中...」
 *
 * のまま画面が進まないケースがあった。
 *
 * そのため、通信処理には必ずタイムアウトを設ける。
 */

const CONNECTION_TIMEOUT_MS =
  10000;

const HISTORY_TIMEOUT_MS =
  15000;

const FUNCTION_TIMEOUT_MS =
  120000;


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

let isResearching = false;

let isEvaluating = false;


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
   SAFE DOM CHECK
========================================================== */

function checkRequiredElements() {

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

    ["latestSection", latestSection],

    ["latestTitle", latestTitle],

    ["latestDate", latestDate],

    ["latestSymbol", latestSymbol],

    ["latestSummary", latestSummary],

    ["latestMeta", latestMeta],

    ["evaluateButton", evaluateButton],

    ["toggleDetailsButton", toggleDetailsButton],

    ["details", details],

    ["historyList", historyList],

    ["historyCount", historyCount],

  ];


  const missing =
    required
      .filter(
        item =>
          !item[1],
      )
      .map(
        item =>
          item[0],
      );


  if (missing.length) {

    console.error(
      "Missing DOM elements:",
      missing,
    );

    throw new Error(
      `HTMLに必要な要素がありません: ${missing.join(", ")}`,
    );
  }
}


/* ==========================================================
   TIMEOUT HELPER
========================================================== */

/*
 * Promiseにタイムアウトを設定する。
 *
 * これによって、
 *
 *   await supabase...
 *
 * が永遠に待ち続けることを防ぐ。
 */

function withTimeout(
  promise,
  timeoutMs,
  timeoutMessage,
) {

  let timer = null;


  const timeoutPromise =
    new Promise(
      (_, reject) => {

        timer =
          setTimeout(
            () => {

              reject(
                new Error(
                  timeoutMessage,
                ),
              );

            },
            timeoutMs,
          );

      },
    );


  return Promise.race([
    promise,
    timeoutPromise,
  ]).finally(
    () => {

      if (timer) {

        clearTimeout(
          timer,
        );
      }

    },
  );
}


/* ==========================================================
   ERROR PROPERTY
========================================================== */

function getErrorProperty(
  error,
  key,
) {

  try {

    if (
      error &&
      error[key] !== undefined &&
      error[key] !== null
    ) {

      return String(
        error[key],
      );
    }

  } catch (_) {
    // ignore
  }


  return "";
}


/* ==========================================================
   ERROR CONTEXT BODY
========================================================== */

async function readErrorContext(
  error,
) {

  if (!error) {
    return "";
  }


  /*
   * Supabase FunctionsHttpError:
   *
   * error.context = Response
   */

  try {

    const context =
      error.context;


    if (!context) {
      return "";
    }


    if (
      typeof context.clone ===
      "function"
    ) {

      const cloned =
        context.clone();


      if (
        typeof cloned.text ===
        "function"
      ) {

        return await cloned.text();
      }
    }


    if (
      typeof context.text ===
      "function"
    ) {

      return await context.text();
    }

  } catch (
    contextError
  ) {

    console.warn(
      "Could not read error context:",
      contextError,
    );
  }


  return "";
}


/* ==========================================================
   FUNCTION ERROR DETAILS
========================================================== */

async function getFunctionErrorDetails(
  error,
) {

  if (!error) {

    return {

      message:
        "不明なEdge Functionエラーです。",

      raw:
        "",

      status:
        "",

      body:
        "",

      name:
        "",

      stack:
        "",

    };
  }


  console.error(
    "Raw Supabase Function error:",
    error,
  );


  const name =
    getErrorProperty(
      error,
      "name",
    );


  const message =
    getErrorProperty(
      error,
      "message",
    );


  const stack =
    getErrorProperty(
      error,
      "stack",
    );


  let status = "";


  try {

    if (
      error.context &&
      error.context.status
    ) {

      status =
        String(
          error.context.status,
        );
    }

  } catch (_) {
    // ignore
  }


  const body =
    await readErrorContext(
      error,
    );


  let parsedBody = null;


  if (body) {

    try {

      parsedBody =
        JSON.parse(
          body,
        );

    } catch (_) {
      // plain text
    }
  }


  let detailMessage =
    message ||
    "Edge Functionでエラーが発生しました。";


  if (
    parsedBody &&
    typeof parsedBody ===
    "object"
  ) {

    if (
      parsedBody.error
    ) {

      detailMessage =
        String(
          parsedBody.error,
        );

    } else if (
      parsedBody.message
    ) {

      detailMessage =
        String(
          parsedBody.message,
        );

    } else if (
      parsedBody.detail
    ) {

      detailMessage =
        String(
          parsedBody.detail,
        );
    }

  } else if (
    body
  ) {

    detailMessage =
      body;
  }


  return {

    message:
      detailMessage,

    raw:
      body,

    status,

    body,

    name,

    stack,

  };
}


/* ==========================================================
   NETWORK ERROR DETECTOR
========================================================== */

function isNetworkError(
  error,
) {

  const message =
    getErrorProperty(
      error,
      "message",
    ).toLowerCase();


  const name =
    getErrorProperty(
      error,
      "name",
    ).toLowerCase();


  return (

    message.includes(
      "load failed",
    ) ||

    message.includes(
      "failed to fetch",
    ) ||

    message.includes(
      "networkerror",
    ) ||

    message.includes(
      "network error",
    ) ||

    message.includes(
      "failed to send a request",
    ) ||

    name.includes(
      "typeerror",
    )

  );
}


/* ==========================================================
   FORMAT ERROR
========================================================== */

function formatError(
  error,
) {

  if (!error) {

    return [
      "【不明なエラー】",
      "",
      `Function: ${RESEARCH_FUNCTION}`,
      `Project ID: ${currentProjectId}`,
    ].join("\n");
  }


  const message =
    getErrorProperty(
      error,
      "message",
    ) ||
    String(error);


  const name =
    getErrorProperty(
      error,
      "name",
    );


  const stack =
    getErrorProperty(
      error,
      "stack",
    );


  console.error(
    "Formatted error:",
    error,
  );


  /*
   * TIMEOUT
   */

  if (
    message.includes(
      "タイムアウト",
    )
  ) {

    return [
      "【通信タイムアウト】",
      "",
      message,
      "",
      "一定時間Supabaseから応答がありませんでした。",
      "",
      "考えられる原因:",
      "・ネットワーク接続",
      "・Supabaseの応答遅延",
      "・Edge Functionの処理時間",
      "・ブラウザ側の通信問題",
      "",
      `Supabase: ${SUPABASE_URL}`,
      `Project ID: ${currentProjectId}`,
      "",
      stack
        ? `Stack:\n${stack}`
        : "",
    ].join("\n");
  }


  /*
   * LOAD FAILED
   *
   * 以前の問題をここで明確に診断する。
   */

  if (
    message
      .toLowerCase()
      .includes(
        "load failed",
      )
  ) {

    return [
      "【通信エラー: Load failed】",
      "",
      "ブラウザからSupabaseへの通信が失敗しました。",
      "",
      "これはAIの数学的な研究処理そのものではなく、",
      "ブラウザ → Supabase / Edge Function の通信経路で",
      "失敗している可能性があります。",
      "",
      "確認ポイント:",
      "1. Supabaseプロジェクトが稼働しているか",
      "2. Edge Functionがデプロイされているか",
      "3. Function名が正しいか",
      "4. GitHub PagesからのCORS通信が許可されているか",
      "5. ブラウザがFetch通信を拒否していないか",
      "6. ネットワーク接続に問題がないか",
      "",
      `Supabase URL: ${SUPABASE_URL}`,
      `Function: ${RESEARCH_FUNCTION}`,
      `Function URL: ${SUPABASE_URL}/functions/v1/${RESEARCH_FUNCTION}`,
      `Project ID: ${currentProjectId}`,
      "",
      `Error name: ${name || "取得できませんでした"}`,
      `Error message: ${message}`,
      "",
      "重要:",
      "Supabase DashboardからFunctionが正常でも、",
      "GitHub Pagesからのブラウザ通信だけ失敗する場合があります。",
      "",
      stack
        ? `Stack:\n${stack}`
        : "Stack: 取得できませんでした",
    ].join("\n");
  }


  /*
   * FAILED TO SEND REQUEST
   */

  if (
    message.includes(
      "Failed to send a request to the Edge Function",
    )
  ) {

    return [
      "【Edge Function通信エラー】",
      "",
      "Supabase Edge Functionへのリクエスト送信に失敗しました。",
      "",
      "考えられる原因:",
      "・CORS",
      "・Functionの公開状態",
      "・Function URL",
      "・Edge Functionのデプロイ状態",
      "・ブラウザFetch",
      "・ネットワーク",
      "",
      `Function: ${RESEARCH_FUNCTION}`,
      `Project ID: ${currentProjectId}`,
      "",
      `Error: ${message}`,
      "",
      stack
        ? `Stack:\n${stack}`
        : "",
    ].join("\n");
  }


  /*
   * FETCH / NETWORK
   */

  if (
    isNetworkError(
      error,
    )
  ) {

    return [
      "【ネットワーク通信エラー】",
      "",
      "ブラウザからSupabaseへ正常に接続できませんでした。",
      "",
      `Supabase: ${SUPABASE_URL}`,
      `Function: ${RESEARCH_FUNCTION}`,
      `Project ID: ${currentProjectId}`,
      "",
      "考えられる原因:",
      "・CORS",
      "・ネットワーク",
      "・Edge Functionの公開設定",
      "・Functionのデプロイ",
      "・ブラウザのFetchエラー",
      "",
      `Error name: ${name || "不明"}`,
      `Error message: ${message}`,
      "",
      stack
        ? `Stack:\n${stack}`
        : "",
    ].join("\n");
  }


  /*
   * DEFAULT
   */

  return [
    "【エラー】",
    "",
    `Function: ${RESEARCH_FUNCTION}`,
    `Project ID: ${currentProjectId}`,
    "",
    `エラー名: ${name || "不明"}`,
    `エラー内容: ${message}`,
    "",
    stack
      ? `Stack:\n${stack}`
      : "",
  ].join("\n");
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
   CONNECTION UI
========================================================== */

function setConnectionState(
  state,
) {

  connectionDot.classList.remove(
    "ok",
    "error",
  );


  if (
    state === "ok"
  ) {

    connectionDot.classList.add(
      "ok",
    );

    connectionText.textContent =
      "Supabase 接続済み";

    return;
  }


  if (
    state === "error"
  ) {

    connectionDot.classList.add(
      "error",
    );

    connectionText.textContent =
      "Supabase 接続エラー";

    return;
  }


  connectionText.textContent =
    "Supabase 接続確認中...";
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


  const numeric =
    Number(
      percent,
    );


  const safe =
    Math.max(
      0,
      Math.min(
        100,
        Number.isFinite(
          numeric,
        )
          ? numeric
          : 0,
      ),
    );


  progressValue.style.width =
    `${safe}%`;


  progressPercent.textContent =
    `${Math.round(safe)}%`;


  progressText.textContent =
    text ||
    "";
}


/* ==========================================================
   CHECK CONNECTION
========================================================== */

/*
 * ここが今回の重要部分。
 *
 * 以前:
 *
 *   await supabase...
 *
 *   ↓
 *
 *   応答が返らない
 *
 *   ↓
 *
 *   「Supabase 接続確認中...」のまま
 *
 * となる可能性があった。
 *
 * 今回:
 *
 *   最大10秒
 *
 *   ↓
 *
 *   成功 / エラー / タイムアウト
 *
 * のどれかに必ず進む。
 */

async function checkConnection() {

  setConnectionState(
    "checking",
  );


  console.log(
    "=== SUPABASE CONNECTION CHECK ===",
  );


  console.log(
    "Supabase URL:",
    SUPABASE_URL,
  );


  console.log(
    "Project ID:",
    currentProjectId,
  );


  try {

    const request =
      supabase
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


    const result =
      await withTimeout(
        request,
        CONNECTION_TIMEOUT_MS,
        "Supabase接続確認がタイムアウトしました。",
      );


    if (
      result.error
    ) {

      throw result.error;
    }


    setConnectionState(
      "ok",
    );


    console.log(
      "Supabase connection: OK",
    );


    return true;


  } catch (
    error
  ) {

    console.error(
      "Supabase connection error:",
      error,
    );


    setConnectionState(
      "error",
    );


    return false;
  }
}


/* ==========================================================
   RESEARCH FUNCTION INVOKE
========================================================== */

async function invokeResearchFunction(
  message,
) {

  console.log(
    "=== EDGE FUNCTION REQUEST ===",
  );


  console.log(
    "Function:",
    RESEARCH_FUNCTION,
  );


  console.log(
    "URL:",
    `${SUPABASE_URL}/functions/v1/${RESEARCH_FUNCTION}`,
  );


  console.log(
    "Project ID:",
    currentProjectId,
  );


  const request =
    supabase.functions.invoke(
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


  return await withTimeout(
    request,
    FUNCTION_TIMEOUT_MS,
    "研究AIへの通信がタイムアウトしました。",
  );
}


/* ==========================================================
   EVALUATE FUNCTION INVOKE
========================================================== */

async function invokeEvaluateFunction(
  resultId,
) {

  console.log(
    "=== EVALUATE EDGE FUNCTION REQUEST ===",
  );


  console.log(
    "Function:",
    EVALUATE_FUNCTION,
  );


  console.log(
    "URL:",
    `${SUPABASE_URL}/functions/v1/${EVALUATE_FUNCTION}`,
  );


  const request =
    supabase.functions.invoke(
      EVALUATE_FUNCTION,
      {
        body: {

          project_id:
            currentProjectId,

          result_id:
            resultId,

        },
      },
    );


  return await withTimeout(
    request,
    FUNCTION_TIMEOUT_MS,
    "評価AIへの通信がタイムアウトしました。",
  );
}


/* ==========================================================
   RESEARCH
========================================================== */

async function runResearch() {

  if (
    isResearching
  ) {

    return;
  }


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


  isResearching =
    true;


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

    console.log(
      "================================",
    );

    console.log(
      "=== RESEARCH START ===",
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
      "Message:",
      message,
    );

    console.log(
      "================================",
    );


    /*
     * STEP 1
     */

    setProgress(
      10,
      "Supabaseへの接続を確認しています...",
    );


    const connected =
      await checkConnection();


    /*
     * 接続確認失敗でもここで永久停止しない。
     *
     * 研究Functionそのものが到達可能な場合もあるため、
     * そのままFunction実行を試す。
     */

    if (!connected) {

      showStatus(
        [
          "Supabaseの事前接続確認に失敗しました。",
          "",
          "ただし、ここで研究処理を停止せず、",
          "Edge Functionへの通信を試します。",
        ].join("\n"),
        "error",
      );
    }


    /*
     * STEP 2
     */

    setProgress(
      20,
      "研究AIを実行しています...",
    );


    let response;


    try {

      response =
        await invokeResearchFunction(
          message,
        );

    } catch (
      invokeError
    ) {

      console.error(
        "invokeResearchFunction error:",
        invokeError,
      );


      const detail =
        await getFunctionErrorDetails(
          invokeError,
        );


      const error =
        new Error(
          [
            detail.message ||
            "研究AIへの通信に失敗しました。",

            "",

            `Function: ${RESEARCH_FUNCTION}`,

            `Project ID: ${currentProjectId}`,

            `HTTP status: ${
              detail.status ||
              "取得できませんでした"
            }`,

            `Error name: ${
              detail.name ||
              "取得できませんでした"
            }`,

            "",

            detail.body
              ? `Response body:\n${detail.body}`
              : "Response body: 取得できませんでした",

            "",

            detail.stack
              ? `Stack:\n${detail.stack}`
              : "",

          ].join("\n"),
        );


      error.original =
        invokeError;


      throw error;
    }


    console.log(
      "=== RESEARCH RESPONSE ===",
    );


    console.log(
      "response:",
      response,
    );


    console.log(
      "response.data:",
      response?.data,
    );


    console.log(
      "response.error:",
      response?.error,
    );


    /*
     * STEP 3
     */

    if (
      response?.error
    ) {

      const detail =
        await getFunctionErrorDetails(
          response.error,
        );


      throw new Error(
        [
          "【Supabase Edge Functionエラー】",

          "",

          `Function: ${RESEARCH_FUNCTION}`,

          `Project ID: ${currentProjectId}`,

          `HTTP status: ${
            detail.status ||
            "取得できませんでした"
          }`,

          `Error name: ${
            detail.name ||
            "取得できませんでした"
          }`,

          "",

          detail.message,

          "",

          detail.body
            ? `Response body:\n${detail.body}`
            : "Response body: 取得できませんでした",

          "",

          detail.stack
            ? `Stack:\n${detail.stack}`
            : "",

        ].join("\n"),
      );
    }


    /*
     * STEP 4
     */

    const data =
      response?.data;


    if (!data) {

      throw new Error(
        [
          "AIからデータが返ってきませんでした。",
          "",
          `Function: ${RESEARCH_FUNCTION}`,
          `Project ID: ${currentProjectId}`,
          "",
          "response:",
          safeJson(response),
        ].join("\n"),
      );
    }


    console.log(
      "Function data:",
      data,
    );


    /*
     * STEP 5
     */

    if (
      !data.ok
    ) {

      throw new Error(
        [
          data.error ||
          data.detail ||
          "研究AIでエラーが発生しました。",

          "",

          "Function response:",

          safeJson(data),

        ].join("\n"),
      );
    }


    /*
     * STEP 6
     */

    setProgress(
      70,
      "研究結果を受け取りました...",
    );


    /*
     * STEP 7
     * BLOCK
     */

    if (
      data.blocked
    ) {

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


    /*
     * STEP 8
     * RESULT
     */

    const research =
      data.research ||
      {};


    latestResult = {

      id:
        data.result_id ||
        research.id ||
        null,


      title:
        research.title ||
        "AI研究回答",


      description:
        research.summary ||
        research.description ||
        "",


      status:
        research.status ||
        "maybe",


      confidence:
        Number(
          research.confidence ??
          0,
        ),


      confidence_basis:
        research.confidence_basis ||
        "",


      hypothesis:
        research.hypothesis ||
        "",


      calculation:
        research.calculation ||
        "",


      verification:
        research.verification ||
        "",


      next_action:
        research.next_action ||
        "",


      evidence: {

        route:
          research.route ||
          "",


        route_key:
          research.route_key ||
          "",


        route_count:
          Number(
            research.route_count ??
            1,
          ),


        confidence:
          Number(
            research.confidence ??
            0,
          ),


        confidence_basis:
          research.confidence_basis ||
          "",


        items:
          Array.isArray(
            research.evidence,
          )
            ? research.evidence
            : [],

      },


      created_at:
        new Date().toISOString(),
    };


    console.log(
      "latestResult:",
      latestResult,
    );


    /*
     * STEP 9
     */

    renderLatestResult(
      latestResult,
    );


    /*
     * STEP 10
     */

    setProgress(
      85,
      "研究結果を保存しました...",
    );


    showStatus(
      "研究結果を保存しました。",
      "success",
    );


    /*
     * STEP 11
     */

    await loadHistory();


    /*
     * STEP 12
     */

    setProgress(
      100,
      "研究完了",
    );


    console.log(
      "=== RESEARCH COMPLETE ===",
    );


  } catch (
    error
  ) {

    console.error(
      "================================",
    );

    console.error(
      "=== RESEARCH ERROR ===",
    );

    console.error(
      error,
    );

    console.error(
      "================================",
    );


    const errorText =
      error?.message ||
      String(error);


    showStatus(
      errorText,
      "error",
    );


    setProgress(
      100,
      "エラーで終了",
    );


  } finally {

    isResearching =
      false;


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

  if (
    isEvaluating
  ) {

    return;
  }


  if (
    !latestResult?.id
  ) {

    showStatus(
      "評価する研究結果がありません。",
      "error",
    );


    return;
  }


  isEvaluating =
    true;


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

    console.log(
      "=== EVALUATE START ===",
    );


    console.log(
      "Function:",
      EVALUATE_FUNCTION,
    );


    console.log(
      "Project ID:",
      currentProjectId,
    );


    console.log(
      "Result ID:",
      latestResult.id,
    );


    const response =
      await invokeEvaluateFunction(
        latestResult.id,
      );


    console.log(
      "evaluate response:",
      response,
    );


    if (
      response?.error
    ) {

      const detail =
        await getFunctionErrorDetails(
          response.error,
        );


      throw new Error(
        [
          "【評価Edge Functionエラー】",

          "",

          `Function: ${EVALUATE_FUNCTION}`,

          `Project ID: ${currentProjectId}`,

          "",

          detail.message,

          "",

          detail.body
            ? `Response body:\n${detail.body}`
            : "",

        ].join("\n"),
      );
    }


    const data =
      response?.data;


    if (!data) {

      throw new Error(
        "評価AIからデータが返ってきませんでした。",
      );
    }


    if (
      !data.ok
    ) {

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


    console.log(
      "=== EVALUATE COMPLETE ===",
    );


  } catch (
    error
  ) {

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

    isEvaluating =
      false;


    evaluateButton.disabled =
      !latestResult?.id;


    researchButton.disabled =
      false;
  }
}


/* ==========================================================
   HISTORY
========================================================== */

async function loadHistory() {

  console.log(
    "=== LOAD HISTORY ===",
  );


  try {

    const request =
      supabase
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


    const result =
      await withTimeout(
        request,
        HISTORY_TIMEOUT_MS,
        "研究履歴の読み込みがタイムアウトしました。",
      );


    if (
      result.error
    ) {

      throw result.error;
    }


    renderHistory(
      result.data || [],
    );


    console.log(
      "History loaded:",
      result.data?.length || 0,
    );


    return true;


  } catch (
    error
  ) {

    console.error(
      "History error:",
      error,
    );


    historyList.innerHTML = `
      <div class="history-empty">
        履歴を読み込めませんでした。
      </div>
    `;


    /*
     * 履歴取得失敗だけで研究サイト全体を壊さない。
     */

    return false;
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


  if (
    !results.length
  ) {

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
                  String(item.id) ===
                  String(id),
              );


            if (
              result
            ) {

              latestResult =
                normalizeHistoryResult(
                  result,
                );


              renderLatestResult(
                latestResult,
              );


              window.scrollTo({
                top:
                  0,

                behavior:
                  "smooth",
              });
            }
          },
        );
      },
    );
}


/* ==========================================================
   HISTORY NORMALIZER
========================================================== */

function normalizeHistoryResult(
  result,
) {

  const evidence =
    result?.evidence &&
    typeof result.evidence ===
    "object"
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
          evidence.route_count ??
          1,
        ),


      confidence:
        Number(
          evidence.confidence ??
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


  const detailHypothesis =
    document.getElementById(
      "detailHypothesis",
    );


  const detailCalculation =
    document.getElementById(
      "detailCalculation",
    );


  const detailVerification =
    document.getElementById(
      "detailVerification",
    );


  const detailNextAction =
    document.getElementById(
      "detailNextAction",
    );


  const detailRoute =
    document.getElementById(
      "detailRoute",
    );


  const detailReason =
    document.getElementById(
      "detailReason",
    );


  if (
    detailHypothesis
  ) {

    detailHypothesis.textContent =
      result.hypothesis ||
      "記録なし";
  }


  if (
    detailCalculation
  ) {

    detailCalculation.textContent =
      result.calculation ||
      "記録なし";
  }


  if (
    detailVerification
  ) {

    detailVerification.textContent =
      result.verification ||
      "記録なし";
  }


  if (
    detailNextAction
  ) {

    detailNextAction.textContent =
      result.next_action ||
      "記録なし";
  }


  if (
    detailRoute
  ) {

    detailRoute.textContent =
      result?.evidence?.route ||
      "記録なし";
  }


  if (
    detailReason
  ) {

    detailReason.textContent =
      evaluation?.reason ||
      "まだ評価されていません。";
  }


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


  if (!grid) {
    return;
  }


  if (
    !evaluation
  ) {

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

  if (
    status === "good"
  ) {

    return "○";
  }


  if (
    status === "bad"
  ) {

    return "×";
  }


  return "△";
}


function statusClass(
  status,
) {

  if (
    status === "good"
  ) {

    return "good";
  }


  if (
    status === "bad"
  ) {

    return "bad";
  }


  if (
    status === "maybe"
  ) {

    return "maybe";
  }


  return "unknown";
}


function statusLabel(
  status,
) {

  if (
    status === "good"
  ) {

    return "良";
  }


  if (
    status === "bad"
  ) {

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
   SAFE JSON
========================================================== */

function safeJson(
  value,
) {

  try {

    return JSON.stringify(
      value,
      null,
      2,
    );

  } catch (_) {

    return String(
      value,
    );
  }
}


/* ==========================================================
   INITIALIZE
========================================================== */

async function initialize() {

  console.log(
    "================================",
  );

  console.log(
    "Research AI initializing...",
  );

  console.log(
    "Supabase:",
    SUPABASE_URL,
  );

  console.log(
    "Research Function:",
    RESEARCH_FUNCTION,
  );

  console.log(
    "Evaluate Function:",
    EVALUATE_FUNCTION,
  );

  console.log(
    "Project ID:",
    currentProjectId,
  );

  console.log(
    "================================",
  );


  try {

    /*
     * DOM確認
     */

    checkRequiredElements();


    /*
     * 初期状態
     */

    setConnectionState(
      "checking",
    );


    /*
     * 接続確認
     *
     * 重要:
     * checkConnection() 自体に10秒タイムアウトがある。
     */

    const connected =
      await checkConnection();


    /*
     * 接続失敗しても、
     * ページ初期化そのものは止めない。
     */

    if (!connected) {

      console.warn(
        "Initial Supabase connection check failed.",
      );


      showStatus(
        [
          "Supabaseの接続確認に失敗しました。",
          "",
          "ただしページは停止していません。",
          "研究ボタンからEdge Functionへの通信を試せます。",
        ].join("\n"),
        "error",
      );
    }


    /*
     * 履歴
     *
     * ここにもタイムアウトがあるため、
     * 履歴取得で永久停止しない。
     */

    await loadHistory();


    console.log(
      "Research AI initialization complete.",
    );


  } catch (
    error
  ) {

    console.error(
      "Initialization error:",
      error,
    );


    showStatus(
      formatError(error),
      "error",
    );
  }
}


/* ==========================================================
   START
========================================================== */

initialize();
