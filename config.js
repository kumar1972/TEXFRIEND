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

        // 🌟 Auto sync all main ERP keys from Cloud to LocalStorage if local is empty
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
                        // If local data is missing or empty, restore from cloud automatically
                        if (!localData || localData === "[]" || localData === "{}") {
                            localStorage.setItem(key, JSON.stringify(cloudData));
                            console.log(`☁️ Restored ${key} from Cloud!`);
                        }
                    } catch(err) {
                        console.error("JSON parse error on sync for:", key, err);
                    }
                }
            }).catch(e => console.log("Sync error for", key, e));
        });
    });
});

// 🚀 Cloud Load (Checks Local first, fallback or direct sync)
window.firebaseLoad = function(key) {
    return window.localLoad(key); 
};

// 🚀 Cloud Save (Saves to both Local & Firebase Firestore instantly)
window.firebaseSave = function(key, data) {
    window.localSave(key, data);
    if (window.db) {
        window._setDoc(window._doc(window.db, "texfriend_erp", key), { content: JSON.stringify(data) }).catch(e => console.log("Save error for", key, e));
    }
};

window.firebaseSaveIndividual = function(key, data) {
    window.firebaseSave(key, data);
};

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
        if (specKey && specs[specKey]) {
            return specs[specKey];
        }
    } catch(e) {
        console.error("Error in getCrossPageData:", e);
    }
    return null;
};

// 🌟 TEXFRIEND - Master Data List
window.texMasterList = {
    mills: [], weavers: [],
    dyeingNames: [], warpingNames: [],
    sizingNames: [], washingNames: [],
    counts: ["2/40s", "2/60s", "30s"], colours: ["White", "Black", "Navy Blue", "Maroon"]
};

// 🚀 1. Design Synchronization & Dropdown Loader
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
                    if(!exists) {
                        designSpecs[name] = { designNumber: name, status: 'running' };
                    }
                }
            });

            let keysFromSpecs = Object.keys(designSpecs);
            let combinedList = Array.from(new Set([...preDesignList, ...keysFromSpecs]));
            
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
        } catch(err) {
            console.error("Design Loader Error:", err);
        }
    }, 400);
});

// 🚀 2. SAFE UNIVERSAL AUTO-SUGGEST FOR MILLS & UNITS
window.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        try {
            let namesSet = new Set();
            
            let inwards = JSON.parse(localStorage.getItem('kora_stock_records')) || [];
            inwards.forEach(i => { if(i.supplier) namesSet.add(i.supplier.trim()); if(i.millName) namesSet.add(i.millName.trim()); });
            
            let issues = JSON.parse(localStorage.getItem('kora_issue_records')) || [];
            issues.forEach(i => { if(i.millName) namesSet.add(i.millName.trim()); if(i.dyeingName) namesSet.add(i.dyeingName.trim()); });

            let masterMills = JSON.parse(localStorage.getItem('tex_master_mills')) || [];
            masterMills.forEach(m => namesSet.add(m.trim()));

            let existingDatalist = document.getElementById('globalUniversalSuggestions');
            if(!existingDatalist) {
                existingDatalist = document.createElement('datalist');
                existingDatalist.id = 'globalUniversalSuggestions';
                document.body.appendChild(existingDatalist);
            }

            let optionsHtml = '';
            namesSet.forEach(name => {
                optionsHtml += `<option value="${name}">`;
            });
            existingDatalist.innerHTML = optionsHtml;

            let inputs = document.querySelectorAll('input[type="text"]');
            inputs.forEach(input => {
                let idClass = (input.id + " " + input.className + " " + input.placeholder).toLowerCase();
                if(!idClass.includes('design') && (idClass.includes('mill') || idClass.includes('supplier') || idClass.includes('dyeing') || idClass.includes('weaver') || idClass.includes('washing') || idClass.includes('unit'))) {
                    input.setAttribute('list', 'globalUniversalSuggestions');
                }
            });
        } catch(err) {
            console.error("Auto-suggest Loader Error:", err);
        }
    }, 600);
});
