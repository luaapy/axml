const xml2js = require('xml2js');
const config = require('../config');

class AXMLEngine {
    constructor(engineConfig) {
        this.config = engineConfig || config;
        this.validInstrumentTypes = [
            'sine', 'square', 'sawtooth', 'triangle',
            'noise', 'pink_noise', 'brown_noise',
            'synth', 'piano', 'guitar', 'bass',
            'drum_808', 'drum_909', 'strings', 'pad'
        ];
        this.validTimeSignatures = ['4/4', '3/4', '6/8', '7/8', '5/4', '2/4'];
        this.validNotes = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];
        this.errors = [];
        this.warnings = [];
    }

    async parse(xmlString) {
        this.errors = [];
        this.warnings = [];

        try {
            const parser = new xml2js.Parser({
                explicitArray: false,
                mergeAttrs: true,
                normalize: true,
                trim: true
            });

            const result = await parser.parseStringPromise(xmlString);

            if (!result.axml) {
                this.addError('ERR_XML_001', 'Invalid AXML: Root element must be <axml>');
                return null;
            }

            const parsed = this.normalizeStructure(result.axml);

            this.validateMetadata(parsed.metadata);
            this.validateInstruments(parsed.instruments);
            this.validateTracks(parsed.tracks);

            return {
                success: this.errors.length === 0,
                data: parsed,
                errors: this.errors,
                warnings: this.warnings
            };

        } catch (error) {
            this.addError('ERR_XML_001', `Malformed XML: ${error.message}`);
            return {
                success: false,
                data: null,
                errors: this.errors,
                warnings: this.warnings
            };
        }
    }

    normalizeStructure(data) {
        // AI sometimes misses wrapper tags like <instruments> or <tracks>
        let instruments = data.instruments?.instrument || data.instrument || [];
        let tracks = data.tracks?.track || data.track || [];

        return {
            version: data.version || '1.0',
            metadata: this.normalizeMetadata(data.metadata || {}),
            instruments: this.normalizeInstruments(instruments),
            tracks: this.normalizeTracks(tracks),
            patterns: this.normalizePatterns(data.patterns?.pattern || []),
            effects: this.normalizeEffects(data.effects || {})
        };
    }

    normalizeMetadata(meta) {
        return {
            title: meta.title || 'Untitled',
            artist: meta.artist || 'Unknown',
            tempo: this.clampValue(parseInt(meta.tempo) || 120, 30, 300),
            timeSignature: meta['time-signature'] || '4/4',
            key: meta.key || 'C',
            genre: meta.genre || '',
            description: meta.description || '',
            duration: parseFloat(meta.duration) || 0
        };
    }

    normalizeInstruments(instruments) {
        if (!Array.isArray(instruments)) {
            instruments = [instruments];
        }

        return instruments.map(inst => ({
            id: inst.id || this.generateId(),
            type: inst.type || 'sine',
            volume: this.clampValue(parseFloat(inst.volume) || 0.7, 0, 1),
            pan: this.clampValue(parseFloat(inst.pan) || 0, -1, 1),
            attack: this.clampValue(parseFloat(inst.attack) || 0.01, 0, 10),
            decay: this.clampValue(parseFloat(inst.decay) || 0.1, 0, 10),
            sustain: this.clampValue(parseFloat(inst.sustain) || 0.7, 0, 1),
            release: this.clampValue(parseFloat(inst.release) || 0.3, 0, 10),
            detune: this.clampValue(parseInt(inst.detune) || 0, -100, 100),
            octave: this.clampValue(parseInt(inst.octave) || 0, -2, 2)
        }));
    }

    normalizeTracks(tracks) {
        if (!Array.isArray(tracks)) {
            tracks = [tracks];
        }

        return tracks.map(track => ({
            instrument: track.instrument || 'default',
            name: track.name || 'Untitled Track',
            muted: track.muted === 'true' || track.muted === true,
            solo: track.solo === 'true' || track.solo === true,
            repeat: parseInt(track.repeat) || 1,
            notes: this.normalizeNotes(track.notes?.note || track.note || track.chord || [])
        }));
    }

    normalizeNotes(notes) {
        if (!Array.isArray(notes)) {
            notes = [notes];
        }

        return notes.map(note => {
            if (note.note) {
                return {
                    type: 'chord',
                    start: parseFloat(note.start) || 0,
                    notes: this.normalizeNotes(note.note)
                };
            }

            return {
                type: 'note',
                pitch: note.pitch || 'C4',
                duration: this.parseDuration(note.duration || 'quarter'),
                velocity: this.clampValue(parseFloat(note.velocity) || 0.7, 0, 1),
                start: parseFloat(note.start) || null
            };
        });
    }

    normalizePatterns(patterns) {
        if (!Array.isArray(patterns)) {
            patterns = patterns ? [patterns] : [];
        }

        return patterns.map(pattern => ({
            id: pattern.id || this.generateId(),
            notes: this.normalizeNotes(pattern.note || [])
        }));
    }

    normalizeEffects(effects) {
        const normalized = {};

        if (effects.reverb) {
            normalized.reverb = {
                type: effects.reverb.type || 'hall',
                mix: this.clampValue(parseFloat(effects.reverb.mix) || 0.3, 0, 1),
                decay: parseFloat(effects.reverb.decay) || 2.5
            };
        }

        if (effects.delay) {
            normalized.delay = {
                time: parseFloat(effects.delay.time) || 0.5,
                feedback: this.clampValue(parseFloat(effects.delay.feedback) || 0.5, 0, 1),
                mix: this.clampValue(parseFloat(effects.delay.mix) || 0.3, 0, 1)
            };
        }

        if (effects.filter) {
            normalized.filter = {
                type: effects.filter.type || 'lowpass',
                frequency: parseFloat(effects.filter.frequency) || 1000,
                resonance: this.clampValue(parseFloat(effects.filter.resonance) || 0.5, 0, 1)
            };
        }

        return normalized;
    }

    parseDuration(durationStr) {
        const durationMap = {
            'whole': 4.0, 'w': 4.0,
            'half': 2.0, 'h': 2.0,
            'quarter': 1.0, 'q': 1.0,
            'eighth': 0.5, 'e': 0.5,
            'sixteenth': 0.25, 's': 0.25,
            'thirty-second': 0.125, 't': 0.125
        };

        const isDotted = durationStr.includes('.d') || durationStr.includes('d');
        const cleanDuration = durationStr.replace('.d', '').replace('d', '');

        let duration = durationMap[cleanDuration] || parseFloat(cleanDuration) || 1.0;

        if (isDotted) {
            duration *= 1.5;
        }

        return duration;
    }

    validateMetadata(meta) {
        if (meta.tempo < 30 || meta.tempo > 300) {
            this.addWarning('Tempo clamped to valid range (30-300)');
        }

        if (!this.validTimeSignatures.includes(meta.timeSignature)) {
            this.addWarning(`Non-standard time signature: ${meta.timeSignature}`);
        }
    }

    validateInstruments(instruments) {
        const ids = new Set();

        instruments.forEach((inst, index) => {
            if (ids.has(inst.id)) {
                this.addError('ERR_REF_003', `Duplicate instrument ID: ${inst.id}`);
            }
            ids.add(inst.id);

            if (!this.validInstrumentTypes.includes(inst.type)) {
                this.addWarning(`Unknown instrument type: ${inst.type}, using 'sine'`);
            }
        });
    }

    validateTracks(tracks) {
        if (tracks.length > (this.config.axml?.maxTracks || 32)) {
            this.addError('ERR_AUDIO_004', `Too many tracks (${tracks.length}), maximum is ${this.config.axml?.maxTracks || 32}`);
        }

        tracks.forEach((track, index) => {
            if (track.notes.length > (this.config.axml?.maxNotes || 10000)) {
                this.addError('ERR_AUDIO_004', `Track "${track.name}" has too many notes (${track.notes.length})`);
            }

            track.notes.forEach(note => {
                if (note.type === 'note' && !this.isValidPitch(note.pitch)) {
                    this.addWarning(`Invalid pitch notation: ${note.pitch}`);
                }
            });
        });
    }

    isValidPitch(pitch) {
        if (pitch === 'rest') return true;

        const match = pitch.match(/^([A-G][#b]?)(\d)$/);
        if (!match) return false;

        const [, note, octave] = match;
        const octaveNum = parseInt(octave);

        return this.validNotes.includes(note) && octaveNum >= 0 && octaveNum <= 8;
    }

    clampValue(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    addError(code, message) {
        this.errors.push({ code, message });
    }

    addWarning(message) {
        this.warnings.push(message);
    }

    generateId() {
        return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    autoCorrect(xmlString) {
        let corrected = xmlString;
        const corrections = [];

        const openTags = corrected.match(/<(\w+)/g) || [];
        const closeTags = corrected.match(/<\/(\w+)/g) || [];

        if (corrected.includes('<track') && !corrected.includes('</track>')) {
            const trackCount = (corrected.match(/<track/g) || []).length;
            const closeCount = (corrected.match(/<\/track>/g) || []).length;

            if (trackCount > closeCount) {
                corrected += '\n    </track>';
                corrections.push('Added missing </track> tag');
            }
        }

        corrected = corrected.replace(/pitch="C99"/g, 'pitch="C4"');
        if (corrected !== xmlString) {
            corrections.push('Corrected invalid octave C99 → C4');
        }

        return {
            corrected,
            corrections,
            wasModified: corrections.length > 0
        };
    }
}

module.exports = AXMLEngine;
