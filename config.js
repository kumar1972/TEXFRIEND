/* =========================================================
   GLOBAL DISPLAY SIZE ADJUSTER (Top-Right Version)
   Added to Config.js to work across all ERP pages
========================================================= */

document.addEventListener("DOMContentLoaded", function() {

    // ஏற்கனவே பட்டன் இருந்தால் மீண்டும் வராமல் தடுக்க
    if(document.getElementById('texfriend-display-controller')) return;

    // சேமிக்கப்பட்ட பழைய அளவை எடுத்தல் அல்லது Default 100% (1.0)
    let currentZoom = parseFloat(localStorage.getItem('texfriend_zoom_level')) || 1.0;
    applyZoom(currentZoom);

    // மிதக்கும் பட்டன் மற்றும் மெனு கண்டெய்னர் (Floating Action UI)
    const controllerDiv = document.createElement('div');
    controllerDiv.id = 'texfriend-display-controller';
    controllerDiv.style.position = 'fixed';
    
    // 🟢 மாற்றுப்பட்ட இடம்: மேல் வலது மூலை (Top-Right) 🟢
    controllerDiv.style.top = '15px';     
    controllerDiv.style.right = '15px';   
    controllerDiv.style.zIndex = '999999';
    controllerDiv.style.display = 'flex';
    controllerDiv.style.flexDirection = 'column';
    controllerDiv.style.alignItems = 'flex-end'; 

    // பட்டன் மேலே, மெனு கீழே வரும்படி HTML மாற்றி அமைக்கப்பட்டுள்ளது
    controllerDiv.innerHTML = `
        <!-- Floating Button (Top) -->
        <button id="btnToggleZoom" style="background: linear-gradient(135deg, #059669, #10B981); color: white; border: none; width: 42px; height: 42px; border-radius: 50%; font-size: 18px; cursor: pointer; box-shadow: 0 6px 18px rgba(16, 185, 129, 0.4); display: flex; align-items: center; justify-content: center; outline: none; transition: all 0.3s ease; margin-bottom: 10px;">
            🔍
        </button>
        
        <!-- Zoom Panel (Hidden by default, drops down) -->
        <div id="zoomAppPanel" style="display: none; flex-direction: column; gap: 12px; background: rgba(18, 30, 25, 0.95); backdrop-filter: blur(8px); border: 1px solid #4A7C59; padding: 15px; border-radius: 14px; box-shadow: 0 10px 40px rgba(0,0,0,0.6); color: white; width: 170px;">
            
            <div style="font-size: 11px; font-weight: 800; text-align: center; color: #78d18a; text-transform: uppercase; letter-spacing: 1px;">
                Screen Size
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; background: #080f0c; border-radius: 10px; padding: 5px;">
                <button id="btnZoomOut" style="background: transparent; color: #EF4444; border: none; font-size: 20px; width: 38px; height: 38px; cursor: pointer; font-weight:bold; outline:none;">-</button>
                <span id="zoomLabel" style="font-size: 13px; font-weight: bold; color: #fff;">${Math.round(currentZoom * 100)}%</span>
                <button id="btnZoomIn" style="background: transparent; color: #10B981; border: none; font-size: 20px; width: 38px; height: 38px; cursor: pointer; font-weight:bold; outline:none;">+</button>
            </div>
            
            <button id="btnFitScreen" style="background: linear-gradient(135deg, #3B82F6, #1D4ED8); color: white; border: none; padding: 10px; border-radius: 8px; font-weight: bold; font-size: 11px; cursor: pointer; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); outline:none;">
                🖥️ Fit to Screen
            </button>
            
        </div>
    `;

    document.body.appendChild(controllerDiv);

    // Functionality & Logic
    const btnToggle = document.getElementById('btnToggleZoom');
    const panel = document.getElementById('zoomAppPanel');
    const btnZoomIn = document.getElementById('btnZoomIn');
    const btnZoomOut = document.getElementById('btnZoomOut');
    const btnFitScreen = document.getElementById('btnFitScreen');
    const zoomLabel = document.getElementById('zoomLabel');

    let isPanelOpen = false;

    // Open / Close Panel
    btnToggle.onclick = () => {
        isPanelOpen = !isPanelOpen;
        panel.style.display = isPanelOpen ? 'flex' : 'none';
        btnToggle.innerHTML = isPanelOpen ? '✖' : '🔍';
        btnToggle.style.background = isPanelOpen 
            ? 'linear-gradient(135deg, #EF4444, #DC2626)' 
            : 'linear-gradient(135deg, #059669, #10B981)';
        btnToggle.style.transform = isPanelOpen ? 'rotate(90deg)' : 'rotate(0deg)';
    };

    // Zoom In 
    btnZoomIn.onclick = () => {
        if (currentZoom < 2.0) { 
            currentZoom += 0.05;
            updateZoom();
        }
    };

    // Zoom Out 
    btnZoomOut.onclick = () => {
        if (currentZoom > 0.4) { 
            currentZoom -= 0.05;
            updateZoom();
        }
    };

    // Fit to Screen 
    btnFitScreen.onclick = () => {
        currentZoom = 1.0;
        updateZoom();
    };

    function updateZoom() {
        applyZoom(currentZoom);
        zoomLabel.innerText = Math.round(currentZoom * 100) + '%';
    }

    function applyZoom(zoomValue) {
        document.body.style.zoom = zoomValue;
        
        // Firefox பிரவுசருக்கான மாற்று ஏற்பாடு 
        if(navigator.userAgent.toLowerCase().indexOf('firefox') > -1){
            document.body.style.transform = `scale(${zoomValue})`;
            document.body.style.transformOrigin = 'top left';
            document.body.style.width = `${100 / zoomValue}%`;
        }
        
        localStorage.setItem('texfriend_zoom_level', zoomValue);
    }
});
