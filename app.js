/* =========================================================
   Research AI Lab
   app.js
   Supabase + Hypothesis Storage
   ========================================================= */


/* =========================================================
   SUPABASE
   ========================================================= */

const SUPABASE_URL =
    "https://hiefdcodifkfhnqvruzn.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_HmcPY6BGvUQTPESGHVe7Hw_W4NlTPqj";


const PROJECT_ID =
    "4253800d-a89e-45e2-a36a-cc52eb6c510b";


let supabaseClient = null;


/* =========================================================
   STATE
   ========================================================= */

const state = {

    connected: false,

    hypotheses: [],

    results: [],

    memory: [],

    routes: [],

    jobs: []

};


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    start
);


async function start() {

    console.log(
        "Research AI Lab starting..."
    );


    setConnectionStatus(
        "● Supabase 接続確認中"
    );


    if (
        !window.supabase ||
        !window.supabase.createClient
    ) {

        setConnectionStatus(
            "× Supabase SDK読み込み失敗"
        );

        console.error(
            "Supabase SDKが読み込まれていません。"
        );

        return;
    }


    try {

        supabaseClient =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_KEY
            );

    } catch (error) {

        console.error(error);

        setConnectionStatus(
            "× Supabase Client作成失敗"
        );

        return;
    }


    await testSupabaseConnection();


    initializeNavigation();

    initializeHypothesis();

    initializeCalculation();

    initializeChat();

    initializeModal();

}


/* =========================================================
   SUPABASE CONNECTION
   ========================================================= */

async function testSupabaseConnection() {

    setConnectionStatus(
        "● Supabase DB確認中"
    );


    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("research_projects")
            .select("id")
            .eq("id", PROJECT_ID)
            .limit(1);


        if (error) {

            console.error(
                "Supabase error:",
                error
            );

            setConnectionStatus(
                "× DB接続エラー"
            );

            return;
        }


        state.connected = true;


        setConnectionStatus(
            "● Supabase 接続済み"
        );


        console.log(
            "Supabase connection successful."
        );


        if (
            !data ||
            data.length === 0
        ) {

            console.warn(
                "指定したresearch_projectsが存在しません。"
            );

        }


        await loadHypotheses();


    } catch (error) {

        console.error(
            error
        );

        setConnectionStatus(
            "× Supabase 接続失敗"
        );

    }

}


/* =========================================================
   CONNECTION STATUS
   ========================================================= */

function setConnectionStatus(text) {

    const element =
        document.getElementById(
            "connectionStatus"
        );


    if (!element) {

        console.warn(
            "connectionStatusが見つかりません。"
        );

        return;
    }


    element.textContent =
        text;

}


/* =========================================================
   HYPOTHESES
   ========================================================= */

async function loadHypotheses() {

    if (!supabaseClient) return;


    try {

        const {
            data,
            error
        } = await supabaseClient

            .from("hypotheses")

            .select(
                "id, project_id, code, title, statement, status, confidence, created_at, updated_at"
            )

            .eq(
                "project_id",
                PROJECT_ID
            )

            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (error) {

            console.error(
                "Hypothesis loading error:",
                error
            );


            showHypothesisError(
                error.message
            );


            return;
        }


        state.hypotheses =
            data || [];


        renderHypotheses();


        updateStatistics();


        console.log(
            "Loaded hypotheses:",
            state.hypotheses
        );


    } catch (error) {

        console.error(
            "Hypothesis load exception:",
            error
        );

    }

}


/* =========================================================
   RENDER HYPOTHESES
   ========================================================= */

function renderHypotheses() {

    const container =
        document.getElementById(
            "hypotheses"
        );


    if (!container) return;


    if (
        state.hypotheses.length === 0
    ) {

        container.innerHTML = `

            <div class="empty">

                仮説はまだありません。

                <br><br>

                「＋ 仮説を作る」から
                最初の仮説を登録してください。

            </div>

        `;

        return;
    }


    container.innerHTML =
        state.hypotheses
            .map(
                hypothesis => {

                    const status =
                        normalizeStatus(
                            hypothesis.status
                        );


                    const confidence =
                        hypothesis.confidence == null
                            ? "—"
                            : Number(
                                hypothesis.confidence
                              ).toFixed(2);


                    return `

                        <div
                            class="result-card"
                            data-hypothesis-id="${escapeHTML(
                                hypothesis.id
                            )}"
                            style="cursor:pointer;"
                        >

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
                                            color:#edf1f8;
                                            font-weight:700;
                                            font-size:16px;
                                        "
                                    >

                                        ${escapeHTML(
                                            hypothesis.title ||
                                            "無題の仮説"
                                        )}

                                    </div>


                                    <div
                                        style="
                                            color:#8995ae;
                                            margin-top:8px;
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
                                        font-size:28px;
                                        min-width:40px;
                                        text-align:center;
                                    "
                                >

                                    ${getStatusSymbol(
                                        status
                                    )}

                                </div>

                            </div>


                            <div
                                style="
                                    margin-top:12px;
                                    color:#7f8baa;
                                    font-size:12px;
                                "
                            >

                                信頼度：
                                ${confidence}

                            </div>

                        </div>

                    `;

                }
            )
            .join("");


    container
        .querySelectorAll(
            "[data-hypothesis-id]"
        )
        .forEach(
            element => {

                element.addEventListener(
                    "click",
                    () => {

                        openHypothesis(
                            element.dataset.hypothesisId
                        );

                    }
                );

            }
        );

}


/* =========================================================
   CREATE HYPOTHESIS
   ========================================================= */

async function createHypothesis() {

    if (!supabaseClient) {

        alert(
            "Supabaseに接続されていません。"
        );

        return;
    }


    const titleElement =
        document.getElementById(
            "hypothesisTitle"
        );


    const statementElement =
        document.getElementById(
            "hypothesisStatement"
        );


    if (
        !titleElement ||
        !statementElement
    ) {

        alert(
            "仮説入力欄が見つかりません。"
        );

        return;
    }


    const title =
        titleElement.value.trim();


    const statement =
        statementElement.value.trim();


    if (!title) {

        alert(
            "仮説名を入力してください。"
        );

        return;
    }


    if (!statement) {

        alert(
            "命題・仮説の内容を入力してください。"
        );

        return;
    }


    /*
       初期状態では、
       AIによる検証をまだしていないので
       unknown にする。

       ここで勝手に○にしない。
    */

    const status =
        "unknown";


    const confidence =
        0;


    /*
       codeには研究上の構造化データを保存する。

       将来Claudeや別AIが読むことも想定。
    */

    const codeObject = {

        version: 1,

        type: "mathematical_hypothesis",

        title: title,

        statement: statement,

        status: status,

        confidence: confidence,

        created_by: "user",

        verification: {

            mathematical_proof: null,

            numerical_test: null,

            counterexample_search: null,

            literature_check: null,

            reproducibility: null

        }

    };


    const code =
        JSON.stringify(
            codeObject,
            null,
            2
        );


    const {
        data,
        error
    } = await supabaseClient

        .from("hypotheses")

        .insert({

            project_id:
                PROJECT_ID,

            code:
                code,

            title:
                title,

            statement:
                statement,

            status:
                status,

            confidence:
                confidence

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


    console.log(
        "Hypothesis saved:",
        data
    );


    state.hypotheses.unshift(
        data
    );


    renderHypotheses();

    updateStatistics();


    titleElement.value =
        "";


    statementElement.value =
        "";


    closeHypothesisModal();


    /*
       保存成功を画面でも通知
    */

    showSaveMessage(
        "仮説をSupabaseに保存しました。"
    );

}


/* =========================================================
   HYPOTHESIS DETAIL
   ========================================================= */

function openHypothesis(id) {

    const hypothesis =
        state.hypotheses.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!hypothesis) return;


    const modal =
        document.getElementById(
            "modal"
        );


    const content =
        document.getElementById(
            "modalContent"
        );


    if (
        !modal ||
        !content
    ) return;


    let codeText =
        hypothesis.code ||
        "";


    try {

        codeText =
            JSON.stringify(
                JSON.parse(
                    hypothesis.code
                ),
                null,
                2
            );

    } catch {

        /*
           codeがJSONでなくても
           そのまま表示する。
        */

    }


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
                font-size:40px;
                margin-bottom:8px;
            "
        >

            ${getStatusSymbol(
                normalizeStatus(
                    hypothesis.status
                )
            )}

        </div>


        <h2>

            ${escapeHTML(
                hypothesis.title ||
                "無題の仮説"
            )}

        </h2>


        <div class="detail-block">

            <div class="detail-label">

                命題

            </div>


            ${escapeHTML(
                hypothesis.statement ||
                ""
            )}

        </div>


        <div class="detail-block">

            <div class="detail-label">

                判定

            </div>


            ${getStatusSymbol(
                normalizeStatus(
                    hypothesis.status
                )
            )}

            ${escapeHTML(
                hypothesis.status ||
                "unknown"
            )}

        </div>


        <div class="detail-block">

            <div class="detail-label">

                信頼度

            </div>


            ${
                hypothesis.confidence == null
                    ? "—"
                    : Number(
                        hypothesis.confidence
                      ).toFixed(2)
            }

        </div>


        <div class="detail-block">

            <div class="detail-label">

                AI・検証用データ

            </div>


            <pre
                style="
                    white-space:pre-wrap;
                    overflow:auto;
                "
            >${escapeHTML(
                codeText
            )}</pre>

        </div>


        <div class="detail-block">

            <div class="detail-label">

                作成日時

            </div>


            ${escapeHTML(
                hypothesis.created_at ||
                ""
            )}

        </div>

    `;


    modal.classList.add(
        "active"
    );

}


/* =========================================================
   STATUS
   ========================================================= */

function normalizeStatus(status) {

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


function getStatusSymbol(status) {

    if (
        status === "good"
    ) {

        return "○";
    }


    if (
        status === "maybe"
    ) {

        return "△";
    }


    if (
        status === "bad"
    ) {

        return "×";
    }


    return "?";

}


/* =========================================================
   NAVIGATION
   ========================================================= */

function initializeNavigation() {

    document
        .querySelectorAll(
            ".nav-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        switchPage(
                            button.dataset.page
                        );

                    }
                );

            }
        );

}


function switchPage(page) {

    document
        .querySelectorAll(
            ".nav-button"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.page === page
                );

            }
        );


    document
        .querySelectorAll(
            ".page"
        )
        .forEach(
            section => {

                section.classList.toggle(
                    "active",
                    section.id ===
                    `page-${page}`
                );

            }
        );

}


/* =========================================================
   HYPOTHESIS MODAL
   ========================================================= */

function initializeHypothesis() {

    const openButton =
        document.getElementById(
            "newHypothesisButton"
        );


    if (openButton) {

        openButton.addEventListener(
            "click",
            openHypothesisModal
        );

    }


    const saveButton =
        document.getElementById(
            "saveHypothesisButton"
        );


    if (saveButton) {

        saveButton.addEventListener(
            "click",
            createHypothesis
        );

    }


    const closeButton =
        document.getElementById(
            "closeHypothesisModal"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeHypothesisModal
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
   MODAL
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


/* =========================================================
   CALCULATION
   ========================================================= */

function initializeCalculation() {

    const button =
        document.getElementById(
            "startCalculationButton"
        );


    if (button) {

        button.addEventListener(
            "click",
            createCalculationJob
        );

    }

}


async function createCalculationJob() {

    if (!supabaseClient) {

        alert(
            "Supabaseに接続されていません。"
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
                PROJECT_ID,

            job_type:
                "exploration",

            status:
                "queued",

            progress:
                0

        })

        .select()

        .single();


    if (error) {

        console.error(
            error
        );


        alert(
            "計算ジョブの作成に失敗しました。\n\n" +
            error.message
        );


        return;
    }


    alert(
        "計算ジョブをキューに追加しました。"
    );


    console.log(
        data
    );

}


/* =========================================================
   CHAT
   ========================================================= */

function initializeChat() {

    const button =
        document.getElementById(
            "sendMessageButton"
        );


    const input =
        document.getElementById(
            "chatInput"
        );


    if (!button || !input)
        return;


    button.addEventListener(
        "click",
        sendMessage
    );


    input.addEventListener(
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


function sendMessage() {

    const input =
        document.getElementById(
            "chatInput"
        );


    if (!input) return;


    const text =
        input.value.trim();


    if (!text) return;


    addMessage(
        "user",
        text
    );


    input.value = "";


    addMessage(
        "assistant",
        "現在は研究データ保存部分を構築中です。Claudeとの接続は次の段階で実装します。"
    );

}


function addMessage(
    role,
    text
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

            ${escapeHTML(text)}

        </div>

    `;


    container.appendChild(
        message
    );


    container.scrollTop =
        container.scrollHeight;

}


/* =========================================================
   STATISTICS
   ========================================================= */

function updateStatistics() {

    const resultElement =
        document.getElementById(
            "stat-results"
        );


    const hypothesisElement =
        document.getElementById(
            "stat-hypotheses"
        );


    const bannedElement =
        document.getElementById(
            "stat-banned"
        );


    if (resultElement) {

        resultElement.textContent =
            state.results.length;

    }


    if (hypothesisElement) {

        hypothesisElement.textContent =
            state.hypotheses.length;

    }


    if (bannedElement) {

        bannedElement.textContent =
            state.routes.filter(
                route =>
                    route.status ===
                    "banned"
            ).length;

    }

}


/* =========================================================
   SAVE MESSAGE
   ========================================================= */

function showSaveMessage(text) {

    const message =
        document.createElement(
            "div"
        );


    message.textContent =
        text;


    message.style.position =
        "fixed";

    message.style.bottom =
        "25px";

    message.style.right =
        "25px";

    message.style.zIndex =
        "99999";

    message.style.padding =
        "12px 18px";

    message.style.borderRadius =
        "10px";

    message.style.background =
        "#182033";

    message.style.color =
        "#edf1f8";

    message.style.border =
        "1px solid #34405a";


    document.body.appendChild(
        message
    );


    setTimeout(
        () => {

            message.remove();

        },
        3000
    );

}


/* =========================================================
   ERROR
   ========================================================= */

function showHypothesisError(
    message
) {

    const container =
        document.getElementById(
            "hypotheses"
        );


    if (!container) return;


    container.innerHTML = `

        <div class="empty">

            <strong>
                仮説の読み込みに失敗しました。
            </strong>

            <br><br>

            ${escapeHTML(message)}

        </div>

    `;

}


/* =========================================================
   ESCAPE
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


/* =========================================================
   GLOBAL
   ========================================================= */

window.closeModal =
    closeModal;


window.closeHypothesisModal =
    closeHypothesisModal;


window.ResearchLab = {

    state,

    reload:
        start,

    testConnection:
        testSupabaseConnection

};


console.log(
    "Research AI Lab ready."
);
