const { XMLParser } = require('fast-xml-parser');
const fs = require('node:fs');

const NOTE_FREQS = {
    'C': 261.63, 'C#': 277.18, 'Db': 277.18, 'D': 293.66, 'D#': 311.13, 'Eb': 311.13,
    'E': 329.63, 'F': 349.23, 'F#': 369.99, 'Gb': 369.99, 'G': 392.00, 'G#': 415.30,
    'Ab': 415.30, 'A': 440.00, 'A#': 466.16, 'Bb': 466.16, 'B': 493.88
};

function getFreq(pitch) {
    if (pitch === 'rest') return 0;
    const match = pitch.match(/^([A-G][#b]?)([0-8])$/);
    if (!match) return 440;
    const note = match[1];
    const octave = parseInt(match[2]);
    const freq = NOTE_FREQS[note];
    return freq * Math.pow(2, octave - 4);
}

const DURATIONS = {
    'whole': 4, 'w': 4,
    'half': 2, 'h': 2,
    'quarter': 1, 'q': 1,
    'eighth': 0.5, 'e': 0.5,
    'sixteenth': 0.25, 's': 0.25
};

function getDuration(durStr, tempo) {
    const beats = DURATIONS[durStr] || parseFloat(durStr) || 1;
    return (beats * 60) / tempo;
}

const SAMPLE_RATE = 44100;

function generateWavHeader(dataLength) {
    const buffer = Buffer.alloc(44);
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataLength, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20); // PCM
    buffer.writeUInt16LE(1, 22); // Mono
    buffer.writeUInt32LE(SAMPLE_RATE, 24);
    buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
    buffer.writeUInt16LE(2, 32);
    buffer.writeUInt16LE(16, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataLength, 40);
    return buffer;
}

module.exports = async (axmlPath, options = {}) => {
    const xmlData = fs.readFileSync(axmlPath, 'utf-8');
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });
    const jsonObj = parser.parse(xmlData);

    const axml = jsonObj.axml;
    const tempo = options.tempo || parseInt(axml.metadata.tempo) || 120;
    const tracks = Array.isArray(axml.tracks.track) ? axml.tracks.track : [axml.tracks.track];
    const instruments = Array.isArray(axml.instruments.instrument) ? axml.instruments.instrument : [axml.instruments.instrument];

    const instMap = {};
    instruments.forEach(i => instMap[i.id] = i);

    let maxDuration = 0;
    const processedTracks = tracks.map(track => {
        const inst = instMap[track.instrument] || { type: 'sine', volume: 0.5 };
        const notes = Array.isArray(track.note) ? track.note : (track.note ? [track.note] : []);

        let currentTime = 0;
        const trackNotes = notes.map(n => {
            const start = n.start !== undefined ? (parseFloat(n.start) * 60 / tempo) : currentTime;
            const duration = getDuration(n.duration, tempo);
            const freq = getFreq(n.pitch);
            currentTime = start + duration;
            if (currentTime > maxDuration) maxDuration = currentTime;
            return { freq, start, duration, type: inst.type || 'sine', volume: parseFloat(inst.volume) || 0.5 };
        });
        return trackNotes;
    });

    const numSamples = Math.ceil(maxDuration * SAMPLE_RATE);
    const buffer = new Float32Array(numSamples);

    processedTracks.forEach(trackNotes => {
        trackNotes.forEach(note => {
            const startSample = Math.floor(note.start * SAMPLE_RATE);
            const endSample = Math.floor((note.start + note.duration) * SAMPLE_RATE);

            for (let i = startSample; i < endSample && i < numSamples; i++) {
                const t = (i - startSample) / SAMPLE_RATE;
                let sample = 0;

                // Basic Oscillators
                if (note.type === 'sine') {
                    sample = Math.sin(2 * Math.PI * note.freq * t);
                } else if (note.type === 'square') {
                    sample = Math.sin(2 * Math.PI * note.freq * t) >= 0 ? 1 : -1;
                } else if (note.type === 'sawtooth') {
                    sample = 2 * (t * note.freq - Math.floor(0.5 + t * note.freq));
                } else if (note.type === 'triangle') {
                    sample = Math.abs(2 * (t * note.freq - Math.floor(0.5 + t * note.freq))) * 2 - 1;
                } else {
                    sample = Math.sin(2 * Math.PI * note.freq * t);
                }

                // Simple ADSR Envelope (Linear fade out)
                const releaseStart = (endSample - startSample) * 0.8;
                let envelope = 1.0;
                if ((i - startSample) > releaseStart) {
                    envelope = 1.0 - ((i - startSample - releaseStart) / ((endSample - startSample) - releaseStart));
                }

                buffer[i] += sample * note.volume * 0.2 * envelope; // Mix tracks
            }
        });
    });

    // Convert to 16-bit PCM
    const pcmBuffer = Buffer.alloc(numSamples * 2);
    for (let i = 0; i < numSamples; i++) {
        const s = Math.max(-1, Math.min(1, buffer[i]));
        const val = s < 0 ? s * 0x8000 : s * 0x7FFF;
        pcmBuffer.writeInt16LE(val, i * 2);
    }

    const header = generateWavHeader(pcmBuffer.length);
    return Buffer.concat([header, pcmBuffer]);
};
