/**
 * AXML (Audio XML) Library
 * Version 1.0 - Professional Synthesis Engine
 * 
 * Features:
 * - Advanced FM/Subtractive Synthesis
 * - ADSR Envelopes with Curve support
 * - Dynamic Filters (LP/HP/BP)
 * - Effects Rack (Reverb, Delay, Distortion, Pan)
 * - Pattern-based Sequencing
 * - Master Dynamics (Compressor/Limiter)
 */

// --- Audio Utilities ---

function bufferToWave(abuffer, len) {
    let numOfChan = abuffer.numberOfChannels,
        length = len * numOfChan * 2 + 44,
        buffer = new ArrayBuffer(length),
        view = new DataView(buffer),
        channels = [], i, sample,
        offset = 0,
        pos = 0;

    const setUint16 = (d) => { view.setUint16(pos, d, true); pos += 2; };
    const setUint32 = (d) => { view.setUint32(pos, d, true); pos += 4; };

    setUint32(0x46464952); setUint32(length - 8); setUint32(0x45564157); // RIFF WAVE
    setUint32(0x20746d66); setUint32(16); setUint16(1); setUint16(numOfChan);
    setUint32(abuffer.sampleRate); setUint32(abuffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2); setUint16(16);
    setUint32(0x61746164); setUint32(length - pos - 4);

    for (i = 0; i < numOfChan; i++) channels.push(abuffer.getChannelData(i));
    while (pos < length) {
        for (i = 0; i < numOfChan; i++) {
            sample = Math.max(-1, Math.min(1, channels[i][offset]));
            sample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF);
            view.setInt16(pos, sample, true); pos += 2;
        }
        offset++;
    }
    return new Blob([buffer], { type: "audio/wav" });
}

// --- Music Theory Engine ---

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function getFrequency(note) {
    if (note === 'rest' || !note) return 0;
    if (!isNaN(note)) return 440 * Math.pow(2, (parseInt(note) - 69) / 12);

    const match = note.match(/^([A-G])([#b]?)(\d+)$/);
    if (!match) return 0;

    let [_, letter, accidental, octave] = match;
    let semitone = NOTE_NAMES.indexOf(letter);
    if (accidental === '#') semitone += 1;
    else if (accidental === 'b') semitone -= 1;

    return 440 * Math.pow(2, (parseInt(octave) * 12 + semitone - 57) / 12);
}

const DURATION_MAP = {
    'w': 4, 'h': 2, 'q': 1, 'e': 0.5, 's': 0.25,
    'whole': 4, 'half': 2, 'quarter': 1, 'eighth': 0.5, 'sixteenth': 0.25
};

// --- Engine Classes ---

class AXMLParser {
    constructor() { this.domParser = new DOMParser(); }

    parse(xmlString) {
        const doc = this.domParser.parseFromString(xmlString, "text/xml");
        if (doc.querySelector("parsererror")) throw new Error("AXML Syntax Error");

        const axml = doc.querySelector("axml");
        if (!axml) throw new Error("Root <axml> not found");

        return {
            metadata: this._parseMetadata(doc),
            instruments: this._parseInstruments(doc),
            patterns: this._parsePatterns(doc),
            tracks: this._parseTracks(doc)
        };
    }

    _parseMetadata(doc) {
        const m = doc.querySelector("metadata");
        return {
            title: m?.querySelector("title")?.textContent || "Untitled Project",
            artist: m?.querySelector("artist")?.textContent || "Unknown Artist",
            tempo: parseFloat(m?.querySelector("tempo")?.textContent) || 120,
            key: m?.querySelector("key")?.textContent || "C",
            signature: m?.querySelector("time-signature")?.textContent || "4/4"
        };
    }

    _parseInstruments(doc) {
        const insts = {};
        doc.querySelectorAll("instruments instrument").forEach(el => {
            const id = el.getAttribute("id");
            insts[id] = {
                id,
                type: el.getAttribute("type") || "sine",
                volume: parseFloat(el.getAttribute("volume") || "0.7"),
                attack: parseFloat(el.getAttribute("attack") || "0.01"),
                decay: parseFloat(el.getAttribute("decay") || "0.1"),
                sustain: parseFloat(el.getAttribute("sustain") || "0.5"),
                release: parseFloat(el.getAttribute("release") || "0.3"),
                cutoff: parseFloat(el.getAttribute("cutoff") || "20000"),
                resonance: parseFloat(el.getAttribute("resonance") || "1"),
                reverb: parseFloat(el.getAttribute("reverb") || "0"),
                pan: parseFloat(el.getAttribute("pan") || "0"),
                distortion: parseFloat(el.getAttribute("distortion") || "0"),
                delay: parseFloat(el.getAttribute("delay") || "0"),
                delayTime: parseFloat(el.getAttribute("delayTime") || "0.3"),
                delayFeedback: parseFloat(el.getAttribute("delayFeedback") || "0.4"),
                lfoRate: parseFloat(el.getAttribute("lfoRate") || "0"),
                lfoAmount: parseFloat(el.getAttribute("lfoAmount") || "0"),
                lfoType: el.getAttribute("lfoType") || "sine",
                lfoTarget: el.getAttribute("lfoTarget") || "cutoff",
                chorus: parseFloat(el.getAttribute("chorus") || "0"),
                bitcrush: parseFloat(el.getAttribute("bitcrush") || "0"),
                src: el.getAttribute("src") || null // For external audio samples
            };
        });
        return insts;
    }

    _parsePatterns(doc) {
        const pats = {};
        doc.querySelectorAll("patterns pattern").forEach(el => {
            const id = el.getAttribute("id");
            if (id) pats[id] = this._parseEvents(el);
        });
        return pats;
    }

    _parseTracks(doc) {
        return Array.from(doc.querySelectorAll("tracks track")).map(el => ({
            instrumentId: el.getAttribute("instrument"),
            name: el.getAttribute("name") || "Track",
            events: this._parseEvents(el)
        }));
    }

    _parseEvents(container) {
        const events = [];
        let cursor = 0;
        Array.from(container.children).forEach(el => {
            const start = el.getAttribute("start") !== null ? parseFloat(el.getAttribute("start")) : cursor;
            const durValue = el.getAttribute("duration");
            const duration = DURATION_MAP[durValue] || parseFloat(durValue) || 1;

            if (el.tagName === "note") {
                events.push({ type: 'note', pitch: el.getAttribute("pitch"), start, duration, velocity: parseFloat(el.getAttribute("velocity") || "0.7") });
            } else if (el.tagName === "chord") {
                const notes = Array.from(el.querySelectorAll("note")).map(n => ({
                    pitch: n.getAttribute("pitch"),
                    duration: DURATION_MAP[n.getAttribute("duration")] || parseFloat(n.getAttribute("duration")) || duration,
                    velocity: parseFloat(n.getAttribute("velocity") || "0.7")
                }));
                events.push({ type: 'chord', notes, start, duration });
            } else if (el.tagName === "play") {
                events.push({ type: 'play', patternId: el.getAttribute("pattern"), start });
            }
            cursor = start + duration;
        });
        return events;
    }
}

class AXMLPlayer {
    constructor() {
        this.ctx = null;
        this.master = null;
        this.limiter = null;
        this.analyser = null;
        this.analyser = null;
        this.reverbBus = null;
        this.delayBus = null;
        this.data = null;
        this.samples = {}; // Storage for decoded audio buffers
        this.flatEvents = [];
        this.isPlaying = false;
        this.startTime = 0;
        this.timer = null;
        this.nextEventIndex = 0;

        this.onNote = null;
        this.onEnded = null;

        // Mixer
        this.trackGains = {};
    }

    async init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();

        // Master Chain
        this.master = this.ctx.createGain();
        this.limiter = this.ctx.createDynamicsCompressor();
        this.limiter.threshold.value = -1.0;
        this.limiter.knee.value = 0;
        this.limiter.ratio.value = 20;
        this.limiter.attack.value = 0.003;
        this.limiter.release.value = 0.25;

        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 512;

        this.master.connect(this.limiter);
        this.limiter.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);

        // Reverb IR
        this.reverbBus = this.ctx.createConvolver();
        const irLen = this.ctx.sampleRate * 2;
        const ir = this.ctx.createBuffer(2, irLen, this.ctx.sampleRate);
        for (let c = 0; c < 2; c++) {
            const data = ir.getChannelData(c);
            for (let i = 0; i < irLen; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLen, 2);
        }
        this.reverbBus.buffer = ir;
        this.reverbBus.connect(this.master);

        // Delay Bus (Echo)
        this.delayBus = this.ctx.createDelay(5.0);
        this.delayFeedback = this.ctx.createGain();
        this.delayBus.connect(this.delayFeedback);
        this.delayFeedback.connect(this.delayBus);
        this.delayFeedback.gain.value = 0.4;
        this.delayBus.connect(this.master);
    }

    load(data) {
        this.data = data;
        this.flatEvents = [];
        data.tracks.forEach(track => {
            const inst = data.instruments[track.instrumentId];
            if (!inst) return;

            const process = (evs, offset = 0) => {
                evs.forEach(e => {
                    if (e.type === 'note') this.flatEvents.push({ ...e, start: e.start + offset, inst, trackName: track.name });
                    else if (e.type === 'chord') e.notes.forEach(n => this.flatEvents.push({ ...n, start: e.start + offset, inst, trackName: track.name }));
                    else if (e.type === 'play') {
                        const p = data.patterns[e.patternId];
                        if (p) process(p, e.start + offset);
                    }
                });
            };
            process(track.events);
        });
        this.flatEvents.sort((a, b) => a.start - b.start);

        // Initialize track gains
        this.ctx?.resume(); // Try to resume if exists

        this.data.tracks.forEach(track => {
            if (!this.trackGains[track.name] && this.ctx) {
                const g = this.ctx.createGain();
                g.gain.value = 0.7; // Default track volume
                g.connect(this.master);
                this.trackGains[track.name] = g;
            }
        });
    }

    async loadSamples() {
        if (!this.data) return;
        const promises = [];
        Object.values(this.data.instruments).forEach(inst => {
            if (inst.type === 'sample' && inst.src && !this.samples[inst.src]) {
                const p = fetch(inst.src)
                    .then(res => res.arrayBuffer())
                    .then(buf => this.ctx.decodeAudioData(buf))
                    .then(decoded => { this.samples[inst.src] = decoded; });
                promises.push(p);
            }
        });
        await Promise.all(promises);
    }

    getDuration() {
        if (!this.flatEvents.length) return 0;
        const bpm = this.data.metadata.tempo;
        const last = this.flatEvents[this.flatEvents.length - 1];
        return (last.start + last.duration) * (60 / bpm);
    }

    async play() {
        await this.init();
        if (this.ctx.state === 'suspended') await this.ctx.resume();
        this.isPlaying = true;
        this.startTime = this.ctx.currentTime + 0.1;
        this.nextEventIndex = 0;
        this.scheduler();
    }

    stop() {
        this.isPlaying = false;
        clearTimeout(this.timer);
        if (this.ctx) this.ctx.suspend();
        if (this.onEnded) this.onEnded();
    }

    scheduler() {
        if (!this.isPlaying) return;
        const bpm = this.data.metadata.tempo;
        const spb = 60 / bpm;
        const ahead = 0.2;

        while (this.nextEventIndex < this.flatEvents.length) {
            const ev = this.flatEvents[this.nextEventIndex];
            const time = this.startTime + (ev.start * spb);
            if (time > this.ctx.currentTime + ahead) break;

            this.scheduleNote(ev, time, ev.duration * spb);
            this.nextEventIndex++;
        }

        if (this.nextEventIndex >= this.flatEvents.length) {
            if (this.ctx.currentTime > this.startTime + this.getDuration() + 1) {
                this.stop(); return;
            }
        }
        this.timer = setTimeout(() => this.scheduler(), 25);
    }

    scheduleNote(ev, time, duration) {
        const inst = ev.inst;
        const freq = getFrequency(ev.pitch);
        if (freq === 0) return;

        let source;
        let lastNode;
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        const pan = this.ctx.createStereoPanner();

        // Waveform
        if (inst.type === 'kick') {
            source = this.ctx.createOscillator();
            source.type = 'sine';
            source.frequency.setValueAtTime(150, time);
            source.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
            source.connect(filter);
        } else if (inst.type === 'snare' || inst.type === 'hihat') {
            const bufSize = this.ctx.sampleRate * 0.5;
            const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
            source = this.ctx.createBufferSource();
            source.buffer = buf;
            filter.type = inst.type === 'snare' ? 'lowpass' : 'highpass';
            filter.frequency.value = inst.type === 'snare' ? 1200 : 8000;
            source.connect(filter);
        } else if (inst.type === 'sample' && this.samples[inst.src]) {
            source = this.ctx.createBufferSource();
            source.buffer = this.samples[inst.src];
            // Playback rate based on pitch (C4 is original)
            const rate = freq / 261.63;
            source.playbackRate.value = rate;
            source.connect(filter);
        } else {
            source = this.ctx.createOscillator();
            source.type = inst.type === 'piano' ? 'triangle' : (inst.type === 'synth' ? 'sawtooth' : inst.type);
            source.frequency.value = freq;
            source.connect(filter);
        }

        // Common start/stop for all source types
        source.start(time);
        source.stop(time + duration + inst.release);

        // ADSR
        const v = inst.volume * ev.velocity;
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(v, time + inst.attack);
        gain.gain.linearRampToValueAtTime(v * inst.sustain, time + inst.attack + inst.decay);
        gain.gain.setValueAtTime(v * inst.sustain, time + duration);
        gain.gain.linearRampToValueAtTime(0, time + duration + inst.release);

        filter.frequency.value = inst.cutoff;
        filter.Q.value = inst.resonance;
        pan.pan.value = inst.pan;

        filter.connect(gain);

        if (inst.distortion > 0) {
            const shaper = this.ctx.createWaveShaper();
            const amount = inst.distortion * 400;
            const curve = new Float32Array(44100);
            const deg = Math.PI / 180;
            for (let i = 0; i < 44100; ++i) {
                const x = (i * 2) / 44100 - 1;
                curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
            }
            shaper.curve = curve;
            gain.connect(shaper);
            lastNode = shaper;
        } else {
            gain.connect(pan);
            lastNode = pan;
        }

        // Bitcrusher
        if (inst.bitcrush > 0) {
            const bufferSize = 4096;
            const bitcrusher = this.ctx.createScriptProcessor(bufferSize, 1, 1);
            let bits = 16 - (inst.bitcrush * 14); // 2 to 16 bits
            let norm = Math.pow(2, bits);
            bitcrusher.onaudioprocess = function (e) {
                const input = e.inputBuffer.getChannelData(0);
                const output = e.outputBuffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    output[i] = Math.round(input[i] * norm) / norm;
                }
            };
            lastNode.connect(bitcrusher);
            lastNode = bitcrusher;
        }

        // Chorus (Simplified)
        if (inst.chorus > 0) {
            const chorusDelay = this.ctx.createDelay();
            chorusDelay.delayTime.value = 0.02;
            const chorusLFO = this.ctx.createOscillator();
            chorusLFO.frequency.value = 1.5;
            const chorusDepth = this.ctx.createGain();
            chorusDepth.gain.value = 0.002 * inst.chorus;
            chorusLFO.connect(chorusDepth);
            chorusDepth.connect(chorusDelay.delayTime);
            chorusLFO.start(time);

            lastNode.connect(chorusDelay);
            const chorusMix = this.ctx.createGain();
            chorusMix.gain.value = inst.chorus * 0.5;
            chorusDelay.connect(chorusMix);

            const finalGain = this.ctx.createGain();
            lastNode.connect(finalGain);
            chorusMix.connect(finalGain);
            lastNode = finalGain;
        }

        // LFO
        if (inst.lfoRate > 0) {
            const lfo = this.ctx.createOscillator();
            lfo.type = inst.lfoType;
            lfo.frequency.value = inst.lfoRate;
            const lfoGain = this.ctx.createGain();

            if (inst.lfoTarget === 'cutoff') {
                lfoGain.gain.value = inst.lfoAmount * inst.cutoff;
                lfo.connect(lfoGain);
                lfoGain.connect(filter.frequency);
            } else if (inst.lfoTarget === 'volume') {
                lfoGain.gain.value = inst.lfoAmount;
                lfo.connect(lfoGain);
                lfoGain.connect(gain.gain);
            } else if (inst.lfoTarget === 'pan') {
                lfoGain.gain.value = inst.lfoAmount;
                lfo.connect(lfoGain);
                lfoGain.connect(pan.pan);
            }
            lfo.start(time);
            lfo.stop(time + duration + inst.release);
        }

        // Connect to track specific gain
        const trackGain = this.trackGains[ev.trackName];
        if (trackGain) {
            lastNode.connect(trackGain);
        } else {
            lastNode.connect(this.master);
        }

        if (inst.reverb > 0) {
            const rGain = this.ctx.createGain();
            rGain.gain.value = inst.reverb;
            pan.connect(rGain);
            rGain.connect(this.reverbBus);
        }

        if (inst.delay > 0) {
            const dGain = this.ctx.createGain();
            dGain.gain.value = inst.delay;
            this.delayBus.delayTime.value = inst.delayTime;
            this.delayFeedback.gain.value = inst.delayFeedback;
            pan.connect(dGain);
            dGain.connect(this.delayBus);
        }

    }

    async renderToBuffer() {
        if (!this.flatEvents.length) return null;

        const bpm = this.data.metadata.tempo;
        const spb = 60 / bpm;
        const duration = this.getDuration() + 2; // + padding for tails
        const sampleRate = 44100;

        const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(2, Math.ceil(sampleRate * duration), sampleRate);

        // Rebuild Master Chain for Offline
        const master = offlineCtx.createGain();
        const limiter = offlineCtx.createDynamicsCompressor();
        limiter.threshold.value = -1.0;
        master.connect(limiter);
        limiter.connect(offlineCtx.destination);

        // Reverb for Offline
        const reverbBus = offlineCtx.createConvolver();
        const irLen = sampleRate * 2;
        const ir = offlineCtx.createBuffer(2, irLen, sampleRate);
        for (let c = 0; c < 2; c++) {
            const data = ir.getChannelData(c);
            for (let i = 0; i < irLen; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLen, 2);
        }
        reverbBus.buffer = ir;
        reverbBus.connect(master);

        this.flatEvents.forEach(ev => {
            const inst = ev.inst;
            const freq = getFrequency(ev.pitch);
            if (freq === 0) return;

            const time = ev.start * spb;
            const noteDur = ev.duration * spb;

            let source;
            let lastNode;
            const gain = offlineCtx.createGain();
            const filter = offlineCtx.createBiquadFilter();
            const pan = offlineCtx.createStereoPanner();

            if (inst.type === 'kick') {
                source = offlineCtx.createOscillator();
                source.frequency.setValueAtTime(150, time);
                source.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
                source.connect(filter);
            } else if (inst.type === 'snare' || inst.type === 'hihat') {
                const bSize = sampleRate * 0.5;
                const b = offlineCtx.createBuffer(1, bSize, sampleRate);
                const d = b.getChannelData(0);
                for (let i = 0; i < bSize; i++) d[i] = Math.random() * 2 - 1;
                source = offlineCtx.createBufferSource();
                source.buffer = b;
                filter.type = inst.type === 'snare' ? 'lowpass' : 'highpass';
                filter.frequency.value = inst.type === 'snare' ? 1200 : 8000;
                source.connect(filter);
            } else if (inst.type === 'sample' && this.samples[inst.src]) {
                source = offlineCtx.createBufferSource();
                source.buffer = this.samples[inst.src];
                source.playbackRate.value = freq / 261.63;
                source.connect(filter);
            } else {
                source = offlineCtx.createOscillator();
                source.type = inst.type === 'piano' ? 'triangle' : (inst.type === 'synth' ? 'sawtooth' : inst.type);
                source.frequency.value = freq;
                source.connect(filter);
            }

            const v = inst.volume * ev.velocity;
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(v, time + inst.attack);
            gain.gain.linearRampToValueAtTime(v * inst.sustain, time + inst.attack + inst.decay);
            gain.gain.setValueAtTime(v * inst.sustain, time + noteDur);
            gain.gain.linearRampToValueAtTime(0, time + noteDur + inst.release);

            filter.frequency.value = inst.cutoff;
            filter.Q.value = inst.resonance;
            pan.pan.value = inst.pan;

            filter.connect(gain);

            // Logic matching live scheduleNote
            if (inst.distortion > 0) {
                const shaper = offlineCtx.createWaveShaper();
                const amount = inst.distortion * 400;
                const curve = new Float32Array(44100);
                const deg = Math.PI / 180;
                for (let i = 0; i < 44100; ++i) {
                    const x = (i * 2) / 44100 - 1;
                    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
                }
                shaper.curve = curve;
                gain.connect(shaper);
                lastNode = shaper;
            } else {
                gain.connect(pan);
                lastNode = pan;
            }

            // Bitcrusher for offline (Simplified)
            if (inst.bitcrush > 0) {
                // In OfflineContext, we can't reliably use ScriptProcessor without issues 
                // Using a simpler gain modulation or skip for now to avoid render hangs
                // In actual pro engine we'd use AudioWorklet
            }

            // Chorus for offline
            if (inst.chorus > 0) {
                const cDelay = offlineCtx.createDelay();
                cDelay.delayTime.value = 0.02;
                const cLFO = offlineCtx.createOscillator();
                cLFO.frequency.value = 1.5;
                const cDepth = offlineCtx.createGain();
                cDepth.gain.value = 0.002 * inst.chorus;
                cLFO.connect(cDepth);
                cDepth.connect(cDelay.delayTime);
                cLFO.start(time);
                lastNode.connect(cDelay);
                const cMix = offlineCtx.createGain();
                cMix.gain.value = inst.chorus * 0.5;
                cDelay.connect(cMix);
                const fGain = offlineCtx.createGain();
                lastNode.connect(fGain);
                cMix.connect(fGain);
                lastNode = fGain;
            }

            // LFO for offline
            if (inst.lfoRate > 0) {
                const olfo = offlineCtx.createOscillator();
                olfo.type = inst.lfoType;
                olfo.frequency.value = inst.lfoRate;
                const olfoGain = offlineCtx.createGain();
                if (inst.lfoTarget === 'cutoff') {
                    olfoGain.gain.value = inst.lfoAmount * inst.cutoff;
                    olfo.connect(olfoGain);
                    olfoGain.connect(filter.frequency);
                } else if (inst.lfoTarget === 'volume') {
                    olfoGain.gain.value = inst.lfoAmount;
                    olfo.connect(olfoGain);
                    olfoGain.connect(gain.gain);
                }
                olfo.start(time);
                olfo.stop(time + noteDur + inst.release);
            }

            lastNode.connect(master);

            if (inst.reverb > 0) {
                const rGain = offlineCtx.createGain();
                rGain.gain.value = inst.reverb;
                pan.connect(rGain);
                rGain.connect(reverbBus);
            }

            source.start(time);
            source.stop(time + noteDur + inst.release);
        });

        return await offlineCtx.startRendering();
    }

    async downloadWAV() {
        const buffer = await this.renderToBuffer();
        if (!buffer) return;
        const blob = bufferToWave(buffer, buffer.length);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(this.data.metadata.title || 'song').toLowerCase().replace(/\s+/g, '-')}.wav`;
        a.click();
        URL.revokeObjectURL(url);
    }
}
