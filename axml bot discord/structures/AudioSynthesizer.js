const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const config = require('../config');

class AudioSynthesizer {
    constructor(audioConfig) {
        this.config = audioConfig || config;
        this.sampleRate = this.config.axml?.sampleRate || 48000;
        this.bitDepth = this.config.axml?.bitDepth || 24;
        this.channels = 2;
    }

    async synthesize(axmlData) {
        try {
            if (!axmlData) throw new Error("AXML Data is null or undefined");

            // Handle metadata (handle both engine output and raw XML)
            const meta = axmlData.metadata || {};
            const tempo = parseInt(meta.tempo) || 120;

            // Handle tracks (handle both engine output and raw XML)
            let tracks = [];
            if (Array.isArray(axmlData.tracks)) {
                tracks = axmlData.tracks; // Engine normalized
            } else {
                tracks = Array.isArray(axmlData.tracks?.track) ? axmlData.tracks.track : (axmlData.tracks?.track ? [axmlData.tracks.track] : []);
            }

            // Handle instruments
            let instruments = [];
            if (Array.isArray(axmlData.instruments)) {
                instruments = axmlData.instruments; // Engine normalized
            } else {
                instruments = Array.isArray(axmlData.instruments?.instrument) ? axmlData.instruments.instrument : (axmlData.instruments?.instrument ? [axmlData.instruments.instrument] : []);
            }

            const maxDuration = this.calculateDuration(tracks, tempo);

            if (maxDuration > 300) {
                throw new Error(`Composition duration (${maxDuration.toFixed(1)}s) exceeds safety limit of 300s (5 minutes). Currently calculated: ${maxDuration.toFixed(1)}s.`);
            }

            if (maxDuration <= 0 || tracks.length === 0) {
                console.error('[Audio] Validation failed: duration is 0 or no tracks found.', { maxDuration, tracksCount: tracks.length });
                throw new Error("Musical composition is empty or has zero duration.");
            }
            const samples = Math.ceil(maxDuration * this.sampleRate);

            const leftChannel = new Float32Array(samples);
            const rightChannel = new Float32Array(samples);

            console.log(`[Audio] Starting synthesis. Tracks: ${tracks.length}, Samples: ${samples}, Max Duration: ${maxDuration.toFixed(2)}s`);

            tracks.forEach((track, idx) => {
                const instrument = instruments.find(i => i.id === track.instrument);
                if (!instrument) {
                    console.log(`[Audio] Skipping track "${track.name}" - Instrument ID "${track.instrument}" not found.`);
                    return;
                }
                if (track.muted) {
                    console.log(`[Audio] Skipping track "${track.name}" - Muted.`);
                    return;
                }

                console.log(`[Audio] Rendering track ${idx + 1}/${tracks.length}: "${track.name}" with instrument "${instrument.type}" (${track.notes?.length || 0} notes)`);
                const trackBuffer = this.renderTrack(track, instrument, tempo, samples);

                let trackMax = 0;
                for (let i = 0; i < samples; i++) {
                    const pan = instrument.pan || 0;
                    const leftGain = Math.cos((pan + 1) * Math.PI / 4);
                    const rightGain = Math.sin((pan + 1) * Math.PI / 4);

                    const val = trackBuffer[i];
                    if (Math.abs(val) > trackMax) trackMax = Math.abs(val);

                    leftChannel[i] += val * leftGain;
                    rightChannel[i] += val * rightGain;
                }
                console.log(`[Audio] Track "${track.name}" peak amplitude: ${trackMax.toFixed(4)}`);
            });

            this.normalize(leftChannel);
            this.normalize(rightChannel);

            const wavBuffer = this.createWAVBuffer(leftChannel, rightChannel);

            return {
                success: true,
                buffer: wavBuffer,
                duration: maxDuration,
                sampleRate: this.sampleRate,
                channels: this.channels
            };

        } catch (error) {
            console.error('Synthesis Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    parseDuration(duration) {
        if (typeof duration === 'number') return duration;
        if (!duration) return 1.0;

        const map = {
            'whole': 4.0, 'w': 4.0,
            'half': 2.0, 'h': 2.0,
            'quarter': 1.0, 'q': 1.0,
            'eighth': 0.5, 'e': 0.5,
            'sixteenth': 0.25, 's': 0.25,
            'thirty-second': 0.125, 't': 0.125,
            'quarter.d': 1.5, 'q.d': 1.5,
            'eighth.d': 0.75, 'e.d': 0.75
        };

        return map[duration.toLowerCase()] || parseFloat(duration) || 1.0;
    }

    renderTrack(track, instrument, tempo, totalSamples) {
        const buffer = new Float32Array(totalSamples);
        const beatsPerSecond = tempo / 60;

        let notes = track.note || track.notes || [];
        if (notes.note) notes = notes.note;
        if (!Array.isArray(notes)) notes = [notes];

        const repeat = parseInt(track.repeat) || 1;

        // Find the length of one loop in beats
        let maxTrackBeats = 0;
        notes.forEach(note => {
            const duration = this.parseDuration(note.duration);
            const start = note.start !== undefined ? parseFloat(note.start) : 0;
            maxTrackBeats = Math.max(maxTrackBeats, start + duration);
        });

        // Round up to nearest bar (4 beats) if it's close to a bar boundary
        if (maxTrackBeats > 0) {
            // Heuristic: If it's within 0.1 of a 4-beat boundary, snap it. 
            // Otherwise, just use the actual max beat.
            const nearestBar = Math.ceil(maxTrackBeats / 4) * 4;
            if (nearestBar - maxTrackBeats < 0.5) {
                maxTrackBeats = nearestBar;
            }
        }

        if (repeat > 1) {
            console.log(`[Audio] Looping track "${track.name}" ${repeat} times. Loop length: ${maxTrackBeats.toFixed(2)} beats.`);
        }

        for (let r = 0; r < repeat; r++) {
            const beatOffset = r * maxTrackBeats;
            let currentBeat = beatOffset;

            notes.forEach(note => {
                if (note.type === 'chord') {
                    const chordNotes = Array.isArray(note.note) ? note.note : [note.note];
                    chordNotes.forEach(chordNote => {
                        const startPos = note.start !== undefined ? parseFloat(note.start) + beatOffset : currentBeat;
                        this.renderNote(buffer, chordNote, startPos, instrument, beatsPerSecond);
                    });
                } else {
                    const startBeat = (note.start !== undefined && note.start !== null) ? (parseFloat(note.start) + beatOffset) : currentBeat;
                    const duration = this.parseDuration(note.duration);
                    this.renderNote(buffer, note, startBeat, instrument, beatsPerSecond, duration);
                    currentBeat = startBeat + duration;
                }
            });
        }

        return buffer;
    }

    renderNote(buffer, note, startBeat, instrument, beatsPerSecond, durationOverride) {
        if (note.pitch === 'rest') return;

        const frequency = this.pitchToFrequency(note.pitch, instrument.detune || 0);
        if (!frequency) return;

        const duration = durationOverride || this.parseDuration(note.duration);
        const startSample = Math.floor(startBeat / beatsPerSecond * this.sampleRate);
        const durationSamples = Math.floor(duration / beatsPerSecond * this.sampleRate);

        const attack = (instrument.attack || 0.01) * this.sampleRate;
        const decay = (instrument.decay || 0.1) * this.sampleRate;
        const sustain = instrument.sustain || 0.7;
        const release = (instrument.release || 0.3) * this.sampleRate;

        for (let i = 0; i < durationSamples && (startSample + i) < buffer.length; i++) {
            const t = i / this.sampleRate;
            const envelope = this.calculateADSR(i, durationSamples, attack, decay, sustain, release);

            let sample = 0;

            switch (instrument.type) {
                case 'sine':
                    sample = Math.sin(2 * Math.PI * frequency * t);
                    break;
                case 'square':
                    sample = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1;
                    break;
                case 'sawtooth':
                    sample = 2 * ((frequency * t) % 1) - 1;
                    break;
                case 'triangle':
                    sample = 2 * Math.abs(2 * ((frequency * t) % 1) - 1) - 1;
                    break;
                case 'noise':
                    sample = Math.random() * 2 - 1;
                    break;
                case 'piano':
                case 'guitar':
                case 'bass':
                    sample = this.synthesizeComplex(frequency, t, instrument.type);
                    break;
                case 'drum_808':
                case 'drum_909':
                    sample = this.synthesizeDrum(frequency, t, i, durationSamples);
                    break;
                case 'pad':
                    sample = this.synthesizePad(frequency, t);
                    break;
                default:
                    sample = Math.sin(2 * Math.PI * frequency * t);
            }

            const velocity = note.velocity || 0.7;
            const volume = instrument.volume || 0.7;

            buffer[startSample + i] += sample * envelope * velocity * volume * 0.3;
        }
    }

    synthesizeComplex(frequency, t, type) {
        let sample = Math.sin(2 * Math.PI * frequency * t);

        sample += 0.3 * Math.sin(4 * Math.PI * frequency * t);
        sample += 0.15 * Math.sin(6 * Math.PI * frequency * t);

        if (type === 'piano') {
            sample *= Math.exp(-t * 2);
        } else if (type === 'guitar') {
            sample *= Math.exp(-t * 1.5);
            sample += 0.1 * (Math.random() * 2 - 1);
        }

        return sample / 1.5;
    }

    synthesizeDrum(frequency, t, sample, duration) {
        const kickDecay = Math.exp(-t * 15);
        const kickPitch = 60 * kickDecay;

        let drum = Math.sin(2 * Math.PI * kickPitch * t) * kickDecay;

        if (sample % Math.floor(this.sampleRate / 4) < this.sampleRate / 16) {
            drum += (Math.random() * 2 - 1) * 0.3;
        }

        return drum;
    }

    synthesizePad(frequency, t) {
        let sample = 0;
        sample += Math.sin(2 * Math.PI * frequency * t);
        sample += 0.5 * Math.sin(2 * Math.PI * frequency * 1.01 * t);
        sample += 0.3 * Math.sin(2 * Math.PI * frequency * 0.99 * t);
        sample += 0.2 * Math.sin(2 * Math.PI * frequency * 2 * t);

        return sample / 2;
    }

    calculateADSR(sample, totalSamples, attack, decay, sustain, release) {
        if (sample < attack) {
            return sample / attack;
        }

        if (sample < attack + decay) {
            const decayProgress = (sample - attack) / decay;
            return 1 - (decayProgress * (1 - sustain));
        }

        const releaseStart = totalSamples - release;
        if (sample > releaseStart) {
            const releaseProgress = (sample - releaseStart) / release;
            return sustain * (1 - releaseProgress);
        }

        return sustain;
    }

    pitchToFrequency(pitch, detune = 0) {
        const noteMap = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
            'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7,
            'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
        };

        const match = pitch.match(/^([A-G][#b]?)(\d)$/);
        if (!match) return null;

        const [, note, octave] = match;
        const octaveNum = parseInt(octave);

        const midiNote = noteMap[note] + (octaveNum * 12) + 12;

        const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);

        const detuneFactor = Math.pow(2, detune / 1200);

        return frequency * detuneFactor;
    }

    calculateDuration(tracks, tempo) {
        let maxDuration = 0;
        const beatsPerSecond = tempo / 60;

        tracks.forEach(track => {
            let iterationBeats = 0;
            let notes = track.note || track.notes || [];
            if (notes.note) notes = notes.note;
            if (!Array.isArray(notes)) notes = [notes];

            notes.forEach(note => {
                const duration = this.parseDuration(note.duration);
                if (note.start !== undefined && note.start !== null) {
                    iterationBeats = Math.max(iterationBeats, parseFloat(note.start) + duration);
                } else {
                    iterationBeats += duration;
                }
            });

            const repeat = parseInt(track.repeat) || 1;
            maxDuration = Math.max(maxDuration, iterationBeats * repeat);
        });

        return maxDuration / beatsPerSecond;
    }

    normalize(buffer) {
        let max = 0;
        for (let i = 0; i < buffer.length; i++) {
            max = Math.max(max, Math.abs(buffer[i]));
        }

        if (max > 0) {
            const scale = 0.95 / max;
            for (let i = 0; i < buffer.length; i++) {
                buffer[i] *= scale;
            }
        }
    }

    createWAVBuffer(leftChannel, rightChannel) {
        const bytesPerSample = this.bitDepth / 8;
        const numSamples = leftChannel.length;
        const dataSize = numSamples * this.channels * bytesPerSample;
        const bufferSize = 44 + dataSize;

        const buffer = Buffer.alloc(bufferSize);

        buffer.write('RIFF', 0);
        buffer.writeUInt32LE(bufferSize - 8, 4);
        buffer.write('WAVE', 8);

        buffer.write('fmt ', 12);
        buffer.writeUInt32LE(16, 16);
        buffer.writeUInt16LE(1, 20);
        buffer.writeUInt16LE(this.channels, 22);
        buffer.writeUInt32LE(this.sampleRate, 24);
        buffer.writeUInt32LE(this.sampleRate * this.channels * bytesPerSample, 28);
        buffer.writeUInt16LE(this.channels * bytesPerSample, 32);
        buffer.writeUInt16LE(this.bitDepth, 34);

        buffer.write('data', 36);
        buffer.writeUInt32LE(dataSize, 40);

        let offset = 44;
        const maxValue = Math.pow(2, this.bitDepth - 1) - 1;

        for (let i = 0; i < numSamples; i++) {
            const leftSample = Math.round(leftChannel[i] * maxValue);
            const rightSample = Math.round(rightChannel[i] * maxValue);

            if (this.bitDepth === 16) {
                buffer.writeInt16LE(leftSample, offset);
                buffer.writeInt16LE(rightSample, offset + 2);
                offset += 4;
            } else if (this.bitDepth === 24) {
                this.writeInt24LE(buffer, leftSample, offset);
                this.writeInt24LE(buffer, rightSample, offset + 3);
                offset += 6;
            }
        }

        return buffer;
    }

    writeInt24LE(buffer, value, offset) {
        const clamped = Math.max(-8388608, Math.min(8388607, value));
        const bytes = clamped < 0 ? clamped + 16777216 : clamped;

        buffer[offset] = bytes & 0xFF;
        buffer[offset + 1] = (bytes >> 8) & 0xFF;
        buffer[offset + 2] = (bytes >> 16) & 0xFF;
    }

    async saveToFile(wavBuffer, filename) {
        const tempDir = this.config.paths?.temp || './temp';

        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const filePath = path.join(tempDir, filename);

        // Regular WAV save
        await new Promise((resolve, reject) => {
            fs.writeFile(filePath, wavBuffer, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // If filename ends in .mp3, convert the saved wav to mp3
        if (filename.endsWith('.mp3')) {
            const wavPath = filePath.replace('.mp3', '.tmp.wav');
            fs.renameSync(filePath, wavPath);

            return new Promise((resolve, reject) => {
                ffmpeg(wavPath)
                    .toFormat('mp3')
                    .audioBitrate(192)
                    .on('error', (err) => {
                        console.error('FFmpeg MP3 Conversion Error:', err);
                        fs.unlinkSync(wavPath);
                        reject(err);
                    })
                    .on('end', () => {
                        fs.unlinkSync(wavPath);
                        resolve(filePath);
                    })
                    .save(filePath);
            });
        }

        return filePath;
    }

    applyReverb(buffer, mix = 0.3, decayTime = 2.0) {
        const reverbSamples = Math.floor(decayTime * this.sampleRate);
        const output = new Float32Array(buffer.length);

        for (let i = 0; i < buffer.length; i++) {
            output[i] = buffer[i] * (1 - mix);

            for (let d = 1; d < Math.min(5, reverbSamples / 1000); d++) {
                const delay = Math.floor(d * this.sampleRate * 0.05);
                if (i >= delay) {
                    const decay = Math.exp(-d / decayTime);
                    output[i] += buffer[i - delay] * decay * mix * 0.2;
                }
            }
        }

        return output;
    }

    applyDelay(buffer, delayTime = 0.5, feedback = 0.5, mix = 0.3) {
        const delaySamples = Math.floor(delayTime * this.sampleRate);
        const output = new Float32Array(buffer.length);

        for (let i = 0; i < buffer.length; i++) {
            output[i] = buffer[i];

            if (i >= delaySamples) {
                output[i] += output[i - delaySamples] * feedback * mix;
            }
        }

        return output;
    }
}

module.exports = AudioSynthesizer;
