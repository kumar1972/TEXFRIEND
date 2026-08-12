// config.js - TEXFRIEND ERP (Ultimate Cloud Sync Version)

window.isDemo = false; 

// 🛠️ Local Storage Helpers
window.localLoad = function(key) {
    try {
        let data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch(e) {
        console.error("localLoad Error for key:", key, e);
        return null;
    }
};

window.localSave = function(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch(e) {
        console.error("localSave Error for key:", key, e);
    }
};

// 🔥 FIREBASE INITIALIZATION
const firebaseConfig = {
    apiKey: "AIzaSyDYPLOPZnOlPvCzNeZXuS7yHTf2sUe-SFM",
    authDomain: "texfriend.firebaseapp.com",
    projectId: "texfriend",
    storageBucket: "texfriend.appspot.com",
    messagingSenderId: "331673079578",
    appId: "1:331673079578:web:e8c2ea6c41e6359d3f66a3",
    measurementId: "G-2NP13ZTKCN"
};

window.db = null; window._doc = null; window._setDoc = null; window._getDoc = null;

// 🔥 Firebase Async Connection & Auto-Sync on Startup
import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js").then((firebaseApp) => {
    const app = firebaseApp.initializeApp(firebaseConfig);
    import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js").then((firebaseFirestore) => {
        window.db = firebaseFirestore.getFirestore(app);
        window._doc = firebaseFirestore.doc; 
        window._setDoc = firebaseFirestore.setDoc; 
        window._getDoc = firebaseFirestore.getDoc;
        console.log("🔥 Firebase Connected!");

        let mainKeys = [
            'design_specs', 'pre_design_numbers', 'design_masters_data', 
            'warping_issue_records', 'weaving_master_data', 'weaving_warp_trans', 
            'weaving_weft_trans', 'party_orders_data', 'dyeing_issue_records', 
            'dyeing_receive_records', 'tex_master_weavers', 'tex_master_warping_units',
            'washing_issue_records', 'washing_receive_records', 'tex_master_washing_units',
            'kora_stock_records', 'kora_issue_records', 'tex_master_mills', 
            'tex_master_units', 'tex_master_counts', 'party_master_db', 'user_permissions', 'erp_system_users'
        ];

        mainKeys.forEach(key => {
            window._getDoc(window._doc(window.db, "texfriend_erp", key)).then(docSnap => {
                if (docSnap.exists()) {
                    try {
                        let cloudData = JSON.parse(docSnap.data().content);
                        let localData = localStorage.getItem(key);
                        if (!localData || localData === "[]" || localData === "{}") {
                            localStorage.setItem(key, JSON.stringify(cloudData));
                        }
                    } catch(err) {}
                }
            }).catch(e => {});
        });
    });
});

window.firebaseLoad = function(key) { return window.localLoad(key); };
window.firebaseSave = function(key, data) {
    window.localSave(key, data);
    if (window.db) {
        window._setDoc(window._doc(window.db, "texfriend_erp", key), { content: JSON.stringify(data) }).catch(e => {});
    }
};
window.firebaseSaveIndividual = function(key, data) { window.firebaseSave(key, data); };

// 🌟 UNIVERSAL CROSS-PAGE DATA FETCH UTILITY
window.getCrossPageData = function(designNo, recordKey) {
    let cleanTarget = designNo ? designNo.toString().replace('#', '').trim().toLowerCase() : '';
    if (!cleanTarget) return null;
    try {
        let records = JSON.parse(localStorage.getItem(recordKey)) || [];
        let match = records.slice().reverse().find(r => {
            let d = r.designNo || r.designNumber || r.design || r.name || "";
            return d.toString().replace('#', '').trim().toLowerCase() === cleanTarget;
        });
        if (match) return match;
        let specs = JSON.parse(localStorage.getItem('design_specs')) || {};
        let specKey = Object.keys(specs).find(k => k.toString().replace('#', '').trim().toLowerCase() === cleanTarget);
        if (specKey && specs[specKey]) return specs[specKey];
    } catch(e) {}
    return null;
};

window.texMasterList = {
    mills: [], weavers: [], dyeingNames: [], warpingNames: [],
    sizingNames: [], washingNames: [], counts: ["2/40s", "2/60s", "30s"], colours: ["White", "Black", "Navy Blue", "Maroon"]
};

window.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        try {
            let designSpecs = JSON.parse(localStorage.getItem('design_specs')) || {};
            let preDesignList = JSON.parse(localStorage.getItem('pre_design_numbers')) || JSON.parse(localStorage.getItem('tex_master_designs')) || [];
            preDesignList.forEach(d => {
                let name = typeof d === 'object' ? (d.designNo || d.designNumber || '') : d;
                if(name) {
                    let clean = name.toString().replace('#', '').trim().toLowerCase();
                    let exists = Object.keys(designSpecs).some(k => k.toString().replace('#', '').trim().toLowerCase() === clean);
                    if(!exists) designSpecs[name] = { designNumber: name, status: 'running' };
                }
            });
            let combinedList = Array.from(new Set([...preDesignList, ...Object.keys(designSpecs)]));
            localStorage.setItem('design_specs', JSON.stringify(designSpecs));
            localStorage.setItem('pre_design_numbers', JSON.stringify(combinedList));

            let dropdowns = document.querySelectorAll('select');
            dropdowns.forEach(function(select) {
                let idOrClass = (select.id + " " + select.className).toLowerCase();
                if (idOrClass.includes('design') || select.id === 'designNumber' || select.id === 'designSelect' || select.classList.contains('item-design')) {
                    if (select.options.length <= 1) {
                        let currentVal = select.value;
                        let html = '<option value="">Select Design No</option>';
                        combinedList.forEach(function(d) {
                            let name = typeof d === 'object' ? (d.designNo || d.designNumber || '') : d;
                            if(name) html += '<option value="' + name + '">' + name + '</option>';
                        });
                        select.innerHTML = html;
                        if (currentVal) select.value = currentVal;
                    }
                }
            });
        } catch(err) {}
    }, 400);
});


// 🌟 ========================================================== 🌟
// 🎨 UNIVERSAL LIGHT & DULL MULTI-THEME ENGINE (SOFT GREEN UNTOUCHED)
// 🌟 ========================================================== 🌟
(function() {
    function applyGlobal3Themes() {
        let savedMode = localStorage.getItem('erp_theme_mode') || 'softgreen';
        let oldStyle = document.getElementById('global-perfect-theme');
        if (oldStyle) oldStyle.remove();

        // 📐 Universal Responsive Width Rule Matching 2nd Image
        let commonWidthCSS = `
            .container, .main-card, .form-container, .card {
                width: 96% !important;
                max-width: 1100px !important;
                margin: 0 auto !important;
            }
        `;

        let css = commonWidthCSS;

        /* ------------------------------------------------------------- */
        /* 🌿 1. SOFT GREEN THEME (உங்களின் 1st இமேஜ் - மாற்றவே இல்லை)   */
        /* ------------------------------------------------------------- */
        if (savedMode === 'softgreen') {
            css += `
                body, html { 
                    background-color: #D2DCD2 !important; 
                    color: #1A3320 !important;            
                }
                .top-header-container, .container, .main-card, .form-section, .form-section-box, .warping-beam-tab, .modal-content, .stats-banner, .search-bar-box, .stat-box {
                    background: #E2EAE2 !important;       
                    border-color: #B5C6B5 !important;     
                    color: #1A3320 !important;            
                    box-shadow: 0 6px 18px rgba(0,0,0,0.06) !important;
                }
                .top-header-container h3, h1, h2, h3, h4, label, .section-title, .page-title, .stat-value {
                    color: #23432B !important;            
                    background: none !important;
                    -webkit-text-fill-color: #23432B !important;
                }
                input, select {
                    background-color: #CBD8CB !important; 
                    color: #112416 !important;            
                    border: 1px solid #A2B7A2 !important; 
                }
                table, .table-container, div[style*="background: white"], div[style*="background:#fff"] {
                    background-color: #E2EAE2 !important;
                    color: #1A3320 !important;
                }
                th { 
                    background-color: #CBD8CB !important; 
                    color: #23432B !important;            
                    border-color: #B5C6B5 !important;     
                }
                td { 
                    background-color: #E2EAE2 !important;
                    color: #1A3320 !important;            
                    border-color: #D2DCD2 !important;     
                }
            `;
        } 
        
        /* ------------------------------------------------------------- */
        /* 🌲 2. DARK GREEN THEME (1st இமேஜ் போல Light & Dull Soft Green)*/
        /* ------------------------------------------------------------- */
        else if (savedMode === 'darkgreen') {
            css += `
                body, html { 
                    background-color: #C8D8CE !important; /* Muted Soft Dull Sage Green */
                    color: #132A1C !important;            
                }
                .top-header-container, .container, .main-card, .form-section, .form-section-box, .warping-beam-tab, .modal-content, .stats-banner, .search-bar-box, .stat-box {
                    background: #D8E5DC !important;       /* Soft Light Green Cards */
                    border-color: #9EBDAC !important;     
                    color: #132A1C !important;            
                    box-shadow: 0 6px 18px rgba(0,0,0,0.05) !important;
                }
                .top-header-container h3, h1, h2, h3, h4, label, .section-title, .page-title, .stat-value {
                    color: #1B3D27 !important;            
                    background: none !important;
                    -webkit-text-fill-color: #1B3D27 !important;
                }
                input, select {
                    background-color: #C2D4CC !important; 
                    color: #0A1C12 !important;            
                    border: 1px solid #8EAD9C !important; 
                }
                table, .table-container, div[style*="background: white"], div[style*="background:#fff"] {
                    background-color: #D8E5DC !important;
                    color: #132A1C !important;
                }
                th { 
                    background-color: #C2D4CC !important; 
                    color: #1B3D27 !important;            
                    border-color: #9EBDAC !important;     
                }
                td { 
                    background-color: #D8E5DC !important;
                    color: #132A1C !important;            
                    border-color: #C8D8CE !important;     
                }
            `;
        } 

        /* ------------------------------------------------------------- */
        /* 🌄 3. SUNSET GOLD THEME (1st இமேஜ் போல Light & Dull Soft Gold)*/
        /* ------------------------------------------------------------- */
        else if (savedMode === 'sunset') {
            css += `
                body, html { 
                    background-color: #E2D9C8 !important; /* Muted Light Dull Sand Gold */
                    color: #33230F !important; 
                }
                .top-header-container, .container, .main-card, .form-section, .form-section-box, .warping-beam-tab, .modal-content, .stats-banner, .search-bar-box, .stat-box {
                    background: #EEE5D8 !important;       /* Light Warm Gold Cards */
                    border-color: #C2AF95 !important; 
                    color: #33230F !important;
                    box-shadow: 0 6px 18px rgba(0,0,0,0.05) !important;
                }
                .top-header-container h3, h1, h2, h3, h4, label, .section-title, .page-title, .stat-value {
                    color: #4A3315 !important; 
                    background: none !important;
                    -webkit-text-fill-color: #4A3315 !important;
                }
                input, select {
                    background-color: #D8CBB7 !important;
                    color: #211608 !important;
                    border: 1px solid #B29D7D !important;
                }
                table, .table-container, div[style*="background: white"], div[style*="background:#fff"] {
                    background-color: #EEE5D8 !important;
                    color: #33230F !important;
                }
                th { 
                    background-color: #D8CBB7 !important; 
                    color: #4A3315 !important; 
                    border-color: #C2AF95 !important; 
                }
                td { 
                    background-color: #EEE5D8 !important; 
                    color: #33230F !important; 
                    border-color: #E2D9C8 !important; 
                }
            `;
        }

        /* ------------------------------------------------------------- */
        /* 🌌 4. DARK NEON THEME (1st இமேஜ் போல Light & Dull Soft Blue)  */
        /* ------------------------------------------------------------- */
        else {
            css += `
                body, html { 
                    background-color: #CDD7E2 !important; /* Muted Light Dull Blue Gray */
                    color: #122133 !important; 
                }
                .top-header-container, .container, .main-card, .form-section, .form-section-box, .warping-beam-tab, .modal-content, .stats-banner, .search-bar-box, .stat-box {
                    background: #DAE3ED !important;       /* Light Soft Slate Cards */
                    border-color: #A3B8CC !important; 
                    color: #122133 !important; 
                    box-shadow: 0 6px 18px rgba(0,0,0,0.05) !important;
                }
                .top-header-container h3, h1, h2, h3, h4, label, .section-title, .page-title, .stat-value {
                    color: #1B334D !important; 
                    background: none !important;
                    -webkit-text-fill-color: #1B334D !important;
                }
                input, select {
                    background-color: #BCCCDD !important; 
                    color: #0A1524 !important; 
                    border: 1px solid #8FA8C2 !important; 
                }
                table, .table-container, div[style*="background: white"], div[style*="background:#fff"] {
                    background-color: #DAE3ED !important;
                    color: #122133 !important;
                }
                th { 
                    background-color: #BCCCDD !important; 
                    color: #1B334D !important; 
                    border-color: #A3B8CC !important; 
                }
                td { 
                    background-color: #DAE3ED !important; 
                    color: #122133 !important; 
                    border-color: #CDD7E2 !important; 
                }
            `;
        }

        let style = document.createElement('style');
        style.id = 'global-perfect-theme';
        style.innerHTML = css;
        document.head.appendChild(style);
    }

    if(document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyGlobal3Themes);
    } else {
        applyGlobal3Themes();
    }

    window.addEventListener('storage', applyGlobal3Themes);
    window.applySystemTheme = applyGlobal3Themes;
})();
