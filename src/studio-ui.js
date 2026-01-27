/**
 * Studio UI Orchestrator - Extended with Presets & Docs
 */
// Use var for global accessibility and avoid redeclaration errors
var editorElement = document.getElementById('code-editor');
var logPanel = document.getElementById('log');
var statusBadgeElement = document.getElementById('status-badge');
var projectListElement = document.getElementById('project-list');

const DOCS = [
    { title: "Root Architecture", tag: "<axml>", desc: "Kontainer utama proyek musik. Wajib menyertakan atribut version='1.0'." },
    { title: "Project Metadata", tag: "<metadata>", desc: "Mendefinisikan context: <title>, <artist>, <tempo> (BPM), dan <key>." },
    { title: "Instrument (The Synth)", tag: "<instrument>", desc: "Mendefinisikan suara. Oscillator: sine, sawtooth, square, triangle, kick, snare, hihat." },
    { title: "Sound Envelopes", tag: "ADSR", desc: "Parameter instrumen: attack (fade-in), decay, sustain (level), release (fade-out)." },
    { title: "Logic Filters", tag: "Filters", desc: "Parameter instrumen: cutoff (Hz) dan resonance (Q) untuk sculpting frekuensi." },
    { title: "FX Rack (v2.0)", tag: "DSP", desc: "Efek: distortion (0-1), chorus (0-1), bitcrush (0-1), reverb (0-1), delay (0-1)." },
    { title: "LFO Modulation", tag: "Modulation", desc: "Modulasi otomatis: lfoRate (Hz), lfoAmount (depth), lfoTarget (cutoff, volume, pan)." },
    { title: "Tracks & Sequencing", tag: "<track>", desc: "Alur nada untuk instrumen tertentu. Gunakan atribut instrument='ID'." },
    { title: "Note Notation", tag: "<note>", desc: "Atribut: pitch (C4, 60, rest), start (beat), duration (q, e, s, w, h)." },
    { title: "Polyphony (Chords)", tag: "<chord>", desc: "Gunakan untuk memainkan beberapa nada sekaligus dengan start dan duration yang sama." },
    { title: "Pattern Library", tag: "<patterns>", desc: "Definisikan loop reusable di <pattern> lalu panggil menggunakan <play pattern='ID' start='X'/>." },
    { title: "Visualizer Modes", tag: "UI", desc: "Ganti visualisasi dengan ikon di panel kanan: Bars (Frekuensi), Wave (Oscilloscope), atau Circular." },
    { title: "Sequencer Tool", tag: "Tool", desc: "Klik ikon Grid di header untuk membuka sequencer otomatis untuk men-generate arpeggio instan." }
];

function log(msg, type = 'info') {
    if (!logPanel) return;
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="log-time">${new Date().toLocaleTimeString().split(' ')[0]}</span> <span style="color:${type === 'error' ? '#ff0055' : (type === 'mixer' ? '#00f2ff' : '#a5b3ce')}">${msg}</span>`;
    logPanel.prepend(entry);
}

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

    const tab = document.getElementById('tab-' + tabId);
    if (tab) tab.classList.add('active');

    const btn = document.querySelector(`[onclick="showTab('${tabId}')"]`);
    if (btn) btn.classList.add('active');
}

function toggleMixerMode(mode) {
    const mixer = document.getElementById('mixer-grid');
    const fx = document.getElementById('fx-dashboard');
    if (mode === 'mixer') {
        if (mixer) mixer.style.display = 'flex';
        if (fx) fx.style.display = 'none';
    } else {
        if (mixer) mixer.style.display = 'none';
        if (fx) fx.style.display = 'flex';
    }
}

function initLibrary(parser, player) {
    const projectList = document.getElementById('project-list');
    const examples = (typeof AXML_EXAMPLES !== 'undefined') ? AXML_EXAMPLES : {};

    if (projectList) {
        projectList.innerHTML = '';
        Object.keys(examples).forEach(name => {
            const item = document.createElement('div');
            item.className = 'project-item';
            item.innerHTML = `<i class="material-icons">audio_file</i> <span>${name}</span>`;
            item.onclick = () => {
                document.querySelectorAll('#project-list .project-item').forEach(p => p.classList.remove('active'));
                item.classList.add('active');

                if (editorElement) {
                    editorElement.value = examples[name];
                    try {
                        const data = parser.parse(editorElement.value);
                        updateUI(data, player);
                        log(`Loaded example: ${name}`);
                    } catch (e) {
                        log("Parse error in example: " + name, "error");
                    }
                }
            };
            projectList.appendChild(item);
        });
    }

    if (typeof loadPresetsToUI === 'function') {
        loadPresetsToUI();
    }

    const helpContent = document.getElementById('help-content');
    if (helpContent) {
        helpContent.innerHTML = '';
        DOCS.forEach(d => {
            const div = document.createElement('div');
            div.className = 'doc-item';
            div.style.marginBottom = '20px';
            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong style="color:var(--primary); font-family:var(--font-display); font-size:0.8rem;">${d.title}</strong>
                    <span class="doc-tag">${d.tag}</span>
                </div>
                <p style="font-size:0.75rem; margin-top:8px; line-height:1.5;">${d.desc}</p>
            `;
            helpContent.appendChild(div);
        });
    }
}

async function shareProject() {
    try {
        if (!editorElement) return;
        const code = editorElement.value;
        const encoded = btoa(unescape(encodeURIComponent(code)));
        const url = window.location.origin + window.location.pathname + '#project=' + encoded;
        await navigator.clipboard.writeText(url);
        log("🔗 Share link copied to clipboard!");
    } catch (e) {
        log("Failed to create share link", "error");
    }
}

function loadFromHash(parser, player) {
    const hash = window.location.hash;
    if (hash.startsWith('#project=') && editorElement) {
        try {
            const encoded = hash.split('=')[1];
            const code = decodeURIComponent(escape(atob(encoded)));
            editorElement.value = code;
            log("🔗 Project loaded from URL");
            const data = parser.parse(code);
            updateUI(data, player);
            return true;
        } catch (e) { log("Error loading from URL", "error"); }
    }
    return false;
}

function clearLog() { if (logPanel) logPanel.innerHTML = ''; }

function formatCode(parser) {
    if (!editorElement) return;
    let code = editorElement.value.trim();
    if (!code) return;
    try {
        const xml = parser.domParser.parseFromString(code, "text/xml");
        if (xml.querySelector("parsererror")) throw new Error("Invalid XML");
        const ser = new XMLSerializer();
        let out = ser.serializeToString(xml).replace(/><(?!\/)/g, ">\n  <").replace(/><\//g, ">\n</");
        editorElement.value = out;
        log("✨ XML Formatted");
    } catch (e) { log(e.message, 'error'); }
}

function saveToLocal() {
    if (!editorElement) return;
    const code = editorElement.value;
    const title = document.getElementById('meta-title').textContent || 'project';
    localStorage.setItem('axml_last_project', code);
    log(`💾 Project '${title}' saved to local storage`);
}

function toggleTheme() {
    document.body.classList.toggle('light-theme');
    log("🎨 Theme toggled");
}

function updateUI(data, player) {
    if (!data) return;
    const titleEl = document.getElementById('meta-title');
    const artistEl = document.getElementById('meta-artist');
    const tempoEl = document.getElementById('meta-tempo');
    const keyEl = document.getElementById('meta-key');
    const filenameEl = document.getElementById('current-filename');

    if (titleEl) titleEl.textContent = data.metadata.title;
    if (artistEl) artistEl.textContent = data.metadata.artist;
    if (tempoEl) tempoEl.textContent = data.metadata.tempo + ' BPM';
    if (keyEl) keyEl.textContent = data.metadata.key;
    if (filenameEl) filenameEl.textContent = data.metadata.title.toUpperCase().replace(/\s/g, '_') + '.axml';

    const mixer = document.getElementById('mixer-grid');
    if (mixer) {
        mixer.innerHTML = '';
        const masterVol = player.master ? player.master.gain.value : 0.8;
        mixer.innerHTML += `<div class="mixer-channel" data-track="master">
            <div class="fader-track"><div class="fader-cap" style="bottom: ${masterVol * 100}%;"></div></div>
            <span style="color:var(--primary);">MST</span>
        </div>`;

        data.tracks.forEach((t) => {
            const n = t.name.substring(0, 3).toUpperCase();
            const trackVol = (player.trackGains && player.trackGains[t.name]) ? player.trackGains[t.name].gain.value : 0.7;
            mixer.innerHTML += `<div class="mixer-channel" data-track="${t.name}">
                <div class="fader-track"><div class="fader-cap" style="bottom: ${trackVol * 100}%;"></div></div>
                <span>${n}</span>
            </div>`;
        });

        if (typeof initMixerEvents === 'function') {
            initMixerEvents(player);
        }
    }
    initFXEvents(player);
}

function initFXEvents(player) {
    const cutoff = document.getElementById('fx-cutoff');
    const reson = document.getElementById('fx-reson');

    if (cutoff) {
        cutoff.oninput = () => {
            const val = parseInt(cutoff.value);
            if (player.data) {
                Object.values(player.data.instruments).forEach(inst => inst.cutoff = val);
            }
        };
    }

    if (reson) {
        reson.oninput = () => {
            const val = parseFloat(reson.value);
            if (player.data) {
                Object.values(player.data.instruments).forEach(inst => inst.resonance = val);
            }
        };
    }
}
