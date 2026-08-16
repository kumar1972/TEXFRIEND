// ============================================================
// TEXFRIEND ERP
// config.js - Ultimate Firebase Cloud Sync + Theme Engine
// ============================================================

window.isDemo = false;

// ============================================================
// LOCAL STORAGE HELPERS
// ============================================================

window.localLoad = function (key, fallback = null) {
    try {
        const raw = localStorage.getItem(key);
        if (raw === null || raw === "") return fallback;
        try {
            const parsed = JSON.parse(raw);
            return parsed ?? fallback;
        } catch (jsonError) {
            return raw;
        }
    } catch (error) {
        console.error("localLoad Error:", key, error);
        return fallback;
    }
};

window.localSave = function (key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
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
    apiKey: "AIzaSyDYPLOPZnOlPvCzNeZXuS7yHTf2sUe-SFM",
    authDomain: "texfriend.firebaseapp.com",
    projectId: "texfriend",
    storageBucket: "texfriend.appspot.com",
    messagingSenderId: "331673079578",
    appId: "1:331673079578:web:e8c2ea6c41e6359d3f66a3",
    measurementId: "G-2NP13ZTKCN"
};

// ============================================================
// GLOBAL FIREBASE REFERENCES
// ============================================================

window.db = null;
window._firebaseApp = null;
window._doc = null;
window._setDoc = null;
window._getDoc = null;
window._deleteDoc = null;
window._collection = null;
window._getDocs = null;

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
    "erp_system_users",
    "master_settings"
];

// ============================================================
// CLOUD → LOCAL SYNC FUNCTION
// ============================================================

window.syncERPFromCloud = async function () {
    if (!window.db || !window._doc || !window._getDoc) {
        throw new Error("Firebase Firestore is not ready");
    }

    const keys = window.erpCloudKeys || [];
    console.log("☁️ Downloading ERP Cloud Data...");

    const promises = keys.map(async function (key) {
        try {
            const ref = window._doc(window.db, "texfriend_erp", key);
            const snap = await window._getDoc(ref);

            if (!snap.exists()) return;

            const cloudContent = snap.data()?.content;
            if (cloudContent === undefined || cloudContent === null) return;

            let cloudData;
            if (typeof cloudContent === "object") {
                cloudData = cloudContent;
            } else {
                try {
                    cloudData = JSON.parse(cloudContent);
                } catch (parseError) {
                    cloudData = cloudContent;
                }
            }

            localStorage.setItem(key, JSON.stringify(cloudData));
            console.log("☁️ Synced:", key);
        } catch (error) {
            console.error("Cloud Fetch Error:", key, error);
        }
    });

    await Promise.all(promises);

    try {
        if (typeof window.populateDropdowns === "function") {
            window.populateDropdowns();
        }
    } catch (error) {
        console.warn("Dropdown rebuild warning:", error);
    }

    console.log("✅ All ERP Cloud Data Downloaded");
};

// ============================================================
// LOCAL → CLOUD SAVE
// ============================================================

window.firebaseSave = async function (key, data) {
    window.localSave(key, data);

    if (!window.db || !window._doc || !window._setDoc) {
        console.warn("Firebase not ready. Local save only:", key);
        return false;
    }

    try {
        const ref = window._doc(window.db, "texfriend_erp", key);
        await window._setDoc(
            ref,
            {
                content: JSON.stringify(data),
                updatedAt: new Date().toISOString()
            },
            { merge: true }
        );
        console.log("☁️ Cloud Saved:", key);
        return true;
    } catch (error) {
        console.error("❌ Firebase Save Error:", key, error);
        return false;
    }
};

window.firebaseSaveIndividual = function (key, data) {
    return window.firebaseSave(key, data);
};

window.firebaseLoad = function (key, fallback = null) {
    return window.localLoad(key, fallback);
};

// ============================================================
// FIREBASE INITIALIZATION EXECUTION
// ============================================================

window.cloudSyncPromise = (async function () {
    try {
        console.log("🔥 Starting Firebase...");

        const firebaseApp = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js");

        if (firebaseApp.getApps && firebaseApp.getApps().length > 0) {
            window._firebaseApp = firebaseApp.getApps()[0];
        } else {
            window._firebaseApp = firebaseApp.initializeApp(firebaseConfig);
        }

        const firebaseFirestore = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");

        window.db = firebaseFirestore.getFirestore(window._firebaseApp);
        window._doc = firebaseFirestore.doc;
        window._setDoc = firebaseFirestore.setDoc;
        window._getDoc = firebaseFirestore.getDoc;
        window._deleteDoc = firebaseFirestore.deleteDoc;
        window._collection = firebaseFirestore.collection;
        window._getDocs = firebaseFirestore.getDocs;

        window.firebaseConnected = true;
        console.log("🔥 Firebase Connected");

        await window.syncERPFromCloud();

        window.cloudSyncReady = true;
        console.log("✅ TEXFRIEND Cloud Sync Completed");

        window.dispatchEvent(new CustomEvent("texfriend-cloud-sync-complete"));
        return true;
    } catch (error) {
        console.error("❌ Firebase Initialization Error:", error);
        window.firebaseConnected = false;
        window.cloudSyncReady = false;
        window.dispatchEvent(new CustomEvent("texfriend-cloud-sync-error", { detail: error }));
        return false;
    }
})();

// ============================================================
// FACTORY RESET CLOUD & LOCAL CACHE
// ============================================================

window.factoryResetCloud = async function () {
    const isConfirmed = window.confirm("⚠️ FACTORY RESET WARNING\n\nFirebase Cloud + Local ERP Data அனைத்தும் நிரந்தரமாக அழிக்கப்படும்.\n\nCONTINUE செய்ய OK அழுத்தவும்.");
    if (!isConfirmed) return;

    const finalConfirm = window.confirm("🚨 FINAL CONFIRMATION 🚨\n\nOK = DELETE EVERYTHING\nCancel = KEEP DATA");
    if (!finalConfirm) return;

    if (!window.db || !window._doc || !window._deleteDoc) {
        alert("❌ Firebase connect ஆகவில்லை. சில நொடிகள் கழித்து முயற்சிக்கவும்.");
        return;
    }

    try {
        const keys = window.erpCloudKeys || [];
        const deletePromises = keys.map(async function (key) {
            try {
                const ref = window._doc(window.db, "texfriend_erp", key);
                await window._deleteDoc(ref);
            } catch (e) {
                console.error("Delete Error:", key, e);
            }
        });

        await Promise.all(deletePromises);
        localStorage.clear();
        sessionStorage.clear();
        window.cloudSyncReady = false;

        alert("✅ FACTORY RESET COMPLETED!");
        window.location.href = "index.html";
    } catch (error) {
        alert("❌ Factory Reset Failed: " + error.message);
    }
};

window.clearLocalCache = function () {
    if (!window.confirm("🧹 CLEAR LOCAL CACHE\n\nLocal Cache மட்டும் அழிக்கப்படும். Cloud Data பாதுகாப்பாக இருக்கும்.")) return;
    try {
        localStorage.clear();
        sessionStorage.clear();
        alert("✅ Local Cache Cleared!");
        window.location.reload();
    } catch (error) {
        alert("❌ Clear Cache Error: " + error.message);
    }
};

window.handleCloudReset = window.factoryResetCloud;
window.handleLocalReset = window.clearLocalCache;

// ============================================================
// WAIT FOR CLOUD SYNC
// ============================================================

window.waitForCloudSync = function (timeout = 15000) {
    if (window.cloudSyncReady) return Promise.resolve(true);

    return new Promise(function (resolve) {
        let finished = false;

        function done(val) {
            if (finished) return;
            finished = true;
            window.removeEventListener("texfriend-cloud-sync-complete", onSuccess);
            window.removeEventListener("texfriend-cloud-sync-error", onFailure);
            resolve(val);
        }

        function onSuccess() { done(true); }
        function onFailure() { done(false); }

        window.addEventListener("texfriend-cloud-sync-complete", onSuccess);
        window.addEventListener("texfriend-cloud-sync-error", onFailure);

        setTimeout(function () { done(!!window.cloudSyncReady); }, timeout);
    });
};

// ============================================================
// CROSS PAGE DATA & DROPDOWNS
// ============================================================

window.getCrossPageData = function (designNo, recordKey) {
    const cleanTarget = designNo ? String(designNo).replace("#", "").trim().toLowerCase() : "";
    if (!cleanTarget) return null;

    try {
        const records = window.localLoad(recordKey, []);
        if (Array.isArray(records)) {
            const match = records.slice().reverse().find(function (r) {
                if (!r || typeof r !== "object") return false;
                const d = r.designNo || r.designNumber || r.design || r.name || "";
                return String(d).replace("#", "").trim().toLowerCase() === cleanTarget;
            });
            if (match) return match;
        }

        const specs = window.localLoad("design_specs", {});
        if (specs && typeof specs === "object") {
            const key = Object.keys(specs).find(function (k) {
                return String(k).replace("#", "").trim().toLowerCase() === cleanTarget;
            });
            if (key && specs[key]) return specs[key];
        }
    } catch (error) {
        console.error("getCrossPageData Error:", error);
    }
    return null;
};

window.populateDropdowns = function () {
    try {
        const designSpecs = window.localLoad("design_specs", {});
        let preDesignList = window.localLoad("pre_design_numbers", null) || window.localLoad("tex_master_designs", []);
        if (!Array.isArray(preDesignList)) preDesignList = [];

        const cleaned = preDesignList.map(d => typeof d === "object" && d !== null ? (d.designNo || d.designNumber || "") : d).filter(Boolean);

        cleaned.forEach(name => {
            const clean = String(name).replace("#", "").trim().toLowerCase();
            const exists = Object.keys(designSpecs).some(k => String(k).replace("#", "").trim().toLowerCase() === clean);
            if (!exists) {
                designSpecs[name] = { designNumber: name, status: "running" };
            }
        });

        const combined = Array.from(new Set([...cleaned, ...Object.keys(designSpecs)]));
        localStorage.setItem("design_specs", JSON.stringify(designSpecs));
        localStorage.setItem("pre_design_numbers", JSON.stringify(combined));

        document.querySelectorAll("select").forEach(function (select) {
            const id = (String(select.id || "") + " " + String(select.className || "")).toLowerCase();
            if (id.includes("design") || select.id === "designNumber" || select.id === "designSelect" || select.classList.contains("item-design")) {
                const current = select.value;
                select.innerHTML = '<option value="">Select Design No</option>';
                combined.forEach(function (name) {
                    const opt = document.createElement("option");
                    opt.value = name;
                    opt.textContent = name;
                    select.appendChild(opt);
                });
                if (current) select.value = current;
            }
        });
    } catch (error) {
        console.error("Dropdown Populate Error:", error);
    }
};

window.addEventListener("DOMContentLoaded", function () {
    window.populateDropdowns();
});

// ============================================================
// GLOBAL THEME ENGINE
// ============================================================

(function () {
    function applyGlobalTheme() {
        const savedMode = localStorage.getItem("erp_theme_mode") || "dark";
        const old = document.getElementById("global-perfect-theme");
        if (old) old.remove();

        let css = `
        html, body { min-height: 100% !important; margin: 0 !important; transition: background 0.3s ease, color 0.3s ease; }
        .container, .main-card, .form-container, .card { width: 96% !important; max-width: 1100px !important; margin-left: auto !important; margin-right: auto !important; }
        `;

        if (savedMode === "dark") {
            css += `
            html, body { background: #030712 !important; color: #F8FAFC !important; }
            .top-header-container, .container, .main-card, .form-container, .card { background: #0F172A !important; color: #F8FAFC !important; border-color: #38BDF8 !important; }
            .stats-banner, .stat-box { background: #111827 !important; color: #F8FAFC !important; border-color: #38BDF8 !important; }
            .stat-value, .live-clock { color: #38BDF8 !important; }
            .menu-btn { border-color: #38BDF8 !important; }
            input, select, textarea { background: #FFFFFF !important; color: #111827 !important; border-color: #CBD5E1 !important; }
            `;
        } else if (savedMode === "softgreen") {
            css += `
            html, body { background: #ECFDF5 !important; color: #064E3B !important; }
            .top-header-container, .container, .main-card, .form-container, .card { background: #D1FAE5 !important; color: #064E3B !important; border-color: #10B981 !important; }
            .stats-banner, .stat-box { background: #ECFDF5 !important; color: #064E3B !important; border-color: #34D399 !important; }
            .stat-value, .live-clock { color: #059669 !important; }
            .menu-btn { border-color: #34D399 !important; }
            input, select, textarea { background: #FFFFFF !important; color: #064E3B !important; border-color: #A7F3D0 !important; }
            `;
        } else if (savedMode === "darkgreen") {
            css += `
            html, body { background: #021C12 !important; color: #ECFDF5 !important; }
            .top-header-container, .container, .main-card, .form-container, .card { background: #063B27 !important; color: #ECFDF5 !important; border-color: #22C55E !important; }
            .stats-banner, .stat-box { background: #075E45 !important; color: #ECFDF5 !important; border-color: #22C55E !important; }
            .stat-value, .live-clock { color: #4ADE80 !important; }
            .menu-btn { border-color: #22C55E !important; }
            input, select, textarea { background: #FFFFFF !important; color: #064E3B !important; border-color: #86EFAC !important; }
            `;
        } else if (savedMode === "sunset") {
            css += `
            html, body { background: #1C0F05 !important; color: #FFF7ED !important; }
            .top-header-container, .container, .main-card, .form-container, .card { background: #3B1F0B !important; color: #FFF7ED !important; border-color: #F59E0B !important; }
            .stats-banner, .stat-box { background: #6B3508 !important; color: #FFF7ED !important; border-color: #FBBF24 !important; }
            .stat-value, .live-clock { color: #FBBF24 !important; }
            .menu-btn { border-color: #F59E0B !important; }
            input, select, textarea { background: #FFFFFF !important; color: #7C2D12 !important; border-color: #FCD34D !important; }
            `;
        } else if (savedMode === "royalblue") {
            css += `
            html, body { background: #050B2E !important; color: #EEF2FF !important; }
            .top-header-container, .container, .main-card, .form-container, .card { background: #101A4C !important; color: #EEF2FF !important; border-color: #6366F1 !important; }
            .stats-banner, .stat-box { background: #1E3A8A !important; color: #EEF2FF !important; border-color: #818CF8 !important; }
            .stat-value, .live-clock { color: #A5B4FC !important; }
            .menu-btn { border-color: #818CF8 !important; }
            input, select, textarea { background: #FFFFFF !important; color: #172554 !important; border-color: #A5B4FC !important; }
            `;
        }

        const style = document.createElement("style");
        style.id = "global-perfect-theme";
        style.innerHTML = css;
        document.head.appendChild(style);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", applyGlobalTheme);
    } else {
        applyGlobalTheme();
    }

    window.applySystemTheme = applyGlobalTheme;

    window.setTheme = function (themeName) {
        const validThemes = ["dark", "softgreen", "darkgreen", "sunset", "royalblue"];
        if (!validThemes.includes(themeName)) return;
        localStorage.setItem("erp_theme_mode", themeName);
        applyGlobalTheme();
    };

    window.addEventListener("storage", function (event) {
        if (event.key === "erp_theme_mode") {
            applyGlobalTheme();
        }
    });
})();

console.log("✅ TEXFRIEND config.js loaded successfully");
