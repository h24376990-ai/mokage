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
   RESEARCH SETTINGS
========================================================== */

const MAX_CHAT_MESSAGES =
  50;

const MAX_RESEARCH_MEMORY =
  100;

const MAX_SAVED_RESEARCH =
  100;


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

let researchMemory = [];

let savedResearch = [];

let chatMessages = [];

let currentResearchDirection =
  localStorage.getItem(
    "research_direction",
  ) || "";

let currentHypothesis = null;

let currentExperiment = null;

let currentVisualization = null;


/* ==========================================================
   LOCAL STORAGE KEYS
========================================================== */

const STORAGE_KEYS = {

  memory:
    "riemann_research_memory",

  savedResearch:
    "riemann_saved_research",

  chat:
    "riemann_chat_messages",

  direction:
    "riemann_research_direction",

  hypothesis:
    "riemann_current_hypothesis",

  experiments:
    "riemann_experiment_jobs",

};


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

/*
 * これらは今のHTMLに存在しなくてもエラーにしない。
 *
 * 将来UIを復元するときに追加する。
 */

const optionalDOM = {

  memoryPanel:
    document.getElementById(
      "memoryPanel",
    ),

  memoryList:
    document.getElementById(
      "memoryList",
    ),

  savedResearchList:
    document.getElementById(
      "savedResearchList",
    ),

  savedResearchCount:
    document.getElementById(
      "savedResearchCount",
    ),

  directionInput:
    document.getElementById(
      "directionInput",
    ),

  hypothesisList:
    document.getElementById(
      "hypothesisList",
    ),

  experimentList:
    document.getElementById(
      "experimentList",
    ),

  visualization:
    document.getElementById(
      "visualization",
    ),

  strictMode:
    document.getElementById(
      "strictMode",
    ),

};


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
   LOCAL STORAGE
========================================================== */

function loadLocalState() {

  try {

    researchMemory =
      JSON.parse(
        localStorage.getItem(
          STORAGE_KEYS.memory,
        ) || "[]",
      );

  } catch (_) {

    researchMemory = [];

  }


  try {

    savedResearch =
      JSON.parse(
        localStorage.getItem(
          STORAGE_KEYS.savedResearch,
        ) || "[]",
      );

  } catch (_) {

    savedResearch = [];

  }


  try {

    chatMessages =
      JSON.parse(
        localStorage.getItem(
          STORAGE_KEYS.chat,
        ) || "[]",
      );

  } catch (_) {

    chatMessages = [];

  }


  try {

    currentHypothesis =
      JSON.parse(
        localStorage.getItem(
          STORAGE_KEYS.hypothesis,
        ) || "null",
      );

  } catch (_) {

    currentHypothesis = null;

  }


  pruneChatMessages();

  pruneResearchMemory();

  pruneSavedResearch();

  renderOptionalPanels();

}


/* ==========================================================
   SAVE LOCAL STATE
========================================================== */

function saveLocalState() {

  localStorage.setItem(
    STORAGE_KEYS.memory,
    JSON.stringify(
      researchMemory,
    ),
  );


  localStorage.setItem(
    STORAGE_KEYS.savedResearch,
    JSON.stringify(
      savedResearch,
    ),
  );


  localStorage.setItem(
    STORAGE_KEYS.chat,
    JSON.stringify(
      chatMessages,
    ),
  );


  localStorage.setItem(
    STORAGE_KEYS.direction,
    currentResearchDirection,
  );


  localStorage.setItem(
    STORAGE_KEYS.hypothesis,
    JSON.stringify(
      currentHypothesis,
    ),
  );

}


/* ==========================================================
   CHAT MEMORY
========================================================== */

function addChatMessage(
  role,
  content,
) {

  chatMessages.push({

    id:
      crypto.randomUUID
        ? crypto.randomUUID()
        : String(
            Date.now(),
          ),

    role,

    content,

    created_at:
      new Date().toISOString(),

  });


  pruneChatMessages();

  saveLocalState();
}


/*
 * 直近50件だけ残す。
 *
 * 重要研究情報は別のMemoryへ昇格するため、
 * チャットPruningによって研究知識そのものは失わない。
 */

function pruneChatMessages() {

  if (
    chatMessages.length >
    MAX_CHAT_MESSAGES
  ) {

    chatMessages =
      chatMessages.slice(
        -MAX_CHAT_MESSAGES,
      );
  }

}


/* ==========================================================
   RESEARCH MEMORY
========================================================== */

function addResearchMemory(
  type,
  content,
  source = "research",
  importance = "normal",
) {

  if (
    !content ||
    !String(content).trim()
  ) {

    return;

  }


  const item = {

    id:
      crypto.randomUUID
        ? crypto.randomUUID()
        : String(
            Date.now(),
          ),

    type,

    content:
      String(content).trim(),

    source,

    importance,

    created_at:
      new Date().toISOString(),

  };


  researchMemory.unshift(
    item,
  );


  pruneResearchMemory();

  saveLocalState();

  renderOptionalPanels();

}


/*
 * Memoryは単純に無限保存しない。
 */

function pruneResearchMemory() {

  if (
    researchMemory.length >
    MAX_RESEARCH_MEMORY
  ) {

    researchMemory =
      researchMemory.slice(
        0,
        MAX_RESEARCH_MEMORY,
      );
  }

}


/* ==========================================================
   SAVED RESEARCH
========================================================== */

function saveImportantResearch(
  result,
) {

  if (!result) {

    return;

  }


  const id =
    result.id ||
    result.result_id;


  if (!id) {

    return;

  }


  const exists =
    savedResearch.some(
      item =>
        item.id === id,
    );


  if (exists) {

    return;

  }


  savedResearch.unshift({

    ...result,

    saved_at:
      new Date().toISOString(),

    saved_reason:
      "評価AIによる○判定",

  });


  pruneSavedResearch();

  saveLocalState();

  renderOptionalPanels();

}


/* ==========================================================
   SAVED RESEARCH PRUNING
========================================================== */

function pruneSavedResearch() {

  if (
    savedResearch.length >
    MAX_SAVED_RESEARCH
  ) {

    savedResearch =
      savedResearch.slice(
        0,
        MAX_SAVED_RESEARCH,
      );
  }

}


/* ==========================================================
   REMOVE SAVED RESEARCH
========================================================== */

function removeSavedResearch(
  id,
) {

  savedResearch =
    savedResearch.filter(
      item =>
        item.id !== id,
    );


  saveLocalState();

  renderOptionalPanels();

}


/* ==========================================================
   RESEARCH DIRECTION
========================================================== */

function setResearchDirection(
  direction,
) {

  currentResearchDirection =
    String(
      direction || "",
    ).trim();


  localStorage.setItem(
    STORAGE_KEYS.direction,
    currentResearchDirection,
  );


  addResearchMemory(
    "direction",
    currentResearchDirection,
    "user",
    "high",
  );

}


/* ==========================================================
   HYPOTHESIS
========================================================== */

function createHypothesisFromResult(
  result,
) {

  if (!result) {

    return null;

  }


  const hypothesis = {

    id:
      `H-${Date.now()}`,

    title:
      result.title ||
      "新しい研究仮説",

    claim:
      result.hypothesis ||
      "",

    assumptions:
      extractAssumptions(
        result,
      ),

    status:
      normalizeResearchStatus(
        result.status,
      ),

    source:
      "research",

    parent_id:
      currentHypothesis?.id ||
      null,

    evidence:
      result.evidence || {},

    created_at:
      new Date().toISOString(),

  };


  currentHypothesis =
    hypothesis;


  saveLocalState();

  renderOptionalPanels();


  addResearchMemory(
    "hypothesis",
    JSON.stringify(
      hypothesis,
      null,
      2,
    ),
    "research",
    "high",
  );


  return hypothesis;

}


/* ==========================================================
   ASSUMPTION EXTRACTION
========================================================== */

function extractAssumptions(
  result,
) {

  const text =
    result?.confidence_basis ||
    result?.verification ||
    "";


  if (!text) {

    return [];

  }


  return [

    {

      id:
        `A-${Date.now()}`,

      text,

      source:
        "AI inference",

      verified:
        false,

    },

  ];

}


/* ==========================================================
   RESEARCH STATUS
========================================================== */

function normalizeResearchStatus(
  status,
) {

  const valid = [

    "PROVEN",

    "SUPPORTED",

    "NUMERICALLY_OBSERVED",

    "UNVERIFIED",

    "PLAUSIBLE",

    "SPECULATIVE",

    "CONTRADICTED",

    "REJECTED",

    "DISCOVERY_CANDIDATE",

  ];


  const value =
    String(
      status || "",
    )
      .trim()
      .toUpperCase();


  if (
    valid.includes(
      value,
    )
  ) {

    return value;

  }


  if (
    status === "good"
  ) {

    return "SUPPORTED";

  }


  if (
    status === "bad"
  ) {

    return "CONTRADICTED";

  }


  return "UNVERIFIED";

}


/* ==========================================================
   EVIDENCE
========================================================== */

function buildEvidenceLedger(
  result,
) {

  const evidence =
    result?.evidence || {};


  return {

    research_id:
      result.id || null,

    status:
      normalizeResearchStatus(
        result.status,
      ),

    confidence:
      Number(
        evidence.confidence ||
        result.confidence ||
        0,
      ),

    confidence_basis:
      evidence.confidence_basis ||
      result.confidence_basis ||
      "",

    route:
      evidence.route ||
      "",

    route_key:
      evidence.route_key ||
      "",

    numerical_observation:
      result.calculation ||
      "",

    verification:
      result.verification ||
      "",

    evaluation:
      evidence.evaluation ||
      null,

    evidence_items:
      Array.isArray(
        evidence.items,
      )
        ? evidence.items
        : [],

    created_at:
      result.created_at ||
      new Date().toISOString(),

  };

}


/* ==========================================================
   RESEARCH RATIONALE
========================================================== */

function buildResearchRationale(
  result,
) {

  return {

    previous_route:
      result?.evidence?.route ||
      "",

    previous_route_key:
      result?.evidence?.route_key ||
      "",

    route_count:
      Number(
        result?.evidence?.route_count ||
        1,
      ),

    previous_hypothesis:
      currentHypothesis?.id ||
      null,

    reason:

      result?.next_action ||

      "前回の研究結果をもとに次の研究方針を検討する。",

  };

}


/* ==========================================================
   MATHEMATICAL VISUALIZATION DATA
========================================================== */

function buildVisualizationData(
  result,
) {

  if (!result) {

    return null;

  }


  /*
   * 数学モデルそのものの計算は
   * この関数では捏造しない。
   *
   * 実際の計算結果が存在する場合だけ
   * visualizationへ渡す。
   */

  const calculation =
    result.calculation ||
    "";

  const hypothesis =
    result.hypothesis ||
    "";

  const verification =
    result.verification ||
    "";


  currentVisualization = {

    type:
      "research-mathematical-model",

    research_id:
      result.id || null,

    title:
      result.title ||
      "数学モデル",

    hypothesis,

    calculation,

    verification,

    route:
      result?.evidence?.route ||
      "",

    data:
      Array.isArray(
        result?.evidence?.items,
      )
        ? result.evidence.items
        : [],

    criticalLine: {

      real:
        0.5,

      label:
        "Re(s) = 1/2",

    },

    zeros: [],

    /*
     * 実測された零点だけをここへ入れる。
     * 固定値を「計算結果」として扱わない。
     */

    source:
      "research_result",

    created_at:
      new Date().toISOString(),

  };


  renderVisualization();

  return currentVisualization;

}


/* ==========================================================
   VISUALIZATION RENDER
========================================================== */

function renderVisualization() {

  const container =
    optionalDOM.visualization;


  if (!container) {

    return;

  }


  if (!currentVisualization) {

    container.innerHTML = "";

    return;

  }


  container.innerHTML = `

    <div class="math-model">

      <div class="math-model-title">
        ${escapeHtml(
          currentVisualization.title,
        )}
      </div>

      <div class="math-model-section">

        <strong>
          仮説
        </strong>

        <div>
          ${escapeHtml(
            currentVisualization.hypothesis ||
            "記録なし",
          )}
        </div>

      </div>

      <div class="math-model-section">

        <strong>
          Critical Line
        </strong>

        <div>
          Re(s) = 1/2
        </div>

      </div>

      <div class="math-model-section">

        <strong>
          計算
        </strong>

        <div>
          ${escapeHtml(
            currentVisualization.calculation ||
            "記録なし",
          )}
        </div>

      </div>

      <div class="math-model-section">

        <strong>
          検証
        </strong>

        <div>
          ${escapeHtml(
            currentVisualization.verification ||
            "記録なし",
          )}
        </div>

      </div>

      <div class="math-model-note">

        ※ 数学的グラフは実際の数値計算結果が
        提供された場合のみ描画します。

      </div>

    </div>

  `;

}


/* ==========================================================
   OPTIONAL PANEL RENDERING
========================================================== */

function renderOptionalPanels() {

  renderMemoryPanel();

  renderSavedResearchPanel();

  renderHypothesisPanel();

}


/* ==========================================================
   MEMORY PANEL
========================================================== */

function renderMemoryPanel() {

  const list =
    optionalDOM.memoryList;


  if (!list) {

    return;

  }


  if (
    !researchMemory.length
  ) {

    list.innerHTML = `
      <div class="memory-empty">
        重要な研究メモはまだありません。
      </div>
    `;

    return;

  }


  list.innerHTML =
    researchMemory
      .map(
        memory => `

          <div
            class="memory-item"
            data-memory-id="${escapeHtml(
              memory.id,
            )}"
          >

            <div class="memory-type">
              ${escapeHtml(
                memory.type,
              )}
            </div>

            <div class="memory-content">
              ${escapeHtml(
                memory.content,
              )}
            </div>

            <div class="memory-meta">
              ${escapeHtml(
                memory.source,
              )}
              ・
              ${formatDate(
                memory.created_at,
              )}
            </div>

          </div>

        `,
      )
      .join("");

}


/* ==========================================================
   SAVED RESEARCH PANEL
========================================================== */

function renderSavedResearchPanel() {

  const list =
    optionalDOM.savedResearchList;


  if (!list) {

    return;

  }


  if (
    optionalDOM.savedResearchCount
  ) {

    optionalDOM.savedResearchCount.textContent =
      `${savedResearch.length}件`;

  }


  if (
    !savedResearch.length
  ) {

    list.innerHTML = `
      <div class="history-empty">
        保存された重要研究はありません。
      </div>
    `;

    return;

  }


  list.innerHTML =
    savedResearch
      .map(
        result => {

          const status =
            result?.evidence?.evaluation
              ?.overall ||
            result.status ||
            "maybe";


          const symbol =
            result?.evidence?.evaluation
              ?.overall_symbol ||
            statusToSymbol(
              status,
            );


          return `

            <div
              class="history-item saved-research-item"
              data-saved-result-id="${escapeHtml(
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

                <div>

                  <div class="history-title">
                    ${escapeHtml(
                      result.title ||
                      "保存研究",
                    )}
                  </div>

                  <div class="history-date">
                    ${formatDate(
                      result.created_at,
                    )}
                  </div>

                </div>

              </div>

            </div>

          `;

        },
      )
      .join("");


  list
    .querySelectorAll(
      "[data-saved-result-id]",
    )
    .forEach(
      element => {

        element.addEventListener(
          "click",
          () => {

            const id =
              element.dataset
                .savedResultId;


            const result =
              savedResearch.find(
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
   HYPOTHESIS PANEL
========================================================== */

function renderHypothesisPanel() {

  const list =
    optionalDOM.hypothesisList;


  if (!list) {

    return;

  }


  if (!currentHypothesis) {

    list.innerHTML = `
      <div class="history-empty">
        現在の仮説はありません。
      </div>
    `;

    return;

  }


  list.innerHTML = `

    <div class="hypothesis-card">

      <div class="hypothesis-id">
        ${escapeHtml(
          currentHypothesis.id,
        )}
      </div>

      <div class="hypothesis-title">
        ${escapeHtml(
          currentHypothesis.title,
        )}
      </div>

      <div class="hypothesis-claim">
        ${escapeHtml(
          currentHypothesis.claim ||
          "記録なし",
        )}
      </div>

      <div class="hypothesis-status">
        ${escapeHtml(
          currentHypothesis.status,
        )}
      </div>

    </div>

  `;

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
    `${Math.round(
      safe,
    )}%`;


  progressText.textContent =
    text;

}


/* ==========================================================
   ERROR HELPERS
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


  let body = "";


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
   FORMAT ERROR
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

      `エラー名: ${
        name ||
        "取得できませんでした"
      }`,

      `エラー内容: ${message}`,

      "",

      `URL: ${SUPABASE_URL}`,

      `Function URL: ${SUPABASE_URL}/functions/v1/${RESEARCH_FUNCTION}`,

      `Project ID: ${currentProjectId}`,

      "",

      stack
        ? `Stack:\n${stack}`
        : "Stack: 取得できませんでした",

    ].join("\n");

  }


  return [

    "【エラー】",

    "",

    `Function: ${RESEARCH_FUNCTION}`,

    `project_id: ${currentProjectId}`,

    "",

    `エラー名: ${
      name ||
      "不明"
    }`,

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


  /*
   * Chat Memory
   */

  addChatMessage(
    "user",
    message,
  );


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
     * 重要：
     *
     * ここは現在Load failed対策で
     * 動作確認済みの通信処理を維持する。
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

              message,

              project_id:
                currentProjectId,

              /*
               * 追加情報。
               *
               * smart-handler側が無視しても
               * 現在の通信方式は壊さない。
               */

              research_context: {

                direction:
                  currentResearchDirection,

                current_hypothesis:
                  currentHypothesis,

                memory:
                  researchMemory
                    .slice(
                      0,
                      30,
                    ),

              },

            },

          },
        );

    } catch (
      invokeError
    ) {

      console.error(
        "invoke() threw an exception:",
        invokeError,
      );


      throw new Error(
        formatError(
          invokeError,
        ),
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

          `HTTP status: ${
            detail.status ||
            "取得できませんでした"
          }`,

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

          data.answer ||
          "",

          "",

          "別のアプローチを探します。",

        ].join("\n"),

        "success",

      );


      addResearchMemory(

        "blocked-route",

        [

          `route: ${
            data.route ||
            ""
          }`,

          `route_key: ${
            data.route_key ||
            ""
          }`,

          data.answer ||
          "",

        ].join("\n"),

        "research",

        "high",

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


    /*
     * Chat AI response
     */

    addChatMessage(
      "assistant",
      [
        latestResult.title,
        latestResult.description,
        latestResult.hypothesis,
        latestResult.verification,
      ]
        .filter(Boolean)
        .join("\n\n"),
    );


    /*
     * Research Memory
     */

    if (
      latestResult.hypothesis
    ) {

      addResearchMemory(
        "hypothesis",
        latestResult.hypothesis,
        "research",
        "high",
      );

    }


    if (
      latestResult.verification
    ) {

      addResearchMemory(
        "verification",
        latestResult.verification,
        "research",
        "high",
      );

    }


    if (
      latestResult.next_action
    ) {

      addResearchMemory(
        "next_action",
        latestResult.next_action,
        "research",
        "normal",
      );

    }


    if (
      latestResult?.evidence?.route
    ) {

      addResearchMemory(
        "research_route",
        [

          `route: ${
            latestResult.evidence.route
          }`,

          `route_key: ${
            latestResult.evidence.route_key
          }`,

          `route_count: ${
            latestResult.evidence.route_count
          }`,

        ].join("\n"),
        "research",
        "high",
      );

    }


    /*
     * Hypothesis
     */

    createHypothesisFromResult(
      latestResult,
    );


    /*
     * Evidence Ledger
     */

    const ledger =
      buildEvidenceLedger(
        latestResult,
      );


    addResearchMemory(
      "evidence_ledger",
      JSON.stringify(
        ledger,
        null,
        2,
      ),
      "research",
      "high",
    );


    /*
     * Research rationale
     */

    const rationale =
      buildResearchRationale(
        latestResult,
      );


    addResearchMemory(
      "research_rationale",
      JSON.stringify(
        rationale,
        null,
        2,
      ),
      "research",
      "normal",
    );


    /*
     * Visualization data
     */

    buildVisualizationData(
      latestResult,
    );


    renderLatestResult(
      latestResult,
    );


    setProgress(
      85,
      "研究結果を保存しました...",
    );


    showStatus(
      "研究結果を保存しました。",
      "success",
    );


    await loadHistory();


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


    /*
     * ○だった場合は重要研究として保存。
     */

    const overall =
      evaluation?.overall;


    const symbol =
      evaluation?.overall_symbol;


    if (
      overall === "good" ||
      symbol === "○"
    ) {

      saveImportantResearch(
        latestResult,
      );


      addResearchMemory(
        "successful_research",
        [

          latestResult.title,

          latestResult.hypothesis ||
          "",

          evaluation?.reason ||
          "",

        ]
          .filter(Boolean)
          .join("\n\n"),
        "evaluation",
        "high",
      );

    }


    /*
     * ×の場合も研究失敗としてMemoryに残す。
     */

    if (
      overall === "bad" ||
      symbol === "×"
    ) {

      addResearchMemory(
        "rejected_or_contradicted",
        [

          latestResult.title,

          latestResult.hypothesis ||
          "",

          evaluation?.reason ||
          "",

        ]
          .filter(Boolean)
          .join("\n\n"),
        "evaluation",
        "high",
      );

    }


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


              buildVisualizationData(
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


  const isSaved =
    savedResearch.some(
      item =>
        item.id === result.id,
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

            ${
              isSaved
                ? " ⭐"
                : ""
            }

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
    `symbol ${statusClass(
      status,
    )}`;


  latestSummary.textContent =
    result.description ||
    "研究結果が保存されています。";


  latestMeta.innerHTML =
    "";


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
        result.evidence.confidence *
        100,
      )}%`,
    );

  }


  /*
   * 保存済み表示
   */

  if (
    savedResearch.some(
      item =>
        item.id === result.id,
    )
  ) {

    addTag(
      latestMeta,
      "⭐ 保存済み研究",
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


  /*
   * 数学モデルデータ更新
   */

  buildVisualizationData(
    result,
  );

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
   OPTIONAL DIRECTION INPUT
========================================================== */

if (
  optionalDOM.directionInput
) {

  optionalDOM.directionInput.value =
    currentResearchDirection;


  optionalDOM.directionInput.addEventListener(
    "change",
    event => {

      setResearchDirection(
        event.target.value,
      );

    },
  );

}


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
   PUBLIC RESEARCH API
========================================================== */

/*
 * 将来のUIから呼べるようにする。
 *
 * 例：
 *
 * window.RiemannLab.saveMemory(...)
 * window.RiemannLab.getSavedResearch()
 * window.RiemannLab.createHypothesis(...)
 */

window.RiemannLab = {

  getMemory() {

    return [
      ...researchMemory,
    ];

  },


  addMemory(
    type,
    content,
    source = "user",
    importance = "normal",
  ) {

    addResearchMemory(
      type,
      content,
      source,
      importance,
    );

  },


  getSavedResearch() {

    return [
      ...savedResearch,
    ];

  },


  removeSavedResearch(
    id,
  ) {

    removeSavedResearch(
      id,
    );

  },


  getChatMessages() {

    return [
      ...chatMessages,
    ];

  },


  getCurrentHypothesis() {

    return currentHypothesis;

  },


  getVisualizationData() {

    return currentVisualization;

  },


  getResearchDirection() {

    return currentResearchDirection;

  },


  setResearchDirection(
    direction,
  ) {

    setResearchDirection(
      direction,
    );

  },


  createExperimentJob(
    payload,
  ) {

    const jobs =
      JSON.parse(
        localStorage.getItem(
          STORAGE_KEYS.experiments,
        ) || "[]",
      );


    const job = {

      id:
        `EXP-${Date.now()}`,

      status:
        "QUEUED",

      payload,

      created_at:
        new Date().toISOString(),

    };


    jobs.unshift(
      job,
    );


    localStorage.setItem(
      STORAGE_KEYS.experiments,
      JSON.stringify(
        jobs,
      ),
    );


    return job;

  },

};


/* ==========================================================
   INITIALIZE
========================================================== */

async function initialize() {

  try {

    checkRequiredElements();


    loadLocalState();


    console.log(
      "================================",
    );


    console.log(
      "Riemann Research Lab initialized",
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
      "Chat messages:",
      chatMessages.length,
    );


    console.log(
      "Research memory:",
      researchMemory.length,
    );


    console.log(
      "Saved research:",
      savedResearch.length,
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
      formatError(
        error,
      ),
      "error",
    );

  }

}


/* ==========================================================
   START
========================================================== */

initialize();
