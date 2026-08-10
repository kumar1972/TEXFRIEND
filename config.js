
// config.js - TEXFRIEND ERP (Local Storage Demo Version)

window.isDemo = true; // இது 'true' ஆக இருந்தால் LocalStorage-ஐ மட்டும் பயன்படுத்தും

// Local Storage Helper Functions
window.firebaseLoad = function(key) {
    let data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
};

window.firebaseSave = function(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
};

window.firebaseSaveIndividual = function(key, data) {
    localStorage.setItem("design_" + key, JSON.stringify(data));
};

// 🚀 Automatic Local Data Loader for Dropdowns & Setup Pages
window.addEventListener('load', function() {
    if(!localStorage.getItem('pre_design_numbers')) {
        localStorage.setItem('pre_design_numbers', JSON.stringify([]));
    }
});

// 🚀 Universal Dropdown Loader for All Pages (Enhanced)
window.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        let preDesignList = JSON.parse(localStorage.getItem('pre_design_numbers')) || [];
        
        let dropdowns = document.querySelectorAll('select');
        dropdowns.forEach(function(select) {
            let idOrClass = (select.id + " " + select.className).toLowerCase();
            if (idOrClass.includes('design') || select.id === 'designNumber' || select.id === 'designSelect' || select.id === 'settingDesignSelect' || select.classList.contains('item-design')) {
                if (select.options.length <= 1) {
                    let currentVal = select.value;
                    let html = '<option value="">Select Design</option>';
                    preDesignList.forEach(function(d) {
                        html += '<option value="' + d + '">' + d + '</option>';
                    });
                    select.innerHTML = html;
                    if (currentVal) select.value = currentVal;
                }
            }
        });
    }, 200);
    // 🚀 Sync & Status Pages Local Data Loader (Updated)
window.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        // "Loading Cloud Data" அல்லது "SYNCING CLOUD DATA" வாசகங்களை மறைக்க
        let loadingTexts = document.querySelectorAll('div, h3, h2, p, span');
        loadingTexts.forEach(function(el) {
            if (el.innerText && (el.innerText.includes('Loading Cloud Data') || el.innerText.includes('SYNCING CLOUD DATA'))) {
                el.style.display = 'none';
            }
        });

        // லோக்கல் ஸ்டோரேஜിൽ உள்ள டேட்டாவை வைத்து டேபிளை உருவாக்குதல்
        let designSpecs = JSON.parse(localStorage.getItem('design_specs') || '{}');
        let preDesignList = JSON.parse(localStorage.getItem('pre_design_numbers')) || [];
        
        let container = document.querySelector('.form-section, .main-card, body');
        
        if (preDesignList.length > 0 && container && !document.getElementById('localStatusTable')) {
            let html = '<div id="localStatusTable" style="margin-top:15px; background:white; padding:15px; border-radius:12px; box-shadow:0 4px 10px rgba(0,0,0,0.05);"><h3 style="color:#2F4F38; margin-bottom:10px; font-size:14px;">📊 Design Status List (Local Demo)</h3><table border="1" style="width:100%; border-collapse:collapse; background:white; font-size:12px;"><tr><th style="padding:8px; background:#4A7C59; color:white;">Design No</th><th style="padding:8px; background:#4A7C59; color:white;">Process</th><th style="padding:8px; background:#4A7C59; color:white;">Warp / Weft</th></tr>';
            
            preDesignList.forEach(function(d) {
                let key = d; // எளிமைக்காக
                let spec = designSpecs[d] || designSpecs[Object.keys(designSpecs).find(k => k.toLowerCase() === d.toLowerCase())] || {};
                html += `<tr><td style="padding:8px; text-align:center;"><b>${d}</b></td><td style="padding:8px; text-align:center;">${spec.typeOfProcess || 'Running'}</td><td style="padding:8px; text-align:center;">${spec.warp || '-'}/${spec.weft || '-'}</td></tr>`;
            });
            html += '</table></div>';
            
            let displayBox = document.querySelector('.main-card') || document.body;
            let div = document.createElement('div');
            div.innerHTML = html;
            displayBox.appendChild(div);
        }
    }, 300);
});

});

