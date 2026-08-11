// config.js - TEXFRIEND ERP (Final Clean Version without Dashboard Conflicts)

window.isDemo = false; 

// 🛠️ Local Storage Helpers
window.localLoad = function(key) {
    let data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
};
window.localSave = function(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
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

import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js").then((firebaseApp) => {
    const app = firebaseApp.initializeApp(firebaseConfig);
    import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js").then((firebaseFirestore) => {
        window.db = firebaseFirestore.getFirestore(app);
        window._doc = firebaseFirestore.doc; window._setDoc = firebaseFirestore.setDoc; window._getDoc = firebaseFirestore.getDoc;
        console.log("🔥 Firebase Connected!");
    });
});

window.firebaseLoad = function(key) {
    return window.localLoad(key); 
};

window.firebaseSave = function(key, data) {
    window.localSave(key, data);
    if (window.db && window._setDoc && window._doc) {
        window._setDoc(window._doc(window.db, "texfriend_erp", key), { content: JSON.stringify(data) }).catch(e => console.log(e));
    }
};

window.firebaseSaveIndividual = function(key, data) {
    window.firebaseSave("design_" + key, data);
};

// 🌟 TEXFRIEND - Master Data List (No Dummies)
window.texMasterList = {
    mills: [], weavers: [],
    dyeingNames: [], warpingNames: [],
    sizingNames: [], washingNames: [],
    counts: ["2/40s", "2/60s", "30s"], colours: ["White", "Black", "Navy Blue", "Maroon"]
};

// 🚀 1. Design Synchronization & Dropdown Loader
window.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
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
    }, 400);
});

// 🚀 2. SAFE UNIVERSAL AUTO-SUGGEST FOR MILLS (No Dummies)
window.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        let namesSet = new Set();
        
        let inwards = JSON.parse(localStorage.getItem('kora_stock_records')) || [];
        inwards.forEach(i => { if(i.supplier) namesSet.add(i.supplier.trim()); if(i.millName) namesSet.add(i.millName.trim()); });
        
        let issues = JSON.parse(localStorage.getItem('kora_issue_records')) || [];
        issues.forEach(i => { if(i.millName) namesSet.add(i.millName.trim()); if(i.dyeingName) namesSet.add(i.dyeingName.trim()); });

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

    }, 600);
});
