/* ==========================================================
   RESEARCH AI
   app.js
   FULL VERSION
========================================================== */


/* ==========================================================
   CONFIG
========================================================== */

const SUPABASE_URL =
  "https://hiefdcodifkfhnqvruzn.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_HmcPY6BGvUQTPESGHVe7Hw_W4NlTPqj";


const RESEARCH_FUNCTION =
  "smart-handler";

const EVALUATE_FUNCTION =
  "evaluate";


const DEFAULT_PROJECT_ID =
  "4253800d-a89e-45e2-a36a-cc52eb6c510b";


/*
 * 通信タイムアウト
 *
 * これが今回かなり重要。
 *
 * 起動時のSupabase確認が永久に
 * 「接続確認中」で止まらないようにする。
 */

const CONNECTION_TIMEOUT_MS =
  8000;

const HISTORY_TIMEOUT_MS =
  10000;

const FUNCTION_TIMEOUT_MS =
  120000;


/* ==========================================================
   SUPABASE
========================================================== */

if (
  !window.supabase ||
  typeof window.supabase.createClient !==
    "function"
) {

  throw new Error(
    "Supabase JavaScript SDK が読み込まれていません。",
  );
}


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

let latestResult =
  null;

let isResearching =
  false;

let isEvaluating =
  false;


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
   OPTIONAL DOM
========================================================== */

const evaluationGrid =
  document.getElementById(
    "evaluationGrid",
  );

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


/* ==========================================================
   DOM CHECK
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


  if (
    missing.length
  ) {

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
    String(
      message ?? "",
    );


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

  if (
    !progress ||
    !progressValue ||
    !progressPercent ||
    !progressText
  ) {

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
    text || "";
}


/* ==========================================================
   CONNECTION UI
========================================================== */

function setConnectionState(
  state,
  message,
) {

  if (!connectionDot ||
      !connectionText) {

    return;
  }


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

  } else if (
    state === "error"
  ) {

    connectionDot.classList.add(
      "error",
    );
  }


  connectionText.textContent =
    message;
}


/* ==========================================================
   TIMEOUT
========================================================== */

function createTimeoutError(
  label,
  timeoutMs,
) {

  const error =
    new Error(
      `${label} が ${Math.round(timeoutMs / 1000)}秒以内に応答しませんでした。`,
    );


  error.name =
    "TimeoutError";


  error.timeout =
    true;


  error.timeoutMs =
    timeoutMs;


  return error;
}


/* ==========================================================
   TIMEOUT WRAPPER
========================================================== */

async function withTimeout(
  promise,
  timeoutMs,
  label,
) {

  let timer = null;


  const timeoutPromise =
    new Promise(
      (_, reject) => {

        timer =
          setTimeout(
            () => {

              reject(
                createTimeoutError(
                  label,
                  timeoutMs,
                ),
              );

            },
            timeoutMs,
          );
      },
    );


  try {

    return await Promise.race(
      [
        promise,
        timeoutPromise,
      ],
    );

  } finally {

    if (timer) {

      clearTimeout(
        timer,
      );
    }
  }
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
   READ RESPONSE BODY
========================================================== */

async function readResponseBody(
  response,
) {

  if (
    !response
  ) {

    return "";
  }


  try {

    if (
      typeof response.clone ===
        "function"
    ) {

      const cloned =
        response.clone();


      if (
        typeof cloned.text ===
          "function"
      ) {

        return await cloned.text();
      }
    }


    if (
      typeof response.text ===
        "function"
    ) {

      return await response.text();
    }

  } catch (error) {

    console.warn(
      "Response body read failed:",
      error,
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
        "不明なEdge Functionエラーです.",

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


  let status =
    getErrorProperty(
      error,
      "status",
    );


  let body =
    "";


  try {

    if (
      error.context
    ) {

      status =
        status ||
        getErrorProperty(
          error.context,
          "status",
        );


      body =
        await readResponseBody(
          error.context,
        );
    }

  } catch (contextError) {

    console.warn(
      "Could not read Function error context:",
      contextError,
    );
  }


  let parsedBody =
    null;


  if (
    body
  ) {

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
   NETWORK ERROR CLASSIFICATION
========================================================== */

function classifyNetworkError(
  message,
) {

  const value =
    String(
      message || "",
    ).toLowerCase();


  if (
    value.includes(
      "load failed",
    )
  ) {

    return "load_failed";
  }


  if (
    value.includes(
      "failed to fetch",
    )
  ) {

    return "failed_to_fetch";
  }


  if (
    value.includes(
      "failed to send a request",
    )
  ) {

    return "function_request_failed";
  }


  if (
    value.includes(
      "networkerror",
    )
  ) {

    return "network_error";
  }


  if (
    value.includes(
      "cors",
    )
  ) {

    return "cors";
  }


  return "other";
}


/* ==========================================================
   FORMAT ERROR
========================================================== */

function formatError(
  error,
  functionName = RESEARCH_FUNCTION,
) {

  if (!error) {

    return [
      "【不明なエラー】",
      "",
      `Function: ${functionName}`,
      `project_id: ${currentProjectId}`,
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


  if (
    error.timeout
  ) {

    return [
      "【通信タイムアウト】",
      "",
      `${functionName} への通信が時間内に完了しませんでした。`,
      "",
      `Function: ${functionName}`,
      `project_id: ${currentProjectId}`,
      `Timeout: ${error.timeoutMs || "不明"} ms`,
      "",
      "これはAI内部の計算エラーとは限りません。",
      "",
      "確認ポイント:",
      "・Supabase Edge Functionが起動しているか",
      "・Function URLが正しいか",
      "・ブラウザからSupabaseへ到達できるか",
      "・ネットワーク接続",
    ].join("\n");
  }


  const kind =
    classifyNetworkError(
      message,
    );


  if (
    kind === "load_failed"
  ) {

    return [
      "【通信エラー: Load failed】",
      "",
      "ブラウザがSupabase Edge Functionへの通信を完了できませんでした。",
      "",
      `Function: ${functionName}`,
      `project_id: ${currentProjectId}`,
      "",
      "重要:",
      "これはsmart-handler内部のAI処理エラーだと断定できません。",
      "ブラウザ → Supabase Edge Function の通信段階で失敗している可能性があります。",
      "",
      "考えられる原因:",
      "・CORS",
      "・Edge Functionへの到達失敗",
      "・Functionが正常に起動していない",
      "・Function URLの問題",
      "・ネットワーク",
      "・ブラウザ側Fetchエラー",
      "",
      `Function URL: ${SUPABASE_URL}/functions/v1/${functionName}`,
      `Project ID: ${currentProjectId}`,
      "",
      `エラー名: ${name || "取得できませんでした"}`,
      `エラー内容: ${message}`,
      "",
      stack
        ? `Stack:\n${stack}`
        : "Stack: 取得できませんでした",
    ].join("\n");
  }


  if (
    kind === "failed_to_fetch"
  ) {

    return [
      "【通信エラー: Failed to fetch】",
      "",
      "ブラウザのFetch通信が失敗しました。",
      "",
      `Function: ${functionName}`,
      `project_id: ${currentProjectId}`,
      "",
      "CORSまたはFunctionへの到達性を確認してください。",
      "",
      `URL: ${SUPABASE_URL}/functions/v1/${functionName}`,
      "",
      `エラー内容: ${message}`,
    ].join("\n");
  }


  if (
    kind === "function_request_failed"
  ) {

    return [
      "【Edge Function通信エラー】",
      "",
      `Function: ${functionName}`,
      `project_id: ${currentProjectId}`,
      "",
      "Supabase Edge Functionへのリクエスト送信に失敗しました。",
      "",
      "考えられる原因:",
      "・CORS",
      "・Functionが公開されていない",
      "・Function URLへの接続失敗",
      "・ブラウザFetchエラー",
      "",
      `エラー内容: ${message}`,
      "",
      stack
        ? `Stack:\n${stack}`
        : "",
    ].join("\n");
  }


  return [
    "【エラー】",
    "",
    `Function: ${functionName}`,
    `project_id: ${currentProjectId}`,
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
   CONNECTION CHECK
========================================================== */

/*
 * 重要:
 *
 * この関数は「サイトを起動するための必須条件」ではない。
 *
 * 失敗してもrunResearch()を止めない。
 *
 * またタイムアウトを入れているので、
 * 「Supabase 接続確認中...」で永久停止しない。
 */

async function checkConnection() {

  setConnectionState(
    "pending",
    "Supabase 接続確認中...",
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
        "Supabase接続確認",
      );


    if (
      result.error
    ) {

      throw result.error;
    }


    setConnectionState(
      "ok",
      "Supabase 接続済み",
    );


    console.log(
      "Supabase connection OK",
    );


    return true;

  } catch (error) {

    console.error(
      "Supabase connection check failed:",
      error,
    );


    setConnectionState(
      "error",
      "Supabase 接続確認失敗",
    );


    /*
     * ここでthrowしない。
     *
     * これが重要。
     */

    return false;
  }
}


/* ==========================================================
   HISTORY
========================================================== */

async function loadHistory() {

  try {

    console.log(
      "Loading history...",
    );


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
        .limit(
          100,
        );


    const result =
      await withTimeout(
        request,
        HISTORY_TIMEOUT_MS,
        "研究履歴の読み込み",
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

  } catch (error) {

    console.error(
      "History error:",
      error,
    );


    if (
      historyList
    ) {

      historyList.innerHTML = `
        <div class="history-empty">
          履歴を読み込めませんでした。
        </div>
      `;
    }


    return false;
  }
}


/* ==========================================================
   EDGE FUNCTION INVOKE
========================================================== */

/*
 * Edge Function呼び出しを共通化。
 *
 * smart-handler / evaluate の両方で
 * 同じ通信診断を使う。
 */

async function invokeFunction(
  functionName,
  body,
) {

  console.log(
    "Invoking Edge Function:",
    functionName,
  );


  console.log(
    "Body:",
    body,
  );


  try {

    const request =
      supabase.functions.invoke(
        functionName,
        {
          body,
        },
      );


    const response =
      await withTimeout(
        request,
        FUNCTION_TIMEOUT_MS,
        functionName,
      );


    console.log(
      "Function response:",
      response,
    );


    return response;

  } catch (error) {

    console.error(
      `invoke(${functionName}) threw:`,
      error,
    );


    /*
     * ここが前回の
     * 「Load failed」対策の中心。
     */

    const detail =
      await getFunctionErrorDetails(
        error,
      );


    const formatted =
      formatError(
        {
          ...error,
          message:
            detail.message ||
            error?.message ||
            String(error),
        },
        functionName,
      );


    throw new Error(
      [
        formatted,
        "",
        detail.status
          ? `HTTP status: ${detail.status}`
          : "",
        detail.body
          ? `Response body:\n${detail.body}`
          : "",
      ]
        .filter(
          Boolean,
        )
        .join("\n"),
    );
  }
}


/* ==========================================================
   RESEARCH
========================================================== */

async function runResearch() {

  if (
    isResearching ||
    isEvaluating
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
      "RESEARCH START",
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
     * DB接続確認は「診断用」。
     *
     * 失敗しても研究Functionは実行する。
     */

    setProgress(
      10,
      "Supabase接続を確認しています...",
    );


    const connectionOK =
      await checkConnection();


    if (!connectionOK) {

      console.warn(
        "Connection check failed. Continuing to Edge Function.",
      );


      showStatus(
        "Supabaseの事前接続確認に失敗しました。研究AIへの直接接続を試します...",
      );
    }


    /*
     * Edge Function
     */

    setProgress(
      20,
      "研究AIを実行しています...",
    );


    const response =
      await invokeFunction(
        RESEARCH_FUNCTION,
        {

          message:
            message,

          project_id:
            currentProjectId,

        },
      );


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
     * response.error
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
          `project_id: ${currentProjectId}`,
          "",
          `HTTP status: ${
            detail.status ||
            "取得できませんでした"
          }`,
          "",
          `Error name: ${
            detail.name ||
            "取得できませんでした"
          }`,
          "",
          detail.message,
          "",
          detail.body
            ? `Response body:\n${detail.body}`
            : "",
          "",
          detail.stack
            ? `Stack:\n${detail.stack}`
            : "",
        ]
          .filter(
            value =>
              value !== "",
          )
          .join("\n"),
      );
    }


    /*
     * data
     */

    const data =
      response?.data;


    if (
      !data
    ) {

      throw new Error(
        [
          "AIからデータが返ってきませんでした。",
          "",
          `Function: ${RESEARCH_FUNCTION}`,
          `project_id: ${currentProjectId}`,
          "",
          "response:",
          safeJson(
            response,
          ),
        ].join("\n"),
      );
    }


    console.log(
      "Function data:",
      data,
    );


    /*
     * Function側のok
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
          safeJson(
            data,
          ),
        ].join("\n"),
      );
    }


    setProgress(
      70,
      "研究結果を受け取りました...",
    );


    /*
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


    renderLatestResult(
      latestResult,
    );


    setProgress(
      85,
      "研究結果を確認しています...",
    );


    showStatus(
      "研究結果を受け取りました。",
      "success",
    );


    /*
     * 履歴保存確認
     *
     * smart-handler側で保存される構成を維持。
     */

    await loadHistory();


    setProgress(
      100,
      "研究完了",
    );


    showStatus(
      "研究完了。",
      "success",
    );


    console.log(
      "=== RESEARCH COMPLETE ===",
    );


  } catch (error) {

    console.error(
      "================================",
    );

    console.error(
      "RESEARCH ERROR",
    );

    console.error(
      error,
    );

    console.error(
      "================================",
    );


    showStatus(
      error?.message ||
      String(error),
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
      !latestResult?.id;
  }
}


/* ==========================================================
   EVALUATE
========================================================== */

async function evaluateLatest() {

  if (
    isResearching ||
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
      "================================",
    );

    console.log(
      "EVALUATE START",
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

    console.log(
      "================================",
    );


    const response =
      await invokeFunction(
        EVALUATE_FUNCTION,
        {

          project_id:
            currentProjectId,

          result_id:
            latestResult.id,

        },
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
          `project_id: ${currentProjectId}`,
          "",
          detail.message,
          "",
          detail.body
            ? `Response body:\n${detail.body}`
            : "",
        ]
          .filter(
            Boolean,
          )
          .join("\n"),
      );
    }


    const data =
      response?.data;


    if (
      !data
    ) {

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


    if (
      details
    ) {

      details.classList.remove(
        "hidden",
      );
    }


    if (
      toggleDetailsButton
    ) {

      toggleDetailsButton.textContent =
        "詳細を閉じる";
    }


  } catch (error) {

    console.error(
      "Evaluation error:",
      error,
    );


    showStatus(
      error?.message ||
      formatError(
        error,
        EVALUATE_FUNCTION,
      ),
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
   HISTORY RENDER
========================================================== */

function renderHistory(
  results,
) {

  if (
    !historyCount ||
    !historyList
  ) {

    return;
  }


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
              !result
            ) {

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
              top:
                0,

              behavior:
                "smooth",
            });
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

  if (
    !result
  ) {

    return;
  }


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

  if (
    !evaluationGrid
  ) {

    return;
  }


  if (
    !evaluation
  ) {

    evaluationGrid.innerHTML = `
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


  evaluationGrid.innerHTML =
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

if (
  toggleDetailsButton &&
  details
) {

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
}


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

  if (
    !date
  ) {

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

  if (
    !container
  ) {

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
   INITIALIZE
========================================================== */

async function initialize() {

  try {

    checkRequiredElements();


    console.log(
      "================================",
    );

    console.log(
      "Research AI initialized",
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


    /*
     * ------------------------------------------------------
     * 重要
     * ------------------------------------------------------
     *
     * 接続確認と履歴読み込みを
     * サイト全体の起動条件にしない。
     *
     * それぞれ内部でタイムアウトする。
     */


    setConnectionState(
      "pending",
      "Supabase 接続確認中...",
    );


    /*
     * まず接続確認。
     *
     * 最大8秒。
     */

    await checkConnection();


    /*
     * 履歴。
     *
     * 最大10秒。
     */

    await loadHistory();


    console.log(
      "Initialization complete.",
    );


  } catch (error) {

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
