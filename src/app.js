/**
 * AXML Studio App Entry Point
 * v2.0 - Agentic Upgrade
 */
var parser = new AXMLParser();
var player = new AXMLPlayer();

window.onload = () => {
    // These are initialized here to ensure DOM is ready and avoid conflicts
    window.editorElement = document.getElementById('code-editor');
    window.statusBadgeElement = document.getElementById('status-badge');

    const canvas = document.getElementById('canvas');
    if (canvas) initVisualizer(canvas, player);

    // Initialize UI Modules
    initLibrary(parser, player);

    // Load from URL (Hash) or Local Storage
    if (!loadFromHash(parser, player)) {
        const last = localStorage.getItem('axml_last_project');
        const projList = document.getElementById('project-list');

        if (last && window.editorElement) {
            window.editorElement.value = last;
            try {
                const data = parser.parse(last);
                updateUI(data, player);
            } catch (e) { }
        } else if (projList && projList.children.length) {
            projList.children[0].click();
        }
    }

    log("🚀 AXML Studio Engine Ready");
};

// --- Action Bindings ---

const btnPlay = document.getElementById('btn-play');
if (btnPlay) {
    btnPlay.onclick = async () => {
        try {
            if (!window.editorElement) return;
            await player.init();
            const data = parser.parse(window.editorElement.value);
            player.load(data);
            updateUI(data, player);

            if (window.statusBadgeElement) window.statusBadgeElement.textContent = "SYNCING AUDIO...";
            await player.loadSamples();

            await player.play();
            if (window.statusBadgeElement) {
                window.statusBadgeElement.textContent = "ENGINE PLAYING";
                window.statusBadgeElement.classList.add('playing');
            }
            log("▶ Sound engine active");
        } catch (e) {
            log(e.message, 'error');
            console.error(e);
        }
    };
}

const btnStop = document.getElementById('btn-stop');
if (btnStop) {
    btnStop.onclick = () => {
        player.stop();
        if (window.statusBadgeElement) {
            window.statusBadgeElement.textContent = "ENGINE IDLE";
            window.statusBadgeElement.classList.remove('playing');
        }
        log("⏹ Playback terminated");
    };
}

const btnExport = document.getElementById('btn-export');
if (btnExport) {
    btnExport.onclick = async () => {
        if (!window.editorElement) return;
        const code = window.editorElement.value;
        if (!code.trim()) return;
        const btn = document.getElementById('btn-export');
        const originalText = btn.innerHTML;
        try {
            btn.innerHTML = `<i class="material-icons rotating" style="font-size:14px;">sync</i> RENDERING...`;
            btn.disabled = true;
            log("⏳ Rendering project to WAV...");

            const data = parser.parse(code);
            player.load(data);
            await player.downloadWAV();

            log("✅ Export complete!");
        } catch (e) {
            log("❌ Export failed: " + e.message, 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    };
}

// --- Keyboard Shortcuts ---

if (document.getElementById('code-editor')) {
    document.getElementById('code-editor').onkeydown = (e) => {
        const el = e.target;
        if (e.ctrlKey && e.key === 's') { e.preventDefault(); saveToLocal(); }
        if (e.ctrlKey && e.key === 'i') { e.preventDefault(); formatCode(parser); }

        if (e.key === 'Tab') {
            e.preventDefault();
            const s = el.selectionStart;
            el.value = el.value.substring(0, s) + "  " + el.value.substring(el.selectionEnd);
            el.selectionStart = el.selectionEnd = s + 2;
        }

        setTimeout(() => {
            const sub = el.value.substring(0, el.selectionStart);
            const ln = sub.split('\n').length;
            const col = sub.split('\n').pop().length + 1;
            const posEl = document.getElementById('cursor-pos');
            if (posEl) posEl.textContent = `Ln ${ln}, Col ${col}`;
        }, 0);
    };
}

window.onkeydown = (e) => {
    if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        if (player.isPlaying) {
            const stopBtn = document.getElementById('btn-stop');
            if (stopBtn) stopBtn.click();
        } else {
            const playBtn = document.getElementById('btn-play');
            if (playBtn) playBtn.click();
        }
    }
};
