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
// NOTIFICATION HELPER
// ============================================================

window.showNotification = function(message, type = 'success') {
    const oldNotif = document.getElementById('erp-custom-notification');
    if (oldNotif) oldNotif.remove();

    const notification = document.createElement('div');
    notification.id = 'erp-custom-notification';
    notification.innerText = message;
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = type === 'success' ? '#10B981' : '#EF4444';
    notification.style.color = 'white';
    notification.style.padding = '12px 24px';
    notification.style.borderRadius = '8px';
    notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    notification.style.zIndex = '999999';
    notification.style.fontFamily = 'sans-serif';
    notification.style.fontSize = '14px';
    notification.style.fontWeight = '600';
    notification.style.transition = 'opacity 0.3s ease';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
};

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
// LOCAL → CLOUD SAVE (NO POPUP - AUTO BOTH)
// ============================================================

window.firebaseSave = async function (key, data) {
    // 1. எப்போதுமே Local-ல் சேமிக்கும்
    window.localSave(key, data);

    // 2. இணையம்/Cloud தயாராக இருந்தால் Cloud-லும் சேமிக்கும்
    if (window.db && window._setDoc) {
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
            window.showNotification("Successfully Saved (Local & Cloud)!");
            return true;
        } catch (error) {
            console.error("❌ Firebase Save Error:", key, error);
            window.showNotification("Saved Locally! (Cloud Failed)", "error");
            return false;
        }
    } else {
        window.showNotification("Successfully Saved Locally!");
        return true;
    }
};

window.firebaseSaveIndividual = function (key, data, storageType = 'both') {
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

// ============================================================
// ENTER KEY NAVIGATION (STEP-BY-STEP ACROSS TABS / INPUTS)
// ============================================================

document.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        const activeElement = document.activeElement;
        
        if (!activeElement) return;

        // Textarea-ல் Enter அழுத்தும்போது புதிய வரிக்குச் செல்ல அனுமதித்தல் (Newline)
        if (activeElement.tagName === 'TEXTAREA') {
            return;
        }

        // Edit அல்லது Delete பட்டன்கள் மீது Enter அழுத்தினால் இயல்பான செயல்பாடு தொடரும்
        if (activeElement.classList.contains('edit-btn') || activeElement.classList.contains('delete-btn') ||
            activeElement.id === 'editBtn' || activeElement.id === 'deleteBtn') {
            return;
        }

        // டேப்கள் மற்றும் இன்புட் புலங்களை வரிசைப்படுத்துதல்
        const focusableElements = Array.from(document.querySelectorAll(
            'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )).filter(el => {
            return el.offsetParent !== null && 
                   !el.classList.contains('edit-btn') && 
                   !el.classList.contains('delete-btn');
        });

        const currentIndex = focusableElements.indexOf(activeElement);
        
        if (currentIndex > -1 && currentIndex < focusableElements.length - 1) {
            event.preventDefault();
            focusableElements[currentIndex + 1].focus();
            if (focusableElements[currentIndex + 1].tagName === 'INPUT' && focusableElements[currentIndex + 1].type === 'text') {
                focusableElements[currentIndex + 1].select();
            }
        }
    }
});

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
/* =========================================================
   SMART MOVABLE DISPLAY SIZE ADJUSTER (Perfect Mobile Click Fix)
   Added to Config.js to work across all ERP pages
========================================================= */

document.addEventListener("DOMContentLoaded", function() {

    // ஏற்கனவே பட்டன் இருந்தால் மீண்டும் வராமல் தடுக்க
    if(document.getElementById('texfriend-display-controller')) return;

    // சேமிக்கப்பட்ட பழைய அளவை எடுத்தல் அல்லது Default 100% (1.0)
    let currentZoom = parseFloat(localStorage.getItem('texfriend_zoom_level')) || 1.0;
    applyZoom(currentZoom);

    // கடைசியாக நகர்த்தி வைத்த இடத்தை நினைவில் கொள்ளுதல் 
    let savedTop = localStorage.getItem('texfriend_zoom_top') || '15px';
    let savedLeft = localStorage.getItem('texfriend_zoom_left') || (window.innerWidth - 65) + 'px';

    const controllerDiv = document.createElement('div');
    controllerDiv.id = 'texfriend-display-controller';
    controllerDiv.style.position = 'fixed';
    controllerDiv.style.top = savedTop;
    controllerDiv.style.left = savedLeft;
    controllerDiv.style.zIndex = '999999';

    controllerDiv.innerHTML = `
        <div id="btnToggleZoom" style="touch-action: none; user-select: none; -webkit-user-select: none; background: linear-gradient(135deg, #059669, #10B981); color: white; width: 45px; height: 45px; border-radius: 50%; font-size: 20px; cursor: pointer; box-shadow: 0 6px 18px rgba(16, 185, 129, 0.4); display: flex; align-items: center; justify-content: center; transition: background 0.3s ease;">
            🔍
        </div>
        <div id="zoomAppPanel" style="display: none; flex-direction: column; gap: 10px; background: rgba(18, 30, 25, 0.95); backdrop-filter: blur(8px); border: 1px solid #4A7C59; padding: 12px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.6); color: white; width: 150px; position: absolute; top: 55px; right: 0;">
            <div style="font-size: 10px; font-weight: 800; text-align: center; color: #78d18a;">SCREEN SIZE</div>
            <div style="display: flex; justify-content: space-between; align-items: center; background: #080f0c; border-radius: 8px; padding: 5px;">
                <div id="btnZoomOut" style="color:#EF4444; font-size:22px; cursor:pointer; width:30px; height:30px; display:flex; align-items:center; justify-content:center; font-weight:bold; user-select: none;">-</div>
                <span id="zoomLabel" style="font-size: 13px; font-weight: bold;">${Math.round(currentZoom * 100)}%</span>
                <div id="btnZoomIn" style="color:#10B981; font-size:20px; cursor:pointer; width:30px; height:30px; display:flex; align-items:center; justify-content:center; font-weight:bold; user-select: none;">+</div>
            </div>
            <div id="btnFitScreen" style="background: #3B82F6; color: white; padding: 8px; border-radius: 6px; font-size: 11px; font-weight: bold; text-align: center; cursor: pointer; user-select: none;">Fit to Screen</div>
        </div>
    `;
    document.body.appendChild(controllerDiv);

    const btnToggle = document.getElementById('btnToggleZoom');
    const panel = document.getElementById('zoomAppPanel');
    let isPanelOpen = false;

    let didMove = false;
    let startX, startY, initialX, initialY;

    // --- 📱 MOBILE TOUCH LOGIC ---
    btnToggle.addEventListener('touchstart', function(e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        initialX = controllerDiv.offsetLeft;
        initialY = controllerDiv.offsetTop;
        didMove = false;
    }, {passive: true});

    btnToggle.addEventListener('touchmove', function(e) {
        let dx = e.touches[0].clientX - startX;
        let dy = e.touches[0].clientY - startY;
        // 5 பிக்சலுக்கு மேல் நகர்ந்தால் மட்டுமே Drag ஆக கணக்கிடப்படும்
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            didMove = true;
            controllerDiv.style.left = (initialX + dx) + 'px';
            controllerDiv.style.top = (initialY + dy) + 'px';
            controllerDiv.style.right = 'auto';
            e.preventDefault(); 
        }
    }, {passive: false});

    btnToggle.addEventListener('touchend', function(e) {
        if(didMove) {
            localStorage.setItem('texfriend_zoom_top', controllerDiv.style.top);
            localStorage.setItem('texfriend_zoom_left', controllerDiv.style.left);
        }
    });

    // --- 💻 PC MOUSE LOGIC ---
    btnToggle.addEventListener('mousedown', function(e) {
        startX = e.clientX;
        startY = e.clientY;
        initialX = controllerDiv.offsetLeft;
        initialY = controllerDiv.offsetTop;
        didMove = false;

        function onMouseMove(me) {
            let dx = me.clientX - startX;
            let dy = me.clientY - startY;
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                didMove = true;
                controllerDiv.style.left = (initialX + dx) + 'px';
                controllerDiv.style.top = (initialY + dy) + 'px';
                controllerDiv.style.right = 'auto';
            }
        }

        function onMouseUp() {
            if (didMove) {
                localStorage.setItem('texfriend_zoom_top', controllerDiv.style.top);
                localStorage.setItem('texfriend_zoom_left', controllerDiv.style.left);
            }
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    // --- 🟢 CLICK & CLOSE FIX 🟢 ---
    btnToggle.addEventListener('click', function(e) {
        // ஒருவேளை ஐகானை நகர்த்தியிருந்தால் (Dragged), அதை க்ளிக்காக எடுத்துக்கொள்ளாது!
        if (didMove) {
            didMove = false;
            return; 
        }
        togglePanel();
    });

    function togglePanel() {
        isPanelOpen = !isPanelOpen;
        panel.style.display = isPanelOpen ? 'flex' : 'none';
        btnToggle.innerHTML = isPanelOpen ? '✖' : '🔍';
        btnToggle.style.background = isPanelOpen ? 'linear-gradient(135deg, #EF4444, #DC2626)' : 'linear-gradient(135deg, #059669, #10B981)';
    }

    // --- ZOOM BUTTON ACTIONS ---
    document.getElementById('btnZoomIn').onclick = () => { if(currentZoom < 2.0) currentZoom += 0.05; updateZoom(); };
    document.getElementById('btnZoomOut').onclick = () => { if(currentZoom > 0.4) currentZoom -= 0.05; updateZoom(); };
    document.getElementById('btnFitScreen').onclick = () => { currentZoom = 1.0; updateZoom(); };

    function updateZoom() {
        applyZoom(currentZoom);
        document.getElementById('zoomLabel').innerText = Math.round(currentZoom * 100) + '%';
    }

    function applyZoom(val) {
        document.body.style.zoom = val;
        // Firefox பிரவுசருக்கான மாற்று ஏற்பாடு 
        if(navigator.userAgent.toLowerCase().indexOf('firefox') > -1){
            document.body.style.transform = `scale(${val})`;
            document.body.style.transformOrigin = 'top left';
            document.body.style.width = `${100 / val}%`;
        }
        localStorage.setItem('texfriend_zoom_level', val);
    }
});

