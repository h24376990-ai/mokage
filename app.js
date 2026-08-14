/* =========================================================
   Research AI Lab
   app.js
   Supabase connected version
   ========================================================= */


/* =========================================================
   1. SUPABASE CONFIG
   ========================================================= */

const SUPABASE_URL =
    "https://hiefdcodifkfhnqvruzn.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_HmcPY6BGvUQTPESGHVe7Hw_W4NlTPqj";


/* =========================================================
   2. SUPABASE CLIENT
   ========================================================= */

let supabaseClient = null;


/* =========================================================
   3. APPLICATION STATE
   ========================================================= */

const state = {

    project: null,

    results: [],

    hypotheses: [],

    routes: [],

    memory: [],

    jobs: [],

    conversations: [],

    messages: [],

    sources: [],

    events: [],

    currentPage: "research",

    connected: false

};


/* =========================================================
   4. START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeApp
);


async function initializeApp() {

    console.log(
        "Research AI Lab starting..."
    );


    initializeNavigation();

    initializeButtons();

    initializeModals();

    initializeSupabase();

}


/* =========================================================
   5. SUPABASE INITIALIZATION
   ========================================================= */

function initializeSupabase() {

    const status =
        document.getElementById(
            "connectionStatus"
        );


    try {

        if (
            !window.supabase ||
            !window.supabase.createClient
        ) {

            throw new Error(
                "Supabase SDKが読み込まれていません。"
            );

        }


        supabaseClient =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_KEY
            );


        state.connected = true;


        if (status) {

            status.textContent =
                "● Supabase 接続中";

        }


        loadApplication();


    } catch (error) {

        console.error(
            "Supabase initialization failed:",
            error
        );


        state.connected = false;


        if (status) {

            status.textContent =
                "● Supabase 接続エラー";

        }

    }

}


/* =========================================================
   6. LOAD EVERYTHING
   ========================================================= */

async function loadApplication() {

    try {

        await loadProject();


        if (!state.project) {

            showConnectionError(
                "research_projects に研究プロジェクトがありません。"
            );

            return;

        }


        await Promise.all([

            loadResults(),

            loadHypotheses(),

            loadRoutes(),

            loadMemory(),

            loadJobs()

        ]);


        updateStatistics();


        const status =
            document.getElementById(
                "connectionStatus"
            );


        if (status) {

            status.textContent =
                "● Supabase 接続済み";

        }


        console.log(
            "Research AI Lab loaded successfully."
        );


    } catch (error) {

        console.error(
            "Application loading error:",
            error
        );


        showConnectionError(
            "Supabaseからデータを読み込めませんでした。"
        );

    }

}


/* =========================================================
   7. PROJECT
   ========================================================= */

async function loadProject() {

    const {
        data,
        error
    } = await supabaseClient

        .from("research_projects")

        .select("*")

        .order(
            "created_at",
            {
                ascending: true
            }
        )

        .limit(1);


    if (error) {

        console.error(
            "Project loading error:",
            error
        );

        throw error;

    }


    state.project =
        data && data.length
            ? data[0]
            : null;


    console.log(
        "Current project:",
        state.project
    );

}


/* =========================================================
   8. RESULTS
   ========================================================= */

async function loadResults() {

    if (!state.project) return;


    const {
        data,
        error
    } = await supabaseClient

        .from("research_results")

        .select("*")

        .eq(
            "project_id",
            state.project.id
        )

        .order(
            "created_at",
            {
                ascending: false
            }
        )

        .limit(100);


    if (error) {

        console.error(
            "Results error:",
            error
        );

        return;

    }


    state.results =
        data || [];


    renderResults();

}


function renderResults() {

    const container =
        document.getElementById(
            "results"
        );


    if (!container) return;


    if (!state.results.length) {

        container.innerHTML = `

            <div class="empty">

                まだ研究結果はありません。

                <br><br>

                AIによる仮説検証や計算結果が
                ここに保存されます。

            </div>

        `;

        return;

    }


    container.innerHTML =
        state.results
            .map(createResultHTML)
            .join("");


    container
        .querySelectorAll(
            "[data-result-id]"
        )
        .forEach(element => {

            element.addEventListener(
                "click",
                () => {

                    openResultDetail(
                        element.dataset.resultId
                    );

                }
            );

        });

}


function createResultHTML(result) {

    const status =
        normalizeStatus(
            result.status
        );


    return `

        <div
            class="result-card ${getStatusClass(status)}"
            data-result-id="${escapeHTML(result.id)}"
            style="cursor:pointer;"
        >

            <div
                style="
                    display:flex;
                    align-items:flex-start;
                    gap:14px;
                "
            >

                <div
                    style="
                        font-size:31px;
                        min-width:35px;
                        line-height:1;
                    "
                >
                    ${getStatusSymbol(status)}
                </div>


                <div style="flex:1;">

                    <div
                        style="
                            font-weight:700;
                            color:#edf1f8;
                            margin-bottom:6px;
                        "
                    >
                        ${escapeHTML(
                            result.title ||
                            "無題の研究結果"
                        )}
                    </div>


                    <div
                        style="
                            color:#8c98b1;
                            font-size:13px;
                            line-height:1.65;
                        "
                    >
                        ${escapeHTML(
                            truncate(
                                result.description ||
                                "説明なし",
                                220
                            )
                        )}
                    </div>

                </div>

            </div>


            <div
                style="
                    margin-top:12px;
                    color:#5e6b86;
                    font-size:11px;
                "
            >
                ${formatDate(
                    result.created_at
                )}
            </div>

        </div>

    `;

}


/* =========================================================
   9. RESULT DETAIL
   ========================================================= */

function openResultDetail(id) {

    const result =
        state.results.find(
            item => item.id === id
        );


    if (!result) return;


    const modal =
        document.getElementById(
            "modal"
        );


    const content =
        document.getElementById(
            "modalContent"
        );


    if (!modal || !content) return;


    const status =
        normalizeStatus(
            result.status
        );


    content.innerHTML = `

        <button
            class="close"
            type="button"
            onclick="closeModal()"
        >
            ×
        </button>


        <div
            style="
                font-size:45px;
                margin-bottom:5px;
            "
        >
            ${getStatusSymbol(status)}
        </div>


        <h2>
            ${escapeHTML(
                result.title ||
                "無題の研究結果"
            )}
        </h2>


        <div class="detail-block">

            <div class="detail-label">
                判定
            </div>

            ${getStatusText(status)}

        </div>


        <div class="detail-block">

            <div class="detail-label">
                概要
            </div>

            ${escapeHTML(
                result.description ||
                "記録なし"
            )}

        </div>


        <div class="detail-block">

            <div class="detail-label">
                仮説
            </div>

            ${escapeHTML(
                result.hypothesis ||
                "記録なし"
            )}

        </div>


        <div class="detail-block">

            <div class="detail-label">
                計算
            </div>

            <pre>${escapeHTML(
                result.calculation ||
                "計算記録なし"
            )}</pre>

        </div>


        <div class="detail-block">

            <div class="detail-label">
                検証
            </div>

            ${escapeHTML(
                result.verification ||
                "検証記録なし"
            )}

        </div>


        <div class="detail-block">

            <div class="detail-label">
                次の探索
            </div>

            ${escapeHTML(
                result.next_action ||
                "未設定"
            )}

        </div>


        <div class="detail-block">

            <div class="detail-label">
                保存日時
            </div>

            ${formatDate(
                result.created_at
            )}

        </div>

    `;


    modal.classList.add(
        "active"
    );

}


/* =========================================================
   10. HYPOTHESES
   ========================================================= */

async function loadHypotheses() {

    if (!state.project) return;


    const {
        data,
        error
    } = await supabaseClient

        .from("hypotheses")

        .select("*")

        .eq(
            "project_id",
            state.project.id
        )

        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "Hypotheses error:",
            error
        );

        return;

    }


    state.hypotheses =
        data || [];


    renderHypotheses();

}


function renderHypotheses() {

    const container =
        document.getElementById(
            "hypotheses"
        );


    if (!container) return;


    if (!state.hypotheses.length) {

        container.innerHTML = `

            <div class="empty">

                仮説はまだありません。

                <br>

                「＋ 仮説を作る」から追加できます。

            </div>

        `;

        return;

    }


    container.innerHTML =
        state.hypotheses
            .map(
                hypothesis => `

                    <div class="result-card">

                        <div
                            style="
                                display:flex;
                                justify-content:space-between;
                                gap:20px;
                            "
                        >

                            <div>

                                <div
                                    style="
                                        color:#71809e;
                                        font-size:11px;
                                        margin-bottom:5px;
                                    "
                                >
                                    ${escapeHTML(
                                        hypothesis.code ||
                                        ""
                                    )}
                                </div>


                                <div
                                    style="
                                        color:#edf1f8;
                                        font-weight:700;
                                        margin-bottom:7px;
                                    "
                                >
                                    ${escapeHTML(
                                        hypothesis.title ||
                                        "無題の仮説"
                                    )}
                                </div>


                                <div
                                    style="
                                        color:#929db6;
                                        font-size:13px;
                                        line-height:1.65;
                                    "
                                >
                                    ${escapeHTML(
                                        hypothesis.statement ||
                                        ""
                                    )}
                                </div>

                            </div>


                            <div
                                style="
                                    font-size:24px;
                                "
                            >
                                ${getStatusSymbol(
                                    normalizeStatus(
                                        hypothesis.status
                                    )
                                )}
                            </div>

                        </div>

                    </div>

                `
            )
            .join("");

}


/* =========================================================
   11. CREATE HYPOTHESIS
   ========================================================= */

async function createHypothesis() {

    if (!state.project) {

        alert(
            "研究プロジェクトがありません。"
        );

        return;

    }


    const title =
        document
            .getElementById(
                "hypothesisTitle"
            )
            ?.value
            .trim();


    const statement =
        document
            .getElementById(
                "hypothesisStatement"
            )
            ?.value
            .trim();


    if (!title || !statement) {

        alert(
            "仮説名と命題を入力してください。"
        );

        return;

    }


    const code =
        "H-" +
        String(
            state.hypotheses.length + 1
        ).padStart(
            4,
            "0"
        );


    const {
        data,
        error
    } = await supabaseClient

        .from("hypotheses")

        .insert({

            project_id:
                state.project.id,

            code,

            title,

            statement,

            status:
                "unknown"

        })

        .select()
        .single();


    if (error) {

        console.error(
            "Hypothesis insert error:",
            error
        );

        alert(
            "仮説の保存に失敗しました。\n\n" +
            error.message
        );

        return;

    }


    state.hypotheses.unshift(
        data
    );


    renderHypotheses();

    updateStatistics();

    closeHypothesisModal();


    const titleInput =
        document.getElementById(
            "hypothesisTitle"
        );


    const statementInput =
        document.getElementById(
            "hypothesisStatement"
        );


    if (titleInput)
        titleInput.value = "";


    if (statementInput)
        statementInput.value = "";


    console.log(
        "Hypothesis saved:",
        data
    );

}


/* =========================================================
   12. MEMORY
   ========================================================= */

async function loadMemory() {

    if (!state.project) return;


    const {
        data,
        error
    } = await supabaseClient

        .from("research_memory")

        .select("*")

        .eq(
            "project_id",
            state.project.id
        )

        .order(
            "importance",
            {
                ascending: false
            }
        )

        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "Memory error:",
            error
        );

        return;

    }


    state.memory =
        data || [];


    renderMemory();

}


function renderMemory() {

    const container =
        document.getElementById(
            "memory"
        );


    if (!container) return;


    if (!state.memory.length) {

        container.innerHTML = `

            <div class="empty">

                研究記憶はまだありません。

                <br><br>

                AIが研究を進めると、
                重要な発見・失敗・反例などが
                ここに保存されます。

            </div>

        `;

        return;

    }


    container.innerHTML =
        state.memory
            .map(
                memory => `

                    <div class="result-card">

                        <div
                            style="
                                display:flex;
                                justify-content:space-between;
                                gap:15px;
                            "
                        >

                            <div>

                                <div
                                    style="
                                        color:#71809e;
                                        font-size:11px;
                                        margin-bottom:5px;
                                    "
                                >
                                    ${escapeHTML(
                                        memory.memory_type ||
                                        "memory"
                                    )}
                                </div>


                                <div
                                    style="
                                        color:#edf1f8;
                                        font-weight:700;
                                        margin-bottom:7px;
                                    "
                                >
                                    ${escapeHTML(
                                        memory.title ||
                                        "無題"
                                    )}
                                </div>


                                <div
                                    style="
                                        color:#929db6;
                                        font-size:13px;
                                        line-height:1.65;
                                    "
                                >
                                    ${escapeHTML(
                                        memory.content ||
                                        ""
                                    )}
                                </div>

                            </div>


                            <div
                                style="
                                    color:#aab5cb;
                                    font-size:11px;
                                    white-space:nowrap;
                                "
                            >
                                P${escapeHTML(
                                    memory.importance ??
                                    0
                                )}

                            </div>

                        </div>

                    </div>

                `
            )
            .join("");

}


/* =========================================================
   13. ROUTES
   ========================================================= */

async function loadRoutes() {

    if (!state.project) return;


    const {
        data,
        error
    } = await supabaseClient

        .from("exploration_routes")

        .select("*")

        .eq(
            "project_id",
            state.project.id
        )

        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "Routes error:",
            error
        );

        return;

    }


    state.routes =
        data || [];


    renderRoutes();

}


function renderRoutes() {

    const container =
        document.getElementById(
            "routes"
        );


    if (!container) return;


    if (!state.routes.length) {

        container.innerHTML = `

            <div class="empty">

                探索ルートはまだありません。

            </div>

        `;

        return;

    }


    container.innerHTML =
        state.routes
            .map(
                route => {

                    const banned =
                        route.status ===
                        "banned";


                    return `

                        <div class="result-card">

                            <div
                                style="
                                    display:flex;
                                    justify-content:space-between;
                                    gap:20px;
                                "
                            >

                                <div>

                                    <div
                                        style="
                                            color:#edf1f8;
                                            font-weight:700;
                                            margin-bottom:6px;
                                        "
                                    >
                                        ${escapeHTML(
                                            route.name ||
                                            "無名ルート"
                                        )}
                                    </div>


                                    <div
                                        style="
                                            color:#8995ae;
                                            font-size:13px;
                                        "
                                    >
                                        ${escapeHTML(
                                            route.description ||
                                            ""
                                        )}
                                    </div>

                                </div>


                                <div
                                    style="
                                        text-align:right;
                                        white-space:nowrap;
                                    "
                                >

                                    <div>
                                        ${escapeHTML(
                                            route.attempts ??
                                            0
                                        )}
                                        / 3
                                    </div>


                                    <div
                                        style="
                                            color:
                                            ${
                                                banned
                                                    ? "#dc7582"
                                                    : "#8390aa"
                                            };
                                            font-size:11px;
                                            margin-top:4px;
                                        "
                                    >

                                        ${
                                            banned
                                                ? "× 封印"
                                                : "使用可能"
                                        }

                                    </div>

                                </div>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   14. CALCULATION JOBS
   ========================================================= */

async function loadJobs() {

    if (!state.project) return;


    const {
        data,
        error
    } = await supabaseClient

        .from("calculation_jobs")

        .select("*")

        .eq(
            "project_id",
            state.project.id
        )

        .order(
            "created_at",
            {
                ascending: false
            }
        )

        .limit(100);


    if (error) {

        console.error(
            "Jobs error:",
            error
        );

        return;

    }


    state.jobs =
        data || [];


    renderJobs();

}


function renderJobs() {

    const container =
        document.getElementById(
            "jobs"
        );


    if (!container) return;


    if (!state.jobs.length) {

        container.innerHTML = `

            <div class="empty">

                計算ジョブはありません。

                <br><br>

                「▶ 計算を開始」から
                ジョブを作成できます。

            </div>

        `;

        return;

    }


    container.innerHTML =
        state.jobs
            .map(
                job => {

                    const progress =
                        Math.max(
                            0,
                            Math.min(
                                100,
                                Number(
                                    job.progress || 0
                                )
                            )
                        );


                    return `

                        <div class="result-card">

                            <div
                                style="
                                    display:flex;
                                    justify-content:space-between;
                                    gap:15px;
                                "
                            >

                                <div>

                                    <div
                                        style="
                                            font-weight:700;
                                            color:#edf1f8;
                                        "
                                    >
                                        ${escapeHTML(
                                            job.job_type ||
                                            "計算"
                                        )}
                                    </div>


                                    <div
                                        style="
                                            color:#7f8ca7;
                                            font-size:12px;
                                            margin-top:5px;
                                        "
                                    >
                                        ${escapeHTML(
                                            job.status ||
                                            "unknown"
                                        )}
                                    </div>

                                </div>


                                <div>
                                    ${progress}%
                                </div>

                            </div>


                            <div
                                style="
                                    height:5px;
                                    margin-top:12px;
                                    background:#192238;
                                    border-radius:20px;
                                    overflow:hidden;
                                "
                            >

                                <div
                                    style="
                                        width:${progress}%;
                                        height:100%;
                                        background:#718cff;
                                    "
                                ></div>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   15. CREATE CALCULATION JOB
   ========================================================= */

async function createCalculationJob() {

    if (!state.project) {

        alert(
            "研究プロジェクトがありません。"
        );

        return;

    }


    const {
        data,
        error
    } = await supabaseClient

        .from("calculation_jobs")

        .insert({

            project_id:
                state.project.id,

            job_type:
                "exploration",

            parameters: {

                mode:
                    "experimental",

                source:
                    "Research AI Lab"

            },

            status:
                "queued",

            progress:
                0

        })

        .select()
        .single();


    if (error) {

        console.error(
            "Job creation error:",
            error
        );

        alert(
            "計算ジョブの作成に失敗しました。\n\n" +
            error.message
        );

        return;

    }


    state.jobs.unshift(
        data
    );


    renderJobs();


    /*
       現在はDBへのジョブ登録まで。

       本物の計算は次の段階で

       calculation_jobs
              ↓
       Worker
              ↓
       Python / 数式エンジン
              ↓
       結果検証
              ↓
       research_results

       にする。
    */


    console.log(
        "Calculation job created:",
        data
    );

}


/* =========================================================
   16. CHAT
   ========================================================= */

async function sendMessage() {

    const input =
        document.getElementById(
            "chatInput"
        );


    if (!input) return;


    const content =
        input.value.trim();


    if (!content) return;


    addChatMessage(
        "user",
        content
    );


    input.value = "";


    /*
       Claude APIはまだ接続していない。

       APIキーをブラウザへ直接置かず、

       Browser
           ↓
       Server / Edge Function
           ↓
       Claude
           ↓
       Research Memory
           ↓
       Response

       にする。
    */


    addChatMessage(
        "assistant",
        "メッセージを受け取りました。現在はClaude API接続前の段階です。研究記憶・仮説・過去の探索結果をAIへ渡す機構を次に実装します。"
    );

}


/* =========================================================
   17. CHAT UI
   ========================================================= */

function addChatMessage(
    role,
    content
) {

    const container =
        document.getElementById(
            "chatMessages"
        );


    if (!container) return;


    const message =
        document.createElement(
            "div"
        );


    message.className =
        role === "user"
            ? "message user"
            : "message ai";


    message.innerHTML = `

        <div class="message-label">

            ${
                role === "user"
                    ? "あなた"
                    : "研究AI"
            }

        </div>


        <div>

            ${escapeHTML(content)}

        </div>

    `;


    container.appendChild(
        message
    );


    container.scrollTop =
        container.scrollHeight;


    state.messages.push({

        role,

        content,

        created_at:
            new Date().toISOString()

    });

}


/* =========================================================
   18. NAVIGATION
   ========================================================= */

function initializeNavigation() {

    document
        .querySelectorAll(
            ".nav-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    switchPage(
                        button.dataset.page
                    );

                }
            );

        });

}


function switchPage(page) {

    state.currentPage =
        page;


    document
        .querySelectorAll(
            ".nav-button"
        )
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.page ===
                page
            );

        });


    document
        .querySelectorAll(
            ".page"
        )
        .forEach(section => {

            section.classList.toggle(
                "active",
                section.id ===
                `page-${page}`
            );

        });

}


/* =========================================================
   19. BUTTONS
   ========================================================= */

function initializeButtons() {

    const send =
        document.getElementById(
            "sendMessageButton"
        );


    if (send) {

        send.addEventListener(
            "click",
            sendMessage
        );

    }


    const input =
        document.getElementById(
            "chatInput"
        );


    if (input) {

        input.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Enter"
                ) {

                    sendMessage();

                }

            }
        );

    }


    const newHypothesis =
        document.getElementById(
            "newHypothesisButton"
        );


    if (newHypothesis) {

        newHypothesis.addEventListener(
            "click",
            openHypothesisModal
        );

    }


    const saveHypothesis =
        document.getElementById(
            "saveHypothesisButton"
        );


    if (saveHypothesis) {

        saveHypothesis.addEventListener(
            "click",
            createHypothesis
        );

    }


    const closeHypothesis =
        document.getElementById(
            "closeHypothesisModal"
        );


    if (closeHypothesis) {

        closeHypothesis.addEventListener(
            "click",
            closeHypothesisModal
        );

    }


    const calculation =
        document.getElementById(
            "startCalculationButton"
        );


    if (calculation) {

        calculation.addEventListener(
            "click",
            createCalculationJob
        );

    }

}


/* =========================================================
   20. MODALS
   ========================================================= */

function initializeModals() {

    const modal =
        document.getElementById(
            "modal"
        );


    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target === modal
                ) {

                    closeModal();

                }

            }
        );

    }


    const hypothesisModal =
        document.getElementById(
            "hypothesisModal"
        );


    if (hypothesisModal) {

        hypothesisModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    hypothesisModal
                ) {

                    closeHypothesisModal();

                }

            }
        );

    }

}


function closeModal() {

    const modal =
        document.getElementById(
            "modal"
        );


    if (modal) {

        modal.classList.remove(
            "active"
        );

    }

}


function openHypothesisModal() {

    const modal =
        document.getElementById(
            "hypothesisModal"
        );


    if (modal) {

        modal.classList.add(
            "active"
        );

    }

}


function closeHypothesisModal() {

    const modal =
        document.getElementById(
            "hypothesisModal"
        );


    if (modal) {

        modal.classList.remove(
            "active"
        );

    }

}


/* =========================================================
   21. STATISTICS
   ========================================================= */

function updateStatistics() {

    const results =
        document.getElementById(
            "stat-results"
        );


    const hypotheses =
        document.getElementById(
            "stat-hypotheses"
        );


    const banned =
        document.getElementById(
            "stat-banned"
        );


    if (results) {

        results.textContent =
            state.results.length;

    }


    if (hypotheses) {

        hypotheses.textContent =
            state.hypotheses.filter(
                hypothesis => {

                    const status =
                        normalizeStatus(
                            hypothesis.status
                        );

                    return (
                        status ===
                        "maybe"
                    ) || (
                        status ===
                        "unknown"
                    );

                }
            ).length;

    }


    if (banned) {

        banned.textContent =
            state.routes.filter(
                route =>
                    route.status ===
                    "banned"
            ).length;

    }

}


/* =========================================================
   22. STATUS
   ========================================================= */

function normalizeStatus(
    status
) {

    if (
        status === "good" ||
        status === "supported"
    ) {

        return "good";

    }


    if (
        status === "maybe" ||
        status === "uncertain"
    ) {

        return "maybe";

    }


    if (
        status === "bad" ||
        status === "rejected"
    ) {

        return "bad";

    }


    return "unknown";

}


function getStatusSymbol(
    status
) {

    switch (status) {

        case "good":
            return "○";

        case "maybe":
            return "△";

        case "bad":
            return "×";

        default:
            return "?";

    }

}


function getStatusClass(
    status
) {

    switch (status) {

        case "good":
            return "result-good";

        case "maybe":
            return "result-maybe";

        case "bad":
            return "result-bad";

        default:
            return "result-unknown";

    }

}


function getStatusText(
    status
) {

    switch (status) {

        case "good":
            return "○ 支持";

        case "maybe":
            return "△ 未確定";

        case "bad":
            return "× 棄却";

        default:
            return "? 未判定";

    }

}


/* =========================================================
   23. ERROR DISPLAY
   ========================================================= */

function showConnectionError(
    message
) {

    console.warn(
        message
    );


    const status =
        document.getElementById(
            "connectionStatus"
        );


    if (status) {

        status.textContent =
            "● データ接続確認中";

    }

}


/* =========================================================
   24. UTILITIES
   ========================================================= */

function escapeHTML(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

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


function truncate(
    text,
    length
) {

    if (!text) return "";


    const value =
        String(text);


    if (
        value.length <= length
    ) {

        return value;

    }


    return (
        value.slice(
            0,
            length
        ) +
        "..."
    );

}


function formatDate(
    value
) {

    if (!value) {

        return "日時不明";

    }


    try {

        return new Date(
            value
        ).toLocaleString(
            "ja-JP"
        );

    } catch {

        return String(value);

    }

}


/* =========================================================
   25. GLOBAL DEBUG API
   ========================================================= */

window.ResearchLab = {

    state,

    reload:
        loadApplication,

    loadProject,

    loadResults,

    loadHypotheses,

    loadMemory,

    loadRoutes,

    loadJobs,

    createHypothesis,

    createCalculationJob

};


window.closeModal =
    closeModal;


window.openHypothesisModal =
    openHypothesisModal;


window.closeHypothesisModal =
    closeHypothesisModal;


console.log(
    "Research AI Lab initialized."
);
