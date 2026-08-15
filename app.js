/* =========================================================
   Research AI Lab
   app.js
   =========================================================

   現在の実装
   -------------------------
   ・Supabase接続
   ・研究プロジェクト確認
   ・仮説の保存 / 読み込み
   ・研究結果の保存 / 読み込み
   ・○ / △ / × 表示
   ・結果詳細表示
   ・信頼度
   ・根拠(JSONB)
   ・最新100件表示
   ・手動で研究結果を登録
   ・計算ジョブの作成
   ・研究チャットUI
   ・ナビゲーション

   研究上の原則
   -------------------------
   ・数値実験だけで数学的証明を主張しない
   ・反例探索を重視する
   ・未検証の結果を○にしない
   ・既知の数学との比較を行うまで
     「新しい数学」と断定しない
   ========================================================= */


/* =========================================================
   SUPABASE
   ========================================================= */

const SUPABASE_URL =
    "https://hiefdcodifkfhnqvruzn.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_HmcPY6BGvUQTPESGHVe7Hw_W4NlTPqj";


/*
   現在使っている研究プロジェクト
*/

const PROJECT_ID =
    "4253800d-a89e-45e2-a36a-cc52eb6c510b";


/*
   表示上の最大件数。

   DBから削除する数ではない。
   AIが後から過去の研究を参照できるよう、
   今はDBには残す。
*/

const DISPLAY_LIMIT =
    100;


let supabaseClient =
    null;


/* =========================================================
   STATE
   ========================================================= */

const state = {

    connected:
        false,

    project:
        null,

    hypotheses:
        [],

    results:
        [],

    memory:
        [],

    routes:
        [],

    jobs:
        [],

    currentHypothesis:
        null,

    currentResult:
        null

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


    /*
       Supabase SDK確認
    */

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


    /*
       Client作成
    */

    try {

        supabaseClient =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_KEY
            );

    } catch (error) {

        console.error(
            "Supabase client error:",
            error
        );

        setConnectionStatus(
            "× Supabase Client作成失敗"
        );

        return;
    }


    /*
       DB確認
    */

    const connected =
        await testSupabaseConnection();


    if (!connected) {

        return;

    }


    /*
       データ読み込み
    */

    await loadHypotheses();

    await loadResults();


    /*
       UI初期化
    */

    initializeNavigation();

    initializeHypothesis();

    initializeResults();

    initializeCalculation();

    initializeChat();

    initializeModal();


    /*
       統計更新
    */

    updateStatistics();


    console.log(
        "Research AI Lab ready."
    );

}


/* =========================================================
   SUPABASE CONNECTION
   ========================================================= */

async function testSupabaseConnection() {

    if (!supabaseClient) {

        return false;

    }


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

            .eq(
                "id",
                PROJECT_ID
            )

            .limit(1);


        if (error) {

            console.error(
                "Supabase error:",
                error
            );


            setConnectionStatus(
                "× DB接続エラー"
            );


            return false;

        }


        state.connected =
            true;


        if (
            data &&
            data.length > 0
        ) {

            state.project =
                data[0];

        }


        setConnectionStatus(
            "● Supabase 接続済み"
        );


        console.log(
            "Supabase connection successful."
        );


        return true;


    } catch (error) {

        console.error(
            "Supabase connection exception:",
            error
        );


        setConnectionStatus(
            "× Supabase 接続失敗"
        );


        return false;

    }

}


/* =========================================================
   CONNECTION STATUS
   ========================================================= */

function setConnectionStatus(
    text
) {

    const element =
        document.getElementById(
            "connectionStatus"
        );


    if (!element) {

        return;

    }


    element.textContent =
        text;

}


/* =========================================================
   HYPOTHESES
   ========================================================= */

async function loadHypotheses() {

    if (!supabaseClient) {

        return;

    }


    try {

        const {
            data,
            error
        } = await supabaseClient

            .from("hypotheses")

            .select(
                [
                    "id",
                    "project_id",
                    "code",
                    "title",
                    "statement",
                    "status",
                    "confidence",
                    "created_at",
                    "updated_at"
                ].join(",")
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


    if (!container) {

        return;

    }


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
                        normalizeHypothesisStatus(
                            hypothesis.status
                        );


                    const confidence =
                        hypothesis.confidence == null
                            ? "未評価"
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

                                <div
                                    style="flex:1;"
                                >

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


                                    <div
                                        style="
                                            color:#7f8baa;
                                            margin-top:10px;
                                            font-size:12px;
                                        "
                                    >

                                        信頼度：
                                        ${escapeHTML(
                                            confidence
                                        )}

                                    </div>

                                </div>


                                <div
                                    style="
                                        font-size:30px;
                                        min-width:38px;
                                        text-align:center;
                                    "
                                >

                                    ${getHypothesisStatusSymbol(
                                        status
                                    )}

                                </div>

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
                            element.dataset
                                .hypothesisId
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
       未検証なのでunknown。
       勝手に○にはしない。
    */

    const status =
        "unknown";


    const confidence =
        0;


    /*
       codeには構造化情報を保存。
    */

    const codeObject = {

        version:
            1,

        type:
            "mathematical_hypothesis",

        title:
            title,

        statement:
            statement,

        status:
            status,

        confidence:
            confidence,

        created_by:
            "user",

        verification: {

            mathematical_proof:
                null,

            numerical_test:
                null,

            counterexample_search:
                null,

            literature_check:
                null,

            reproducibility:
                null

        }

    };


    const {
        data,
        error
    } = await supabaseClient

        .from("hypotheses")

        .insert({

            project_id:
                PROJECT_ID,

            code:
                JSON.stringify(
                    codeObject,
                    null,
                    2
                ),

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


    showSaveMessage(
        "仮説をSupabaseに保存しました。"
    );

}


/* =========================================================
   HYPOTHESIS DETAIL
   ========================================================= */

function openHypothesis(
    id
) {

    const hypothesis =
        state.hypotheses.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!hypothesis) {

        return;

    }


    state.currentHypothesis =
        hypothesis;


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
    ) {

        return;

    }


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
           JSONでなくてもそのまま表示。
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

            ${getHypothesisStatusSymbol(
                normalizeHypothesisStatus(
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
                    ? "未評価"
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
   RESULTS
   ========================================================= */

async function loadResults() {

    if (!supabaseClient) {

        return;

    }


    try {

        const {
            data,
            error
        } = await supabaseClient

            .from("research_results")

            .select(
                [
                    "id",
                    "project_id",
                    "hypothesis_id",
                    "title",
                    "description",
                    "status",
                    "hypothesis",
                    "calculation",
                    "verification",
                    "next_action",
                    "evidence",
                    "created_at"
                ].join(",")
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
            )

            .limit(
                DISPLAY_LIMIT
            );


        if (error) {

            console.error(
                "Research results loading error:",
                error
            );


            showResultsError(
                error.message
            );


            return;

        }


        state.results =
            data || [];


        renderResults();

        updateStatistics();


        console.log(
            "Loaded research results:",
            state.results
        );


    } catch (error) {

        console.error(
            "Research results exception:",
            error
        );

    }

}


/* =========================================================
   RESULT UI INITIALIZATION
   ========================================================= */

function initializeResults() {

    /*
       現在のHTMLには
       「結果登録」ボタンがないので、
       JSから追加する。

       AIが勝手に架空の結果を作るのではなく、
       最初はユーザーが実際の結果を登録して
       DBとの動作確認ができるようにする。
    */

    const resultsContainer =
        document.getElementById(
            "results"
        );


    if (!resultsContainer) {

        return;

    }


    const section =
        resultsContainer.closest(
            ".section"
        );


    if (!section) {

        return;

    }


    const header =
        section.querySelector(
            ".section-header"
        );


    if (!header) {

        return;

    }


    if (
        document.getElementById(
            "newResultButton"
        )
    ) {

        return;

    }


    const button =
        document.createElement(
            "button"
        );


    button.id =
        "newResultButton";


    button.className =
        "btn btn-primary";


    button.type =
        "button";


    button.textContent =
        "＋ 結果を登録";


    button.addEventListener(
        "click",
        openResultModal
    );


    header.appendChild(
        button
    );


    /*
       結果登録モーダルも作成。
    */

    createResultModal();

}


/* =========================================================
   CREATE RESULT MODAL
   ========================================================= */

function createResultModal() {

    if (
        document.getElementById(
            "resultModal"
        )
    ) {

        return;

    }


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "resultModal";


    modal.className =
        "modal-bg";


    modal.innerHTML = `

        <div class="modal">

            <button
                id="closeResultModal"
                class="close"
                type="button"
            >
                ×
            </button>


            <h2>
                研究結果を登録
            </h2>


            <div class="detail-block">

                <div class="detail-label">
                    対象仮説
                </div>

                <select
                    id="resultHypothesisId"
                    style="
                        width:100%;
                        padding:12px;
                        border:1px solid #2b3754;
                        border-radius:9px;
                        background:#0b1120;
                        color:white;
                    "
                >
                </select>

            </div>


            <div class="detail-block">

                <div class="detail-label">
                    結果名
                </div>

                <input
                    id="resultTitle"
                    type="text"
                    placeholder="例：反例探索の結果"
                    style="
                        width:100%;
                        padding:12px;
                        border:1px solid #2b3754;
                        border-radius:9px;
                        background:#0b1120;
                        color:white;
                    "
                >

            </div>


            <div class="detail-block">

                <div class="detail-label">
                    判定
                </div>

                <select
                    id="resultStatus"
                    style="
                        width:100%;
                        padding:12px;
                        border:1px solid #2b3754;
                        border-radius:9px;
                        background:#0b1120;
                        color:white;
                    "
                >

                    <option value="maybe">
                        △ 未確定
                    </option>

                    <option value="good">
                        ○ 支持
                    </option>

                    <option value="bad">
                        × 反証・棄却
                    </option>

                </select>

            </div>


            <div class="detail-block">

                <div class="detail-label">
                    信頼度 0〜1
                </div>

                <input
                    id="resultConfidence"
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value="0"
                    style="
                        width:100%;
                        padding:12px;
                        border:1px solid #2b3754;
                        border-radius:9px;
                        background:#0b1120;
                        color:white;
                    "
                >

            </div>


            <div class="detail-block">

                <div class="detail-label">
                    概要
                </div>

                <textarea
                    id="resultDescription"
                    rows="3"
                    placeholder="何が分かったか"
                    style="
                        width:100%;
                        padding:12px;
                        border:1px solid #2b3754;
                        border-radius:9px;
                        background:#0b1120;
                        color:white;
                        resize:vertical;
                    "
                ></textarea>

            </div>


            <div class="detail-block">

                <div class="detail-label">
                    仮説
                </div>

                <textarea
                    id="resultHypothesis"
                    rows="3"
                    placeholder="検証した仮説"
                    style="
                        width:100%;
                        padding:12px;
                        border:1px solid #2b3754;
                        border-radius:9px;
                        background:#0b1120;
                        color:white;
                        resize:vertical;
                    "
                ></textarea>

            </div>


            <div class="detail-block">

                <div class="detail-label">
                    計算
                </div>

                <textarea
                    id="resultCalculation"
                    rows="4"
                    placeholder="計算内容・数式・数値実験"
                    style="
                        width:100%;
                        padding:12px;
                        border:1px solid #2b3754;
                        border-radius:9px;
                        background:#0b1120;
                        color:white;
                        resize:vertical;
                    "
                ></textarea>

            </div>


            <div class="detail-block">

                <div class="detail-label">
                    検証
                </div>

                <textarea
                    id="resultVerification"
                    rows="4"
                    placeholder="証明・反例探索・再現性・文献確認など"
                    style="
                        width:100%;
                        padding:12px;
                        border:1px solid #2b3754;
                        border-radius:9px;
                        background:#0b1120;
                        color:white;
                        resize:vertical;
                    "
                ></textarea>

            </div>


            <div class="detail-block">

                <div class="detail-label">
                    次に調べること
                </div>

                <textarea
                    id="resultNextAction"
                    rows="3"
                    placeholder="次の研究ステップ"
                    style="
                        width:100%;
                        padding:12px;
                        border:1px solid #2b3754;
                        border-radius:9px;
                        background:#0b1120;
                        color:white;
                        resize:vertical;
                    "
                ></textarea>

            </div>


            <button
                id="saveResearchResultButton"
                class="btn btn-primary"
                type="button"
            >
                研究結果を保存
            </button>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    document
        .getElementById(
            "closeResultModal"
        )
        .addEventListener(
            "click",
            closeResultModal
        );


    document
        .getElementById(
            "saveResearchResultButton"
        )
        .addEventListener(
            "click",
            saveResearchResultFromForm
        );


    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {

                closeResultModal();

            }

        }
    );

}


/* =========================================================
   OPEN RESULT MODAL
   ========================================================= */

function openResultModal() {

    const modal =
        document.getElementById(
            "resultModal"
        );


    if (!modal) {

        return;

    }


    populateResultHypotheses();


    modal.classList.add(
        "active"
    );

}


/* =========================================================
   POPULATE HYPOTHESIS SELECT
   ========================================================= */

function populateResultHypotheses() {

    const select =
        document.getElementById(
            "resultHypothesisId"
        );


    if (!select) {

        return;

    }


    if (
        state.hypotheses.length === 0
    ) {

        select.innerHTML = `

            <option value="">
                仮説なし
            </option>

        `;

        return;

    }


    select.innerHTML = `

        <option value="">
            仮説を選択
        </option>

        ${
            state.hypotheses
                .map(
                    hypothesis => `

                        <option
                            value="${escapeHTML(
                                hypothesis.id
                            )}"
                        >

                            ${escapeHTML(
                                hypothesis.title ||
                                "無題の仮説"
                            )}

                        </option>

                    `
                )
                .join("")
        }

    `;

}


/* =========================================================
   SAVE RESULT FROM FORM
   ========================================================= */

async function saveResearchResultFromForm() {

    const title =
        getInputValue(
            "resultTitle"
        );


    if (!title) {

        alert(
            "結果名を入力してください。"
        );

        return;

    }


    const hypothesisId =
        getInputValue(
            "resultHypothesisId"
        ) ||
        null;


    const status =
        getInputValue(
            "resultStatus"
        ) ||
        "maybe";


    const confidenceRaw =
        getInputValue(
            "resultConfidence"
        );


    let confidence =
        Number(
            confidenceRaw
        );


    if (
        !Number.isFinite(
            confidence
        )
    ) {

        confidence =
            0;

    }


    /*
       0〜1に制限。
    */

    confidence =
        Math.max(
            0,
            Math.min(
                1,
                confidence
            )
        );


    const description =
        getInputValue(
            "resultDescription"
        );


    const hypothesis =
        getInputValue(
            "resultHypothesis"
        );


    const calculation =
        getInputValue(
            "resultCalculation"
        );


    const verification =
        getInputValue(
            "resultVerification"
        );


    const nextAction =
        getInputValue(
            "resultNextAction"
        );


    /*
       confidenceはresearch_resultsに
       専用列がないためevidenceに保存。

       根拠そのものとは分けて管理する。
    */

    const evidence = {

        confidence:
            confidence,

        confidence_basis:
            "user_entered",

        sources:
            [],

        calculations:
            [],

        counterexamples:
            [],

        reproducibility:
            null,

        literature_check:
            null

    };


    try {

        await createResearchResult({

            hypothesisId:

                hypothesisId,

            title:

                title,

            description:

                description,

            status:

                status,

            hypothesis:

                hypothesis,

            calculation:

                calculation,

            verification:

                verification,

            nextAction:

                nextAction,

            evidence:

                evidence

        });


        clearResultForm();

        closeResultModal();


        showSaveMessage(
            "研究結果をSupabaseに保存しました。"
        );


    } catch (error) {

        alert(
            "研究結果の保存に失敗しました。\n\n" +
            error.message
        );

    }

}


/* =========================================================
   CREATE RESEARCH RESULT
   ========================================================= */

async function createResearchResult({

    hypothesisId =
        null,

    title,

    description =
        "",

    status =
        "maybe",

    hypothesis =
        "",

    calculation =
        "",

    verification =
        "",

    nextAction =
        "",

    evidence =
        {}

}) {

    if (!supabaseClient) {

        throw new Error(
            "Supabaseに接続されていません。"
        );

    }


    const safeStatus =
        normalizeResultStatus(
            status
        );


    const {
        data,
        error
    } = await supabaseClient

        .from(
            "research_results"
        )

        .insert({

            project_id:
                PROJECT_ID,

            hypothesis_id:
                hypothesisId,

            title:
                title,

            description:
                description,

            status:
                safeStatus,

            hypothesis:
                hypothesis,

            calculation:
                calculation,

            verification:
                verification,

            next_action:
                nextAction,

            evidence:
                evidence

        })

        .select()
        .single();


    if (error) {

        console.error(
            "Research result insert error:",
            error
        );

        throw error;

    }


    /*
       画面表示用に追加。
    */

    state.results.unshift(
        data
    );


    /*
       DBから削除はしない。

       画面上だけ最新100件。
    */

    state.results =
        state.results.slice(
            0,
            DISPLAY_LIMIT
        );


    renderResults();

    updateStatistics();


    return data;

}


/* =========================================================
   RENDER RESULTS
   ========================================================= */

function renderResults() {

    const container =
        document.getElementById(
            "results"
        );


    if (!container) {

        return;

    }


    if (
        state.results.length === 0
    ) {

        container.innerHTML = `

            <div class="empty">

                研究結果はまだありません。

                <br><br>

                「＋ 結果を登録」から
                結果を保存できます。

            </div>

        `;

        return;

    }


    container.innerHTML =
        state.results
            .map(
                result => {

                    const status =
                        normalizeResultStatus(
                            result.status
                        );


                    const confidence =
                        extractConfidence(
                            result.evidence
                        );


                    return `

                        <div
                            class="result-card"
                            data-result-id="${escapeHTML(
                                result.id
                            )}"
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
                                        font-size:32px;
                                        min-width:40px;
                                        text-align:center;
                                    "
                                >

                                    ${getStatusSymbol(
                                        status
                                    )}

                                </div>


                                <div
                                    style="
                                        flex:1;
                                        min-width:0;
                                    "
                                >

                                    <div
                                        style="
                                            color:#edf1f8;
                                            font-weight:700;
                                            font-size:16px;
                                        "
                                    >

                                        ${escapeHTML(
                                            result.title ||
                                            "無題の研究結果"
                                        )}

                                    </div>


                                    <div
                                        style="
                                            color:#8995ae;
                                            margin-top:7px;
                                        "
                                    >

                                        ${escapeHTML(
                                            result.description ||
                                            ""
                                        )}

                                    </div>


                                    <div
                                        style="
                                            color:#7f8baa;
                                            margin-top:10px;
                                            font-size:12px;
                                        "
                                    >

                                        ${
                                            confidence === null

                                            ? "信頼度：未評価"

                                            : "信頼度：" +
                                              Number(
                                                  confidence
                                              ).toFixed(2)

                                        }

                                    </div>

                                </div>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");


    container
        .querySelectorAll(
            "[data-result-id]"
        )
        .forEach(
            element => {

                element.addEventListener(
                    "click",
                    () => {

                        openResearchResult(
                            element.dataset
                                .resultId
                        );

                    }
                );

            }
        );

}


/* =========================================================
   RESULT DETAIL
   ========================================================= */

function openResearchResult(
    id
) {

    const result =
        state.results.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!result) {

        return;

    }


    state.currentResult =
        result;


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
    ) {

        return;

    }


    const evidenceText =
        formatEvidence(
            result.evidence
        );


    const confidence =
        extractConfidence(
            result.evidence
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
                font-size:44px;
                margin-bottom:8px;
            "
        >

            ${getStatusSymbol(
                normalizeResultStatus(
                    result.status
                )
            )}

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

            <strong>

                ${getStatusSymbol(
                    normalizeResultStatus(
                        result.status
                    )
                )}

            </strong>

            ${escapeHTML(
                result.status ||
                "maybe"
            )}

        </div>


        <div class="detail-block">

            <div class="detail-label">
                信頼度
            </div>

            ${
                confidence === null

                ? "未評価"

                : Number(
                    confidence
                  ).toFixed(2)

            }

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

            <pre
                style="
                    white-space:pre-wrap;
                    overflow:auto;
                "
            >${escapeHTML(
                result.calculation ||
                "記録なし"
            )}</pre>

        </div>


        <div class="detail-block">

            <div class="detail-label">
                検証
            </div>

            ${escapeHTML(
                result.verification ||
                "記録なし"
            )}

        </div>


        <div class="detail-block">

            <div class="detail-label">
                次に調べること
            </div>

            ${escapeHTML(
                result.next_action ||
                "記録なし"
            )}

        </div>


        <div class="detail-block">

            <div class="detail-label">
                根拠データ
            </div>

            <pre
                style="
                    white-space:pre-wrap;
                    overflow:auto;
                "
            >${escapeHTML(
                evidenceText
            )}</pre>

        </div>


        <div class="detail-block">

            <div class="detail-label">
                作成日時
            </div>

            ${escapeHTML(
                result.created_at ||
                ""
            )}

        </div>

    `;


    modal.classList.add(
        "active"
    );

}


/* =========================================================
   RESULT STATUS
   ========================================================= */

function normalizeResultStatus(
    status
) {

    if (
        status === "good" ||
        status === "supported" ||
        status === "support"
    ) {

        return "good";

    }


    if (
        status === "bad" ||
        status === "rejected" ||
        status === "refuted"
    ) {

        return "bad";

    }


    /*
       unknownも未確定として△。
    */

    return "maybe";

}


function getStatusSymbol(
    status
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


/* =========================================================
   HYPOTHESIS STATUS
   ========================================================= */

function normalizeHypothesisStatus(
    status
) {

    if (
        status === "good" ||
        status === "supported"
    ) {

        return "good";

    }


    if (
        status === "bad" ||
        status === "rejected"
    ) {

        return "bad";

    }


    return "unknown";

}


function getHypothesisStatusSymbol(
    status
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


    return "?";

}


/* =========================================================
   EVIDENCE
   ========================================================= */

function formatEvidence(
    evidence
) {

    if (
        evidence === null ||
        evidence === undefined
    ) {

        return "根拠なし";

    }


    if (
        typeof evidence ===
        "string"
    ) {

        return evidence;

    }


    try {

        return JSON.stringify(
            evidence,
            null,
            2
        );

    } catch {

        return String(
            evidence
        );

    }

}


function extractConfidence(
    evidence
) {

    if (
        evidence === null ||
        evidence === undefined
    ) {

        return null;

    }


    if (
        typeof evidence !==
        "object"
    ) {

        return null;

    }


    if (
        typeof evidence.confidence ===
        "number"
    ) {

        return evidence.confidence;

    }


    return null;

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


function switchPage(
    page
) {

    document
        .querySelectorAll(
            ".nav-button"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.page ===
                    page
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
   HYPOTHESIS UI
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
   RESULT MODAL
   ========================================================= */

function closeResultModal() {

    const modal =
        document.getElementById(
            "resultModal"
        );


    if (modal) {

        modal.classList.remove(
            "active"
        );

    }

}


function clearResultForm() {

    const ids = [

        "resultTitle",

        "resultDescription",

        "resultHypothesis",

        "resultCalculation",

        "resultVerification",

        "resultNextAction"

    ];


    ids.forEach(
        id => {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.value =
                    "";

            }

        }
    );


    const confidence =
        document.getElementById(
            "resultConfidence"
        );


    if (confidence) {

        confidence.value =
            "0";

    }


    const status =
        document.getElementById(
            "resultStatus"
        );


    if (status) {

        status.value =
            "maybe";

    }

}


/* =========================================================
   MAIN MODAL
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
                    event.target ===
                    modal
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
   CALCULATION JOB
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


    /*
       calculation_jobsの列構造は、
       今回確認した範囲では詳細未確認。

       そのため、既存DBを壊さないよう
       最低限のproject_idだけで作成する。
    */

    const {
        data,
        error
    } = await supabaseClient

        .from(
            "calculation_jobs"
        )

        .insert({

            project_id:
                PROJECT_ID

        })

        .select()
        .single();


    if (error) {

        console.error(
            "Calculation job error:",
            error
        );


        alert(
            "計算ジョブを作成できませんでした。\n\n" +
            error.message
        );


        return;

    }


    state.jobs.unshift(
        data
    );


    showSaveMessage(
        "計算ジョブを作成しました。"
    );


    console.log(
        "Calculation job:",
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


    if (
        !button ||
        !input
    ) {

        return;

    }


    button.addEventListener(
        "click",
        sendMessage
    );


    input.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

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


    if (!input) {

        return;

    }


    const text =
        input.value.trim();


    if (!text) {

        return;

    }


    addMessage(
        "user",
        text
    );


    input.value =
        "";


    /*
       まだAI APIには接続しない。

       架空の回答を「AIの検証結果」として
       保存しないため。
    */

    addMessage(
        "assistant",
        "現在は研究データベースとの接続段階です。AI APIはまだ接続していません。"
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


    if (!container) {

        return;

    }


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

            ${escapeHTML(
                text
            )}

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

        /*
           「未確定の仮説」という表示なので、
           unknownのみを数える。
        */

        const uncertainCount =
            state.hypotheses.filter(
                hypothesis =>
                    normalizeHypothesisStatus(
                        hypothesis.status
                    ) ===
                    "unknown"
            ).length;


        hypothesisElement.textContent =
            uncertainCount;

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
   ERROR DISPLAY
   ========================================================= */

function showHypothesisError(
    message
) {

    const container =
        document.getElementById(
            "hypotheses"
        );


    if (!container) {

        return;

    }


    container.innerHTML = `

        <div class="empty">

            <strong>
                仮説の読み込みに失敗しました。
            </strong>

            <br><br>

            ${escapeHTML(
                message
            )}

        </div>

    `;

}


function showResultsError(
    message
) {

    const container =
        document.getElementById(
            "results"
        );


    if (!container) {

        return;

    }


    container.innerHTML = `

        <div class="empty">

            <strong>
                研究結果の読み込みに失敗しました。
            </strong>

            <br><br>

            ${escapeHTML(
                message
            )}

        </div>

    `;

}


/* =========================================================
   FORM VALUE
   ========================================================= */

function getInputValue(
    id
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return "";

    }


    return String(
        element.value ||
        ""
    ).trim();

}


/* =========================================================
   SAVE MESSAGE
   ========================================================= */

function showSaveMessage(
    text
) {

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
   HTML ESCAPE
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


    return String(
        value
    )

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
   GLOBAL API
   ========================================================= */

window.closeModal =
    closeModal;


window.closeHypothesisModal =
    closeHypothesisModal;


window.closeResultModal =
    closeResultModal;


window.ResearchLab = {

    state:

        state,

    reload:

        start,

    loadHypotheses:

        loadHypotheses,

    loadResults:

        loadResults,

    createHypothesis:

        createHypothesis,

    createResearchResult:

        createResearchResult,

    openHypothesis:

        openHypothesis,

    openResearchResult:

        openResearchResult,

    testConnection:

        testSupabaseConnection

};


console.log(
    "Research AI Lab ready."
);
