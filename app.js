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
   SUPABASE CLIENT
========================================================== */

const supabase =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
  );


/* ==========================================================
   CURRENT PROJECT ID
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
   DEBUG
========================================================== */

console.log(
  "==========================================",
);

console.log(
  "Research AI starting...",
);

console.log(
  "SUPABASE_URL:",
  SUPABASE_URL,
);

console.log(
  "RESEARCH_FUNCTION:",
  RESEARCH_FUNCTION,
);

console.log(
  "EVALUATE_FUNCTION:",
  EVALUATE_FUNCTION,
);

console.log(
  "currentProjectId:",
  currentProjectId,
);

console.log(
  "==========================================",
);


/* ==========================================================
   STATE
========================================================== */

let latestResult =
  null;


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
   DOM VALIDATION
========================================================== */

console.log(
  "DOM check:",
  {
    questionInput:
      !!questionInput,

    researchButton:
      !!researchButton,

    clearButton:
      !!clearButton,

    statusBox:
      !!statusBox,

    connectionDot:
      !!connectionDot,

    connectionText:
      !!connectionText,

    progress:
      !!progress,

    progressText:
      !!progressText,

    progressPercent:
      !!progressPercent,

    progressValue:
      !!progressValue,

    latestSection:
      !!latestSection,

    latestTitle:
      !!latestTitle,

    latestDate:
      !!latestDate,

    latestSymbol:
      !!latestSymbol,

    latestSummary:
      !!latestSummary,

    latestMeta:
      !!latestMeta,

    evaluateButton:
      !!evaluateButton,

    toggleDetailsButton:
      !!toggleDetailsButton,

    details:
      !!details,

    historyList:
      !!historyList,

    historyCount:
      !!historyCount,
  },
);


/* ==========================================================
   CONNECTION CHECK
========================================================== */

async function checkConnection() {

  console.log(
    "Checking Supabase connection...",
  );

  console.log(
    "project_id:",
    currentProjectId,
  );


  try {

    const {
      data,
      error,
      count,
    } =
      await supabase
        .from(
          "research_results",
        )
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


    console.log(
      "Supabase connection response:",
      {
        data,
        error,
        count,
      },
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
    "==========================================",
  );

  console.log(
    "RUN RESEARCH",
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
    "==========================================",
  );


  const message =
    questionInput
      ? questionInput.value.trim()
      : "";


  console.log(
    "Question:",
    message,
  );


  if (!message) {

    showStatus(
      "研究したい数学的な問題を入力してください。",
      "error",
    );


    if (questionInput) {
      questionInput.focus();
    }


    return;
  }


  if (!currentProjectId) {

    showStatus(
      "project_id が設定されていません。",
      "error",
    );


    console.error(
      "currentProjectId is empty.",
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


  setProgress(
    5,
    "研究を準備しています...",
  );


  showStatus(
    "研究AIに接続しています...",
  );


  try {

    /* ======================================================
       STEP 1
    ====================================================== */

    setProgress(
      15,
      "過去の研究履歴を確認しています...",
    );


    console.log(
      "Calling Edge Function:",
      RESEARCH_FUNCTION,
    );


    console.log(
      "Request body:",
      {
        message:
          message,

        project_id:
          currentProjectId,
      },
    );


    /* ======================================================
       STEP 2
       EDGE FUNCTION
    ====================================================== */

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


    } catch (invokeError) {

      console.error(
        "FUNCTION INVOKE THREW ERROR:",
        invokeError,
      );


      throw new Error(
        [
          "smart-handler の呼び出し自体に失敗しました。",
          "",
          "message:",
          invokeError?.message ||
            String(invokeError),
          "",
          "name:",
          invokeError?.name ||
            "unknown",
        ].join("\n"),
      );
    }


    /* ======================================================
       RAW RESPONSE DEBUG
    ====================================================== */

    console.log(
      "==========================================",
    );

    console.log(
      "EDGE FUNCTION RESPONSE",
    );

    console.log(
      "response:",
      response,
    );

    console.log(
      "response.error:",
      response?.error,
    );

    console.log(
      "response.data:",
      response?.data,
    );

    console.log(
      "==========================================",
    );


    /* ======================================================
       EDGE FUNCTION ERROR
    ====================================================== */

    if (response?.error) {

      const functionError =
        response.error;


      console.error(
        "EDGE FUNCTION ERROR:",
        functionError,
      );


      const errorMessage =
        functionError?.message ||
        functionError?.error_description ||
        functionError?.details ||
        functionError?.hint ||
        JSON.stringify(
          functionError,
          null,
          2,
        );


      throw new Error(
        [
          "smart-handler からエラーが返りました。",
          "",
          errorMessage,
        ].join("\n"),
      );
    }


    /* ======================================================
       DATA
    ====================================================== */

    const data =
      response?.data;


    console.log(
      "Parsed function data:",
      data,
    );


    if (!data) {

      throw new Error(
        [
          "smart-handler からデータが返ってきませんでした。",
          "",
          "response:",
          JSON.stringify(
            response,
            null,
            2,
          ),
        ].join("\n"),
      );
    }


    /* ======================================================
       SERVER ERROR
    ====================================================== */

    if (!data.ok) {

      console.error(
        "smart-handler returned ok=false:",
        data,
      );


      throw new Error(
        [
          "smart-handler がエラーを返しました。",
          "",
          data.error ||
            data.detail ||
            "原因不明",
        ].join("\n"),
      );
    }


    /* ======================================================
       SUCCESS
    ====================================================== */

    setProgress(
      70,
      "研究結果を受け取りました...",
    );


    console.log(
      "Research succeeded:",
      data,
    );


    /* ======================================================
       BLOCKED ROUTE
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
       VALIDATE RESEARCH RESULT
    ====================================================== */

    if (!data.research) {

      throw new Error(
        [
          "研究結果は返りましたが、research オブジェクトがありません。",
          "",
          JSON.stringify(
            data,
            null,
            2,
          ),
        ].join("\n"),
      );
    }


    /* ======================================================
       NORMALIZE EVIDENCE
    ====================================================== */

    const research =
      data.research;


    const evidence =
      research.evidence;


    let evidenceItems = [];


    if (
      Array.isArray(
        evidence,
      )
    ) {

      evidenceItems =
        evidence;

    } else if (
      evidence &&
      typeof evidence ===
        "object"
    ) {

      evidenceItems =
        Array.isArray(
          evidence.items,
        )
          ? evidence.items
          : [];
    }


    const route =
      research.route ||
      evidence?.route ||
      "";


    const routeKey =
      research.route_key ||
      evidence?.route_key ||
      "";


    const routeCount =
      Number(
        research.route_count ??
        evidence?.route_count ??
        1,
      );


    const confidence =
      Number(
        research.confidence ??
        evidence?.confidence ??
        0,
      );


    const confidenceBasis =
      research.confidence_basis ||
      evidence?.confidence_basis ||
      "";


    /* ======================================================
       CREATE LATEST RESULT
    ====================================================== */

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
          route,

        route_key:
          routeKey,

        route_count:
          Number.isFinite(
            routeCount,
          )
            ? routeCount
            : 1,

        confidence:
          Number.isFinite(
            confidence,
          )
            ? confidence
            : 0,

        confidence_basis:
          confidenceBasis,

        items:
          evidenceItems,

      },


      created_at:
        new Date().toISOString(),

    };


    console.log(
      "latestResult:",
      latestResult,
    );


    /* ======================================================
       RESULT MUST HAVE ID
    ====================================================== */

    if (!latestResult.id) {

      throw new Error(
        [
          "研究結果は返りましたが result_id がありません。",
          "",
          JSON.stringify(
            data,
            null,
            2,
          ),
        ].join("\n"),
      );
    }


    /* ======================================================
       RENDER
    ====================================================== */

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


    /* ======================================================
       HISTORY
    ====================================================== */

    await loadHistory();


    setProgress(
      100,
      "研究完了",
    );


    console.log(
      "Research completed successfully.",
    );


  } catch (error) {

    console.error(
      "==========================================",
    );

    console.error(
      "RESEARCH ERROR",
    );

    console.error(
      error,
    );

    console.error(
      "==========================================",
    );


    showStatus(
      formatError(
        error,
      ),
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
        !latestResult;
    }
  }
}


/* ==========================================================
   EVALUATE
========================================================== */

async function evaluateLatest() {

  console.log(
    "==========================================",
  );

  console.log(
    "EVALUATE",
  );

  console.log(
    "Result ID:",
    latestResult?.id,
  );

  console.log(
    "Project ID:",
    currentProjectId,
  );

  console.log(
    "==========================================",
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

    const requestBody = {

      project_id:
        currentProjectId,

      result_id:
        latestResult.id,

    };


    console.log(
      "Evaluate request:",
      requestBody,
    );


    let response;


    try {

      response =
        await supabase.functions.invoke(
          EVALUATE_FUNCTION,
          {
            body:
              requestBody,
          },
        );

    } catch (invokeError) {

      console.error(
        "Evaluate invoke error:",
        invokeError,
      );


      throw new Error(
        [
          "evaluate Functionの呼び出しに失敗しました。",
          "",
          invokeError?.message ||
            String(invokeError),
        ].join("\n"),
      );
    }


    console.log(
      "Evaluate response:",
      response,
    );


    if (response?.error) {

      throw new Error(
        [
          "evaluate Functionからエラーが返りました。",
          "",
          response.error.message ||
            JSON.stringify(
              response.error,
              null,
              2,
            ),
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


    if (!data.ok) {

      throw new Error(
        data.error ||
        data.detail ||
        "評価AIでエラーが発生しました。",
      );
    }


    const evaluation =
      data.evaluation;


    if (!evaluation) {

      throw new Error(
        [
          "評価は成功しましたが evaluation がありません。",
          "",
          JSON.stringify(
            data,
            null,
            2,
          ),
        ].join("\n"),
      );
    }


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
          evaluation.overall_symbol ||
          "△"
        }`,
        "",
        evaluation.reason ||
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
      "Evaluation error:",
      error,
    );


    showStatus(
      formatError(
        error,
      ),
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
    "Loading research history...",
  );


  console.log(
    "History project_id:",
    currentProjectId,
  );


  try {

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "research_results",
        )
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


    console.log(
      "History response:",
      {
        data,
        error,
      },
    );


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


    if (historyList) {

      historyList.innerHTML = `
        <div class="history-empty">
          履歴を読み込めませんでした。
          <br>
          ${escapeHtml(
            error?.message ||
            String(error),
          )}
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

  if (historyCount) {

    historyCount.textContent =
      `${results.length}件`;
  }


  if (!historyList) {
    return;
  }


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
            }
          },
        );
      },
    );
}


/* ==========================================================
   NORMALIZE HISTORY RESULT
========================================================== */

function normalizeHistoryResult(
  result,
) {

  const evidence =
    result?.evidence;


  const evaluation =
    evidence?.evaluation;


  const route =
    evidence?.route ||
    "";


  const routeKey =
    evidence?.route_key ||
    "";


  const routeCount =
    Number(
      evidence?.route_count ??
      1,
    );


  const confidence =
    Number(
      evidence?.confidence ??
      0,
    );


  const confidenceBasis =
    evidence?.confidence_basis ||
    "";


  const items =
    Array.isArray(
      evidence?.items,
    )
      ? evidence.items
      : [];


  return {

    ...result,

    description:
      result.description ||
      "",


    hypothesis:
      result.hypothesis ||
      "",


    calculation:
      result.calculation ||
      "",


    verification:
      result.verification ||
      "",


    next_action:
      result.next_action ||
      "",


    evidence: {

      route,

      route_key:
        routeKey,

      route_count:
        Number.isFinite(
          routeCount,
        )
          ? routeCount
          : 1,

      confidence:
        Number.isFinite(
          confidence,
        )
          ? confidence
          : 0,

      confidence_basis:
        confidenceBasis,

      items,

      evaluation,
    },
  };
}


/* ==========================================================
   CREATE HISTORY ITEM
========================================================== */

function createHistoryItem(
  result,
) {

  const evidence =
    result?.evidence;


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
      data-result-id="${escapeHtml(
        result.id,
      )}"
    >

      <div class="history-main">

        <div
          class="history-symbol ${statusClass(
            status,
          )}"
        >
          ${escapeHtml(
            symbol,
          )}
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
      `symbol ${statusClass(
        status,
      )}`;
  }


  if (latestSummary) {

    latestSummary.textContent =
      result.description ||
      "研究結果が保存されています。";
  }


  if (latestMeta) {

    latestMeta.innerHTML =
      "";
  }


  if (latestMeta) {

    addTag(
      latestMeta,
      `状態: ${statusLabel(
        status,
      )}`,
    );


    if (
      result?.evidence?.route
    ) {

      addTag(
        latestMeta,
        `ルート: ${
          result.evidence.route
        }`,
      );
    }


    if (
      result?.evidence?.route_count
    ) {

      addTag(
        latestMeta,
        `使用回数: ${
          result.evidence.route_count
        }`,
      );
    }


    if (
      typeof result?.evidence?.confidence ===
      "number"
    ) {

      addTag(
        latestMeta,
        `信頼度: ${
          Math.round(
            result.evidence.confidence *
            100,
          )
        }%`,
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
              ${escapeHtml(
                label,
              )}
            </div>

            <div class="value">
              ${escapeHtml(
                value,
              )}
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
        (
          event.metaKey ||
          event.ctrlKey
        ) &&
        event.key === "Enter"
      ) {

        event.preventDefault();

        runResearch();
      }
    },
  );
}


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
   ERROR FORMATTER
========================================================== */

function formatError(
  error,
) {

  if (!error) {
    return "不明なエラーです。";
  }


  console.error(
    "Formatting error:",
    error,
  );


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
      "Function:",
      RESEARCH_FUNCTION,
      "",
      "project_id:",
      currentProjectId,
      "",
      "SupabaseのEdge Functionsで",
      "smart-handler がDeploy済みか確認してください。",
    ].join("\n");
  }


  if (
    message.includes(
      "Load failed",
    )
  ) {

    return [
      "Load failed",
      "",
      "smart-handlerへの通信に失敗しました。",
      "",
      `Function: ${RESEARCH_FUNCTION}`,
      `project_id: ${currentProjectId}`,
      "",
      "ブラウザConsoleに詳細ログを出しています。",
    ].join("\n");
  }


  return message;
}


/* ==========================================================
   INITIALIZE
========================================================== */

async function initialize() {

  console.log(
    "Initializing Research AI...",
  );


  try {

    await checkConnection();

  } catch (error) {

    console.error(
      "Initialization connection error:",
      error,
    );
  }


  try {

    await loadHistory();

  } catch (error) {

    console.error(
      "Initialization history error:",
      error,
    );
  }


  console.log(
    "Research AI initialized.",
  );
}


/* ==========================================================
   START
========================================================== */

initialize();
