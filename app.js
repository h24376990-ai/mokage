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
      .remove(
        "error",
      );


    connectionDot
      .classList
      .add(
        "ok",
      );


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
      .remove(
        "ok",
      );


    connectionDot
      .classList
      .add(
        "error",
      );


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
   DIAGNOSTIC HELPERS
========================================================== */

/*
 * JavaScriptのErrorオブジェクトを、
 * 画面表示できる安全な文字列に変換する。
 */

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


/*
 * Edge Functionエラーの詳細を取得する。
 */

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


  let body = "";


  /*
   * FunctionsHttpErrorの場合、
   * error.contextはResponse。
   */

  try {

    if (
      error.context &&
      typeof error.context.clone ===
        "function"
    ) {

      const cloned =
        error.context.clone();


      if (
        typeof cloned.text ===
          "function"
      ) {

        body =
          await cloned.text();

      }

    } else if (
      error.context &&
      typeof error.context.text ===
        "function"
    ) {

      body =
        await error.context.text();

    }

  } catch (
    contextError
  ) {

    console.warn(
      "Could not read Function error context:",
      contextError,
    );
  }


  /*
   * JSONなら整形する。
   */

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
   DIAGNOSTIC ERROR FORMAT
========================================================== */

function formatError(
  error,
) {

  if (!error) {

    return [
      "不明なエラーです。",
      "",
      `Function: ${RESEARCH_FUNCTION}`,
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


  console.error(
    "Formatted error:",
    error,
  );


  /*
   * Load failed
   */

  if (
    message
      .toLowerCase()
      .includes(
        "load failed",
      )
  ) {

    return [
      "【通信エラー】",
      "",
      "ブラウザからSupabase Edge Functionへ接続できませんでした。",
      "",
      `Function: ${RESEARCH_FUNCTION}`,
      `project_id: ${currentProjectId}`,
      "",
      "考えられる原因:",
      "・CORS",
      "・Edge Functionへの通信失敗",
      "・GitHub Pagesからのリクエスト拒否",
      "・ネットワーク接続",
      "・ブラウザのFetchエラー",
      "",
      `エラー名: ${name || "取得できませんでした"}`,
      `エラー内容: ${message}`,
      "",
      "このエラーはsmart-handler内部のAI処理エラーとは限りません。",
      "Supabase Dashboardからのテストが200なら、",
      "GitHubサイトからFunctionへ到達する部分を調査する必要があります。",
      "",
      "▼ 診断情報",
      `URL: ${SUPABASE_URL}`,
      `Function URL: ${SUPABASE_URL}/functions/v1/${RESEARCH_FUNCTION}`,
      `Project ID: ${currentProjectId}`,
      `Message: ${questionInput.value.trim()}`,
      "",
      stack
        ? `Stack:\n${stack}`
        : "Stack: 取得できませんでした",
    ].join("\n");
  }


  /*
   * Failed to send request
   */

  if (
    message.includes(
      "Failed to send a request to the Edge Function",
    )
  ) {

    return [
      "【Edge Function通信エラー】",
      "",
      `Function: ${RESEARCH_FUNCTION}`,
      `project_id: ${currentProjectId}`,
      "",
      "Supabase Edge Functionへのリクエスト送信に失敗しました。",
      "",
      "考えられる原因:",
      "・CORS",
      "・Functionが公開されていない",
      "・Function URLへの接続失敗",
      "・ブラウザ側Fetchエラー",
      "",
      `エラー内容: ${message}`,
      "",
      stack
        ? `Stack:\n${stack}`
        : "",
    ].join("\n");
  }


  /*
   * その他
   */

  return [
    "【エラー】",
    "",
    `Function: ${RESEARCH_FUNCTION}`,
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

    /*
     * ------------------------------------------------------
     * 1
     * ------------------------------------------------------
     */

    setProgress(
      10,
      "Supabaseへ接続しています...",
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


    /*
     * ------------------------------------------------------
     * 2
     * ------------------------------------------------------
     */

    setProgress(
      20,
      "研究AIを実行しています...",
    );


    let response;


    try {

      response =
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

    } catch (
      invokeError
    ) {

      /*
       * invoke()自体がPromise rejectした場合。
       *
       * ここが今回の「Load failed」の
       * 最重要ポイント。
       */

      console.error(
        "invoke() threw an exception:",
        invokeError,
      );


      const detail =
        formatError(
          invokeError,
        );


      throw new Error(
        detail,
      );
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
     * ------------------------------------------------------
     * 3
     * ------------------------------------------------------
     */

    if (
      response?.error
    ) {

      const detail =
        await getFunctionErrorDetails(
          response.error,
        );


      const diagnostic = [

        "【Supabase Edge Functionエラー】",

        "",

        `Function: ${RESEARCH_FUNCTION}`,

        `project_id: ${currentProjectId}`,

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

      ].join("\n");


      throw new Error(
        diagnostic,
      );
    }


    /*
     * ------------------------------------------------------
     * 4
     * ------------------------------------------------------
     */

    const data =
      response?.data;


    if (!data) {

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
     * ------------------------------------------------------
     * 5
     * ------------------------------------------------------
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


    /*
     * ------------------------------------------------------
     * 6
     * ------------------------------------------------------
     */

    setProgress(
      70,
      "研究結果を受け取りました...",
    );


    /*
     * ------------------------------------------------------
     * 7
     * BLOCK
     * ------------------------------------------------------
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
     * ------------------------------------------------------
     * 8
     * RESULT
     * ------------------------------------------------------
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
     * ------------------------------------------------------
     * 9
     * ------------------------------------------------------
     */

    renderLatestResult(
      latestResult,
    );


    /*
     * ------------------------------------------------------
     * 10
     * ------------------------------------------------------
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
     * ------------------------------------------------------
     * 11
     * ------------------------------------------------------
     */

    await loadHistory();


    /*
     * ------------------------------------------------------
     * 12
     * ------------------------------------------------------
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
      "=== RESEARCH ERROR ===",
    );


    console.error(
      error,
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
    !latestResult?.id
  ) {

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
      "evaluate response:",
      response,
    );


    if (
      response.error
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
        ].join("\n"),
      );
    }


    const data =
      response.data;


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

    console.log(
      "Loading history...",
    );


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


    if (
      error
    ) {

      throw error;
    }


    renderHistory(
      data || [],
    );


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
                  item.id === id,
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
   HISTORY RESULT NORMALIZER
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


    await checkConnection();


    await loadHistory();


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
