/* =========================================================
   Research AI Lab
   app.js
   ========================================================= */


/* =========================================================
   1. CONFIGURATION
   ========================================================= */

const SUPABASE_URL = "ここにSupabase URL";
const SUPABASE_KEY = "ここにPublishable key";


/* =========================================================
   2. SUPABASE
   ========================================================= */

let supabaseClient = null;

let currentProject = null;

let currentConversation = null;


/* =========================================================
   3. APPLICATION STATE
   ========================================================= */

const state = {

    results: [],

    hypotheses: [],

    routes: [],

    memory: [],

    jobs: [],

    messages: [],

    sources: [],

    events: [],

    currentPage: "research",

    loading: false

};


/* =========================================================
   4. INITIALIZE
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    initializeNavigation();

    initializeButtons();

    initializeModal();

    initializeSupabase();

});


/* =========================================================
   5. SUPABASE INITIALIZATION
   ========================================================= */

function initializeSupabase() {

    const status =
        document.getElementById("connectionStatus");


    if (
        !SUPABASE_URL ||
        SUPABASE_URL.includes("ここに")
    ) {

        if (status) {

            status.textContent =
                "● Supabase API設定待ち";

        }

        console.warn(
            "Supabase URL / Key が設定されていません。"
        );

        renderEmptyState();

        return;

    }


    if (
        !SUPABASE_KEY ||
        SUPABASE_KEY.includes("ここに")
    ) {

        if (status) {

            status.textContent =
                "● Supabase API設定待ち";

        }

        console.warn(
            "Supabase Key が設定されていません。"
        );

        renderEmptyState();

        return;

    }


    try {

        supabaseClient =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_KEY
            );


        if (status) {

            status.textContent =
                "● Supabase 接続中";

        }


        loadApplication();


    } catch (error) {

        console.error(
            "Supabase initialization error:",
            error
        );


        if (status) {

            status.textContent =
                "● Supabase 接続エラー";

        }

    }

}


/* =========================================================
   6. LOAD APPLICATION
   ========================================================= */

async function loadApplication() {

    try {

        await loadProject();

        if (!currentProject) {

            console.warn(
                "研究プロジェクトが見つかりません。"
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


    } catch (error) {

        console.error(
            "Application loading error:",
            error
        );


        const status =
            document.getElementById(
                "connectionStatus"
            );


        if (status) {

            status.textContent =
                "● データ読み込みエラー";

        }

    }

}


/* =========================================================
   7. LOAD PROJECT
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

        throw error;

    }


    currentProject =
        data && data.length
            ? data[0]
            : null;

}


/* =========================================================
   8. RESULTS
   ========================================================= */

async function loadResults() {

    if (!currentProject) return;


    const {
        data,
        error
    } = await supabaseClient

        .from("research_results")

        .select("*")

        .eq(
            "project_id",
            currentProject.id
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
            "Results loading error:",
            error
        );

        return;

    }


    state.results = data || [];


    renderResults();

}


function renderResults() {

    const container =
        document.getElementById("results");


    if (!container) return;


    if (!state.results.length) {

        container.innerHTML = `

            <div class="empty">

                まだ研究結果はありません。

                <br><br>

                AIまたは計算エンジンによる
                最初の研究結果がここに保存されます。

            </div>

        `;

        return;

    }


    container.innerHTML =
        state.results
            .map(result =>
                createResultHTML(result)
            )
            .join("");


    container
        .querySelectorAll("[data-result-id]")
        .forEach(element => {

            element.addEventListener(
                "click",
                () => {

                    const id =
                        element.dataset.resultId;

                    openResultDetail(id);

                }
            );

        });

}


function createResultHTML(result) {

    const status =
        normalizeResultStatus(
            result.status
        );


    const symbol =
        getStatusSymbol(status);


    const className =
        getStatusClass(status);


    return `

        <div
            class="result-card ${className}"
            data-result-id="${escapeHTML(result.id)}"
            style="cursor:pointer;"
        >

            <div
                style="
                    display:flex;
                    align-items:center;
                    gap:14px;
                "
            >

                <div
                    style="
                        font-size:30px;
                        min-width:36px;
                    "
                >
                    ${symbol}
                </div>


                <div
                    style="
                        flex:1;
                    "
                >

                    <div
                        style="
                            font-weight:700;
                            margin-bottom:5px;
                        "
                    >
                        ${escapeHTML(
                            result.title ||
                            "無題の研究結果"
                        )}
                    </div>


                    <div
                        style="
                            color:#8d99b5;
                            font-size:13px;
                            line-height:1.6;
                        "
                    >
                        ${escapeHTML(
                            truncate(
                                result.description ||
                                "説明なし",
                                180
                            )
                        )}
                    </div>

                </div>

            </div>


            <div
                style="
                    margin-top:12px;
                    color:#66728f;
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


function normalizeResultStatus(status) {

    if (
        status === "good" ||
        status === "supported"
    ) return "good";


    if (
        status === "maybe" ||
        status === "uncertain"
    ) return "maybe";


    if (
        status === "bad" ||
        status === "rejected"
    ) return "bad";


    return "unknown";

}


function getStatusSymbol(status) {

    if (status === "good")
        return "○";

    if (status === "maybe")
        return "△";

    if (status === "bad")
        return "×";

    return "?";

}


function getStatusClass(status) {

    if (status === "good")
        return "result-good";

    if (status === "maybe")
        return "result-maybe";

    if (status === "bad")
        return "result-bad";

    return "result-unknown";

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
        document.getElementById("modal");


    const content =
        document.getElementById(
            "modalContent"
        );


    if (!modal || !content) return;


    const status =
        normalizeResultStatus(
            result.status
        );


    content.innerHTML = `

        <button
            class="close"
            onclick="closeModal()"
        >
            ×
        </button>


        <div
            style="
                font-size:42px;
                margin-bottom:10px;
            "
        >
            ${getStatusSymbol(status)}
        </div>


        <h2>
            ${escapeHTML(
                result.title ||
                "無題"
            )}
        </h2>


        <div
            class="detail-block"
        >

            <div class="detail-label">
                判定
            </div>

            ${getStatusText(status)}

        </div>


        <div
            class="detail-block"
        >

            <div class="detail-label">
                概要
            </div>

            ${escapeHTML(
                result.description ||
                "記録なし"
            )}

        </div>


        <div
            class="detail-block"
        >

            <div class="detail-label">
                仮説
            </div>

            ${escapeHTML(
                result.hypothesis ||
                "記録なし"
            )}

        </div>


        <div
            class="detail-block"
        >

            <div class="detail-label">
                計算
            </div>

            <pre
                style="
                    white-space:pre-wrap;
                    overflow-wrap:anywhere;
                "
            >${escapeHTML(
                result.calculation ||
                "計算記録なし"
            )}</pre>

        </div>


        <div
            class="detail-block"
        >

            <div class="detail-label">
                検証
            </div>

            ${escapeHTML(
                result.verification ||
                "検証記録なし"
            )}

        </div>


        <div
            class="detail-block"
        >

            <div class="detail-label">
                次の行動
            </div>

            ${escapeHTML(
                result.next_action ||
                "未設定"
            )}

        </div>


        <div
            class="detail-block"
        >

            <div class="detail-label">
                保存日時
            </div>

            ${formatDate(
                result.created_at
            )}

        </div>

    `;


    modal.classList.add("active");

}


function getStatusText(status) {

    if (status === "good")
        return "○ 支持";

    if (status === "maybe")
        return "△ 未確定";

    if (status === "bad")
        return "× 棄却";

    return "? 未判定";

}


/* =========================================================
   10. HYPOTHESES
   ========================================================= */

async function loadHypotheses() {

    if (!currentProject) return;


    const {
        data,
        error
    } = await supabaseClient

        .from("hypotheses")

        .select("*")

        .eq(
            "project_id",
            currentProject.id
        )

        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "Hypotheses loading error:",
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

            </div>

        `;

        return;

    }


    container.innerHTML =
        state.hypotheses
            .map(hypothesis => `

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
                                    color:#7885a5;
                                    font-size:11px;
                                    margin-bottom:6px;
                                "
                            >
                                ${escapeHTML(
                                    hypothesis.code ||
                                    ""
                                )}
                            </div>


                            <div
                                style="
                                    font-weight:700;
                                    margin-bottom:8px;
                                "
                            >
                                ${escapeHTML(
                                    hypothesis.title
                                )}
                            </div>


                            <div
                                style="
                                    color:#909bb6;
                                    line-height:1.6;
                                    font-size:13px;
                                "
                            >
                                ${escapeHTML(
                                    hypothesis.statement
                                )}
                            </div>

                        </div>


                        <div>

                            ${getStatusSymbol(
                                normalizeResultStatus(
                                    hypothesis.status
                                )
                            )}

                        </div>

                    </div>

                </div>

            `)
            .join("");

}


async function createHypothesis() {

    if (!currentProject) {

        alert(
            "研究プロジェクトが読み込まれていません。"
        );

        return;

    }


    const title =
        document.getElementById(
            "hypothesisTitle"
        ).value.trim();


    const statement =
        document.getElementById(
            "hypothesisStatement"
        ).value.trim();


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
        error
    } = await supabaseClient

        .from("hypotheses")

        .insert({

            project_id:
                currentProject.id,

            code,

            title,

            statement,

            status:
                "unknown"

        });


    if (error) {

        console.error(error);

        alert(
            "仮説の保存に失敗しました。"
        );

        return;

    }


    closeHypothesisModal();


    document.getElementById(
        "hypothesisTitle"
    ).value = "";


    document.getElementById(
        "hypothesisStatement"
    ).value = "";


    await loadHypotheses();

    updateStatistics();

}


/* =========================================================
   11. MEMORY
   ========================================================= */

async function loadMemory() {

    if (!currentProject) return;


    const {
        data,
        error
    } = await supabaseClient

        .from("research_memory")

        .select("*")

        .eq(
            "project_id",
            currentProject.id
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
            "Memory loading error:",
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
                研究記憶はありません。
            </div>

        `;

        return;

    }


    container.innerHTML =
        state.memory
            .map(memory => `

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
                                    font-size:11px;
                                    color:#72809e;
                                    margin-bottom:5px;
                                "
                            >
                                ${escapeHTML(
                                    memory.memory_type
                                )}
                            </div>


                            <div
                                style="
                                    font-weight:700;
                                    margin-bottom:7px;
                                "
                            >
                                ${escapeHTML(
                                    memory.title
                                )}
                            </div>


                            <div
                                style="
                                    color:#929db6;
                                    font-size:13px;
                                    line-height:1.6;
                                "
                            >
                                ${escapeHTML(
                                    memory.content
                                )}
                            </div>

                        </div>


                        <div
                            style="
                                color:#aeb9d2;
                                font-size:11px;
                            "
                        >
                            P${memory.importance}

                        </div>

                    </div>

                </div>

            `)
            .join("");

}


/* =========================================================
   12. EXPLORATION ROUTES
   ========================================================= */

async function loadRoutes() {

    if (!currentProject) return;


    const {
        data,
        error
    } = await supabaseClient

        .from("exploration_routes")

        .select("*")

        .eq(
            "project_id",
            currentProject.id
        )

        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "Routes loading error:",
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

                探索ルートはありません。

            </div>

        `;

        return;

    }


    container.innerHTML =
        state.routes
            .map(route => {

                const banned =
                    route.status === "banned";


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
                                        margin-bottom:7px;
                                    "
                                >
                                    ${escapeHTML(
                                        route.name
                                    )}
                                </div>


                                <div
                                    style="
                                        color:#8c98b2;
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

                                    ${route.attempts}
                                    / 3

                                </div>


                                <div
                                    style="
                                        margin-top:5px;
                                        font-size:11px;
                                        color:
                                            ${banned
                                                ? "#ff7d8b"
                                                : "#8b97b1"};
                                    "
                                >

                                    ${banned
                                        ? "封印"
                                        : "使用可能"}

                                </div>

                            </div>

                        </div>

                    </div>

                `;

            })
            .join("");

}


/* =========================================================
   13. CALCULATION JOBS
   ========================================================= */

async function loadJobs() {

    if (!currentProject) return;


    const {
        data,
        error
    } = await supabaseClient

        .from("calculation_jobs")

        .select("*")

        .eq(
            "project_id",
            currentProject.id
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
            "Jobs loading error:",
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

            </div>

        `;

        return;

    }


    container.innerHTML =
        state.jobs
            .map(job => `

                <div class="result-card">

                    <div
                        style="
                            display:flex;
                            justify-content:space-between;
                        "
                    >

                        <div>

                            <div
                                style="
                                    font-weight:700;
                                "
                            >
                                ${escapeHTML(
                                    job.job_type
                                )}
                            </div>


                            <div
                                style="
                                    color:#8793ad;
                                    font-size:12px;
                                    margin-top:5px;
                                "
                            >
                                ${escapeHTML(
                                    job.status
                                )}
                            </div>

                        </div>


                        <div>

                            ${Math.round(
                                Number(
                                    job.progress || 0
                                )
                            )}%

                        </div>

                    </div>


                    <div
                        style="
                            height:5px;
                            background:#182138;
                            border-radius:10px;
                            margin-top:12px;
                            overflow:hidden;
                        "
                    >

                        <div
                            style="
                                width:${Math.max(
                                    0,
                                    Math.min(
                                        100,
                                        Number(
                                            job.progress || 0
                                        )
                                    )
                                )}%;
                                height:100%;
                                background:#718cff;
                            "
                        ></div>

                    </div>

                </div>

            `)
            .join("");

}


/* =========================================================
   14. CREATE CALCULATION JOB
   ========================================================= */

async function createCalculationJob() {

    if (!currentProject) {

        alert(
            "研究プロジェクトが読み込まれていません。"
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
                currentProject.id,

            job_type:
                "exploration",

            parameters: {

                mode:
                    "experimental",

                created_by:
                    "research_ui"

            },

            status:
                "queued",

            progress:
                0

        })

        .select()

        .single();


    if (error) {

        console.error(error);

        alert(
            "計算ジョブを作成できませんでした。"
        );

        return;

    }


    state.jobs.unshift(data);

    renderJobs();


    /*
       注意：

       ここではまだ本当の計算は実行していない。

       今後、

       Browser
          ↓
       Job Queue
          ↓
       Compute Worker
          ↓
       Python / 数式エンジン
          ↓
       Supabase

       という構造にする。
    */


    simulateJobDisplay(data.id);

}


/* =========================================================
   15. TEMPORARY JOB DISPLAY
   ========================================================= */

function simulateJobDisplay(jobId) {

    let progress = 0;


    const timer =
        setInterval(
            async () => {

                progress += 5;


                if (progress >= 100) {

                    progress = 100;

                    clearInterval(timer);

                }


                const job =
                    state.jobs.find(
                        item =>
                            item.id === jobId
                    );


                if (job) {

                    job.progress =
                        progress;

                    job.status =
                        progress >= 100
                            ? "completed"
                            : "running";

                }


                renderJobs();


                /*
                   これは仮表示。

                   実際の24時間計算では
                   この部分をサーバー側Workerに置き換える。
                */

            },

            500

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
       現在はAI API未接続。

       後で、

       Browser
          ↓
       Secure API
          ↓
       Claude
          ↓
       Research Context
          ↓
       Research Memory
          ↓
       Response

       にする。
    */


    addChatMessage(

        "assistant",

        "現在は研究AI APIが未接続です。Supabaseへの保存機能を確認後、Claude接続を追加します。"

    );

}


/* =========================================================
   17. CHAT UI
   ========================================================= */

function addChatMessage(role, content) {

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

}


/* =========================================================
   18. NAVIGATION
   ========================================================= */

function initializeNavigation() {

    const buttons =
        document.querySelectorAll(
            ".nav-button"
        );


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const page =
                    button.dataset.page;


                switchPage(page);

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
                button.dataset.page === page
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

    const sendButton =
        document.getElementById(
            "sendMessageButton"
        );


    if (sendButton) {

        sendButton.addEventListener(
            "click",
            sendMessage
        );

    }


    const chatInput =
        document.getElementById(
            "chatInput"
        );


    if (chatInput) {

        chatInput.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter"
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


    const startCalculation =
        document.getElementById(
            "startCalculationButton"
        );


    if (startCalculation) {

        startCalculation.addEventListener(
            "click",
            createCalculationJob
        );

    }

}


/* =========================================================
   20. MODALS
   ========================================================= */

function initializeModal() {

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
                item =>
                    normalizeResultStatus(
                        item.status
                    ) === "maybe" ||
                    item.status === "unknown"
            ).length;

    }


    if (banned) {

        banned.textContent =
            state.routes.filter(
                route =>
                    route.status === "banned"
            ).length;

    }

}


/* =========================================================
   22. EMPTY STATE
   ========================================================= */

function renderEmptyState() {

    const containers = [

        "results",

        "hypotheses",

        "memory",

        "routes",

        "jobs"

    ];


    containers.forEach(id => {

        const element =
            document.getElementById(id);


        if (!element) return;


        element.innerHTML = `

            <div class="empty">

                Supabase接続を設定すると
                研究データが表示されます。

            </div>

        `;

    });

}


/* =========================================================
   23. UTILITY
   ========================================================= */

function escapeHTML(value) {

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
        ) + "..."
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
   24. GLOBAL FUNCTIONS
   ========================================================= */

window.closeModal =
    closeModal;


window.openHypothesisModal =
    openHypothesisModal;


window.closeHypothesisModal =
    closeHypothesisModal;


/* =========================================================
   25. DEBUG
   ========================================================= */

window.ResearchLab = {

    state,

    getProject:
        () => currentProject,

    reload:
        loadApplication,

    loadResults,

    loadHypotheses,

    loadMemory,

    loadRoutes,

    loadJobs

};


console.log(
    "Research AI Lab initialized."
);
