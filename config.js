// ============================================================
// TEXFRIEND ERP
// config.js - Ultimate Firebase Cloud Sync
// ============================================================

window.isDemo = false;

// ============================================================
// LOCAL STORAGE HELPERS
// ============================================================

window.localLoad = function (key, fallback = null) {
    try {
        const raw = localStorage.getItem(key);

        if (!raw) return fallback;

        const parsed = JSON.parse(raw);

        return parsed ?? fallback;

    } catch (error) {
        console.error("localLoad Error:", key, error);
        return fallback;
    }
};


window.localSave = function (key, data) {
    try {
        localStorage.setItem(
            key,
            JSON.stringify(data)
        );

        return true;

    } catch (error) {
        console.error("localSave Error:", key, error);
        return false;
    }
};


// ============================================================
// FIREBASE CONFIG
// ============================================================

const firebaseConfig = {

    apiKey:
        "AIzaSyDYPLOPZnOlPvCzNeZXuS7yHTf2sUe-SFM",

    authDomain:
        "texfriend.firebaseapp.com",

    projectId:
        "texfriend",

    storageBucket:
        "texfriend.appspot.com",

    messagingSenderId:
        "331673079578",

    appId:
        "1:331673079578:web:e8c2ea6c41e6359d3f66a3",

    measurementId:
        "G-2NP13ZTKCN"
};


// ============================================================
// GLOBAL FIREBASE REFERENCES
// ============================================================

window.db = null;

window._firebaseApp = null;

window._doc = null;

window._setDoc = null;

window._getDoc = null;


// ============================================================
// CLOUD SYNC STATUS
// ============================================================

window.cloudSyncReady = false;

window.firebaseConnected = false;

window.cloudSyncPromise = null;


// ============================================================
// MAIN ERP CLOUD KEYS
// ============================================================

window.erpCloudKeys = [

    "design_specs",

    "pre_design_numbers",

    "design_masters_data",

    "warping_issue_records",

    "weaving_master_data",

    "weaving_warp_trans",

    "weaving_weft_trans",

    "party_orders_data",

    "dyeing_issue_records",

    "dyeing_receive_records",

    "tex_master_weavers",

    "tex_master_warping_units",

    "washing_issue_records",

    "washing_receive_records",

    "tex_master_washing_units",

    "kora_stock_records",

    "kora_issue_records",

    "tex_master_mills",

    "tex_master_units",

    "tex_master_counts",

    "party_master_db",

    "user_permissions",

    "erp_system_users"

];


// ============================================================
// FIREBASE INITIALIZATION
// ============================================================

window.cloudSyncPromise = (async function () {

    try {

        console.log("🔥 Starting Firebase...");


        // ------------------------------------------------------
        // Firebase App
        // ------------------------------------------------------

        const firebaseApp =
            await import(
                "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js"
            );


        if (
            firebaseApp.getApps &&
            firebaseApp.getApps().length
        ) {

            window._firebaseApp =
                firebaseApp.getApps()[0];

        } else {

            window._firebaseApp =
                firebaseApp.initializeApp(
                    firebaseConfig
                );
        }


        // ------------------------------------------------------
        // Firestore
        // ------------------------------------------------------

        const firebaseFirestore =
            await import(
                "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js"
            );


        window.db =
            firebaseFirestore.getFirestore(
                window._firebaseApp
            );


        window._doc =
            firebaseFirestore.doc;


        window._setDoc =
            firebaseFirestore.setDoc;


        window._getDoc =
            firebaseFirestore.getDoc;


        window.firebaseConnected = true;


        console.log(
            "🔥 Firebase Connected"
        );


        // ------------------------------------------------------
        // DOWNLOAD CLOUD DATA
        // ------------------------------------------------------

        await window.syncERPFromCloud();


        // ------------------------------------------------------
        // SYNC COMPLETE
        // ------------------------------------------------------

        window.cloudSyncReady = true;


        console.log(
            "✅ TEXFRIEND Cloud Sync Completed"
        );


        // Notify dashboard / other pages

        window.dispatchEvent(
            new CustomEvent(
                "texfriend-cloud-sync-complete"
            )
        );


        return true;


    } catch (error) {

        console.error(
            "❌ Firebase Initialization Error:",
            error
        );


        window.firebaseConnected = false;

        window.cloudSyncReady = false;


        window.dispatchEvent(
            new CustomEvent(
                "texfriend-cloud-sync-error",
                {
                    detail: error
                }
            )
        );


        return false;
    }

})();


// ============================================================
// CLOUD → LOCAL SYNC
// ============================================================

window.syncERPFromCloud = async function () {

    if (
        !window.db ||
        !window._doc ||
        !window._getDoc
    ) {

        throw new Error(
            "Firebase Firestore is not ready"
        );
    }


    const keys =
        window.erpCloudKeys || [];


    console.log(
        "☁️ Downloading ERP Cloud Data..."
    );


    const promises =
        keys.map(
            async function (key) {

                try {

                    const ref =
                        window._doc(
                            window.db,
                            "texfriend_erp",
                            key
                        );


                    const snap =
                        await window._getDoc(
                            ref
                        );


                    if (!snap.exists()) {

                        console.log(
                            "ℹ️ No cloud data:",
                            key
                        );

                        return;
                    }


                    const cloudContent =
                        snap.data()?.content;


                    if (
                        cloudContent ===
                        undefined ||
                        cloudContent ===
                        null
                    ) {

                        return;
                    }


                    let cloudData;


                    try {

                        cloudData =
                            JSON.parse(
                                cloudContent
                            );

                    } catch (parseError) {

                        console.error(
                            "Cloud JSON Error:",
                            key,
                            parseError
                        );

                        return;
                    }


                    /*
                     * IMPORTANT:
                     *
                     * Cloud data is considered
                     * the latest central ERP data.
                     *
                     * Therefore cloud data is
                     * written into LocalStorage.
                     */

                    localStorage.setItem(
                        key,
                        JSON.stringify(
                            cloudData
                        )
                    );


                    console.log(
                        "☁️ Synced:",
                        key
                    );


                } catch (error) {

                    console.error(
                        "Cloud Fetch Error:",
                        key,
                        error
                    );
                }

            }
        );


    await Promise.all(
        promises
    );


    /*
     * Rebuild design lists after cloud sync.
     */

    try {

        if (
            typeof window.populateDropdowns ===
            "function"
        ) {

            window.populateDropdowns();
        }

    } catch (error) {

        console.warn(
            "Dropdown rebuild warning:",
            error
        );
    }


    console.log(
        "✅ All ERP Cloud Data Downloaded"
    );
};


// ============================================================
// LOCAL → CLOUD SAVE
// ============================================================

window.firebaseSave = async function (
    key,
    data
) {

    /*
     * Save locally first.
     */

    window.localSave(
        key,
        data
    );


    /*
     * If Firebase isn't ready,
     * local data is still safe.
     */

    if (
        !window.db ||
        !window._doc ||
        !window._setDoc
    ) {

        console.warn(
            "Firebase not ready. Local save only:",
            key
        );

        return false;
    }


    try {

        const ref =
            window._doc(
                window.db,
                "texfriend_erp",
                key
            );


        await window._setDoc(
            ref,
            {
                content:
                    JSON.stringify(data),

                updatedAt:
                    new Date().toISOString()
            },
            {
                merge: true
            }
        );


        console.log(
            "☁️ Cloud Saved:",
            key
        );


        return true;


    } catch (error) {

        console.error(
            "❌ Firebase Save Error:",
            key,
            error
        );


        return false;
    }
};


// Compatibility function

window.firebaseSaveIndividual =
    function (key, data) {

        return window.firebaseSave(
            key,
            data
        );
    };


// ============================================================
// LOCAL / CLOUD LOAD
// ============================================================

window.firebaseLoad =
    function (key, fallback = null) {

        return window.localLoad(
            key,
            fallback
        );
    };


// ============================================================
// WAIT FOR CLOUD SYNC
// ============================================================

window.waitForCloudSync =
    function (timeout = 15000) {

        if (
            window.cloudSyncReady
        ) {

            return Promise.resolve(
                true
            );
        }


        return new Promise(
            function (resolve) {

                let finished = false;


                function done(value) {

                    if (finished) return;

                    finished = true;

                    cleanup();

                    resolve(value);
                }


                function success() {

                    done(true);
                }


                function failure() {

                    done(false);
                }


                function cleanup() {

                    window.removeEventListener(
                        "texfriend-cloud-sync-complete",
                        success
                    );

                    window.removeEventListener(
                        "texfriend-cloud-sync-error",
                        failure
                    );
                }


                window.addEventListener(
                    "texfriend-cloud-sync-complete",
                    success
                );


                window.addEventListener(
                    "texfriend-cloud-sync-error",
                    failure
                );


                setTimeout(
                    function () {

                        done(
                            !!window.cloudSyncReady
                        );

                    },
                    timeout
                );

            }
        );
    };


// ============================================================
// CROSS PAGE DATA
// ============================================================

window.getCrossPageData =
    function (
        designNo,
        recordKey
    ) {

        const cleanTarget =
            designNo
                ? String(designNo)
                    .replace("#", "")
                    .trim()
                    .toLowerCase()
                : "";


        if (!cleanTarget) {

            return null;
        }


        try {

            const records =
                window.localLoad(
                    recordKey,
                    []
                );


            if (Array.isArray(records)) {

                const match =
                    records
                        .slice()
                        .reverse()
                        .find(
                            function (r) {

                                if (
                                    !r ||
                                    typeof r !==
                                    "object"
                                ) {

                                    return false;
                                }


                                const d =
                                    r.designNo ||
                                    r.designNumber ||
                                    r.design ||
                                    r.name ||
                                    "";


                                return String(d)
                                    .replace("#", "")
                                    .trim()
                                    .toLowerCase() ===
                                    cleanTarget;
                            }
                        );


                if (match) {

                    return match;
                }
            }


            const specs =
                window.localLoad(
                    "design_specs",
                    {}
                );


            if (
                specs &&
                typeof specs ===
                "object"
            ) {

                const key =
                    Object.keys(
                        specs
                    ).find(
                        function (k) {

                            return String(k)
                                .replace("#", "")
                                .trim()
                                .toLowerCase() ===
                                cleanTarget;
                        }
                    );


                if (
                    key &&
                    specs[key]
                ) {

                    return specs[key];
                }
            }


        } catch (error) {

            console.error(
                "getCrossPageData Error:",
                error
            );
        }


        return null;
    };


// ============================================================
// TEXTILE MASTER DEFAULTS
// ============================================================

window.texMasterList = {

    mills: [],

    weavers: [],

    dyeingNames: [],

    warpingNames: [],

    sizingNames: [],

    washingNames: [],

    counts: [
        "2/40s",
        "2/60s",
        "30s"
    ],

    colours: [
        "White",
        "Black",
        "Navy Blue",
        "Maroon"
    ]
};


// ============================================================
// UNIVERSAL DROPDOWN POPULATOR
// ============================================================

window.populateDropdowns =
    function () {

        try {

            const designSpecs =
                window.localLoad(
                    "design_specs",
                    {}
                );


            let preDesignList =
                window.localLoad(
                    "pre_design_numbers",
                    null
                );


            if (!preDesignList) {

                preDesignList =
                    window.localLoad(
                        "tex_master_designs",
                        []
                    );
            }


            if (!Array.isArray(
                preDesignList
            )) {

                preDesignList = [];
            }


            const cleaned =
                preDesignList
                    .map(
                        function (d) {

                            if (
                                typeof d ===
                                "object" &&
                                d !== null
                            ) {

                                return (
                                    d.designNo ||
                                    d.designNumber ||
                                    ""
                                );
                            }


                            return d;
                        }
                    )
                    .filter(Boolean);


            /*
             * Add missing designs
             */

            cleaned.forEach(
                function (name) {

                    const clean =
                        String(name)
                            .replace("#", "")
                            .trim()
                            .toLowerCase();


                    const exists =
                        Object.keys(
                            designSpecs
                        ).some(
                            function (k) {

                                return String(k)
                                    .replace("#", "")
                                    .trim()
                                    .toLowerCase() ===
                                    clean;
                            }
                        );


                    if (!exists) {

                        designSpecs[name] = {

                            designNumber:
                                name,

                            status:
                                "running"
                        };
                    }
                }
            );


            const combined =
                Array.from(
                    new Set(
                        [
                            ...cleaned,

                            ...Object.keys(
                                designSpecs
                            )
                        ]
                    )
                );


            localStorage.setItem(
                "design_specs",
                JSON.stringify(
                    designSpecs
                )
            );


            localStorage.setItem(
                "pre_design_numbers",
                JSON.stringify(
                    combined
                )
            );


            /*
             * Update only design-related
             * select boxes.
             */

            document
                .querySelectorAll(
                    "select"
                )
                .forEach(
                    function (select) {

                        const identifier =
                            (
                                String(
                                    select.id ||
                                    ""
                                ) +
                                " " +
                                String(
                                    select.className ||
                                    ""
                                )
                            )
                                .toLowerCase();


                        if (
                            identifier.includes(
                                "design"
                            ) ||
                            select.id ===
                                "designNumber" ||
                            select.id ===
                                "designSelect" ||
                            select.classList.contains(
                                "item-design"
                            )
                        ) {

                            const current =
                                select.value;


                            select.innerHTML =
                                "";


                            const first =
                                document.createElement(
                                    "option"
                                );


                            first.value = "";

                            first.textContent =
                                "Select Design No";


                            select.appendChild(
                                first
                            );


                            combined.forEach(
                                function (name) {

                                    const option =
                                        document.createElement(
                                            "option"
                                        );


                                    option.value =
                                        name;

                                    option.textContent =
                                        name;


                                    select.appendChild(
                                        option
                                    );
                                }
                            );


                            if (current) {

                                select.value =
                                    current;
                            }
                        }
                    }
                );


        } catch (error) {

            console.error(
                "Dropdown Populate Error:",
                error
            );
        }
    };


// ============================================================
// DOM READY
// ============================================================

window.addEventListener(
    "DOMContentLoaded",
    function () {

        window.populateDropdowns();

    }
);


// ============================================================
// GLOBAL THEME ENGINE
// ============================================================

(function () {

    function applyGlobalTheme() {

        const savedMode =
            localStorage.getItem(
                "erp_theme_mode"
            ) ||
            "dark";


        const old =
            document.getElementById(
                "global-perfect-theme"
            );


        if (old) {

            old.remove();
        }


        let css = `

            .container,
            .main-card,
            .form-container,
            .card {

                width:96% !important;

                max-width:1100px !important;

                margin-left:auto !important;

                margin-right:auto !important;
            }

        `;


        if (
            savedMode ===
            "softgreen"
        ) {

            css += `

                html,
                body {

                    background:#D2DCD2 !important;

                    color:#1A3320 !important;
                }

                .top-header-container,
                .container,
                .main-card,
                .form-section,
                .form-section-box,
                .warping-beam-tab,
                .modal-content,
                .stats-banner,
                .search-bar-box,
                .stat-box {

                    background:#E2EAE2 !important;

                    border-color:#B5C6B5 !important;

                    color:#1A3320 !important;
                }

                input,
                select {

                    background:#CBD8CB !important;

                    color:#112416 !important;

                    border-color:#A2B7A2 !important;
                }

                table,
                .table-container {

                    background:#E2EAE2 !important;

                    color:#1A3320 !important;
                }

                th {

                    background:#CBD8CB !important;

                    color:#23432B !important;
                }

                td {

                    background:#E2EAE2 !important;

                    color:#1A3320 !important;
                }

            `;

        } else if (
            savedMode ===
            "darkgreen"
        ) {

            css += `

                html,
                body {

                    background:#C8D8CE !important;

                    color:#132A1C !important;
                }

                .top-header-container,
                .container,
                .stats-banner,
                .search-bar-box,
                .stat-box {

                    background:#D8E5DC !important;

                    color:#132A1C !important;

                    border-color:#9EBDAC !important;
                }

                input,
                select {

                    background:#C2D4CC !important;

                    color:#0A1C12 !important;

                    border-color:#8EAD9C !important;
                }

            `;

        } else if (
            savedMode ===
            "sunset"
        ) {

            css += `

                html,
                body {

                    background:#E2D9C8 !important;

                    color:#33230F !important;
                }

                .top-header-container,
                .container,
                .stats-banner,
                .search-bar-box,
                .stat-box {

                    background:#EEE5D8 !important;

                    color:#33230F !important;

                    border-color:#C2AF95 !important;
                }

                input,
                select {

                    background:#D8CBB7 !important;

                    color:#211608 !important;

                    border-color:#B29D7D !important;
                }

            `;

        } else {

            /*
             * DARK NEON
             */

            css += `

                html,
                body {

                    background:#030712 !important;

                    color:#F8FAFC !important;
                }

                .top-header-container,
                .container,
                .stats-banner,
                .search-bar-box,
                .stat-box {

                    background:#0F172A !important;

                    color:#F8FAFC !important;
                }

                 input,
            select {

             background: #FFFFFF !important;

             color: #1E2B23 !important;
        }


            `;
        }


        const style =
            document.createElement(
                "style"
            );


        style.id =
            "global-perfect-theme";


        style.innerHTML =
            css;


        document.head.appendChild(
            style
        );
    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            applyGlobalTheme
        );

    } else {

        applyGlobalTheme();
    }


    window.applySystemTheme =
        applyGlobalTheme;


    window.addEventListener(
        "storage",
        applyGlobalTheme
    );

})();