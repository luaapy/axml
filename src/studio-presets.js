var AXML_PRESETS = {
    // Basses
    "Cyber Bass": `<instrument id="cyberbass" type="sawtooth" volume="0.8" attack="0.01" decay="0.1" sustain="0.6" release="0.2" cutoff="600" resonance="12" distortion="0.6" lfoRate="4" lfoAmount="0.3" lfoTarget="cutoff" />`,
    "Deep Sub": `<instrument id="sub" type="sine" volume="0.9" attack="0.05" decay="0.2" sustain="0.8" release="0.4" cutoff="200" resonance="1" />`,
    "Gritty FM": `<instrument id="gritty" type="sawtooth" volume="0.7" attack="0.01" decay="0.15" sustain="0.4" release="0.1" cutoff="1200" resonance="8" distortion="0.8" bitcrush="0.3" />`,

    // Leads
    "Neon Lead": `<instrument id="neonlead" type="square" volume="0.6" attack="0.05" decay="0.2" sustain="0.4" release="0.4" cutoff="2500" resonance="4" chorus="0.5" reverb="0.4" lfoRate="6" lfoAmount="0.1" lfoTarget="pan" />`,
    "Rave Saw": `<instrument id="ravesaw" type="sawtooth" volume="0.6" attack="0.01" decay="0.1" sustain="0.7" release="0.3" cutoff="5000" resonance="2" chorus="0.8" distortion="0.2" />`,
    "Ethereal Flute": `<instrument id="flute" type="sine" volume="0.5" attack="0.2" decay="0.2" sustain="0.6" release="1.0" cutoff="1500" resonance="4" chorus="0.4" reverb="0.8" lfoRate="3" lfoAmount="0.2" lfoTarget="volume" />`,

    // Pads
    "Dream Pad": `<instrument id="dreampad" type="sine" volume="0.5" attack="2.0" decay="1.0" sustain="0.8" release="2.5" cutoff="1200" resonance="2" chorus="0.8" reverb="0.9" />`,
    "Retro String": `<instrument id="strings" type="sawtooth" volume="0.4" attack="0.5" sustain="1.0" release="1.5" cutoff="1000" resonance="1" chorus="0.6" reverb="0.5" />`,

    // Plucks
    "8-Bit Pluck": `<instrument id="pluck" type="square" volume="0.6" attack="0.005" decay="0.1" sustain="0" release="0.1" cutoff="4000" bitcrush="0.4" />`,
    "Crystal Bell": `<instrument id="bell" type="sine" volume="0.6" attack="0.01" decay="0.4" sustain="0.1" release="0.8" cutoff="3000" resonance="10" chorus="0.3" reverb="0.6" />`,

    // Percussion
    "Industrial Kick": `<instrument id="kick" type="kick" volume="1.0" attack="0.01" release="0.1" distortion="0.3" />`,
    "Crispy Snare": `<instrument id="snare" type="snare" volume="0.8" attack="0.01" release="0.1" cutoff="1500" bitcrush="0.2" />`,
    "Metallic Hihat": `<instrument id="hihat" type="hihat" volume="0.4" attack="0.01" release="0.05" cutoff="8000" resonance="5" />`
};

function loadPresetsToUI() {
    const list = document.getElementById('preset-list');
    if (!list) return;

    list.innerHTML = '';
    Object.keys(AXML_PRESETS).forEach(name => {
        const div = document.createElement('div');
        div.className = 'project-item preset-item';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'space-between';
        div.style.padding = '8px 12px';
        div.style.marginBottom = '4px';
        div.style.cursor = 'pointer';
        div.style.borderRadius = '4px';
        div.style.transition = 'var(--transition)';

        const info = document.createElement('div');
        info.style.display = 'flex';
        info.style.alignItems = 'center';
        info.style.gap = '8px';
        info.innerHTML = `<i class="material-icons" style="font-size:16px; color:var(--primary);">extension</i> <span style="font-size:0.85rem;">${name}</span>`;

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '4px';

        const btnInsert = document.createElement('button');
        btnInsert.className = 'btn-mini';
        btnInsert.innerHTML = '<i class="material-icons" style="font-size:12px;">add</i>';
        btnInsert.title = 'Insert to Editor';
        btnInsert.onclick = (e) => {
            e.stopPropagation();
            insertPreset(name);
        };

        const btnCopy = document.createElement('button');
        btnCopy.className = 'btn-mini';
        btnCopy.innerHTML = '<i class="material-icons" style="font-size:12px;">content_copy</i>';
        btnCopy.title = 'Copy XML';
        btnCopy.onclick = (e) => {
            e.stopPropagation();
            copyPresetToClipboard(name);
        };

        actions.appendChild(btnInsert);
        actions.appendChild(btnCopy);

        div.appendChild(info);
        div.appendChild(actions);

        div.onclick = () => insertPreset(name);

        list.appendChild(div);
    });
}

function insertPreset(name) {
    const xml = AXML_PRESETS[name];
    const editor = document.getElementById('code-editor');
    if (editor) {
        const pos = editor.selectionStart;
        editor.value = editor.value.substring(0, pos) + xml + "\n" + editor.value.substring(pos);
        if (typeof log === 'function') log(`✨ Preset '${name}' inserted at cursor`);
    }
}

function copyPresetToClipboard(name) {
    const xml = AXML_PRESETS[name];
    navigator.clipboard.writeText(xml).then(() => {
        if (typeof log === 'function') log(`📋 Preset '${name}' copied to clipboard`);
        else alert('Preset copied to clipboard!');
    });
}
